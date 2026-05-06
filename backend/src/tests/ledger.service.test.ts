import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { createLedgerLog } from "../services/ledger.service";

// Mock tx (Prisma transaction client)
const mockTx = {
  completionLog: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

const baseData = {
  task_id: "task-1",
  user_id: "user-1",
  goal_id: "goal-1",
  type: "COMPLETED" as const,
  reward_status: "SETTLED" as const,
  money_earned: 50000,
};

describe("createLedgerLog", () => {
  it("ghi log với previousHash = genesis khi chưa có log nào", async () => {
    mockTx.completionLog.findFirst.mockResolvedValue(null);
    mockTx.completionLog.create.mockResolvedValue({ id: "log-1", ...baseData });

    await createLedgerLog(mockTx as any, baseData);

    const expectedRaw = `${baseData.task_id}${baseData.goal_id}${baseData.user_id}${baseData.money_earned}0000000000000000`;
    const expectedHash = crypto.createHash("sha256").update(expectedRaw).digest("hex");

    expect(mockTx.completionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hash: expectedHash,
          previousHash: "0000000000000000",
        }),
      })
    );
  });

  it("ghi log với previousHash từ log trước", async () => {
    const prevHash = "abc123def456";
    mockTx.completionLog.findFirst.mockResolvedValue({ hash: prevHash });
    mockTx.completionLog.create.mockResolvedValue({ id: "log-2", ...baseData });

    await createLedgerLog(mockTx as any, baseData);

    const expectedRaw = `${baseData.task_id}${baseData.goal_id}${baseData.user_id}${baseData.money_earned}${prevHash}`;
    const expectedHash = crypto.createHash("sha256").update(expectedRaw).digest("hex");

    expect(mockTx.completionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hash: expectedHash,
          previousHash: prevHash,
        }),
      })
    );
  });

  it("hash khác nhau cho 2 logs khác nhau", async () => {
    mockTx.completionLog.findFirst.mockResolvedValue(null);
    mockTx.completionLog.create.mockResolvedValue({ id: "log-1" });

    await createLedgerLog(mockTx as any, baseData);
    const call1 = mockTx.completionLog.create.mock.calls[0][0].data.hash;

    vi.clearAllMocks();
    mockTx.completionLog.findFirst.mockResolvedValue(null);
    mockTx.completionLog.create.mockResolvedValue({ id: "log-2" });

    await createLedgerLog(mockTx as any, { ...baseData, money_earned: 99999 });
    const call2 = mockTx.completionLog.create.mock.calls[0][0].data.hash;

    expect(call1).not.toBe(call2);
  });

  it("ghi đúng type và reward_status", async () => {
    mockTx.completionLog.findFirst.mockResolvedValue(null);
    mockTx.completionLog.create.mockResolvedValue({ id: "log-1" });

    await createLedgerLog(mockTx as any, { ...baseData, type: "MISSED", reward_status: "DEBT" });

    expect(mockTx.completionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "MISSED",
          reward_status: "DEBT",
        }),
      })
    );
  });
});
