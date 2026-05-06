import "dotenv/config";
import express from "express";
import cron from "node-cron";
import authRoutes from "./routes/auth.route";
import taskRoutes from "./routes/task.route";
import goalRoutes from "./routes/goal.route";
import rewardRoutes from "./routes/reward.route";
import schedulerRoutes from "./routes/scheduler.route";
import userRoutes from "./routes/user.route";
import prisma from "./config/prisma";
import "./jobs/jobs"; // register cron job
import { catchUpIfNeeded } from "./jobs/jobs";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/tasks", rewardRoutes);
app.use("/api/scheduler", schedulerRoutes);
app.use("/api/users", userRoutes);


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
