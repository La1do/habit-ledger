import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { cn } from '@/utils/cn'

describe('cn()', () => {
  // Unit tests
  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })

  it('returns single class unchanged', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('merges multiple classes', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('handles conditional classes with false', () => {
    expect(cn('base', false && 'conditional')).toBe('base')
  })

  it('handles conditional classes with true', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn('base', undefined, null)).toBe('base')
  })

  it('merges bg classes correctly', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  // Feature: habitledger-frontend, Property 1: cn() idempotent — same input gives same output
  it('Property 1: cn() is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('text-sm', 'text-lg', 'font-bold', 'p-4', 'bg-red-500', 'bg-blue-500'), { maxLength: 5 }),
        (classes) => {
          const result1 = cn(...classes)
          const result2 = cn(...classes)
          expect(result1).toBe(result2)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: habitledger-frontend, Property 1b: cn() output has no duplicate classes
  it('Property 1b: cn() output has no duplicate class tokens', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('text-sm', 'text-lg', 'font-bold', 'p-4', 'p-2', 'bg-red-500', 'bg-blue-500'), { maxLength: 6 }),
        (classes) => {
          const result = cn(...classes)
          const tokens = result.split(' ').filter(Boolean)
          const unique = new Set(tokens)
          expect(tokens.length).toBe(unique.size)
        }
      ),
      { numRuns: 100 }
    )
  })
})
