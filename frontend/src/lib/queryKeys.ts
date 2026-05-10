export const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  goals: ['goals'] as const,
  goalHistory: (id: string) => ['goals', id, 'history'] as const,
  userSummary: ['users', 'summary'] as const,
  ledger: ['ledger'] as const,
  notionStatus: ['notion', 'status'] as const,
  notionPages: ['notion', 'pages'] as const,
} as const
