export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: string
  current_amount: string
  status: GoalStatus
  is_saving: boolean
  deleted_at: string | null
}

export interface CreateGoalInput {
  title: string
  target_amount: number
}

export interface UpdateGoalInput {
  title?: string
  target_amount?: number
  is_saving?: boolean
}

export interface GoalHistoryEntry {
  id: string
  money_earned: string
  createdAt: string
  task: {
    id: string
    title: string
  }
}
