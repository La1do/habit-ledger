import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTask, getTasks, updateTask, deleteTask } from "../services/task.service";

vi.mock("../config/prisma", () => import("../__mocks__/prisma"));

import prisma from "../config/prisma";

const mockUser = { id: "user-1", email: "test@test.com", total_money: 1000000 };
const mockTask = {
  id: "task-1",
  user_id: "user-1",
  title: "Đọc sách",
  status: "PENDING",
  type: "Habit",
  isRecurring: true,
  repeatFrequency: "DAILY",
  deadline: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createTask ───────────────────────────────────────────────────────────────

describe("createTask", () => {
  it("tạo task thành công", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.task.create).mockResolvedValue(mockTask as any);

    const result = await createTask("user-1", {
      title: "Đọc sách",
      type: "Habit",
      isRecurring: true,
      repeatFrequency: "DAILY",
      deadline: new Date(),
    });

    expect(result).toEqual(mockTask);
    expect(prisma.task.create).toHaveBeenCalledOnce();
  });

  it("throw nếu user không tồn tại", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      createTask("user-x", { title: "Test", type: "OneTime", isRecurring: false, deadline: new Date() })
    ).rejects.toThrow("User not found");
  });

  it("throw nếu Habit mà isRecurring = false", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await expect(
      createTask("user-1", { title: "Test", type: "Habit", isRecurring: false, deadline: new Date() })
    ).rejects.toThrow("Habits must be recurring");
  });

  it("throw nếu isRecurring = true nhưng thiếu repeatFrequency", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await expect(
      createTask("user-1", { title: "Test", type: "Habit", isRecurring: true, deadline: new Date() })
    ).rejects.toThrow("Repeat frequency is required for recurring tasks");
  });
});

// ─── getTasks ─────────────────────────────────────────────────────────────────

describe("getTasks", () => {
  it("trả về danh sách tasks của user", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask] as any);

    const result = await getTasks("user-1");
    expect(result).toHaveLength(1);
  });
});

// ─── updateTask ───────────────────────────────────────────────────────────────

describe("updateTask", () => {
  it("update title thành công", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...mockTask, title: "Mới" } as any);

    const result = await updateTask("user-1", "task-1", { title: "Mới" });
    expect(result.title).toBe("Mới");
  });

  it("throw nếu task không thuộc user", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

    await expect(updateTask("user-x", "task-1", { title: "Mới" }))
      .rejects.toThrow("Not found or unauthorized");
  });

  it("throw nếu status không phải PENDING khi update status", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue({ ...mockTask, status: "DONE_TODAY" } as any);

    await expect(updateTask("user-1", "task-1", { status: "DONE_TODAY" }))
      .rejects.toThrow("Status can only be updated from PENDING to DONE_TODAY");
  });

  it("throw nếu update status sang giá trị khác DONE_TODAY", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);

    await expect(updateTask("user-1", "task-1", { status: "COMPLETED" as any }))
      .rejects.toThrow("Status can only be updated to DONE_TODAY");
  });

  it("throw nếu isRecurring = true nhưng thiếu repeatFrequency", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);

    await expect(updateTask("user-1", "task-1", { isRecurring: true }))
      .rejects.toThrow("Repeat frequency is required for recurring tasks");
  });

  it("throw nếu type = Habit nhưng isRecurring = false", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue({ ...mockTask, isRecurring: false } as any);

    await expect(updateTask("user-1", "task-1", { type: "Habit" }))
      .rejects.toThrow("Habits must be recurring");
  });
});

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe("deleteTask", () => {
  it("xóa task thành công", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(mockTask as any);
    vi.mocked(prisma.task.delete).mockResolvedValue(mockTask as any);

    await expect(deleteTask("user-1", "task-1")).resolves.toBeUndefined();
    expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: "task-1" } });
  });

  it("throw nếu task không tồn tại hoặc không thuộc user", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

    await expect(deleteTask("user-x", "task-1"))
      .rejects.toThrow("Task not found or unauthorized");
  });
});
