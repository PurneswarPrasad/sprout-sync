-- CreateTable
CREATE TABLE "PlantSuggestedTask" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "frequencyDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantSuggestedTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantSuggestedTask_plantId_taskKey_key" ON "PlantSuggestedTask"("plantId", "taskKey");

-- AddForeignKey
ALTER TABLE "PlantSuggestedTask" ADD CONSTRAINT "PlantSuggestedTask_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
