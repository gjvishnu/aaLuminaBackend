-- AlterTable
ALTER TABLE "Student" DROP COLUMN "program",
ADD COLUMN     "degreeId" UUID;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "Degree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

