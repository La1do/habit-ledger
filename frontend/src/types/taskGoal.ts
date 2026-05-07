import type { Goal } from './goal'

export interface TaskGoal {
  task_id: string
  goal_id: string
  reward_amount: string
}

export interface TaskGoalWithGoal extends TaskGoal {
  goal: Goal
}

export interface LinkTaskGoalInput {
  goal_id: string
  reward_amount: number
}
