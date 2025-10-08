-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "commonPestsAndDiseases" TEXT,
ADD COLUMN     "petFriendliness" JSONB,
ADD COLUMN     "preventiveMeasures" TEXT;
