import { Router } from "express";
import { getUserSummary } from "../controllers/user.controller";
import authMiddlewares from "../middlewares/auth.middleware";

const router = Router();

router.get("/me/summary", authMiddlewares, getUserSummary);

export default router;
