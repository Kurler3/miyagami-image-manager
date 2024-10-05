'use server'

import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "../supabase/server";
import { z } from "zod";
import { v4 as uuid } from 'uuid';
import prisma from "../prisma/prisma";
import { revalidatePath } from "next/cache";





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
        return redirect('/error?msg=Invalid form data');
    }

    ////////////////////////////////////////////////////////////////////////
    // VALIDATE THE FILE MIME TYPE /////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedMimeTypes.includes(imageFile.type)) {
        console.error('Error: Invalid file type');
        return redirect(`/error?msg=Invalid file type. Valid types: ${allowedMimeTypes.join(', ')}`);
    }

    ////////////////////////////////////////////////////////////////////////
    // VALIDATE THE FILE SIZE //////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    const maxSizeInBytes = 50 * 1024 * 1024; // 50 MB max size

    if (imageFile.size > maxSizeInBytes) {
        console.error('Error: File is too large');
        return redirect('/error?msg=File is too large. Max size is 50MB');
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
        return redirect('/error?msg=Error uploading image');
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

        return redirect('/error?msg=Error saving image');
    }

    // Select path to revalidate and redirect to.
    const pathToRedirectTo = `/dashboard/${publicImage ? 'public' : 'private'}`;

    // Refresh data on the target path
    revalidatePath(pathToRedirectTo);

    // Redirect to path
    redirect(pathToRedirectTo);
}
