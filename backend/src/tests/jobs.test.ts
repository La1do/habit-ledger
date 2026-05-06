import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma", () => import("../__mocks__/prisma"));
vi.mock("node-cron", () => ({ default: { schedule: vi.fn() } }));
vi.mock("../services/ledger.service", () => ({
  createLedgerLog: vi.fn().mockResolvedValue({ id: "log-1" }),
}));

import prisma from "../config/prisma";
import { confirmDailyTasks } from "../jobs/jobs";

const mockUser = { id: "user-1", total_money: 1000000 };
const mockGoal = {
  id: "goal-1",
  user_id: "user-1",
  target_amount: 200000,
  current_amount: 0,
  status: "ACTIVE",
  is_saving: false,
  deleted_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmDailyTasks", () => {
  it("trả về 0/0 khi không có task nào", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([]);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const result = await confirmDailyTasks();
    expect(result).toEqual({ confirmed: 0, missed: 0 });
  });

  it("confirm task DONE_TODAY — set COMPLETED, cộng reward vào goal", async () => {
    const task = {
      id: "task-1",
      user_id: "user-1",
      status: "DONE_TODAY",
      isRecurring: false,
      repeatFrequency: null,
      deadline: null,
      taskGoals: [{ goal_id: "goal-1", reward_amount: 100000 }],
    };

    vi.mocked(prisma.task.findMany).mockResolvedValue([task] as any);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const txMock = {
      user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
      goal: {
        findUnique: vi.fn().mockResolvedValue(mockGoal),
        update: vi.fn().mockResolvedValue({ ...mockGoal, current_amount: 100000 }),
      },
      task: { update: vi.fn().mockResolvedValue({ ...task, status: "COMPLETED" }) },
      user2: { update: vi.fn() },
    };

    // Patch user update vào txMock
    (txMock as any).user.update = vi.fn().mockResolvedValue({});

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(txMock));

    const result = await confirmDailyTasks();
    expect(result.confirmed).toBe(1);
    expect(result.missed).toBe(0);
  });

  it("set MISSED cho task PENDING quá deadline", async () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 60);
    const task = {
      id: "task-2",
      user_id: "user-1",
      status: "PENDING",
      isRecurring: false,
      repeatFrequency: null,
      deadline: pastDeadline,
      taskGoals: [],
    };

    vi.mocked(prisma.task.findMany).mockResolvedValue([task] as any);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const txMock = {
      task: { update: vi.fn().mockResolvedValue({ ...task, status: "MISSED" }) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(txMock));

    const result = await confirmDailyTasks();
    expect(result.missed).toBe(1);
    expect(txMock.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "MISSED" } })
    );
  });

  it("recurring task DONE_TODAY → reset PENDING với deadline mới", async () => {
    const deadline = new Date("2026-05-06T00:00:00.000Z");
    const task = {
      id: "task-3",
      user_id: "user-1",
      status: "DONE_TODAY",
      isRecurring: true,
      repeatFrequency: "DAILY",
      deadline,
      taskGoals: [],
    };

    vi.mocked(prisma.task.findMany).mockResolvedValue([task] as any);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const txMock = {
      user: { findUnique: vi.fn().mockResolvedValue(mockUser), update: vi.fn() },
      task: { update: vi.fn().mockResolvedValue({ ...task, status: "PENDING" }) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(txMock));

    await confirmDailyTasks();

    expect(txMock.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          deadline: new Date("2026-05-07T00:00:00.000Z"),
        }),
      })
    );
  });

  it("goal đạt target → set COMPLETED (khi không phải saving mode)", async () => {
    const task = {
      id: "task-4",
      user_id: "user-1",
      status: "DONE_TODAY",
      isRecurring: false,
      repeatFrequency: null,
      deadline: null,
      taskGoals: [{ goal_id: "goal-1", reward_amount: 200000 }],
    };

    const goalAtTarget = { ...mockGoal, current_amount: 0, target_amount: 200000 };

    vi.mocked(prisma.task.findMany).mockResolvedValue([task] as any);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const txMock = {
      user: { findUnique: vi.fn().mockResolvedValue(mockUser), update: vi.fn() },
      goal: {
        findUnique: vi.fn().mockResolvedValue(goalAtTarget),
        update: vi.fn().mockResolvedValue({ ...goalAtTarget, current_amount: 200000 }),
      },
      task: { update: vi.fn().mockResolvedValue({}) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(txMock));

    await confirmDailyTasks();

    // Goal update được gọi 2 lần: cộng current_amount + set COMPLETED
    expect(txMock.goal.update).toHaveBeenCalledTimes(2);
    expect(txMock.goal.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { status: "COMPLETED" } })
    );
  });

  it("saving mode — goal không set COMPLETED dù đạt target", async () => {
    const task = {
      id: "task-5",
      user_id: "user-1",
      status: "DONE_TODAY",
      isRecurring: false,
      repeatFrequency: null,
      deadline: null,
      taskGoals: [{ goal_id: "goal-1", reward_amount: 200000 }],
    };

    const savingGoal = { ...mockGoal, current_amount: 0, target_amount: 200000, is_saving: true };

    vi.mocked(prisma.task.findMany).mockResolvedValue([task] as any);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const txMock = {
      user: { findUnique: vi.fn().mockResolvedValue(mockUser), update: vi.fn() },
      goal: {
        findUnique: vi.fn().mockResolvedValue(savingGoal),
        update: vi.fn().mockResolvedValue({ ...savingGoal, current_amount: 200000 }),
      },
      task: { update: vi.fn().mockResolvedValue({}) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(txMock));

    await confirmDailyTasks();

    // Goal update chỉ được gọi 1 lần (cộng current_amount), không set COMPLETED
    expect(txMock.goal.update).toHaveBeenCalledTimes(1);
    expect(txMock.goal.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "COMPLETED" } })
    );
  });

  it("debt — không đủ tiền → không trừ total_money", async () => {
    const poorUser = { id: "user-1", total_money: 10 }; // chỉ có 10
    const task = {
      id: "task-6",
      user_id: "user-1",
      status: "DONE_TODAY",
      isRecurring: false,
      repeatFrequency: null,
      deadline: null,
      taskGoals: [{ goal_id: "goal-1", reward_amount: 100000 }], // cần 100000
    };

    vi.mocked(prisma.task.findMany).mockResolvedValue([task] as any);
    vi.mocked(prisma.schedulerRun.create).mockResolvedValue({} as any);

    const txMock = {
      user: { findUnique: vi.fn().mockResolvedValue(poorUser), update: vi.fn() },
      goal: {
        findUnique: vi.fn().mockResolvedValue(mockGoal),
        update: vi.fn().mockResolvedValue({ ...mockGoal, current_amount: 100000 }),
      },
      task: { update: vi.fn().mockResolvedValue({}) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(txMock));

    await confirmDailyTasks();

    // user.update không được gọi vì totalDeducted = 0
    expect(txMock.user.update).not.toHaveBeenCalled();
  });
});
