import type { Request, Response } from "express";
import {
  createGoal as createGoalService,
  getGoals as getGoalsService,
  updateGoal as updateGoalService,
  getGoalHistory as getGoalHistoryService,
  deleteGoal as deleteGoalService,
} from "../services/goal.service";

export const createGoal = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { title, target_amount } = req.body;
    const goal = await createGoalService(user_id, { title, target_amount });
    res.status(201).json(goal);
  } catch (error) {
    if (error instanceof Error) { res.status(400).json({ error: error.message }); }
    else { res.status(500).json({ error: "Something went wrong" }); }
  }
};

export const getGoals = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) { res.status(401).json({ error: "Unauthorized" }); return; }
    const goals = await getGoalsService(user_id);
    res.status(200).json(goals);
  } catch (error) {
    if (error instanceof Error) { res.status(400).json({ error: error.message }); }
    else { res.status(500).json({ error: "Something went wrong" }); }
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { goal_id } = req.params;
    const { title, target_amount, is_saving } = req.body;
    const goal = await updateGoalService(user_id, goal_id, { title, target_amount, is_saving });
    res.status(200).json(goal);
  } catch (error) {
    if (error instanceof Error) { res.status(400).json({ error: error.message }); }
    else { res.status(500).json({ error: "Something went wrong" }); }
  }
};

export const getGoalHistory = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { goal_id } = req.params;
    const history = await getGoalHistoryService(user_id, goal_id);
    res.status(200).json(history);
  } catch (error) {
    if (error instanceof Error) { res.status(400).json({ error: error.message }); }
    else { res.status(500).json({ error: "Something went wrong" }); }
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { goal_id } = req.params;
    await deleteGoalService(user_id, goal_id);
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    if (error instanceof Error) { res.status(400).json({ error: error.message }); }
    else { res.status(500).json({ error: "Something went wrong" }); }
  }
};
