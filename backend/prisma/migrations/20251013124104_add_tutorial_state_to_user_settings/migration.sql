-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "tutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tutorialCompletedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tutorialSkippedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[];
