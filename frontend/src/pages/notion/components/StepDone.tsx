import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StepDoneProps {
  widgetUrl: string
  createdCount: number
}

export function StepDone({ widgetUrl, createdCount }: StepDoneProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(widgetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-base">🎉 Hoàn thành!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Đã tạo <span className="font-medium text-foreground">{createdCount} tasks</span> từ Notion.
          Tick checkbox trong Notion → reward tự động cộng vào goal.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Widget URL (embed vào Notion):</p>
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
            <span className="text-xs truncate flex-1 font-mono">{widgetUrl}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Cách nhúng vào Notion:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Mở page Notion bất kỳ</li>
            <li>Gõ <code className="bg-muted px-1 rounded">/embed</code></li>
            <li>Paste URL vào ô nhập</li>
            <li>Widget tự cập nhật mỗi 30 giây</li>
          </ol>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.open(widgetUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Xem widget
        </Button>
      </CardContent>
    </Card>
  )
}
