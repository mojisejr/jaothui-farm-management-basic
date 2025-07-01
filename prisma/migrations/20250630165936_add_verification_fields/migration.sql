-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
