import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, token, fetchUser, logout } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      fetchUser()
    }
  }, [token, user, fetchUser])

  return {
    user,
    isAuthenticated: !!token,
    isAdmin: user?.is_admin ?? false,
    logout,
  }
}
