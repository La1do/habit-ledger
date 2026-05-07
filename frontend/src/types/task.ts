export enum TaskStatus {
  PENDING = 'PENDING',
  DONE_TODAY = 'DONE_TODAY',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

export enum TaskType {
  Habit = 'Habit',
  OneTime = 'OneTime',
}

export enum RepeatFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface Task {
  id: string
  user_id: string
  title: string
  status: TaskStatus
  type: TaskType
  isRecurring: boolean
  repeatFrequency: RepeatFrequency | null
  deadline: string | null
  date: string
}

export interface CreateTaskInput {
  title: string
  type: TaskType
  isRecurring: boolean
  repeatFrequency?: RepeatFrequency
  deadline?: string
}

export interface UpdateTaskInput {
  title?: string
  type?: TaskType
  isRecurring?: boolean
  repeatFrequency?: RepeatFrequency
  deadline?: string
}
