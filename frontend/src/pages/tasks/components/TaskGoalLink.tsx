import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Goal } from '@/types'

const linkSchema = z.object({
  goalId: z.string().min(1, 'Vui lòng chọn goal'),
  rewardAmount: z.coerce.number().positive('Reward phải > 0'),
})

type LinkFormData = z.infer<typeof linkSchema>

interface TaskGoalLinkProps {
  taskId: string
  availableGoals: Goal[]
  onLink: (goalId: string, rewardAmount: number) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function TaskGoalLink({
  availableGoals,
  onLink,
  onCancel,
  isLoading,
}: TaskGoalLinkProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: { goalId: '', rewardAmount: 0 },
  })

  const handleFormSubmit = async (data: LinkFormData) => {
    await onLink(data.goalId, data.rewardAmount)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="goalId">Chọn Goal</Label>
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
        <Label htmlFor="rewardAmount">Reward (VNĐ)</Label>
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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang gắn...' : 'Gắn goal'}
        </Button>
      </div>
    </form>
  )
}
