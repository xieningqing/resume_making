import { get, post, put, del } from './client'
import client from './client'
import type { Resume, PaginatedData, ApiResponse } from '@/types'

export const resumeApi = {
  list: (page = 1, pageSize = 12) =>
    get<PaginatedData<Resume>>(`/resumes?page=${page}&page_size=${pageSize}`),

  create: (title: string) =>
    post<Resume>('/resumes', { title }),

  get: (id: number) =>
    get<Resume>(`/resumes/${id}`),

  update: (id: number, data: Partial<Pick<Resume, 'title' | 'content' | 'template_id'>>) =>
    put<Resume>(`/resumes/${id}`, data),

  delete: (id: number) =>
    del<null>(`/resumes/${id}`),

  uploadAvatar: async (id: number, file: File): Promise<ApiResponse<Resume>> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await client.post<ApiResponse<Resume>>(`/resumes/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  deleteAvatar: (id: number) =>
    del<null>(`/resumes/${id}/avatar`),
}
