import { useInfiniteQuery } from '@tanstack/react-query'
import { getPublicImages } from '../serverActions/image.actions';
import { Image } from '@prisma/client';
import { useInfinityQueryFunctions } from './useInfinityQueryFunctions.hook';
import { useEffect } from 'react';
import toast from 'react-hot-toast';


const useGetPublicImages = () => {


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
        queryFn: async ({ pageParam = 0 }): Promise<Image[]> => {
            return await getPublicImages(pageParam)
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.length ? pages.length : undefined; // If the last page was not empty, then continue fetching, otherwise stop.
        },
        initialPageParam: 0,
    });

    const {
        lastElementRef,
        flatData,
    } = useInfinityQueryFunctions<Image>({
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetching,
        data,
    });

    useEffect(() => {
        if(errorWhileGettingPublicImages) {
            toast.error(errorWhileGettingPublicImages.message);
        }
    }, [errorWhileGettingPublicImages])

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
    }
}

export default useGetPublicImages;