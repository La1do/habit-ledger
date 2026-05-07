import { formatMoney } from '@/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, AlertTriangle } from 'lucide-react'

interface WalletCardProps {
  totalMoney: string | number
  totalDebt: number
}

export function WalletCard({ totalMoney, totalDebt }: WalletCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Số dư ví
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatMoney(totalMoney)}</p>
        {totalDebt > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Nợ: {formatMoney(totalDebt)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
