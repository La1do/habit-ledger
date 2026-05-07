import { useQuery } from '@tanstack/react-query'
import { goalsApi } from '@/api/goals'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { formatMoney, formatDate } from '@/utils/format'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface GoalHistoryProps {
  goalId: string | null
  isOpen: boolean
  onClose: () => void
}

export function GoalHistory({ goalId, isOpen, onClose }: GoalHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.goalHistory(goalId ?? ''),
    queryFn: () => goalsApi.getGoalHistory(goalId!),
    enabled: isOpen && !!goalId,
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lịch sử tích lũy</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có lịch sử tích lũy nào.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{formatDate(entry.createdAt)}</TableCell>
                  <TableCell className="text-xs">{entry.task.title}</TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    {formatMoney(entry.money_earned)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
