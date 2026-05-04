import { Router } from "express";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/task.controller";
import { linkTaskGoal, unlinkTaskGoal } from "../controllers/taskGoal.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddlewares, getTasks);
router.post("/", authMiddlewares, createTask);
router.put("/:task_id", authMiddlewares, updateTask);
router.delete("/:task_id", authMiddlewares, deleteTask);

router.post("/:task_id/goals", authMiddlewares, linkTaskGoal);
router.delete("/:task_id/goals/:goal_id", authMiddlewares, unlinkTaskGoal);

export default router;