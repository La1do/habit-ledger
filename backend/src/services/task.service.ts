import prisma from "../config/prisma";
import type { RepeatFrequency, TaskType } from "../generated/prisma/enums";

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
      user_id: user_id,
      title: data.title || "Untitled Task",
      type: data.type,
      isRecurring: data.isRecurring,
      repeatFrequency: data.repeatFrequency ?? null,
      deadline: data.deadline ?? null,
    },
  });
  return task;
};

