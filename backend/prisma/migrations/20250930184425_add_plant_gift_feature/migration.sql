-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "isGifted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlantGift" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "giftToken" TEXT NOT NULL,
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PlantGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantGift_plantId_key" ON "PlantGift"("plantId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantGift_giftToken_key" ON "PlantGift"("giftToken");

-- AddForeignKey
ALTER TABLE "PlantGift" ADD CONSTRAINT "PlantGift_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantGift" ADD CONSTRAINT "PlantGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantGift" ADD CONSTRAINT "PlantGift_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
