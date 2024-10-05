import { useMutation } from "@tanstack/react-query";
import { favoriteOrUnfavoriteImage } from "../serverActions/image.actions";
import toast from "react-hot-toast";
import useGetPublicImages from "./useGetPublicImages.hook";

const useFavoriteOrUnfavoriteImage = () => {

    const {
        updateImage,
    } = useGetPublicImages();

    const {
        // data,
        isPending,
        // error,
        mutate,
    } = useMutation({
        mutationKey: ["favorite.unfavorite.image"],
        mutationFn: async ({ imageId }: { imageId: string }) => {
            const hasFavoritedNow = await favoriteOrUnfavoriteImage(imageId);
            return {
                imageId,
                hasFavoritedNow,
            }
        },
        onError: () => {
            // Show toast
            toast.error('Error favoriting image. Please try again');
        },
        onSuccess: ({
            imageId,
            hasFavoritedNow
        }) => {
            updateImage({
                id: imageId,
                isFavorited: hasFavoritedNow
            })
        }
    });

    return {
        isFavoritingOrUnfavoritingImage: isPending,
        favoriteOrUnfavoriteImage: mutate,
    }

};

export default useFavoriteOrUnfavoriteImage;