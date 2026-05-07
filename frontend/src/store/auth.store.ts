import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  accessToken: string | null
  user: User | null
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: localStorage.getItem('access_token'),
  user: null,
  setAccessToken: (token) => {
    localStorage.setItem('access_token', token)
    set({ accessToken: token })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ accessToken: null, user: null })
  },
  setUser: (user) => set({ user }),
}))
