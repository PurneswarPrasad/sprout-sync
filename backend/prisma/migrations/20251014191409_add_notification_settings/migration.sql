-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "fcmToken" TEXT,
ADD COLUMN     "notificationPromptShown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
