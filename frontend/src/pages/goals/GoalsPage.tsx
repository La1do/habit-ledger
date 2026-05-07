import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { goalsApi } from '@/api/goals'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GoalCard } from './components/GoalCard'
import { GoalForm } from './components/GoalForm'
import { GoalHistory } from './components/GoalHistory'
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/types'

type DialogMode =
  | { type: 'create' }
  | { type: 'edit'; goal: Goal }
  | { type: 'delete'; goalId: string }
  | null

export function GoalsPage() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null)

  const { data: goals = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.goals,
    queryFn: goalsApi.getGoals,
  })

  const invalidateGoals = () =>
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals })

  const createMutation = useMutation({
    mutationFn: (data: CreateGoalInput) => goalsApi.createGoal(data),
    onSuccess: () => { invalidateGoals(); setDialog(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalInput }) =>
      goalsApi.updateGoal(id, data),
    onSuccess: () => { invalidateGoals(); setDialog(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    onSuccess: () => { invalidateGoals(); setDialog(null) },
  })

  const handleCreateSubmit = async (data: CreateGoalInput | UpdateGoalInput) => {
    await createMutation.mutateAsync(data as CreateGoalInput)
  }

  const handleEditSubmit = async (data: CreateGoalInput | UpdateGoalInput) => {
    if (dialog?.type !== 'edit') return
    await updateMutation.mutateAsync({ id: dialog.goal.id, data: data as UpdateGoalInput })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goals</h1>
        <Button size="sm" onClick={() => setDialog({ type: 'create' })}>
          <Plus className="h-4 w-4 mr-1" />
          Tạo goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Chưa có goal nào. Tạo goal đầu tiên!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => setDialog({ type: 'edit', goal: g })}
              onDelete={(id) => setDialog({ type: 'delete', goalId: id })}
              onViewHistory={(id) => setHistoryGoalId(id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialog?.type === 'create'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo goal mới</DialogTitle>
          </DialogHeader>
          <GoalForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setDialog(null)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog?.type === 'edit'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa goal</DialogTitle>
          </DialogHeader>
          {dialog?.type === 'edit' && (
            <GoalForm
              initialData={dialog.goal}
              onSubmit={handleEditSubmit}
              onCancel={() => setDialog(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={dialog?.type === 'delete'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa goal này không? Goal sẽ bị ẩn khỏi danh sách.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialog(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (dialog?.type === 'delete') {
                  deleteMutation.mutate(dialog.goalId)
                }
              }}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal History Dialog */}
      <GoalHistory
        goalId={historyGoalId}
        isOpen={!!historyGoalId}
        onClose={() => setHistoryGoalId(null)}
      />
    </div>
  )
}
