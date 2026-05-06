import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkTaskGoal, unlinkTaskGoal } from "../services/taskGoal.service";

vi.mock("../config/prisma", () => import("../__mocks__/prisma"));

import prisma from "../config/prisma";

const mockTask = { id: "task-1", user_id: "user-1", title: "Test", status: "PENDING" };
const mockGoal = { id: "goal-1", user_id: "user-1", title: "Mua laptop", status: "ACTIVE" };
const mockTaskGoal = { task_id: "task-1", goal_id: "goal-1", reward_amount: 50000 };

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── linkTaskGoal ─────────────────────────────────────────────────────────────

describe("linkTaskGoal", () => {
  it("gắn task với goal thành công", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.taskGoal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.taskGoal.create).mockResolvedValue(mockTaskGoal as any);

    const result = await linkTaskGoal("user-1", "task-1", { goal_id: "goal-1", reward_amount: 50000 });
    expect(result).toEqual(mockTaskGoal);
  });

  it("throw nếu thiếu goal_id", async () => {
    await expect(linkTaskGoal("user-1", "task-1", { goal_id: "", reward_amount: 50000 }))
      .rejects.toThrow("goal_id is required");
  });

  it("throw nếu reward_amount = 0", async () => {
    await expect(linkTaskGoal("user-1", "task-1", { goal_id: "goal-1", reward_amount: 0 }))
      .rejects.toThrow("reward_amount must be greater than 0");
  });

  it("throw nếu reward_amount âm", async () => {
    await expect(linkTaskGoal("user-1", "task-1", { goal_id: "goal-1", reward_amount: -100 }))
      .rejects.toThrow("reward_amount must be greater than 0");
  });

  it("throw nếu task không thuộc user", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

    await expect(linkTaskGoal("user-x", "task-1", { goal_id: "goal-1", reward_amount: 50000 }))
      .rejects.toThrow("Not found or unauthorized");
  });

  it("throw nếu goal không thuộc user", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await expect(linkTaskGoal("user-1", "task-1", { goal_id: "goal-x", reward_amount: 50000 }))
      .rejects.toThrow("Not found or unauthorized");
  });

  it("throw nếu task đã gắn với goal này rồi", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.taskGoal.findFirst).mockResolvedValue(mockTaskGoal as any);

    await expect(linkTaskGoal("user-1", "task-1", { goal_id: "goal-1", reward_amount: 50000 }))
      .rejects.toThrow("Task is already linked to this goal");
  });
});

// ─── unlinkTaskGoal ───────────────────────────────────────────────────────────

describe("unlinkTaskGoal", () => {
  it("bỏ gắn thành công", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.taskGoal.findFirst).mockResolvedValue(mockTaskGoal as any);
    vi.mocked(prisma.taskGoal.delete).mockResolvedValue(mockTaskGoal as any);

    await expect(unlinkTaskGoal("user-1", "task-1", "goal-1")).resolves.toBeUndefined();
    expect(prisma.taskGoal.delete).toHaveBeenCalledWith({
      where: { task_id_goal_id: { task_id: "task-1", goal_id: "goal-1" } },
    });
  });

  it("throw nếu task không thuộc user", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

    await expect(unlinkTaskGoal("user-x", "task-1", "goal-1"))
      .rejects.toThrow("Not found or unauthorized");
  });

  it("throw nếu link không tồn tại", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.taskGoal.findFirst).mockResolvedValue(null);

    await expect(unlinkTaskGoal("user-1", "task-1", "goal-x"))
      .rejects.toThrow("Not found or unauthorized");
  });
});
