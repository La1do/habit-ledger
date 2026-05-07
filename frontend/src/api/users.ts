import { apiClient } from './client'
import type { UserSummary } from '@/types'

export const usersApi = {
  getSummary: async (): Promise<UserSummary> => {
    const response = await apiClient.get<UserSummary>('/users/me/summary')
    return response.data
  },
}
