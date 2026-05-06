import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeTask } from "../services/reward.service";

vi.mock("../config/prisma", () => import("../__mocks__/prisma"));

import prisma from "../config/prisma";

const mockTask = {
  id: "task-1",
  user_id: "user-1",
  title: "Đọc sách",
  status: "PENDING",
  deadline: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("completeTask", () => {
  it("toggle PENDING → DONE_TODAY thành công", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...mockTask, status: "DONE_TODAY" } as any);

    const result = await completeTask("user-1", "task-1");
    expect(result.status).toBe("DONE_TODAY");
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "DONE_TODAY" },
    });
  });

  it("toggle DONE_TODAY → PENDING (undone) thành công", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue({ ...mockTask, status: "DONE_TODAY" } as any);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...mockTask, status: "PENDING" } as any);

    const result = await completeTask("user-1", "task-1");
    expect(result.status).toBe("PENDING");
  });

  it("throw nếu task không tồn tại hoặc không thuộc user", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

    await expect(completeTask("user-x", "task-1"))
      .rejects.toThrow("Not found or unauthorized");
  });

  it("throw nếu task đã COMPLETED", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue({ ...mockTask, status: "COMPLETED" } as any);

    await expect(completeTask("user-1", "task-1"))
      .rejects.toThrow("Task is already completed");
  });

  it("throw nếu task đã MISSED", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue({ ...mockTask, status: "MISSED" } as any);

    await expect(completeTask("user-1", "task-1"))
      .rejects.toThrow("Cannot complete a missed task");
  });

  it("throw nếu deadline đã qua", async () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 60 * 24); // hôm qua
    vi.mocked(prisma.task.findFirst).mockResolvedValue({
      ...mockTask,
      deadline: pastDeadline,
    } as any);

    await expect(completeTask("user-1", "task-1"))
      .rejects.toThrow("Cannot complete task past its deadline");
  });

  it("không throw nếu deadline chưa qua", async () => {
    const futureDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24); // ngày mai
    vi.mocked(prisma.task.findFirst).mockResolvedValue({
      ...mockTask,
      deadline: futureDeadline,
    } as any);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...mockTask, status: "DONE_TODAY" } as any);

    await expect(completeTask("user-1", "task-1")).resolves.toBeDefined();
  });
});
