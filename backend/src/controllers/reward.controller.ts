import type { Request, Response } from "express";
import { completeTask as completeTaskService } from "../services/reward.service";

export const completeTask = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { task_id } = req.params;
    const task = await completeTaskService(user_id, task_id as string);
    res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};
