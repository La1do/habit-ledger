import { ExternalLink, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StepConnectProps {
  isConnected: boolean
  onConnect: () => void
  onNext: () => void
}

export function StepConnect({ isConnected, onConnect, onNext }: StepConnectProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-base">Kết nối Notion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã kết nối Notion thành công!</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Kết nối tài khoản Notion để đồng bộ tasks và nhận reward tự động khi tick checkbox.
          </p>
        )}

        <div className="flex gap-2">
          {!isConnected && (
            <Button onClick={onConnect} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Connect Notion
            </Button>
          )}
          {isConnected && (
            <Button onClick={onNext}>
              Tiếp tục →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
