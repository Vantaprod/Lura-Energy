-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "ProductCategory" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "ProductSpecification" ADD COLUMN     "translations" JSONB;
