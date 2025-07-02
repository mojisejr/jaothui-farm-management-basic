/*
  Warnings:

  - You are about to drop the column `animal_type` on the `animals` table. All the data in the column will be lost.
  - Added the required column `animal_type_id` to the `animals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "animals" DROP COLUMN "animal_type",
ADD COLUMN     "animal_type_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "animal_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "animal_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "animal_types_name_key" ON "animal_types"("name");

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_animal_type_id_fkey" FOREIGN KEY ("animal_type_id") REFERENCES "animal_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
