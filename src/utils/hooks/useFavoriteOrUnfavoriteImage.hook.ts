import { useMutation } from "@tanstack/react-query";
import { favoriteOrUnfavoriteImage } from "../serverActions/image.actions";
import toast from "react-hot-toast";
import { IImageType } from "../types";
import useGetImages from "./useGetImages.hook";

const useFavoriteOrUnfavoriteImage = (
    imagesType: IImageType,
) => {

    const {
        updateImage,
    } = useGetImages(imagesType);

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
        onError: (error) => {
            console.log(error);
            // Show toast
            toast.error('Error favoriting image. Please try again');
        },
        onSuccess: ({
            imageId,
            hasFavoritedNow
        }) => {
            toast.success(`Image ${hasFavoritedNow ? 'favorited' : 'unfavorited'} successfully`)
            updateImage({
                id: imageId,
                isFavorited: hasFavoritedNow
            });
        }
    });

    return {
        isFavoritingOrUnfavoritingImage: isPending,
        favoriteOrUnfavoriteImage: mutate,
    }

};

export default useFavoriteOrUnfavoriteImage;