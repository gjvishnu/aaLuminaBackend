-- Add a per-user token version so logout can invalidate issued JWTs.
ALTER TABLE "User"
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
