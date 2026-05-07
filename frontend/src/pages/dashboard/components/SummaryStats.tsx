import { formatMoney } from '@/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, AlertCircle, Trophy, Target } from 'lucide-react'

interface SummaryStatsProps {
  totalEarned: number
  totalDebt: number
  goalsCompleted: number
  goalsActive: number
}

const stats = (props: SummaryStatsProps) => [
  {
    label: 'Tổng đã earn',
    value: formatMoney(props.totalEarned),
    icon: TrendingUp,
    color: 'text-green-600',
  },
  {
    label: 'Tổng nợ',
    value: formatMoney(props.totalDebt),
    icon: AlertCircle,
    color: props.totalDebt > 0 ? 'text-amber-600' : 'text-muted-foreground',
  },
  {
    label: 'Goals hoàn thành',
    value: String(props.goalsCompleted),
    icon: Trophy,
    color: 'text-blue-600',
  },
  {
    label: 'Goals đang active',
    value: String(props.goalsActive),
    icon: Target,
    color: 'text-primary',
  },
]

export function SummaryStats(props: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats(props).map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
