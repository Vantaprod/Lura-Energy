-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "solutionId" TEXT;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
