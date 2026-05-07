import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'
import { TaskType, RepeatFrequency } from '@/types'

const taskSchema = z
  .object({
    title: z.string().min(1, 'Tiêu đề không được rỗng'),
    type: z.nativeEnum(TaskType),
    isRecurring: z.boolean(),
    repeatFrequency: z.nativeEnum(RepeatFrequency).optional(),
    deadline: z.string().optional(),
  })
  .refine((data) => data.type !== TaskType.Habit || data.isRecurring === true, {
    message: 'Habit phải là recurring',
    path: ['isRecurring'],
  })
  .refine(
    (data) => !data.isRecurring || data.repeatFrequency !== undefined,
    {
      message: 'Vui lòng chọn tần suất lặp',
      path: ['repeatFrequency'],
    }
  )

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  initialData?: Partial<Task>
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function TaskForm({ initialData, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const isEdit = !!initialData?.id

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      type: initialData?.type ?? TaskType.OneTime,
      isRecurring: initialData?.isRecurring ?? false,
      repeatFrequency: initialData?.repeatFrequency ?? undefined,
      deadline: initialData?.deadline
        ? new Date(initialData.deadline).toISOString().split('T')[0]
        : undefined,
    },
  })

  const watchType = watch('type')
  const watchIsRecurring = watch('isRecurring')

  // Auto-set isRecurring when type changes to Habit
  useEffect(() => {
    if (watchType === TaskType.Habit) {
      setValue('isRecurring', true)
    }
  }, [watchType, setValue])

  const handleFormSubmit = async (data: TaskFormData) => {
    await onSubmit({
      title: data.title,
      type: data.type,
      isRecurring: data.isRecurring,
      repeatFrequency: data.repeatFrequency,
      deadline: data.deadline || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" placeholder="Tên task..." {...register('title')} />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-1">
        <Label htmlFor="type">Loại</Label>
        <select
          id="type"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          {...register('type')}
        >
          <option value={TaskType.OneTime}>OneTime</option>
          <option value={TaskType.Habit}>Habit</option>
        </select>
      </div>

      {/* isRecurring — chỉ hiện khi OneTime */}
      {watchType === TaskType.OneTime && (
        <div className="flex items-center gap-2">
          <input
            id="isRecurring"
            type="checkbox"
            className="h-4 w-4"
            {...register('isRecurring')}
          />
          <Label htmlFor="isRecurring">Lặp lại</Label>
          {errors.isRecurring && (
            <p className="text-xs text-destructive">{errors.isRecurring.message}</p>
          )}
        </div>
      )}

      {/* repeatFrequency — chỉ hiện khi isRecurring */}
      {watchIsRecurring && (
        <div className="space-y-1">
          <Label htmlFor="repeatFrequency">Tần suất lặp</Label>
          <select
            id="repeatFrequency"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register('repeatFrequency')}
          >
            <option value="">-- Chọn --</option>
            <option value={RepeatFrequency.DAILY}>Hàng ngày</option>
            <option value={RepeatFrequency.WEEKLY}>Hàng tuần</option>
            <option value={RepeatFrequency.MONTHLY}>Hàng tháng</option>
          </select>
          {errors.repeatFrequency && (
            <p className="text-xs text-destructive">{errors.repeatFrequency.message}</p>
          )}
        </div>
      )}

      {/* Deadline */}
      <div className="space-y-1">
        <Label htmlFor="deadline">Deadline (tùy chọn)</Label>
        <Input id="deadline" type="date" {...register('deadline')} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo task'}
        </Button>
      </div>
    </form>
  )
}
