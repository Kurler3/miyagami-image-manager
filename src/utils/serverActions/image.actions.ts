'use server'

import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "../supabase/server";
import { z } from "zod";
import { v4 as uuid } from 'uuid';
import prisma from "../prisma/prisma";
import { revalidatePath } from "next/cache";
import { Favorite, Image } from "@prisma/client";

// Form validation schema
const imageSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    public: z.boolean(),
});


// Upload function to handle form submission
export async function uploadImage(formData: FormData) {
    const supabase = createClient();
    const user = await getCurrentUser();

    if (!user) {
        return redirect('/login');
    }

    // Extract form values
    const title = formData.get("title")?.toString() ?? "";
    const description = formData.get("description")?.toString() ?? "";
    const publicImage = formData.get("public") === "on" ? true : false;
    const imageFile = formData.get("image") as File;

    // Validate the form data
    const parsedData = imageSchema.safeParse({ title, description, public: publicImage });

    if (!parsedData.success) {
        console.error('Error with form data: ', parsedData)
        throw new Error('Invalid form data');
    }

    ////////////////////////////////////////////////////////////////////////
    // VALIDATE THE FILE MIME TYPE /////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(imageFile.type)) {
        console.error('Error: Invalid file type');
        throw new Error(`Invalid file type. Valid types: ${allowedMimeTypes.join(', ')}`)
    }

    ////////////////////////////////////////////////////////////////////////
    // VALIDATE THE FILE SIZE //////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    const maxSizeInBytes = 50 * 1024 * 1024; // 50 MB max size

    if (imageFile.size > maxSizeInBytes) {
        console.error('Error: File is too large');
        throw new Error('File is too large. Max size is 50MB')
    }

    ///////////////////////////////////////////////////////////////////////
    // Upload the image to Supabase storage ///////////////////////////////
    ///////////////////////////////////////////////////////////////////////

    // Which bucket to use
    const bucketName = `${publicImage ? 'PUBLIC' : 'PRIVATE'}-IMAGES`

    const imageUUID = uuid();

    // Build the path of the image in storage (will be in the folder of the user uuid if private).
    const imagePath = publicImage ? imageUUID : `${user.id}/${imageUUID}`

    const { data: storageData, error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(
            imagePath, // Same id as the one in the db!
            imageFile, // The actual image
            {
                // Some metadata
                metadata: {
                    user_id: user.id,
                    public: publicImage,
                },
            }
        );

    if (storageError) {
        console.error('Uploading img error: ', storageError);
        throw new Error('Error uploading image')
    }

    // Only get the public url if the image is public.
    const imageUrl = publicImage ? supabase.storage.from(bucketName).getPublicUrl(storageData.path).data.publicUrl : null;

    ///////////////////////////////////////////////////////////////////////
    // Use a transaction for creating the image on the db /////////////////
    ///////////////////////////////////////////////////////////////////////

    try {

        await prisma.$transaction(async (prisma) => {

            // Create the image entry in the database
            await prisma.image.create({
                data: {
                    id: imageUUID,
                    title,
                    description,
                    public: publicImage,
                    imageUrl: imageUrl,
                    userId: user.id,
                    imagePath: imagePath,
                },
            });

        });

    } catch (dbError) {
        console.error('Error saving image in database: ', dbError);

        // Rollback: Delete the image from storage if the DB transaction fails
        const { error: deleteError } = await supabase.storage
            .from(bucketName)
            .remove([storageData.path]);

        if (deleteError) {
            console.error('Error deleting image from storage during rollback: ', deleteError);
        }

        throw new Error("Error saving image")
    }

    // Select path to revalidate and redirect to.
    const pathToRedirectTo = `/dashboard/${publicImage ? 'public' : 'private'}`;

    // Refresh data on the target path
    revalidatePath(pathToRedirectTo);

    // Redirect to path
    redirect(pathToRedirectTo);
}


/**
 * 
 * @param page 
 * @param limit 
 * @returns List of public images
 */

export async function getPublicImages(page: number, limit = 15) {

    const user = await getCurrentUser();

    const images = await prisma.image.findMany({
        where: { public: true },
        skip: page * limit,
        take: limit,
        orderBy: {
            createdAt: 'desc', // The most recent ones first.
        },
        include: !user ? undefined : {
            Favorite: {
                where: {
                    userId: user.id // Only include favorites for the current user
                },
                select: {
                    id: true // Select only the ID to check if this image is favorited
                }
            }
        }
    });

    // Map through images to attach favorited status
    const imagesWithFavoriteStatus = images.map((image: Image) => ({
        ...image,
        isFavorited: (image as Image & { Favorite: Favorite[] }).Favorite?.length > 0 // Check if there are any favorites for the current user
    }));

    return imagesWithFavoriteStatus;
}


/**
 * Favorites or Unfavorites an image.
 * @param imageId 
 * @returns Void
 */
export async function favoriteOrUnfavoriteImage(
    imageId: string,
) {

    // Make sure user is logged, if not => redirect to /login
    const user = await getCurrentUser();

    if (!user) {
        return redirect('/login');
    }

    // Get image
    const image = await prisma.image.findUnique({
        where: {
            id: imageId,
        },
        // select: {
        //     userId: true,
        //     public: true,
        // },
        include: {
            Favorite: {
                where: {
                    userId: user.id // Only include favorites for the current user
                },
                select: {
                    id: true // Select only the ID to check if this image is favorited
                }
            }
        }
    })

    if (!image) {
        throw new Error('This image doesn\'t exist anymore. Please refresh your page');
    }

    // If private => check if the current user is the owner
    if (!image.public && user.id !== image.userId) {
        throw new Error('You don\'t have access to this image');
    }

    // If already favorited => delete favorite
    if(image.Favorite.length > 0) {

        // Delete
        await prisma.favorite.delete({
            where: {
                id: image.Favorite[0].id,
            }
        });

    // If not, favorite it.
    } else {

        // Create it
        await prisma.favorite.create({
            data: {
                userId: user.id,
                imageId,
            }
        });
    }

    // It has only favorited now (the most recent version) if previously it wasn't.
    const hasFavoritedNow = image.Favorite.length === 0

    return hasFavoritedNow;
}