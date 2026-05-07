import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney, formatDate } from '@/utils/format'
import type { GoalHistoryEntry } from '@/types'

interface LogEntry extends GoalHistoryEntry {
  goalTitle: string
}

interface LogTableProps {
  logs: LogEntry[]
  isLoading: boolean
}

export function LogTable({ logs, isLoading }: LogTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Chưa có lịch sử giao dịch nào.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ngày</TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Goal</TableHead>
          <TableHead className="text-right">Số tiền</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-xs whitespace-nowrap">
              {formatDate(entry.createdAt)}
            </TableCell>
            <TableCell className="text-xs">{entry.task.title}</TableCell>
            <TableCell className="text-xs">{entry.goalTitle}</TableCell>
            <TableCell className="text-xs text-right font-medium">
              {formatMoney(entry.money_earned)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
