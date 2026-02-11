/*
  Warnings:

  - You are about to drop the column `inReplyTo` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `parentMessageId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `senderEmail` on the `Message` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_parentMessageId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "inReplyTo",
DROP COLUMN "parentMessageId",
DROP COLUMN "senderEmail";
