-- DropForeignKey
ALTER TABLE "CompletionLog" DROP CONSTRAINT "CompletionLog_task_id_fkey";

-- AlterTable
ALTER TABLE "CompletionLog" ALTER COLUMN "task_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CompletionLog" ADD CONSTRAINT "CompletionLog_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
