import { z } from 'zod'
import { TaskType, RepeatFrequency } from '@/types'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .regex(/[a-zA-Z]/, 'Mật khẩu phải có chữ')
    .regex(/[0-9]/, 'Mật khẩu phải có số'),
})

// Task schema
export const taskSchema = z
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

// Goal schema factory (cần currentAmount để validate update)
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được rỗng'),
  target_amount: z.coerce.number().positive('Mục tiêu phải > 0'),
  is_saving: z.boolean().optional(),
})

export function createUpdateGoalSchema(currentAmount: number) {
  return z.object({
    title: z.string().min(1, 'Tiêu đề không được rỗng'),
    target_amount: z.coerce
      .number()
      .positive('Mục tiêu phải > 0')
      .refine(
        (val) => val >= currentAmount,
        `Mục tiêu không được nhỏ hơn số đã tích lũy`
      ),
    is_saving: z.boolean().optional(),
  })
}

// TaskGoal link schema
export const linkTaskGoalSchema = z.object({
  goalId: z.string().min(1, 'Vui lòng chọn goal'),
  rewardAmount: z.coerce.number().positive('Reward phải > 0'),
})
