/*
  Warnings:

  - The `careLevel` column on the `Plant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sunRequirements` column on the `Plant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `toxicityLevel` column on the `Plant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Plant" DROP COLUMN "careLevel",
ADD COLUMN     "careLevel" JSONB,
DROP COLUMN "sunRequirements",
ADD COLUMN     "sunRequirements" JSONB,
DROP COLUMN "toxicityLevel",
ADD COLUMN     "toxicityLevel" JSONB;
