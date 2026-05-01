import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.route";
import taskRoutes from "./routes/task.route";
import prisma from "./config/prisma";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes)

async function main() {
  await prisma.$connect();
  console.log("Database connected!");

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main().catch(console.error);

export default app;
