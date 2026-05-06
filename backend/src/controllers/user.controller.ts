import type { Request, Response } from "express";
import { getUserSummary as getUserSummaryService } from "../services/user.service";

export const getUserSummary = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) { res.status(401).json({ error: "Unauthorized" }); return; }
    const summary = await getUserSummaryService(user_id);
    res.status(200).json(summary);
  } catch (error) {
    if (error instanceof Error) { res.status(400).json({ error: error.message }); }
    else { res.status(500).json({ error: "Something went wrong" }); }
  }
};
