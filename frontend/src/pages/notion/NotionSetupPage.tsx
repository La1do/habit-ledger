import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { notionApi } from '@/api/notion'
import { goalsApi } from '@/api/goals'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { cn } from '@/utils/cn'
import { StepConnect } from './components/StepConnect'
import { StepSelectPage } from './components/StepSelectPage'
import { StepConfirm } from './components/StepConfirm'
import { StepDone } from './components/StepDone'
import type { ExtractedTask, ConfirmTaskInput, ConfirmResult } from '@/api/notion'

const STEPS = ['Kết nối', 'Chọn page', 'Xác nhận', 'Hoàn thành']

export function NotionSetupPage() {
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSelectingPage, setIsSelectingPage] = useState(false)
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null)

  // Check connection status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['notion', 'status'],
    queryFn: notionApi.getStatus,
  })

  // Fetch pages (chỉ khi ở bước 2)
  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ['notion', 'pages'],
    queryFn: notionApi.getPages,
    enabled: currentStep === 1,
  })

  // Fetch goals cho bước 3
  const { data: goals = [] } = useQuery({
    queryKey: QUERY_KEYS.goals,
    queryFn: goalsApi.getGoals,
    enabled: currentStep === 2,
  })

  // Xử lý callback từ Notion OAuth
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setCurrentStep(1)
    }
  }, [searchParams])

  // Nếu đã connected và có page_id → skip bước 1
  useEffect(() => {
    if (!statusLoading && status?.connected) {
      if (currentStep === 0) setCurrentStep(1)
      if (status.page_id) setSelectedPageId(status.page_id)
    }
  }, [status, statusLoading, currentStep])

  const handleConnect = async () => {
    try {
      const url = await notionApi.getAuthUrl()
      window.location.href = url
    } catch (err) {
      console.error('Failed to get auth URL:', err)
    }
  }

  const handleSelectPage = async (pageId: string) => {
    setSelectedPageId(pageId)
  }

  const handleNextFromSelectPage = async () => {
    if (!selectedPageId) return
    setIsSelectingPage(true)
    try {
      await notionApi.selectPage(selectedPageId)
      await handleExtract()
      setCurrentStep(2)
    } finally {
      setIsSelectingPage(false)
    }
  }

  const handleExtract = async () => {
    if (!selectedPageId) return
    setIsExtracting(true)
    try {
      const tasks = await notionApi.extractPage(selectedPageId)
      setExtractedTasks(tasks)
    } catch (err) {
      console.error('Extract failed:', err)
      setExtractedTasks([])
    } finally {
      setIsExtracting(false)
    }
  }

  const handleConfirm = async (tasks: ConfirmTaskInput[]) => {
    setIsConfirming(true)
    try {
      const result = await notionApi.confirmTasks(tasks)
      setConfirmResult(result)
      setCurrentStep(3)
    } catch (err) {
      console.error('Confirm failed:', err)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Notion Setup</h1>

      {/* Progress Steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'text-sm hidden sm:block',
                  index === currentStep ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {step}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 sm:w-16 mx-2 transition-colors',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mt-6">
        {currentStep === 0 && (
          <StepConnect
            isConnected={status?.connected ?? false}
            onConnect={handleConnect}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && (
          <StepSelectPage
            pages={pages}
            isLoading={pagesLoading}
            selectedPageId={selectedPageId}
            onSelect={handleSelectPage}
            onNext={handleNextFromSelectPage}
            isConfirming={isSelectingPage}
          />
        )}

        {currentStep === 2 && (
          <StepConfirm
            tasks={extractedTasks}
            goals={goals}
            isLoading={isExtracting}
            isSubmitting={isConfirming}
            onReExtract={handleExtract}
            onConfirm={handleConfirm}
          />
        )}

        {currentStep === 3 && confirmResult && (
          <StepDone
            widgetUrl={confirmResult.widget_url}
            createdCount={confirmResult.created_count}
          />
        )}
      </div>
    </div>
  )
}
