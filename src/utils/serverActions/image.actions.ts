'use server'

import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "../supabase/server";
import { z } from "zod";
import { v4 as uuid } from 'uuid';
import prisma from "../prisma/prisma";
import { revalidatePath } from "next/cache";
import { Favorite, Image } from "@prisma/client";
import { PRIVATE_IMAGES_BUCKET_NAME, PUBLIC_IMAGES_BUCKET_NAME } from "../constants/supabase.constants";
import { IImageWithFavorited } from "../types";

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

// Get private images
export async function getPrivateImages(page: number, limit = 15) {

    const user = await getCurrentUser();

    if (!user) {
        return redirect('/login');
    }

    let images = await prisma.image.findMany({
        where: { public: false },
        skip: page * limit,
        take: limit,
        orderBy: {
            createdAt: 'desc', // The most recent ones first.
        },
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
    });

    console.log(images)

    const imagePaths = images.map((img) => img.imagePath);

    console.log(imagePaths)

    if (imagePaths.length > 0) {

        const supabase = createClient();

        const { data, error } = await supabase
            .storage
            .from(PRIVATE_IMAGES_BUCKET_NAME)
            .createSignedUrls(imagePaths, 60 * 5); // Expires in 5 mins

        if (error) {
            console.error('Error while getting the signed urls', error);
            throw new Error('Error getting signed urls');
        }

        // For each item in data => assign the imageUrl to the correct img
        data?.forEach(({ signedUrl }, index) => {

            images[index] = {
                ...images[index],
                imageUrl: signedUrl,
            }

        });

    }

    // Inject a signed url for each of the images.
    images = images.map((image) => {
        const isFavorited = (image as Image & { Favorite: Favorite[] }).Favorite?.length > 0;
        return {
            ...image,
            isFavorited,
        }
    })



    return images as unknown as IImageWithFavorited[];
}

//TODO Get favorite images

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
    if (image.Favorite.length > 0) {

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


/**
 * Switches from public to private or private to public.
 * @param imageId 
 */
export async function switchImageVisibility(imageId: string) {

    // Get current user
    const user = await getCurrentUser();

    // If not logged in => error
    if (!user) {
        console.error('Trying to change visibility of image without being logged in');
        throw new Error('Need to login boi');
    }

    // Get image
    const img = await prisma.image.findUnique({
        where: {
            id: imageId,
        },
        select: {
            public: true,
            userId: true,
            imageUrl: true,
            imagePath: true,
        }
    });

    if (!img) {
        throw new Error('This image doesn\'t exist');
    }

    // Check if user owns the image
    if (img.userId !== user.id) {
        throw new Error('You don\'t own this image')
    }

    const supabase = createClient();

    // Init the new image object
    const newImageObject: Partial<Image> = { public: !img.public };

    // If switching to private => need to remove the imageUrl and all the favorites expect the owner.
    if (!newImageObject.public) {

        newImageObject.imageUrl = null;

        // Add the user in the image path!
        newImageObject.imagePath = `${user.id}/${img.imagePath}`

        // Download the image from the public bucket
        const { data: fileBlob, error: downloadError } = await supabase
            .storage
            .from(PUBLIC_IMAGES_BUCKET_NAME)
            .download(img.imagePath);

        if (downloadError || !fileBlob) throw new Error('Failed to download the image from public bucket');

        // Upload the image to the private bucket
        const { error: uploadError } = await supabase
            .storage
            .from(PRIVATE_IMAGES_BUCKET_NAME)
            .upload(
                newImageObject.imagePath, 
                fileBlob,
                {
                    metadata: {
                        user_id: user.id,
                        public: false,
                    }
                }
            );

        if (uploadError) throw new Error('Failed to upload the image to private bucket');

        // Delete the image from the public bucket
        const { error: deleteFromPublicError } = await supabase
            .storage
            .from(PUBLIC_IMAGES_BUCKET_NAME)
            .remove([img.imagePath]);

        if (deleteFromPublicError) throw new Error('Failed to delete the image from public bucket');

        // If not private anymore, remove the userId from the path and add the public url
    } else {

        // Updat the image path to only have the id
        newImageObject.imagePath = img.imagePath?.split('/')[1];

        // Download the image from the private bucket
        const { data: fileBlob, error: downloadError } = await supabase
            .storage
            .from(PRIVATE_IMAGES_BUCKET_NAME)
            .download(img.imagePath);

        if (downloadError || !fileBlob) throw new Error('Failed to download the image from private bucket');

        // Upload the image to the public bucket
        const { error: uploadError } = await supabase
            .storage
            .from(PUBLIC_IMAGES_BUCKET_NAME)
            .upload(
                newImageObject.imagePath!, 
                fileBlob,
                {
                    metadata: {
                        user_id: user.id,
                        public: true,
                    }
                }
            );

        if (uploadError) {
            console.error(uploadError)
            throw new Error('Failed to upload the image to public bucket');
        }

        // Delete the image from the private bucket
        const { error: deleteFromPrivateError } = await supabase
            .storage
            .from(PRIVATE_IMAGES_BUCKET_NAME)
            .remove([img.imagePath]);

        if (deleteFromPrivateError) throw new Error('Failed to delete the image from private bucket');

        // Generate the public URL for the image
        const { data: publicUrlData } = supabase
            .storage
            .from(PUBLIC_IMAGES_BUCKET_NAME) // Generate public URL for the new public image path
            .getPublicUrl(newImageObject.imagePath!);

        newImageObject.imageUrl = publicUrlData.publicUrl; // Assign the new public URL
    }

    await prisma.$transaction(async (prisma) => {

        // Switch the public key
        await prisma.image.update({
            where: {
                id: imageId
            },
            data: newImageObject
        });

        if (!newImageObject.public) {

            // Delete all favorites expect the one of the owner.
            await prisma.favorite.deleteMany({
                where: {
                    imageId,
                    userId: {
                        not: user.id,
                    }
                },
            });

        }

    });

    // Return updated image.
    return {
        id: imageId,
        public: !img.public,
    }
}