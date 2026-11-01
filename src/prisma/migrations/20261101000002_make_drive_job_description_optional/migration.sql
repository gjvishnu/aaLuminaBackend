-- Job descriptions are optional when creating a drive role.
ALTER TABLE "DriveRole"
ALTER COLUMN "jobDescription" DROP NOT NULL;
