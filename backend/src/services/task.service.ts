import prisma from "../config/prisma";
import type { RepeatFrequency, TaskStatus, TaskType } from "../generated/prisma/enums";

export const createTask = async (
  user_id: string,
  data: {
    title: string;
    type: TaskType;
    isRecurring: boolean;
    repeatFrequency?: RepeatFrequency;
    deadline: Date;
  },
) => {
  // Implement task creation logic here
  const user = await prisma.user.findUnique({
    where: { id: user_id },
  });
  if (!user) {
    throw new Error("User not found");
  }
  if (!data.type || data.isRecurring === undefined) {
    throw new Error("Missing required fields");
  }
  if (data.type === "Habit" && !data.isRecurring) {
    throw new Error("Habits must be recurring");
  }
  if (data.isRecurring && data.repeatFrequency === undefined) {
    throw new Error("Repeat frequency is required for recurring tasks");
  }
  const task = await prisma.task.create({
    data: {
      title: data.title || "Untitled Task",
      type: data.type,
      status: "PENDING",
      isRecurring: data.isRecurring,
      repeatFrequency: data.repeatFrequency ?? null,
      deadline: data.deadline ?? null,
      user: { connect: { id: user_id } },
    },
  });
  return task;
};

export const getTasks = async (user_id: string) => {
  return prisma.task.findMany({ where: { id: user_id } });
};

export const deleteTask = async (user_id: string, task_id: string) => {
  const task = await prisma.task.findFirst({
    where: { id: task_id, user_id: user_id },
  });
  if (!task) {
    throw new Error("Task not found or unauthorized");
  }
  await prisma.task.delete({
    where: { id: task_id },
  });
};

export const updateTask = async (
  user_id: string,
  task_id: string,
  data: {
    title?: string;
    type?: TaskType;
    isRecurring?: boolean;
    repeatFrequency?: RepeatFrequency | null;
    deadline?: Date | null;
    status?: TaskStatus;
  },
) => {
  const task = await prisma.task.findFirst({ where: { id: task_id, user_id } });
  if (!task) {
    throw new Error("Not found or unauthorized");
  }

  // Status transition validation
  if (data.status !== undefined) {
    if (task.status !== "PENDING") {
      throw new Error("Status can only be updated from PENDING to DONE_TODAY");
    }
    if (data.status !== "DONE_TODAY") {
      throw new Error("Status can only be updated to DONE_TODAY");
    }
  }

  // Business logic validation
  if (data.isRecurring === true && data.repeatFrequency === undefined) {
    throw new Error("Repeat frequency is required for recurring tasks");
  }

  if (data.type === "Habit") {
    const effectiveIsRecurring =
      data.isRecurring !== undefined ? data.isRecurring : task.isRecurring;
    if (effectiveIsRecurring !== true) {
      throw new Error("Habits must be recurring");
    }
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  if (data.repeatFrequency !== undefined) updateData.repeatFrequency = data.repeatFrequency;
  if (data.deadline !== undefined) updateData.deadline = data.deadline;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.task.update({ where: { id: task_id }, data: updateData });
};
