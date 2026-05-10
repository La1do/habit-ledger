import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth.store'
import { AuthForm } from './components/AuthForm'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authApi.login(data.email, data.password)
      setAccessToken(result.accessToken)
      queryClient.clear()
      navigate('/dashboard')
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
      ) {
        setError(String((err.response.data as { error: string }).error))
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl bg-card shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">HabitLedger</h1>
          <p className="text-sm text-muted-foreground">Đăng nhập vào tài khoản</p>
        </div>

        <AuthForm
          mode="login"
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  )
}
