import { apiClient } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionStatus {
  connected: boolean
  workspace_id?: string
  page_id?: string | null
}

export interface NotionPage {
  page_id: string
  title: string
  url: string
}

export interface TaskSuggestion {
  notion_block_id: string
  type: 'Habit' | 'OneTime'
  reward_amount: number
  goal_id: string | null
}

export interface ExtractedTask {
  notion_block_id: string
  raw_title: string
  suggestion: TaskSuggestion
}

export interface ConfirmTaskInput {
  notion_block_id: string
  name: string
  type: 'Habit' | 'OneTime'
  reward_amount: number
  goal_id: string | null
}

export interface ConfirmResult {
  created_count: number
  widget_token: string
  widget_url: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const notionApi = {
  getAuthUrl: async (): Promise<string> => {
    const response = await apiClient.get<{ url: string }>('/notion/auth/start', {
      headers: { Accept: 'application/json' },
    })
    return response.data.url
  },

  getStatus: async (): Promise<NotionStatus> => {
    const response = await apiClient.get<NotionStatus>('/notion/status')
    return response.data
  },

  getPages: async (): Promise<NotionPage[]> => {
    const response = await apiClient.get<{ pages: NotionPage[] }>('/notion/pages')
    return response.data.pages
  },

  selectPage: async (pageId: string): Promise<void> => {
    await apiClient.patch('/notion/pages/select', { page_id: pageId })
  },

  extractPage: async (pageId: string): Promise<ExtractedTask[]> => {
    const response = await apiClient.post<{ tasks: ExtractedTask[] }>(
      `/notion/pages/${pageId}/extract`
    )
    return response.data.tasks
  },

  confirmTasks: async (tasks: ConfirmTaskInput[]): Promise<ConfirmResult> => {
    const response = await apiClient.post<ConfirmResult>('/notion/tasks/confirm', { tasks })
    return response.data
  },
}
