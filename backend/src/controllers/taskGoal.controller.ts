import type { Request, Response } from "express";
import { linkTaskGoal as linkTaskGoalService } from "../services/taskGoal.service";
import { unlinkTaskGoal as unlinkTaskGoalService } from "../services/taskGoal.service";

export const linkTaskGoal = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { task_id } = req.params;
    const { goal_id, reward_amount } = req.body;
    const taskGoal = await linkTaskGoalService(user_id, task_id, { goal_id, reward_amount });
    res.status(201).json(taskGoal);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};

export const unlinkTaskGoal = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { task_id, goal_id } = req.params;
    await unlinkTaskGoalService(user_id, task_id, goal_id);
    res.status(200).json({ message: "Task-goal link removed successfully" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};
