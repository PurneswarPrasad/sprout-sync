-- CreateTable
CREATE TABLE "PlantTracking" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "photoUrl" TEXT,
    "cloudinaryPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantTracking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlantTracking" ADD CONSTRAINT "PlantTracking_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
