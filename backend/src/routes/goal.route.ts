import { Router } from "express";
import {
  createGoal,
  getGoals,
  updateGoal,
  getGoalHistory,
  deleteGoal,
} from "../controllers/goal.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddlewares, getGoals);
router.post("/", authMiddlewares, createGoal);
router.put("/:goal_id", authMiddlewares, updateGoal);
router.get("/:goal_id/history", authMiddlewares, getGoalHistory);
router.delete("/:goal_id", authMiddlewares, deleteGoal);

export default router;
