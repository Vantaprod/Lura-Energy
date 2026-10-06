-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "datasheetUrl" TEXT,
ADD COLUMN     "keyFeatures" JSONB,
ADD COLUMN     "modelNumber" TEXT;

-- AlterTable
ALTER TABLE "ProductCategory" ADD COLUMN     "coverAlt" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "summary" TEXT;
