import { Router } from "express";
import { createGoal, getGoals, deleteGoal } from "../controllers/goal.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddlewares, getGoals);
router.post("/", authMiddlewares, createGoal);
router.delete("/:goal_id", authMiddlewares, deleteGoal);

export default router;
