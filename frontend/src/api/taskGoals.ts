import { apiClient } from './client'
import type { TaskGoal } from '@/types'

export const taskGoalsApi = {
  linkTaskGoal: async (
    taskId: string,
    goalId: string,
    rewardAmount: number
  ): Promise<TaskGoal> => {
    const response = await apiClient.post<TaskGoal>(`/tasks/${taskId}/goals`, {
      goal_id: goalId,
      reward_amount: rewardAmount,
    })
    return response.data
  },

  unlinkTaskGoal: async (taskId: string, goalId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/goals/${goalId}`)
  },
}
