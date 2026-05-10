import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/utils/format'
import type { ExtractedTask, ConfirmTaskInput } from '@/api/notion'
import type { Goal } from '@/types'
import { GoalStatus } from '@/types'

interface StepConfirmProps {
  tasks: ExtractedTask[]
  goals: Goal[]
  isLoading: boolean
  isSubmitting: boolean
  onReExtract: () => void
  onConfirm: (tasks: ConfirmTaskInput[]) => void
}

interface EditableTask {
  notion_block_id: string
  name: string
  type: 'Habit' | 'OneTime'
  reward_amount: number
  goal_id: string | null
}

export function StepConfirm({
  tasks,
  goals,
  isLoading,
  isSubmitting,
  onReExtract,
  onConfirm,
}: StepConfirmProps) {
  const [editableTasks, setEditableTasks] = useState<EditableTask[]>(() =>
    tasks.map((t) => ({
      notion_block_id: t.notion_block_id,
      name: t.raw_title,
      type: t.suggestion.type,
      reward_amount: t.suggestion.reward_amount,
      goal_id: t.suggestion.goal_id,
    }))
  )

  const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE)

  const updateTask = (index: number, field: keyof EditableTask, value: string | number | null) => {
    setEditableTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  const handleConfirm = () => {
    onConfirm(editableTasks)
  }

  if (isLoading) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-base">Đang phân tích tasks...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Xác nhận tasks</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              AI đã gợi ý cấu hình. Bạn có thể chỉnh sửa trước khi xác nhận.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onReExtract} disabled={isLoading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Gợi ý lại
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Không tìm thấy to-do item nào trong page này.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-4">Tên task</div>
              <div className="col-span-2">Loại</div>
              <div className="col-span-3">Reward (VNĐ)</div>
              <div className="col-span-3">Goal</div>
            </div>

            {/* Rows */}
            {editableTasks.map((task, index) => (
              <div key={task.notion_block_id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Input
                    value={task.name}
                    onChange={(e) => updateTask(index, 'name', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={task.type}
                    onChange={(e) => updateTask(index, 'type', e.target.value as 'Habit' | 'OneTime')}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Habit">Habit</option>
                    <option value="OneTime">OneTime</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    value={task.reward_amount}
                    onChange={(e) => updateTask(index, 'reward_amount', Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <select
                    value={task.goal_id ?? ''}
                    onChange={(e) => updateTask(index, 'goal_id', e.target.value || null)}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Không gắn --</option>
                    {activeGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({formatMoney(g.target_amount)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || tasks.length === 0}
          className="w-full"
        >
          {isSubmitting ? 'Đang tạo tasks...' : `Xác nhận ${editableTasks.length} tasks`}
        </Button>
      </CardContent>
    </Card>
  )
}
