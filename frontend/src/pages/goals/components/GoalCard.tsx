import { Pencil, Trash2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/utils/format'
import type { Goal } from '@/types'
import { GoalStatus } from '@/types'

interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => void
  onViewHistory: (id: string) => void
}

export function GoalCard({ goal, onEdit, onDelete, onViewHistory }: GoalCardProps) {
  const current = parseFloat(goal.current_amount)
  const target = parseFloat(goal.target_amount)
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0
  const isCompleted = goal.status === GoalStatus.COMPLETED

  return (
    <Card className={isCompleted ? 'border-green-200 bg-green-50/30' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-sm font-medium truncate">{goal.title}</CardTitle>
            {isCompleted && (
              <Badge variant="success" className="shrink-0 text-xs">Hoàn thành</Badge>
            )}
            {goal.is_saving && (
              <Badge variant="secondary" className="shrink-0 text-xs">Saving</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onViewHistory(goal.id)}
              title="Lịch sử"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(goal)}
              title="Chỉnh sửa"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(goal.id)}
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percent} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatMoney(goal.current_amount)}</span>
          <span className="font-medium text-foreground">{percent}%</span>
          <span>{formatMoney(goal.target_amount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
