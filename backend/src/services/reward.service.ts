import prisma from "../config/prisma";

export const completeTask = async (user_id: string, task_id: string) => {
  // 1. Check task tồn tại + thuộc user
  const task = await prisma.task.findFirst({
    where: { id: task_id, user_id },
  });
  if (!task) {
    throw new Error("Not found or unauthorized");
  }

  // 2. Check deadline chưa qua
  if (task.deadline && task.deadline < new Date()) {
    throw new Error("Cannot complete task past its deadline");
  }

  // 3. Check status không phải COMPLETED/MISSED
  if (task.status === "COMPLETED") {
    throw new Error("Task is already completed");
  }
  if (task.status === "MISSED") {
    throw new Error("Cannot complete a missed task");
  }

  // 4. Toggle status only — tiền sẽ được tính bởi scheduler
  const newStatus = task.status === "PENDING" ? "DONE_TODAY" : "PENDING";

  const updatedTask = await prisma.task.update({
    where: { id: task_id },
    data: { status: newStatus },
  });

  return updatedTask;
};
