import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  startOAuth,
  oauthCallback,
  getPages,
  selectPageHandler,
  getStatus,
  extractPage,
  confirmTasks,
} from "../controllers/notion.controller";

const router = Router();

// OAuth flow — callback không cần JWT (dùng state token)
router.get("/auth/start", authMiddleware, startOAuth);
router.get("/auth/callback", oauthCallback);

// Protected routes
router.get("/status", authMiddleware, getStatus);
router.get("/pages", authMiddleware, getPages);
router.patch("/pages/select", authMiddleware, selectPageHandler);

// Extract + Confirm (tuần 2)
router.post("/pages/:page_id/extract", authMiddleware, extractPage);
router.post("/tasks/confirm", authMiddleware, confirmTasks);

export default router;
