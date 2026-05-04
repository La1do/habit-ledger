import { Router } from "express";
import { completeTask } from "../controllers/reward.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

router.patch("/:task_id/complete", authMiddlewares, completeTask);

export default router;
