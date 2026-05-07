import { Check, RotateCcw, Pencil, Trash2, Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatMoney, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Task, Goal, TaskGoal } from '@/types'
import { TaskStatus, TaskType } from '@/types'

interface TaskGoalWithGoal extends TaskGoal {
  goal: Goal
}

interface TaskCardProps {
  task: Task
  linkedGoals: TaskGoalWithGoal[]
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onLinkGoal: (taskId: string) => void
  onUnlinkGoal: (taskId: string, goalId: string) => void
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
  linkedGoals,
  onToggleComplete,
  onEdit,
  onDelete,
  onLinkGoal,
  onUnlinkGoal,
}: TaskCardProps) {
  const canToggle =
    task.status === TaskStatus.PENDING || task.status === TaskStatus.DONE_TODAY
  const canEdit =
    task.status === TaskStatus.PENDING || task.status === TaskStatus.DONE_TODAY
  const isDone = task.status === TaskStatus.DONE_TODAY

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-sm font-medium truncate',
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {canToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggleComplete(task.id)}
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
                onClick={() => onEdit(task)}
                title="Chỉnh sửa"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Meta info */}
        {(task.deadline || task.isRecurring) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.deadline && <span>Hạn: {formatDate(task.deadline)}</span>}
            {task.isRecurring && task.repeatFrequency && (
              <span>Lặp: {task.repeatFrequency}</span>
            )}
          </div>
        )}

        {/* Linked goals */}
        <div className="space-y-1">
          {linkedGoals.map((tg) => (
            <div
              key={tg.goal_id}
              className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
            >
              <span className="text-muted-foreground truncate">
                🎯 {tg.goal.title} — {formatMoney(tg.reward_amount)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 shrink-0"
                onClick={() => onUnlinkGoal(task.id, tg.goal_id)}
                title="Bỏ gắn"
              >
                <Unlink className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground px-2"
            onClick={() => onLinkGoal(task.id)}
          >
            <Link2 className="h-3 w-3 mr-1" />
            Gắn goal
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
