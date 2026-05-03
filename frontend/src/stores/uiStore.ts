import { create } from 'zustand'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UiState {
  globalLoading: boolean
  toasts: Toast[]
  sidebarCollapsed: boolean
  setGlobalLoading: (loading: boolean) => void
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: number) => void
  toggleSidebar: () => void
}

let toastId = 0

export const useUiStore = create<UiState>((set) => ({
  globalLoading: false,
  toasts: [],
  sidebarCollapsed: false,

  setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),

  addToast: (type, message) => {
    const id = ++toastId
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },
}))
