/*
  Warnings:

  - You are about to drop the column `category` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `CourseDifficulty` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Topic` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId,nameEn]` on the table `CourseDifficulty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseId,nameAr]` on the table `CourseDifficulty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryAr` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryEn` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameAr` to the `CourseDifficulty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `CourseDifficulty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameAr` to the `Topic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `Topic` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CourseDifficulty_courseId_label_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "category",
ADD COLUMN     "categoryAr" TEXT NOT NULL,
ADD COLUMN     "categoryEn" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CourseDifficulty" DROP COLUMN "label",
ADD COLUMN     "nameAr" TEXT NOT NULL,
ADD COLUMN     "nameEn" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameAr" TEXT NOT NULL,
ADD COLUMN     "nameEn" TEXT NOT NULL;

-- DropEnum
DROP TYPE "DifficultyLabel";

-- CreateIndex
CREATE UNIQUE INDEX "CourseDifficulty_courseId_nameEn_key" ON "CourseDifficulty"("courseId", "nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "CourseDifficulty_courseId_nameAr_key" ON "CourseDifficulty"("courseId", "nameAr");
