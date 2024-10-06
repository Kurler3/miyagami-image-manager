import { useMutation } from "@tanstack/react-query";
import { IImageType } from "../types";
import useGetImages from "./useGetImages.hook";
import { switchImageVisibility } from "../serverActions/image.actions";
import toast from "react-hot-toast";


const useSwitchImageVisibility = (type: IImageType) => {

    const {
        updateImage,
    } = useGetImages(type);

    const {
        // data,
        isPending,
        // error,
        mutate,
    } = useMutation({
        mutationKey: ["switch.image.visibility"],
        mutationFn: async ({ imageId }: { imageId: string }) => {
            return await switchImageVisibility(imageId);
        },
        onError: (error) => {
            console.log(error);
            // Show toast
            toast.error('Error switing the visibility of the image. Please try again');
        },
        onSuccess: (updatedImage) => {
            toast.success(`Image visibility switched successfully`)
            updateImage(updatedImage);
        }
    });

    return {
        isSwitchingVisibilityOfImage: isPending,
        switchImageVisibility: mutate,
    }

};

export default useSwitchImageVisibility;