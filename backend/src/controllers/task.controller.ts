import type { Request, Response } from "express";
import { createTask as createtaskService } from "../services/task.service";
import { deleteTask as deletetaskService } from "../services/task.service";
import { getTasks as getTasksService } from "../services/task.service";
import { updateTask as updateTaskService } from "../services/task.service";

export const createTask = async (req: Request, res: Response) => {
  try {
    // Assuming you have user authentication middleware
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { title, type, isRecurring, repeatFrequency, deadline } = req.body;
    const task = await createtaskService(user_id, {
      title,
      type,
      isRecurring,
      repeatFrequency,
      deadline,
    });
    res.status(201).json(task);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const tasks = await getTasksService(user_id);
    res.status(200).json(tasks);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const task_id = req.params.task_id as string;
    if (!task_id) {
      res.status(400).json({ error: "Task ID is required" });
      return;
    }
    const { title, type, isRecurring, repeatFrequency, deadline, status } =
      req.body;
    const task = await updateTaskService(user_id, task_id, {
      title,
      type,
      isRecurring,
      repeatFrequency,
      deadline,
      status,
    });
    res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { task_id } = req.params;
    await deletetaskService(user_id, task_id as string);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};
