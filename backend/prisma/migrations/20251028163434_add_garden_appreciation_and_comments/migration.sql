-- CreateTable
CREATE TABLE "GardenAppreciation" (
    "id" TEXT NOT NULL,
    "gardenOwnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GardenAppreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenComment" (
    "id" TEXT NOT NULL,
    "gardenOwnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GardenComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GardenAppreciation_gardenOwnerId_userId_key" ON "GardenAppreciation"("gardenOwnerId", "userId");

-- AddForeignKey
ALTER TABLE "GardenAppreciation" ADD CONSTRAINT "GardenAppreciation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenComment" ADD CONSTRAINT "GardenComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


