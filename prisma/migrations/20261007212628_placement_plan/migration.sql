/*
  Warnings:

  - Added the required column `plan` to the `placement_attempts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "placement_attempts" ADD COLUMN     "plan" JSONB NOT NULL;
