




// Three types of images: public, private and favorite.
// For public it's simple. Just need to read the public url
// For private: need to get a signed url from the backend
// For favorite, could be either private or public, so its a mix.
// In the end, the logic of the hook will be the same for every type, maybe just some changes when the user updates an image
// (stops favoriting and this list is for the favorites, need to remove it from cache, for example)

import { InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getPrivateImages, getPublicImages } from "../serverActions/image.actions";
import { IImageType, IImageWithFavorited } from "../types";
import { useInfinityQueryFunctions } from "./useInfinityQueryFunctions.hook";
import _ from "lodash";
import toast from "react-hot-toast";
import { useEffect } from "react";


const useGetImages = (
    type: IImageType
) => {

    const queryClient = useQueryClient();

    const queryKey = ['images', type];

    const {
        fetchNextPage,
        isFetching,
        isLoading,
        isFetchingNextPage,
        data,
        error,
        hasNextPage,
        status,
        refetch,
    } = useInfiniteQuery({
        enabled: !!type,
        queryKey,
        queryFn: async ({ pageParam = 0 }): Promise<IImageWithFavorited[]> => {

            let images: IImageWithFavorited[];

            switch (type) {
                case 'public':
                    images = await getPublicImages(pageParam);
                    break;
                case 'private': 
                    images = await getPrivateImages(pageParam);
                    break;
                default:
                    throw new Error('This type is not supported');
            }

            return images;
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.length ? pages.length : undefined; // If the last page was not empty, then continue fetching, otherwise stop.
        },
        initialPageParam: 0,
    })


    const {
        lastElementRef,
        flatData,
        itemIdToIndexesMap,
    } = useInfinityQueryFunctions<IImageWithFavorited>({
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetching,
        data,
    });


    //////////////////////////////////////////
    // FUNCTIONS /////////////////////////////
    //////////////////////////////////////////

    // Update a public image.
    const updateImage = (imageToUpdate: Partial<IImageWithFavorited> & { id: string }) => {

        queryClient.setQueryData(
            queryKey,
            (oldData: InfiniteData<IImageWithFavorited[]>) => {

                const newData = _.cloneDeep(oldData); // { ...oldData };

                if(!newData) {
                    console.error('No data found for: ', type);
                    return null;
                }
                // Find indexes
                const indexes = itemIdToIndexesMap.get(imageToUpdate.id);

                if (!indexes) {
                    toast.error('Trouble updating the image in cache. Please reload')
                    return newData;
                }

                const existingImage = newData.pages[indexes!.pageIndex][indexes!.indexInPage];

                let shouldRemove = false;

                // If the type is favorite and stopped favoriting it => remove it instead.
                if (type === 'favorite' && imageToUpdate.isFavorited === false) shouldRemove = true;
                // If in private page and switched the image to public => remove it
                if (type === 'private' && imageToUpdate.public === true) shouldRemove = true;
                // If in public page and switched the image to private => remove it.
                if (type === 'public' && imageToUpdate.public === false) shouldRemove = true;

                if (shouldRemove) {

                    newData.pages[indexes!.pageIndex].splice(indexes!.indexInPage, 1);

                } else {
                    // Simply update the image object
                    Object.assign(existingImage, imageToUpdate);
                }

                return newData;
            }
        )

    }

    //////////////////////////////////////////
    // CHECK FOR ERRORS //////////////////////
    //////////////////////////////////////////

    useEffect(() => {
        if (error) {
            toast.error(error.message);
        }
    }, [error])

    //////////////////////////////////////////
    // RETURN ////////////////////////////////
    //////////////////////////////////////////

    return {
        lastElementRef,
        isLoadingPublicImages: status === "pending",
        publicImages: flatData,
        status,
        refetch,
        error,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,

        ///////////////////////
        // FUNCTIONS //////////
        ///////////////////////

        updateImage,
    }

};

export default useGetImages;
