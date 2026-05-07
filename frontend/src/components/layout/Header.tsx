import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth.store'

export function Header() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout errors
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <span className="text-sm text-muted-foreground">HabitLedger</span>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Đăng xuất
      </Button>
    </header>
  )
}
