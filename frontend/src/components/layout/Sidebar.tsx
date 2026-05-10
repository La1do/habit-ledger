import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Target, BookOpen, Plug } from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/ledger', label: 'Ledger', icon: BookOpen },
  { to: '/notion/setup', label: 'Notion', icon: Plug },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r bg-white h-full flex flex-col">
      <div className="p-6 border-b">
        <span className="text-lg font-bold text-primary">HabitLedger</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
