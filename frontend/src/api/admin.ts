import { get, post, put, del } from './client'
import type { User, Resume, AdminStats, SystemConfig, PaginatedData } from '@/types'

export const adminApi = {
  getUsers: (page = 1, pageSize = 20, search = '') =>
    get<PaginatedData<User>>(`/admin/users?page=${page}&page_size=${pageSize}&search=${search}`),

  updateUser: (id: number, data: Partial<Pick<User, 'is_active' | 'is_admin'>>) =>
    put<User>(`/admin/users/${id}`, data),

  deleteUser: (id: number) =>
    del<null>(`/admin/users/${id}`),

  resetPassword: (id: number) =>
    post<null>(`/admin/users/${id}/reset-password`),

  getStats: () =>
    get<AdminStats>('/admin/stats'),

  getResumes: (page = 1, pageSize = 20, userId?: number) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (userId) params.set('user_id', String(userId))
    return get<PaginatedData<Resume>>(`/admin/resumes?${params}`)
  },

  deleteResume: (id: number) =>
    del<null>(`/admin/resumes/${id}`),

  getConfig: () =>
    get<SystemConfig>('/admin/config'),

  updateConfig: (data: Partial<SystemConfig>) =>
    put<SystemConfig>('/admin/config', data),
}
