import ImagesList from "../../../components/images/ImagesList";
import { getCurrentUser } from "../../../utils/supabase/server";


export default async function DashboardPrivateImagesPage() {
    const user = await getCurrentUser();

    return (
        <div className="w-full h-screen flex justify-start items-center gap-4 p-4 flex-col">
            <h1 className="text-lg font-bold">Dashboard Private Images</h1>
            <ImagesList
                user={user}
                imagesType="private"
            />
        </div>
    )
}