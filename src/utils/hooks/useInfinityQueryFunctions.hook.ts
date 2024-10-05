import { InfiniteData } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";


type IProps<T> = {
    isLoading: boolean;
    hasNextPage: boolean;
    isFetching: boolean;
    fetchNextPage: () => void;
    data: InfiniteData<T[], unknown> | undefined
}

export const useInfinityQueryFunctions = <T extends { id: number | string }>({
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetching,
    data,
}: IProps<T>) => {

    const observer = useRef<IntersectionObserver>();

    const lastElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isLoading) return;

            // If when this func runs there is a observer, disconnect.
            if (observer.current) observer.current.disconnect();

            // Init observer and set in ref
            observer.current = new IntersectionObserver((entries) => {
                // If the first entry attached to this ref is intersecting the view port and
                // if there is a next page
                // and is not currently fetching => fetch next page
                if (entries[0].isIntersecting && hasNextPage && !isFetching) {
                    fetchNextPage();
                }
            });

            if (node) observer.current.observe(node);
        },
        [fetchNextPage, hasNextPage, isFetching, isLoading]
    );

    const flatData = useMemo(() => {
        return data?.pages.flat();
    }, [data?.pages?.map(page => page.length).join('-')]);

    return {
        flatData,
        lastElementRef
    }

}
