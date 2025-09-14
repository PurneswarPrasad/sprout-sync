/*
  Warnings:

  - You are about to drop the column `onesignalPlayerId` on the `UserSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "onesignalPlayerId",
ADD COLUMN     "fcmToken" TEXT;
