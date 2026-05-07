import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types'

interface GoalFormProps {
  initialData?: Partial<Goal>
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function GoalForm({ initialData, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const isEdit = !!initialData?.id
  const currentAmount = parseFloat(initialData?.current_amount ?? '0')

  const goalSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được rỗng'),
    target_amount: z.coerce
      .number()
      .positive('Mục tiêu phải > 0')
      .refine(
        (val) => !isEdit || val >= currentAmount,
        `Mục tiêu không được nhỏ hơn số đã tích lũy (${currentAmount.toLocaleString('vi-VN')} ₫)`
      ),
    is_saving: z.boolean().optional(),
  })

  type GoalFormData = z.infer<typeof goalSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      target_amount: initialData?.target_amount
        ? parseFloat(initialData.target_amount)
        : undefined,
      is_saving: initialData?.is_saving ?? false,
    },
  })

  const handleFormSubmit = async (data: GoalFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" placeholder="Tên mục tiêu..." {...register('title')} />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="target_amount">Mục tiêu (VNĐ)</Label>
        <Input
          id="target_amount"
          type="number"
          min={1}
          placeholder="10000000"
          {...register('target_amount')}
        />
        {errors.target_amount && (
          <p className="text-xs text-destructive">{errors.target_amount.message}</p>
        )}
        {isEdit && currentAmount > 0 && (
          <p className="text-xs text-muted-foreground">
            Đã tích lũy: {currentAmount.toLocaleString('vi-VN')} ₫
          </p>
        )}
      </div>

      {isEdit && (
        <div className="flex items-center gap-2">
          <input
            id="is_saving"
            type="checkbox"
            className="h-4 w-4"
            {...register('is_saving')}
          />
          <Label htmlFor="is_saving">Saving Mode (tiếp tục tích lũy sau khi đạt target)</Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo goal'}
        </Button>
      </div>
    </form>
  )
}
