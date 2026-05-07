import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { taskSchema } from '@/lib/schemas'
import { TaskType, RepeatFrequency } from '@/types'

describe('taskSchema', () => {
  // Unit tests
  it('accepts valid OneTime task without recurring', () => {
    expect(taskSchema.safeParse({
      title: 'Đọc sách',
      type: TaskType.OneTime,
      isRecurring: false,
    }).success).toBe(true)
  })

  it('accepts valid Habit task with recurring and frequency', () => {
    expect(taskSchema.safeParse({
      title: 'Tập gym',
      type: TaskType.Habit,
      isRecurring: true,
      repeatFrequency: RepeatFrequency.DAILY,
    }).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(taskSchema.safeParse({
      title: '',
      type: TaskType.OneTime,
      isRecurring: false,
    }).success).toBe(false)
  })

  it('rejects Habit with isRecurring = false', () => {
    expect(taskSchema.safeParse({
      title: 'Tập gym',
      type: TaskType.Habit,
      isRecurring: false,
    }).success).toBe(false)
  })

  it('rejects isRecurring = true without repeatFrequency', () => {
    expect(taskSchema.safeParse({
      title: 'Task',
      type: TaskType.OneTime,
      isRecurring: true,
      repeatFrequency: undefined,
    }).success).toBe(false)
  })

  it('accepts isRecurring = true with repeatFrequency', () => {
    expect(taskSchema.safeParse({
      title: 'Task',
      type: TaskType.OneTime,
      isRecurring: true,
      repeatFrequency: RepeatFrequency.WEEKLY,
    }).success).toBe(true)
  })

  // Feature: habitledger-frontend, Property 6: task form business rules
  it('Property 6a: Habit + isRecurring=false always rejected', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (title) => {
        const result = taskSchema.safeParse({
          title,
          type: TaskType.Habit,
          isRecurring: false,
        })
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 6b: isRecurring=true without repeatFrequency always rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom(TaskType.OneTime, TaskType.Habit),
        (title, type) => {
          const result = taskSchema.safeParse({
            title,
            type,
            isRecurring: true,
            repeatFrequency: undefined,
          })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 6c: valid Habit task always accepted', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom(RepeatFrequency.DAILY, RepeatFrequency.WEEKLY, RepeatFrequency.MONTHLY),
        (title, freq) => {
          const result = taskSchema.safeParse({
            title,
            type: TaskType.Habit,
            isRecurring: true,
            repeatFrequency: freq,
          })
          expect(result.success).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
