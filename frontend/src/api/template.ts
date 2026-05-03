import { get } from './client'
import type { Template } from '@/types'

export const templateApi = {
  list: () => get<Template[]>('/templates'),
}
