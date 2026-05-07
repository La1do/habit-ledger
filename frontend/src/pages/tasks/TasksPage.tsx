import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { tasksApi } from '@/api/tasks'
import { goalsApi } from '@/api/goals'
import { taskGoalsApi } from '@/api/taskGoals'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TaskCard } from './components/TaskCard'
import { TaskForm } from './components/TaskForm'
import { TaskGoalManager } from './components/TaskGoalManager'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

type DialogMode =
  | { type: 'create' }
  | { type: 'edit'; task: Task }
  | { type: 'delete'; taskId: string }
  | null

export function TasksPage() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [goalManagerTask, setGoalManagerTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: tasksApi.getTasks,
  })

  const { data: goals = [] } = useQuery({
    queryKey: QUERY_KEYS.goals,
    queryFn: goalsApi.getGoals,
  })

  const invalidateTasks = () =>
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })

  const invalidateAfterComplete = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSummary })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.createTask(data),
    onSuccess: () => { invalidateTasks(); setDialog(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      tasksApi.updateTask(id, data),
    onSuccess: () => { invalidateTasks(); setDialog(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => { invalidateTasks(); setDialog(null) },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.completeTask(id),
    onSuccess: invalidateAfterComplete,
  })

  const linkMutation = useMutation({
    mutationFn: ({ taskId, goalId, rewardAmount }: { taskId: string; goalId: string; rewardAmount: number }) =>
      taskGoalsApi.linkTaskGoal(taskId, goalId, rewardAmount),
    onSuccess: () => {
      invalidateTasks()
      // Cập nhật goalManagerTask với data mới nhất
      if (goalManagerTask) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      }
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: ({ taskId, goalId }: { taskId: string; goalId: string }) =>
      taskGoalsApi.unlinkTaskGoal(taskId, goalId),
    onSuccess: invalidateTasks,
  })

  const handleCreateSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    await createMutation.mutateAsync(data as CreateTaskInput)
  }

  const handleEditSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (dialog?.type !== 'edit') return
    await updateMutation.mutateAsync({ id: dialog.task.id, data: data as UpdateTaskInput })
  }

  const handleLinkGoal = async (taskId: string, goalId: string, rewardAmount: number) => {
    await linkMutation.mutateAsync({ taskId, goalId, rewardAmount })
  }

  const handleUnlinkGoal = (taskId: string, goalId: string) => {
    unlinkMutation.mutate({ taskId, goalId })
  }

  // Lấy task mới nhất từ cache để goalManagerTask luôn có data cập nhật
  const currentGoalManagerTask = goalManagerTask
    ? (tasks.find((t) => t.id === goalManagerTask.id) ?? goalManagerTask)
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <Button size="sm" onClick={() => setDialog({ type: 'create' })}>
          <Plus className="h-4 w-4 mr-1" />
          Tạo task
        </Button>
      </div>

      {tasksLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Chưa có task nào. Tạo task đầu tiên!
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={(id) => completeMutation.mutate(id)}
              onEdit={(t) => setDialog({ type: 'edit', task: t })}
              onDelete={(id) => setDialog({ type: 'delete', taskId: id })}
              onOpenGoalManager={(t) => setGoalManagerTask(t)}
            />
          ))}
        </div>
      )}

      {/* Goal Manager Popup */}
      <TaskGoalManager
        task={currentGoalManagerTask}
        allGoals={goals}
        isOpen={!!goalManagerTask}
        onClose={() => setGoalManagerTask(null)}
        onLink={handleLinkGoal}
        onUnlink={handleUnlinkGoal}
        isLinking={linkMutation.isPending}
      />

      {/* Create Dialog */}
      <Dialog open={dialog?.type === 'create'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo task mới</DialogTitle>
          </DialogHeader>
          <TaskForm
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
            <DialogTitle>Chỉnh sửa task</DialogTitle>
          </DialogHeader>
          {dialog?.type === 'edit' && (
            <TaskForm
              initialData={dialog.task}
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
            Bạn có chắc muốn xóa task này không? Hành động này không thể hoàn tác.
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
                  deleteMutation.mutate(dialog.taskId)
                }
              }}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
