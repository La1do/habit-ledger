import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formatMoney, formatDate } from '@/utils/format'

describe('formatMoney()', () => {
  // Unit tests
  it('formats zero', () => {
    expect(formatMoney(0)).toContain('0')
    expect(formatMoney(0)).toContain('₫')
  })

  it('formats a typical amount', () => {
    const result = formatMoney(1500000)
    expect(result).toContain('₫')
    expect(result).toContain('1')
  })

  it('accepts string input', () => {
    expect(formatMoney('500000')).toContain('₫')
  })

  it('accepts decimal string', () => {
    expect(formatMoney('1000.5')).toContain('₫')
  })

  // Feature: habitledger-frontend, Property 2: formatMoney always contains ₫ symbol
  it('Property 2: always contains ₫ for any non-negative number', () => {
    fc.assert(
      fc.property(fc.nat(), (amount) => {
        const result = formatMoney(amount)
        expect(result).toContain('₫')
      }),
      { numRuns: 100 }
    )
  })
})

describe('formatDate()', () => {
  // Unit tests
  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-05-04'))
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('formats an ISO string', () => {
    const result = formatDate('2026-05-04T00:00:00.000Z')
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('contains the correct year', () => {
    const result = formatDate('2026-01-15')
    expect(result).toContain('2026')
  })

  // Feature: habitledger-frontend, Property 3: formatDate returns DD/MM/YYYY format
  it('Property 3: always returns DD/MM/YYYY pattern', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }), (date) => {
        const result = formatDate(date)
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      }),
      { numRuns: 100 }
    )
  })
})
