import type { Request, Response } from "express";
import { createTask as createtaskService } from "../services/task.service";

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
