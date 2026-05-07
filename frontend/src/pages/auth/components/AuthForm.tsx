import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .regex(/[a-zA-Z]/, 'Mật khẩu phải có chữ')
    .regex(/[0-9]/, 'Mật khẩu phải có số'),
})

type AuthFormData = {
  email: string
  password: string
}

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (data: AuthFormData) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function AuthForm({ mode, onSubmit, isLoading, error }: AuthFormProps) {
  const schema = mode === 'login' ? loginSchema : registerSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
          className={cn(errors.email && 'border-destructive')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          {...register('password')}
          className={cn(errors.password && 'border-destructive')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? 'Đang xử lý...'
          : mode === 'login'
          ? 'Đăng nhập'
          : 'Đăng ký'}
      </Button>
    </form>
  )
}
