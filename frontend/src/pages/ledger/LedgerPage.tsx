import { useQuery } from '@tanstack/react-query'
import { goalsApi } from '@/api/goals'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { LogTable } from './components/LogTable'
import type { GoalHistoryEntry } from '@/types'

interface LogEntry extends GoalHistoryEntry {
  goalTitle: string
}

export function LedgerPage() {
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: QUERY_KEYS.goals,
    queryFn: goalsApi.getGoals,
  })

  // Fetch history của từng goal rồi flatten, chỉ khi goals đã load xong
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['ledger', 'all', goals.map((g) => g.id).join(',')],
    queryFn: async (): Promise<LogEntry[]> => {
      const results = await Promise.all(
        goals.map((goal) =>
          goalsApi.getGoalHistory(goal.id).then((entries) =>
            entries.map((entry): LogEntry => ({
              ...entry,
              goalTitle: goal.title,
            }))
          )
        )
      )
      return results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    },
    enabled: !goalsLoading && goals.length > 0,
  })

  const isLoading = goalsLoading || logsLoading

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ledger</h1>
        {!isLoading && (
          <p className="text-xs text-muted-foreground">{logs.length} giao dịch</p>
        )}
      </div>

      <div className="rounded-md border">
        <LogTable logs={logs} isLoading={isLoading} />
      </div>
    </div>
  )
}
