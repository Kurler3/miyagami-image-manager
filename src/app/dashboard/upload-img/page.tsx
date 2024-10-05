'use client'

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadImage } from "@/utils/serverActions/image.actions";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UploadImagePage() {

    const [loading, setLoading] = useState(false); // Loading state
 
    // Handle form submission with loading state
    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            // This is your server action to upload the image
            await uploadImage(formData); // Call the server action

            toast.success('Image uploaded successfully!')
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false); // Set loading to false after submission
        }

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
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            await handleSubmit(formData);
                        }}
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
                        <Button 
                            className="w-full bg-green-600 text-white hover:bg-green-700" 
                            type="submit"
                            disabled={loading} // Disable button while loading
                        >
                            {loading && <span className="loading loading-spinner mr-2"></span>}
                            {loading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
