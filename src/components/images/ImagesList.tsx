'use client';

import { User } from "@supabase/supabase-js";
import { Card, CardContent } from "../ui/card";
import ImageCard from "./ImageCard";
import { IImageType } from "../../utils/types";
import useGetImages from "../../utils/hooks/useGetImages.hook";

const SkeletonLoader = () => (
    <Card className="shadow-lg animate-pulse border-none">
        <CardContent className="flex items-center justify-center h-96 ">
            {/* Placeholder for skeleton loading */}
            <div className="w-full skeleton h-full "></div>
        </CardContent>
    </Card>
);

type IProps = {
    user: User | null;
    imagesType: IImageType
}

export default function ImagesList({
    user,
    imagesType,
}: IProps) {



    const {
        lastElementRef,
        publicImages,
        isFetchingNextPage,
        hasNextPage,
        isLoadingPublicImages, // Extract isLoading from your hook
    } = useGetImages(imagesType);

    return (
        <div className="container mx-auto px-4 w-full h-full max-h-full overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoadingPublicImages || !publicImages ? (
                    // Show skeleton loaders when the data is loading initially
                    <>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <SkeletonLoader key={index} />
                        ))}
                    </>
                ) : (
                    <>
                        {publicImages.length === 0 && (
                            <p>No images found.</p>
                        )}
                        {publicImages.map((image) => (
                            <ImageCard
                                key={`image_card_${image.id}`}
                                image={image}
                                isFavorited={image.isFavorited}
                                isOwner={user?.id === image.userId}
                                imagesType={imagesType}
                            />
                        ))}

                        {/* Show skeleton loaders while fetching more images */}
                        {isFetchingNextPage && (
                            <>
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <SkeletonLoader key={index} />
                                ))}
                            </>
                        )}
                        {/* Last element ref to trigger load more */}
                        {hasNextPage && (
                            <div ref={lastElementRef} className="h-10" />
                        )}

                    </>
                )}
            </div>
        </div>
    );
}