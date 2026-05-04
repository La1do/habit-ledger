import type { Request, Response } from "express";
import { confirmDailyTasks } from "../jobs/jobs";

export const runScheduler = async (req: Request, res: Response) => {
  try {
    const result = await confirmDailyTasks();
    res.status(200).json({ message: "Scheduler ran successfully", ...result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};
