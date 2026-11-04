-- CreateTable
CREATE TABLE "Degree" (
    "id" UUID NOT NULL,
    "degreeName" VARCHAR(150) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Degree_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Degree_degreeName_key" ON "Degree"("degreeName");

