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
  webhookHandler,
} from "../controllers/notion.controller";

const router = Router();

// OAuth flow
router.get("/auth/start", authMiddleware, startOAuth);
router.get("/auth/callback", oauthCallback);

// Protected routes
router.get("/status", authMiddleware, getStatus);
router.get("/pages", authMiddleware, getPages);
router.patch("/pages/select", authMiddleware, selectPageHandler);

// Extract + Confirm
router.post("/pages/:page_id/extract", authMiddleware, extractPage);
router.post("/tasks/confirm", authMiddleware, confirmTasks);

// Webhook — dùng express.raw() (mount ở server.ts)
router.post("/webhook", webhookHandler);

export default router;
