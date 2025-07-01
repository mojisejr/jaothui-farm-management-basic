/*
  Warnings:

  - You are about to drop the column `user_id` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password_hash` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Made the column `phoneNumber` on table `profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "profiles_user_id_key";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "user_id",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3),
ALTER COLUMN "phoneNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
