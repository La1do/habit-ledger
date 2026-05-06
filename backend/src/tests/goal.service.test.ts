import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGoal, getGoals, updateGoal, deleteGoal } from "../services/goal.service";

vi.mock("../config/prisma", () => import("../__mocks__/prisma"));

import prisma from "../config/prisma";

const mockGoal = {
  id: "goal-1",
  user_id: "user-1",
  title: "Mua laptop",
  target_amount: 10000000,
  current_amount: 500000,
  status: "ACTIVE",
  is_saving: false,
  deleted_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createGoal ───────────────────────────────────────────────────────────────

describe("createGoal", () => {
  it("tạo goal thành công", async () => {
    vi.mocked(prisma.goal.create).mockResolvedValue(mockGoal as any);

    const result = await createGoal("user-1", { title: "Mua laptop", target_amount: 10000000 });
    expect(result).toEqual(mockGoal);
    expect(prisma.goal.create).toHaveBeenCalledOnce();
  });

  it("throw nếu thiếu title", async () => {
    await expect(createGoal("user-1", { title: "", target_amount: 10000000 }))
      .rejects.toThrow("Title is required");
  });

  it("throw nếu target_amount = 0", async () => {
    await expect(createGoal("user-1", { title: "Test", target_amount: 0 }))
      .rejects.toThrow("target_amount must be greater than 0");
  });

  it("throw nếu target_amount âm", async () => {
    await expect(createGoal("user-1", { title: "Test", target_amount: -500 }))
      .rejects.toThrow("target_amount must be greater than 0");
  });
});

// ─── getGoals ─────────────────────────────────────────────────────────────────

describe("getGoals", () => {
  it("trả về goals chưa bị soft delete", async () => {
    vi.mocked(prisma.goal.findMany).mockResolvedValue([mockGoal] as any);

    const result = await getGoals("user-1");
    expect(result).toHaveLength(1);
    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: { user_id: "user-1", deleted_at: null },
    });
  });
});

// ─── updateGoal ───────────────────────────────────────────────────────────────

describe("updateGoal", () => {
  it("update title thành công", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({ ...mockGoal, title: "Mua laptop gaming" } as any);

    const result = await updateGoal("user-1", "goal-1", { title: "Mua laptop gaming" });
    expect(result.title).toBe("Mua laptop gaming");
  });

  it("throw nếu goal không thuộc user", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await expect(updateGoal("user-x", "goal-1", { title: "Test" }))
      .rejects.toThrow("Not found or unauthorized");
  });

  it("throw nếu target_amount < current_amount", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any); // current = 500000

    await expect(updateGoal("user-1", "goal-1", { target_amount: 100000 }))
      .rejects.toThrow("target_amount cannot be less than current_amount");
  });

  it("throw nếu target_amount = 0", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);

    await expect(updateGoal("user-1", "goal-1", { target_amount: 0 }))
      .rejects.toThrow("target_amount must be greater than 0");
  });

  it("bật saving mode thành công", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({ ...mockGoal, is_saving: true } as any);

    const result = await updateGoal("user-1", "goal-1", { is_saving: true });
    expect(result.is_saving).toBe(true);
  });
});

// ─── deleteGoal ───────────────────────────────────────────────────────────────

describe("deleteGoal", () => {
  it("soft delete goal thành công", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({ ...mockGoal, deleted_at: new Date() } as any);

    await expect(deleteGoal("user-1", "goal-1")).resolves.toBeUndefined();
    expect(prisma.goal.update).toHaveBeenCalledWith({
      where: { id: "goal-1" },
      data: expect.objectContaining({ deleted_at: expect.any(Date) }),
    });
  });

  it("throw nếu goal không tồn tại", async () => {
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await expect(deleteGoal("user-x", "goal-1"))
      .rejects.toThrow("Not found or unauthorized");
  });
});
