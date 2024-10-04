// app/dashboard/upload/page.tsx
import { createClient, getSession } from "@/utils/supabase/server"; // your server-side supabase client
import { revalidatePath } from "next/cache";
import { Input } from "@/components/ui/input"; // Using Shadcn UI components
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

// Form validation schema
const imageSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    public: z.boolean(),
});

// Upload function to handle form submission
async function uploadImage(formData: FormData) {
    'use server'

    const supabase = createClient();
    const session = await getSession();
    
    if(!session) {
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

    // Upload the image to Supabase storage
    const { data: storageData, error: storageError } = await supabase.storage
        .from("images")
        .upload(`public/${imageFile.name}`, 
            imageFile,
            {
                metadata: {
                    user_id: session.user.id, 
                    public: publicImage,
                },
            }
        );

    if (storageError) {
        console.error('Uploading img error: ', storageError);
        return redirect('/error?msg=Error uploading image');
    }

    const imageUrl = supabase.storage.from("images").getPublicUrl(storageData.path).data.publicUrl;

    console.log(imageUrl)

    //TODO: Switch for prisma.
    // Save the metadata to Supabase database
    // const { error: insertError } = await supabase
    //     .from("images")
    //     .insert({
    //         title,
    //         description,
    //         public: publicImage,
    //         image: imageUrl,
    //     });

    // if (insertError) {
    //     console.error('Insert error: ', insertError);
    //     return redirect('/error?msg=Error saving metadata');
    // }

    revalidatePath("/dashboard/public");
    redirect("/dashboard/public");
}

// Image Upload Form Component (Server-side)
export default async function UploadImagePage() {

    async function handleSubmit(formData: FormData) {
        'use server'
        await uploadImage(formData);
      }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-base-200 w-full">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Upload New Image</CardTitle>
                </CardHeader>

                <CardContent>
                    <Separator className="mb-4" />

                    <form
                        className="space-y-4"
                        encType="multipart/form-data"
                    >
                        {/* Title */}
                        <div className="space-y-2">
                            <label htmlFor="title" className="font-medium">Title</label>
                            <Input id="title" name="title" type="text" placeholder="Enter image title" required />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="font-medium">Description</label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Enter image description"
                            />
                        </div>

                        {/* Image File */}
                        <div className="space-y-2">
                            <label htmlFor="image" className="font-medium">Image</label>
                            <Input id="image" name="image" type="file" accept="image/*" required />
                        </div>

                        {/* Public Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox id="public" name="public" />
                            <label htmlFor="public" className="font-medium">Public</label>
                        </div>

                        <Separator className="my-4" />

                        {/* Submit Button */}
                        <Button className="w-full bg-green-600 text-white hover:bg-green-700" formAction={handleSubmit} type="submit">
                            Upload Image
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
