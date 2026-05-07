import { apiClient } from './client'

interface SchedulerResult {
  message: string
  confirmed: number
  missed: number
}

export const schedulerApi = {
  run: async (): Promise<SchedulerResult> => {
    const response = await apiClient.post<SchedulerResult>('/scheduler/run')
    return response.data
  },
}
