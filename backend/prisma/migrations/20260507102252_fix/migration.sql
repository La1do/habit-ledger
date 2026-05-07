/*
  Warnings:

  - Added the required column `hash` to the `CompletionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousHash` to the `CompletionLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompletionLog" ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "previousHash" TEXT NOT NULL;
