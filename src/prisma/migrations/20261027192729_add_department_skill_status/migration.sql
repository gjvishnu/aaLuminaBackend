-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
