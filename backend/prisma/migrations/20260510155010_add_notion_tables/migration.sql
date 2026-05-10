-- CreateTable
CREATE TABLE "NotionConnection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "page_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotionConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotionTask" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "notion_block_id" TEXT NOT NULL,
    "task_id" TEXT,
    "raw_title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotionTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotionConnection_user_id_key" ON "NotionConnection"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "NotionTask_notion_block_id_key" ON "NotionTask"("notion_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "NotionTask_task_id_key" ON "NotionTask"("task_id");

-- AddForeignKey
ALTER TABLE "NotionConnection" ADD CONSTRAINT "NotionConnection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionTask" ADD CONSTRAINT "NotionTask_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "NotionConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionTask" ADD CONSTRAINT "NotionTask_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
