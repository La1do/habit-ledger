import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Unlink, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/utils/format'
import type { Task, Goal } from '@/types'
import { GoalStatus } from '@/types'

const linkSchema = z.object({
  goalId: z.string().min(1, 'Vui lòng chọn goal'),
  rewardAmount: z.coerce.number().positive('Reward phải > 0'),
})

type LinkFormData = z.infer<typeof linkSchema>

interface TaskGoalManagerProps {
  task: Task | null
  allGoals: Goal[]
  isOpen: boolean
  onClose: () => void
  onLink: (taskId: string, goalId: string, rewardAmount: number) => Promise<void>
  onUnlink: (taskId: string, goalId: string) => void
  isLinking: boolean
}

export function TaskGoalManager({
  task,
  allGoals,
  isOpen,
  onClose,
  onLink,
  onUnlink,
  isLinking,
}: TaskGoalManagerProps) {
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: { goalId: '', rewardAmount: 0 },
  })

  if (!task) return null

  const linkedGoals = task.taskGoals ?? []
  const linkedGoalIds = new Set(linkedGoals.map((tg) => tg.goal_id))

  // Chỉ hiển thị goals ACTIVE chưa được gắn
  const availableGoals = allGoals.filter(
    (g) => g.status === GoalStatus.ACTIVE && !linkedGoalIds.has(g.id)
  )

  const handleLinkSubmit = async (data: LinkFormData) => {
    await onLink(task.id, data.goalId, data.rewardAmount)
    reset()
    setShowForm(false)
  }

  const handleClose = () => {
    reset()
    setShowForm(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Goals của task: <span className="text-primary">{task.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Danh sách goals đã gắn */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Goals đã gắn ({linkedGoals.length})
            </p>
            {linkedGoals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Chưa gắn goal nào.</p>
            ) : (
              <ul className="space-y-1.5">
                {linkedGoals.map((tg) => (
                  <li
                    key={tg.goal_id}
                    className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">
                        {tg.goal?.title ?? tg.goal_id}
                      </span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {formatMoney(tg.reward_amount)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => onUnlink(task.id, tg.goal_id)}
                      title="Bỏ gắn"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Form gắn goal mới */}
          {!showForm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowForm(true)}
              disabled={availableGoals.length === 0}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {availableGoals.length === 0 ? 'Không còn goal để gắn' : 'Gắn goal mới'}
            </Button>
          ) : (
            <form onSubmit={handleSubmit(handleLinkSubmit)} className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Gắn goal mới</p>

              <div className="space-y-1">
                <Label htmlFor="goalId" className="text-xs">Chọn Goal</Label>
                <select
                  id="goalId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('goalId')}
                >
                  <option value="">-- Chọn goal --</option>
                  {availableGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                {errors.goalId && (
                  <p className="text-xs text-destructive">{errors.goalId.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="rewardAmount" className="text-xs">Reward (VNĐ)</Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  min={1}
                  placeholder="50000"
                  {...register('rewardAmount')}
                />
                {errors.rewardAmount && (
                  <p className="text-xs text-destructive">{errors.rewardAmount.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { reset(); setShowForm(false) }}
                  disabled={isLinking}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="flex-1" disabled={isLinking}>
                  {isLinking ? 'Đang gắn...' : 'Gắn'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
