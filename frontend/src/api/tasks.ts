import { apiClient } from './client'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

export const tasksApi = {
  getTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks')
    return response.data
  },

  createTask: async (data: CreateTaskInput): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', data)
    return response.data
  },

  updateTask: async (id: string, data: UpdateTaskInput): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data)
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
