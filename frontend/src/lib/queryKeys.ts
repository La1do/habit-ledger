export const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  goals: ['goals'] as const,
  goalHistory: (id: string) => ['goals', id, 'history'] as const,
  userSummary: ['users', 'summary'] as const,
  ledger: ['ledger'] as const,
} as const
