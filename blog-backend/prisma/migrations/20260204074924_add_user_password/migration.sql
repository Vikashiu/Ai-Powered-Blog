/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add column as nullable first
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- Set a temporary password for existing users (they'll need to reset)
-- Using bcrypt hash of "ChangeMe123" for existing users
UPDATE "User" SET "password" = '$2b$10$le/NEuvS1OVX1eGLdQYo4uGNZCTy0Iqot7vyyPtAuSgcWzRHcOKwN' WHERE "password" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
