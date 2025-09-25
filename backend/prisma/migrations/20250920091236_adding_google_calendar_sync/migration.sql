-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "googleCalendarAccessToken" TEXT,
ADD COLUMN     "googleCalendarRefreshToken" TEXT,
ADD COLUMN     "googleCalendarReminderMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "googleCalendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleCalendarTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "syncedTaskKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
