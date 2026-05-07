import { apiClient } from './client'
import type { User } from '@/types'

export const authApi = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', { email, password })
    return response.data
  },

  login: async (email: string, password: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string }>('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh-token')
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}
