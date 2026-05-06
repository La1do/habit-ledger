-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'DONE_TODAY', 'COMPLETED', 'MISSED');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "SchedulerRun" (
    "id" TEXT NOT NULL,
    "ran_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed" INTEGER NOT NULL,
    "missed" INTEGER NOT NULL,

    CONSTRAINT "SchedulerRun_pkey" PRIMARY KEY ("id")
);
