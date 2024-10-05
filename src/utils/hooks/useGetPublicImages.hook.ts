import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getPublicImages } from '../serverActions/image.actions';
import { useInfinityQueryFunctions } from './useInfinityQueryFunctions.hook';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { IImageWithFavorited } from '../types';
import _ from 'lodash';

const useGetPublicImages = () => {

    const queryClient = useQueryClient();

    const {
        fetchNextPage,
        isFetching,
        isLoading,
        isFetchingNextPage,
        data,
        error: errorWhileGettingPublicImages,
        hasNextPage,
        status,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["public.images"],
        queryFn: async ({ pageParam = 0 }): Promise<IImageWithFavorited[]> => {
            return await getPublicImages(pageParam)
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.length ? pages.length : undefined; // If the last page was not empty, then continue fetching, otherwise stop.
        },
        initialPageParam: 0,
        // staleTime: 60 * 1000 * 3 // 3 mins
    });

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
            ['public.images'],
            (oldData: InfiniteData<IImageWithFavorited[]>) => {

                const newData =  _.cloneDeep(oldData); // { ...oldData };
             
                // Find indexes
                const indexes = itemIdToIndexesMap.get(imageToUpdate.id);

                if (!indexes) {
                    toast.error('Trouble updating the image in cache. Please reload')
                    return newData;
                }
        
                const existingImage = newData.pages[indexes!.pageIndex][indexes!.indexInPage];

                Object.assign(existingImage, imageToUpdate);

                return newData;
            }
        )

    }

    //////////////////////////////////////////
    // CHECK FOR ERRORS //////////////////////
    //////////////////////////////////////////

    useEffect(() => {
        if (errorWhileGettingPublicImages) {
            toast.error(errorWhileGettingPublicImages.message);
        }
    }, [errorWhileGettingPublicImages])

    //////////////////////////////////////////
    // RETURN ////////////////////////////////
    //////////////////////////////////////////

    return {
        lastElementRef,
        isLoadingPublicImages: status === "pending",
        publicImages: flatData,
        status,
        refetch,
        errorWhileGettingPublicImages,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,

        ///////////////////////
        // FUNCTIONS //////////
        ///////////////////////

        updateImage,
    }
}

export default useGetPublicImages;