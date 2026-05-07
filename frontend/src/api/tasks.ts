import { apiClient } from './client'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

// Normalize deadline: "2026-05-09" → "2026-05-09T00:00:00.000Z"
function normalizeDeadline(deadline?: string): string | undefined {
  if (!deadline) return undefined
  // Nếu chỉ có date (YYYY-MM-DD), append time
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return `${deadline}T00:00:00.000Z`
  }
  return deadline
}

export const tasksApi = {
  getTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks')
    return response.data
  },

  createTask: async (data: CreateTaskInput): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', {
      ...data,
      deadline: normalizeDeadline(data.deadline),
    })
    return response.data
  },

  updateTask: async (id: string, data: UpdateTaskInput): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, {
      ...data,
      deadline: normalizeDeadline(data.deadline),
    })
    return response.data
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },

  completeTask: async (id: string): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/complete`)
    return response.data
  },
}
