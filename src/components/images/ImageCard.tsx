'use client'

import { Image as IImage } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import Image from "next/image";
import { Button } from "../ui/button";
import { Lock, Star, Unlock } from "lucide-react";
import moment from 'moment';
import useFavoriteOrUnfavoriteImage from "../../utils/hooks/useFavoriteOrUnfavoriteImage.hook";
import { IImageType } from "../../utils/types";

type ImageCardProps = {
    image: IImage; // The entire image object
    isFavorited: boolean; // Boolean to check if the image is favorited
    isOwner: boolean;
    imagesType: IImageType;
};

const ImageCard: React.FC<ImageCardProps> = ({
    image,
    isFavorited,
    isOwner,
    imagesType,
}) => {

    const {
        isFavoritingOrUnfavoritingImage,
        favoriteOrUnfavoriteImage
    } = useFavoriteOrUnfavoriteImage(imagesType,);

    return (
        <Card className="shadow-lg transition-transform duration-200">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{image.title}</CardTitle>
                {isOwner && <span className="text-green-500 text-sm">You own this image</span>}
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                {image.imageUrl ? (
                    <Image
                        src={image.imageUrl}
                        alt={image.title}
                        className="object-cover w-full rounded-md"
                        width={200}
                        height={100}
                    />
                ) : (
                    <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded-md">
                        <span>No Image Available</span>
                    </div>
                )}
                <div className="mt-2 text-center">
                    <p className="text-gray-500 text-sm">
                        Created at: {moment(image.createdAt).format("MMMM Do YYYY, h:mm A")}
                    </p>
                </div>
                <div className="flex justify-between items-center w-full mt-2">
                    <Button
                        variant='ghost'
                        onClick={() => favoriteOrUnfavoriteImage({ imageId: image.id })}
                        className={`flex items-center hover:bg-transparent`}
                    >
                        {
                            isFavoritingOrUnfavoritingImage ? (
                                <span className="loading loading-spinner">

                                </span>
                            ) : (
                                <Star
                                    className={`mr-1 hover:text-yellow-400 ${isFavorited ? 'text-yellow-400' : 'text-gray-500'
                                    }`}
                                />
                            )
                        }

                    </Button>
                    {image.public ? (
                        <Unlock className="text-green-600" />
                    ) : (
                        <Lock className="text-red-600" />
                    )}
                </div>
            </CardContent>
        </Card>
    );

};

export default ImageCard;