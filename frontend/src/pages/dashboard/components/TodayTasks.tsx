import { Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import type { Task } from '@/types'
import { TaskStatus } from '@/types'

interface TodayTasksProps {
  tasks: Task[]
  onToggleComplete: (taskId: string) => void
  isLoading: boolean
}

export function TodayTasks({ tasks, onToggleComplete, isLoading }: TodayTasksProps) {
  const todayTasks = tasks.filter(
    (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.DONE_TODAY
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks hôm nay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Tasks hôm nay
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({todayTasks.filter((t) => t.status === TaskStatus.DONE_TODAY).length}/{todayTasks.length} hoàn thành)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Không có task nào hôm nay.
          </p>
        ) : (
          <ul className="space-y-2">
            {todayTasks.map((task) => {
              const isDone = task.status === TaskStatus.DONE_TODAY
              return (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'text-sm truncate',
                        isDone && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </span>
                    <Badge variant={isDone ? 'success' : 'secondary'} className="shrink-0">
                      {isDone ? 'Xong' : 'Chờ'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => onToggleComplete(task.id)}
                    title={isDone ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
                  >
                    {isDone ? (
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
