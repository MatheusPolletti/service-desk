-- CreateEnum
CREATE TYPE "SlaStatus" AS ENUM ('OK', 'WARNING', 'BREACHED');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "slaDueDate" TIMESTAMP(3),
ADD COLUMN     "slaStatus" "SlaStatus" NOT NULL DEFAULT 'OK';
