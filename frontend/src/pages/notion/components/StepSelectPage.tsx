import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { NotionPage } from '@/api/notion'

interface StepSelectPageProps {
  pages: NotionPage[]
  isLoading: boolean
  selectedPageId: string | null
  onSelect: (pageId: string) => void
  onNext: () => void
  isConfirming: boolean
}

export function StepSelectPage({
  pages,
  isLoading,
  selectedPageId,
  onSelect,
  onNext,
  isConfirming,
}: StepSelectPageProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-base">Chọn page Notion</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chọn page chứa todo list bạn muốn theo dõi.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Không tìm thấy page nào. Hãy đảm bảo Integration có quyền truy cập page.
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {pages.map((page) => (
              <li key={page.page_id}>
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left',
                    selectedPageId === page.page_id
                      ? 'bg-primary text-primary-foreground'
                      : hovered === page.page_id
                      ? 'bg-accent'
                      : 'hover:bg-accent'
                  )}
                  onClick={() => onSelect(page.page_id)}
                  onMouseEnter={() => setHovered(page.page_id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="truncate">{page.title || 'Untitled'}</span>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-2 shrink-0 opacity-60 hover:opacity-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button
          onClick={onNext}
          disabled={!selectedPageId || isConfirming}
          className="w-full"
        >
          {isConfirming ? 'Đang xử lý...' : 'Tiếp tục →'}
        </Button>
      </CardContent>
    </Card>
  )
}
