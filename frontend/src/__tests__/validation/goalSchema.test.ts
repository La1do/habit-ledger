import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { createGoalSchema, createUpdateGoalSchema, linkTaskGoalSchema } from '@/lib/schemas'

describe('createGoalSchema', () => {
  it('accepts valid title and positive target_amount', () => {
    expect(createGoalSchema.safeParse({ title: 'Mua laptop', target_amount: 10000000 }).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(createGoalSchema.safeParse({ title: '', target_amount: 1000 }).success).toBe(false)
  })

  it('rejects target_amount = 0', () => {
    expect(createGoalSchema.safeParse({ title: 'Goal', target_amount: 0 }).success).toBe(false)
  })

  it('rejects negative target_amount', () => {
    expect(createGoalSchema.safeParse({ title: 'Goal', target_amount: -100 }).success).toBe(false)
  })

  // Feature: habitledger-frontend, Property 7a: target_amount <= 0 always rejected
  it('Property 7a: target_amount <= 0 always rejected', () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (amount) => {
        const result = createGoalSchema.safeParse({ title: 'Goal', target_amount: amount })
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Feature: habitledger-frontend, Property 7b: target_amount > 0 always accepted
  it('Property 7b: target_amount > 0 always accepted', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000000000 }), (amount) => {
        const target = amount + 1 // ensure > 0
        const result = createGoalSchema.safeParse({ title: 'Goal', target_amount: target })
        expect(result.success).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})

describe('createUpdateGoalSchema', () => {
  it('accepts target_amount >= currentAmount', () => {
    const schema = createUpdateGoalSchema(500000)
    expect(schema.safeParse({ title: 'Goal', target_amount: 500000 }).success).toBe(true)
    expect(schema.safeParse({ title: 'Goal', target_amount: 1000000 }).success).toBe(true)
  })

  it('rejects target_amount < currentAmount', () => {
    const schema = createUpdateGoalSchema(500000)
    expect(schema.safeParse({ title: 'Goal', target_amount: 499999 }).success).toBe(false)
  })

  // Feature: habitledger-frontend, Property 7c: update rejects target < current
  it('Property 7c: target_amount < currentAmount always rejected', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000000 }),
        fc.nat({ max: 10000000 }),
        (a, b) => {
          const currentAmount = Math.max(a, b) + 1
          const targetAmount = Math.min(a, b)
          if (targetAmount >= currentAmount) return // skip equal cases
          const schema = createUpdateGoalSchema(currentAmount)
          const result = schema.safeParse({ title: 'Goal', target_amount: targetAmount })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('linkTaskGoalSchema', () => {
  it('accepts valid goalId and positive rewardAmount', () => {
    expect(linkTaskGoalSchema.safeParse({ goalId: 'some-uuid', rewardAmount: 50000 }).success).toBe(true)
  })

  it('rejects empty goalId', () => {
    expect(linkTaskGoalSchema.safeParse({ goalId: '', rewardAmount: 50000 }).success).toBe(false)
  })

  it('rejects rewardAmount = 0', () => {
    expect(linkTaskGoalSchema.safeParse({ goalId: 'uuid', rewardAmount: 0 }).success).toBe(false)
  })

  it('rejects negative rewardAmount', () => {
    expect(linkTaskGoalSchema.safeParse({ goalId: 'uuid', rewardAmount: -1 }).success).toBe(false)
  })

  // Feature: habitledger-frontend, Property 8: rewardAmount <= 0 always rejected
  it('Property 8a: rewardAmount <= 0 always rejected', () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (amount) => {
        const result = linkTaskGoalSchema.safeParse({ goalId: 'uuid', rewardAmount: amount })
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Feature: habitledger-frontend, Property 8b: rewardAmount > 0 always accepted
  it('Property 8b: rewardAmount > 0 always accepted', () => {
    fc.assert(
      fc.property(fc.nat({ max: 100000000 }), (amount) => {
        const reward = amount + 1
        const result = linkTaskGoalSchema.safeParse({ goalId: 'some-id', rewardAmount: reward })
        expect(result.success).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
