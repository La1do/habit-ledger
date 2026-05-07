import { Check, RotateCcw, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Task } from '@/types'
import { TaskStatus, TaskType } from '@/types'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onOpenGoalManager: (task: Task) => void
}

function getStatusBadgeVariant(status: TaskStatus) {
  switch (status) {
    case TaskStatus.DONE_TODAY: return 'success' as const
    case TaskStatus.COMPLETED: return 'default' as const
    case TaskStatus.MISSED: return 'destructive' as const
    default: return 'secondary' as const
  }
}

function getStatusLabel(status: TaskStatus) {
  switch (status) {
    case TaskStatus.PENDING: return 'Chờ'
    case TaskStatus.DONE_TODAY: return 'Xong hôm nay'
    case TaskStatus.COMPLETED: return 'Hoàn thành'
    case TaskStatus.MISSED: return 'Bỏ lỡ'
  }
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenGoalManager,
}: TaskCardProps) {
  const canToggle =
    task.status === TaskStatus.PENDING || task.status === TaskStatus.DONE_TODAY
  const canEdit =
    task.status === TaskStatus.PENDING || task.status === TaskStatus.DONE_TODAY
  const isDone = task.status === TaskStatus.DONE_TODAY
  const linkedGoals = task.taskGoals ?? []

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          {/* Clickable title area → mở goal manager */}
          <button
            type="button"
            className="flex items-center gap-2 min-w-0 flex-1 text-left group"
            onClick={() => onOpenGoalManager(task)}
            title="Quản lý goals"
          >
            <span
              className={cn(
                'text-sm font-medium truncate group-hover:text-primary transition-colors',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </span>
            <Badge variant={getStatusBadgeVariant(task.status)} className="shrink-0 text-xs">
              {getStatusLabel(task.status)}
            </Badge>
            <Badge variant="outline" className="shrink-0 text-xs">
              {task.type === TaskType.Habit ? 'Habit' : 'OneTime'}
            </Badge>
            {linkedGoals.length > 0 && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                🎯 {linkedGoals.length}
              </Badge>
            )}
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {canToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id) }}
                title={isDone ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
              >
                {isDone ? (
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                title="Chỉnh sửa"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Meta info */}
        {(task.deadline || task.isRecurring) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground pl-0">
            {task.deadline && <span>Hạn: {formatDate(task.deadline)}</span>}
            {task.isRecurring && task.repeatFrequency && (
              <span>Lặp: {task.repeatFrequency}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
