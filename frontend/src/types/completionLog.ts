export enum CompletionType {
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

export enum RewardStatus {
  SETTLED = 'SETTLED',
  DEBT = 'DEBT',
}

export interface CompletionLog {
  id: string
  task_id: string
  user_id: string
  goal_id: string
  type: CompletionType
  reward_status: RewardStatus
  money_earned: string
  hash: string
  previousHash: string
  createdAt: string
  task?: {
    id: string
    title: string
  }
  goal?: {
    id: string
    title: string
  }
}
