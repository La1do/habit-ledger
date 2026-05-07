import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { loginSchema, registerSchema } from '@/lib/schemas'

describe('loginSchema', () => {
  it('accepts valid email and non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'abc' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'abc' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid email and strong password', () => {
    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'abc123' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(registerSchema.safeParse({ email: 'bad', password: 'abc123' }).success).toBe(false)
  })

  it('rejects password shorter than 6 chars', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: 'ab1' }).success).toBe(false)
  })

  it('rejects password with no letters', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(false)
  })

  it('rejects password with no digits', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: 'abcdef' }).success).toBe(false)
  })

  // Feature: habitledger-frontend, Property 5: register schema validates email and password
  it('Property 5a: accepts standard email addresses (user@domain.tld)', () => {
    // fc.emailAddress() generates RFC-compliant emails with special chars
    // that Zod's .email() (HTML spec based) may reject.
    // Test with constrained realistic emails instead.
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9]{3,10}$/),
        fc.constantFrom('example.com', 'test.org', 'mail.net', 'gmail.com'),
        (user, domain) => {
          const email = `${user}@${domain}`
          const result = registerSchema.safeParse({ email, password: 'abc123' })
          expect(result.success).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 5b: rejects passwords shorter than 6 chars', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 5 }), (password) => {
        const result = registerSchema.safeParse({ email: 'a@b.com', password })
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 5c: rejects passwords with only letters (no digits)', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-zA-Z]{6,}$/), (password) => {
        const result = registerSchema.safeParse({ email: 'a@b.com', password })
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})
