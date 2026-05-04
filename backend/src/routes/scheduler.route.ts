import { Router } from "express";
import { runScheduler } from "../controllers/scheduler.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

// Manual trigger for testing
router.post("/run", authMiddlewares, runScheduler);

export default router;
