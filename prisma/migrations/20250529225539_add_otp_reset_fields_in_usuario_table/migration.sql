/*
  Warnings:

  - You are about to drop the column `resetPasswordExpires` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordToken` on the `Usuario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Usuario_nome_key";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "resetPasswordExpires",
DROP COLUMN "resetPasswordToken",
ADD COLUMN     "passwordChangeSessionToken" TEXT,
ADD COLUMN     "passwordChangeSessionTokenExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordOtp" TEXT,
ADD COLUMN     "resetPasswordOtpExpires" TIMESTAMP(3);
