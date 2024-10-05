'use client';

import Image from "next/image";
import useGetPublicImages from "../../utils/hooks/useGetPublicImages.hook";
import { Card, CardContent } from "../ui/card";


const SkeletonLoader = () => (
    <Card className="shadow-lg animate-pulse">
        <CardContent className="flex items-center justify-center h-48 bg-gray-200">
            {/* Placeholder for skeleton loading */}
            <div className="w-full h-full bg-gray-300 rounded"></div>
        </CardContent>
    </Card>
);

export default function ImagesList() {

    const {
        lastElementRef,
        publicImages,
        isFetchingNextPage,
        hasNextPage,
        isLoadingPublicImages, // Extract isLoading from your hook
    } = useGetPublicImages();

    return (
        <div className="container mx-auto px-4 w-full border h-full max-h-full overflow-y-auto p-4">
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
                            <Card key={image.id} className="shadow-lg">
                                <CardContent className="flex items-center justify-center h-48">
                                    {/* Replace this with your actual image rendering */}
                                    <Image 
                                        src={image.imageUrl!} 
                                        alt={image.title} 
                                        className="object-cover w-full h-full" 
                                        width={50}
                                        height={50}
                                    />
                                </CardContent>
                            </Card>
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