import { Image } from "@prisma/client";


export type IImageWithFavorited = Image & {
    isFavorited: boolean;
}

export type IImageType = 'public' | 'private' | 'favorite';