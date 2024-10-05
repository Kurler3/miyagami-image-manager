/*
  Warnings:

  - Added the required column `imagePath` to the `images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "images" ADD COLUMN     "imagePath" TEXT NOT NULL;
