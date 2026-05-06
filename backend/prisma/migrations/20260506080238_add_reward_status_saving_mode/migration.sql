-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('SETTLED', 'DEBT');

-- AlterTable
ALTER TABLE "CompletionLog" ADD COLUMN     "reward_status" "RewardStatus" NOT NULL DEFAULT 'SETTLED';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "is_saving" BOOLEAN NOT NULL DEFAULT false;
