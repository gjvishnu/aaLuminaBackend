-- CreateEnum
CREATE TYPE "CampusDriveStatus" AS ENUM ('DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'APPRENTICESHIP');

-- CreateEnum
CREATE TYPE "SelectionProcess" AS ENUM ('ONLINE_ASSESSMENT', 'APTITUDE_TEST', 'TECHNICAL_TEST', 'GROUP_DISCUSSION', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'MANAGERIAL_INTERVIEW', 'CASE_STUDY', 'CODING_ROUND', 'OTHER');

-- CreateTable
CREATE TABLE "CampusDrive" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "driveDate" DATE NOT NULL,
    "driveTime" VARCHAR(5) NOT NULL,
    "venue" VARCHAR(255) NOT NULL,
    "registrationEndDate" DATE,
    "status" "CampusDriveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampusDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveRole" (
    "id" UUID NOT NULL,
    "driveId" UUID NOT NULL,
    "jobRole" VARCHAR(150) NOT NULL,
    "jobLocation" VARCHAR(150),
    "jobType" "JobType" NOT NULL,
    "ctcPackage" VARCHAR(100) NOT NULL,
    "numberOfOpenings" INTEGER NOT NULL,
    "graduationYears" INTEGER[],
    "minimumCgpa" DECIMAL(4,2),
    "maximumBacklogs" INTEGER,
    "degree" VARCHAR(150),
    "otherCriteria" TEXT[],
    "jobDescription" TEXT NOT NULL,
    "jdPdfUrl" VARCHAR(500),
    "selectionProcesses" "SelectionProcess"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveRoleDepartment" (
    "driveRoleId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,

    CONSTRAINT "DriveRoleDepartment_pkey" PRIMARY KEY ("driveRoleId","departmentId")
);

-- CreateTable
CREATE TABLE "DriveRoleSkill" (
    "driveRoleId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "DriveRoleSkill_pkey" PRIMARY KEY ("driveRoleId","skillId")
);

-- CreateIndex
CREATE INDEX "CampusDrive_companyId_idx" ON "CampusDrive"("companyId");

-- CreateIndex
CREATE INDEX "CampusDrive_driveDate_idx" ON "CampusDrive"("driveDate");

-- CreateIndex
CREATE INDEX "CampusDrive_status_idx" ON "CampusDrive"("status");

-- CreateIndex
CREATE INDEX "DriveRole_driveId_idx" ON "DriveRole"("driveId");

-- CreateIndex
CREATE INDEX "DriveRole_jobRole_idx" ON "DriveRole"("jobRole");

-- CreateIndex
CREATE INDEX "DriveRole_jobType_idx" ON "DriveRole"("jobType");

-- CreateIndex
CREATE INDEX "DriveRoleDepartment_departmentId_idx" ON "DriveRoleDepartment"("departmentId");

-- CreateIndex
CREATE INDEX "DriveRoleSkill_skillId_idx" ON "DriveRoleSkill"("skillId");

-- AddForeignKey
ALTER TABLE "CampusDrive" ADD CONSTRAINT "CampusDrive_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRole" ADD CONSTRAINT "DriveRole_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "CampusDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRoleDepartment" ADD CONSTRAINT "DriveRoleDepartment_driveRoleId_fkey" FOREIGN KEY ("driveRoleId") REFERENCES "DriveRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRoleDepartment" ADD CONSTRAINT "DriveRoleDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRoleSkill" ADD CONSTRAINT "DriveRoleSkill_driveRoleId_fkey" FOREIGN KEY ("driveRoleId") REFERENCES "DriveRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRoleSkill" ADD CONSTRAINT "DriveRoleSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
