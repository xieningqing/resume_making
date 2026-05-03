import { create } from 'zustand'
import type { User } from '@/types'
import { authApi } from '@/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setToken: (token: string) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  setToken: (token: string) => {
    localStorage.setItem('token', token)
    set({ token })
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await authApi.login({ email, password })
      localStorage.setItem('token', res.data.access_token)
      set({ token: res.data.access_token })
      const userRes = await authApi.getMe()
      set({ user: userRes.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await authApi.getMe()
      set({ user: res.data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))
