import { create } from 'zustand'
import type { Resume, Template } from '@/types'
import { resumeApi } from '@/api/resume'
import { templateApi } from '@/api/template'

interface ResumeState {
  resumes: Resume[]
  currentResume: Resume | null
  templates: Template[]
  total: number
  page: number
  isLoading: boolean

  fetchResumes: (page?: number) => Promise<void>
  fetchResume: (id: number) => Promise<void>
  createResume: (title: string) => Promise<Resume>
  updateResume: (id: number, data: Partial<Pick<Resume, 'title' | 'content' | 'template_id'>>) => Promise<void>
  deleteResume: (id: number) => Promise<void>
  fetchTemplates: () => Promise<void>
  setCurrentResume: (resume: Resume | null) => void
  clearCurrent: () => void
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  templates: [],
  total: 0,
  page: 1,
  isLoading: false,

  fetchResumes: async (page = 1) => {
    set({ isLoading: true })
    try {
      const res = await resumeApi.list(page)
      set({
        resumes: res.data.items,
        total: res.data.total,
        page: res.data.page,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchResume: async (id: number) => {
    set({ isLoading: true })
    try {
      const res = await resumeApi.get(id)
      set({ currentResume: res.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createResume: async (title: string) => {
    const res = await resumeApi.create(title)
    const newResume = res.data
    set({ resumes: [newResume, ...get().resumes] })
    return newResume
  },

  updateResume: async (id, data) => {
    const res = await resumeApi.update(id, data)
    const updated = res.data
    set({
      currentResume: updated,
      resumes: get().resumes.map((r) => (r.id === id ? updated : r)),
    })
  },

  deleteResume: async (id: number) => {
    await resumeApi.delete(id)
    set({ resumes: get().resumes.filter((r) => r.id !== id) })
  },

  fetchTemplates: async () => {
    const res = await templateApi.list()
    set({ templates: res.data })
  },

  setCurrentResume: (resume: Resume | null) => set({ currentResume: resume }),
  clearCurrent: () => set({ currentResume: null }),
}))
