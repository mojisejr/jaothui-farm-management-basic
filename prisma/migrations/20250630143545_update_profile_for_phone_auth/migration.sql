/*
  Warnings:

  - You are about to drop the column `email` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "profiles_email_key";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "email",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phoneNumber_key" ON "profiles"("phoneNumber");
