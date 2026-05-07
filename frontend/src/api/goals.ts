import { apiClient } from './client'
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalHistoryEntry } from '@/types'

export const goalsApi = {
  getGoals: async (): Promise<Goal[]> => {
    const response = await apiClient.get<Goal[]>('/goals')
    return response.data
  },

  createGoal: async (data: CreateGoalInput): Promise<Goal> => {
    const response = await apiClient.post<Goal>('/goals', data)
    return response.data
  },

  updateGoal: async (id: string, data: UpdateGoalInput): Promise<Goal> => {
    const response = await apiClient.put<Goal>(`/goals/${id}`, data)
    return response.data
  },

  deleteGoal: async (id: string): Promise<void> => {
    await apiClient.delete(`/goals/${id}`)
  },

  getGoalHistory: async (id: string): Promise<GoalHistoryEntry[]> => {
    const response = await apiClient.get<GoalHistoryEntry[]>(`/goals/${id}/history`)
    return response.data
  },
}
