import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { useAuthStore } from '@/store/auth.store'

// Reset store và localStorage trước mỗi test
beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
  localStorage.clear()
})

describe('auth.store', () => {
  // Unit tests
  it('initial state has null token and user', () => {
    const { token, user } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
  })

  it('setToken updates token in store', () => {
    useAuthStore.getState().setToken('my-token-123')
    expect(useAuthStore.getState().token).toBe('my-token-123')
  })

  it('setUser updates user in store', () => {
    const user = { id: 'u1', email: 'test@example.com', total_money: '0' }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('logout clears token and user', () => {
    useAuthStore.getState().setToken('abc')
    useAuthStore.getState().setUser({ id: 'u1', email: 'a@b.com', total_money: '0' })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('token is persisted to localStorage after setToken', () => {
    useAuthStore.getState().setToken('persisted-token')
    const stored = localStorage.getItem('auth-storage')
    expect(stored).not.toBeNull()
    expect(stored).toContain('persisted-token')
  })

  it('logout clears token from localStorage', () => {
    useAuthStore.getState().setToken('to-be-cleared')
    useAuthStore.getState().logout()
    const stored = localStorage.getItem('auth-storage')
    // After logout token should be null in stored state
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string | null } }
      expect(parsed.state?.token).toBeNull()
    }
  })

  // Feature: habitledger-frontend, Property 4: token persistence round-trip
  it('Property 4: setToken persists to localStorage, logout clears it', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (token) => {
        useAuthStore.setState({ token: null, user: null })
        localStorage.clear()

        useAuthStore.getState().setToken(token)
        expect(useAuthStore.getState().token).toBe(token)

        // Parse JSON to avoid issues with special chars being escaped
        const stored = localStorage.getItem('auth-storage')
        expect(stored).not.toBeNull()
        const parsed = JSON.parse(stored!) as { state?: { token?: string | null } }
        expect(parsed.state?.token).toBe(token)

        useAuthStore.getState().logout()
        expect(useAuthStore.getState().token).toBeNull()
      }),
      { numRuns: 100 }
    )
  })
})
