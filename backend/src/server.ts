import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import authRoutes from "./routes/auth.route";
import taskRoutes from "./routes/task.route";
import goalRoutes from "./routes/goal.route";
import rewardRoutes from "./routes/reward.route";
import schedulerRoutes from "./routes/scheduler.route";
import userRoutes from "./routes/user.route";
import notionRoutes from "./routes/notion.routes";
import { widgetHandler, widgetSseHandler, widgetDataHandler } from "./controllers/notion.controller";
import prisma from "./config/prisma";
import "./jobs/jobs"; // register cron job
import { catchUpIfNeeded } from "./jobs/jobs";

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook route cần rawBody — mount TRƯỚC express.json()
app.post(
  "/api/notion/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
    next();
  }
);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/tasks", rewardRoutes);
app.use("/api/scheduler", schedulerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notion", notionRoutes);

// Widget — public routes, không cần auth header
app.get("/widget/:user_token", widgetHandler);
app.get("/widget/events/:user_token", widgetSseHandler);
app.get("/widget/data/:user_token", widgetDataHandler);


async function main() {
  await prisma.$connect();
  console.log("Database connected!");

  // Catch-up nếu scheduler bị miss
  await catchUpIfNeeded();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main().catch(console.error);

export default app;
