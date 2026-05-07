import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { tasksApi } from '@/api/tasks'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { WalletCard } from './components/WalletCard'
import { SummaryStats } from './components/SummaryStats'
import { TodayTasks } from './components/TodayTasks'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const queryClient = useQueryClient()

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useQuery({
    queryKey: QUERY_KEYS.userSummary,
    queryFn: usersApi.getSummary,
  })

  const {
    data: tasks = [],
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: tasksApi.getTasks,
  })

  const { mutate: toggleComplete } = useMutation({
    mutationFn: (taskId: string) => tasksApi.completeTask(taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSummary })
    },
  })

  if (summaryError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-destructive">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Wallet + Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-1">
          {summaryLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : summary ? (
            <WalletCard
              totalMoney={summary.total_money}
              totalDebt={summary.total_debt}
            />
          ) : null}
        </div>
        <div className="lg:col-span-4">
          {summaryLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : summary ? (
            <SummaryStats
              totalEarned={summary.total_earned}
              totalDebt={summary.total_debt}
              goalsCompleted={summary.goals_completed}
              goalsActive={summary.goals_active}
            />
          ) : null}
        </div>
      </div>

      {/* Today Tasks */}
      <TodayTasks
        tasks={tasks}
        onToggleComplete={(id) => toggleComplete(id)}
        isLoading={tasksLoading}
      />
    </div>
  )
}
