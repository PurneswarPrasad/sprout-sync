/*
  Warnings:

  - You are about to drop the column `syncedTaskKeys` on the `UserSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "syncedTaskKeys",
ADD COLUMN     "syncedPlantIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
