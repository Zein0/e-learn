/*
  Warnings:

  - You are about to drop the column `description` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[titleEn]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `descriptionAr` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descriptionEn` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleAr` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleEn` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Course_title_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "descriptionAr" TEXT NOT NULL,
ADD COLUMN     "descriptionEn" TEXT NOT NULL,
ADD COLUMN     "titleAr" TEXT NOT NULL,
ADD COLUMN     "titleEn" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Course_titleEn_key" ON "Course"("titleEn");
