import { apiClient } from './client'
import type { User } from '@/types'

export const authApi = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', { email, password })
    return response.data
  },

  login: async (email: string, password: string): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/login', { email, password })
    return response.data
  },
}
