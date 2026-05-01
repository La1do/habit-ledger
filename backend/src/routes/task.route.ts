import { Router } from "express";
import { createTask } from "../controllers/task.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddlewares, createTask);

export default router;