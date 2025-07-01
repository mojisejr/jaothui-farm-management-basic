-- AlterTable
ALTER TABLE "farms" ADD COLUMN     "crop_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "size" DOUBLE PRECISION;
