import crypto from "crypto";
import type { Prisma } from "../generated/prisma/client";

type PrismaTransaction = Prisma.TransactionClient;

export const createLedgerLog = async (
  tx: PrismaTransaction,
  data: {
    task_id: string;
    user_id: string;
    goal_id: string;
    type: "COMPLETED" | "MISSED";
    reward_status: "SETTLED" | "DEBT";
    money_earned: Prisma.Decimal | number;
  },
) => {
  // 1. Lấy log mới nhất để lấy previousHash
  const lastLog = await tx.completionLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  const previousHash = lastLog ? lastLog.hash : "0000000000000000";

  // 2. Tính hash từ data + previousHash
  const rawData = `${data.task_id}${data.goal_id}${data.user_id}${data.money_earned}${previousHash}`;
  const hash = crypto.createHash("sha256").update(rawData).digest("hex");

  // 3. Ghi log với hash chain
  return tx.completionLog.create({
    data: {
      task: { connect: { id: data.task_id } },
      user: { connect: { id: data.user_id } },
      goal: { connect: { id: data.goal_id } },
      type: data.type,
      reward_status: data.reward_status,
      money_earned: data.money_earned,
      hash,
      previousHash,
    },
  });
};
