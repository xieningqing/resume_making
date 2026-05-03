import { get, post, put } from './client'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  SendCodeRequest,
  User,
} from '@/types'

export const authApi = {
  sendCode: (data: SendCodeRequest) =>
    post<null>('/auth/send-code', data),

  register: (data: RegisterRequest) =>
    post<LoginResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    post<LoginResponse>('/auth/login', data),

  getMe: () =>
    get<User>('/auth/me'),

  updateNickname: (nickname: string) =>
    put<User>('/auth/nickname', { nickname }),

  changePassword: (old_password: string | null, new_password: string, code?: string) =>
    post<null>('/auth/change-password', { old_password, new_password, code }),

  getAnnouncement: () =>
    get<{ content: string }>('/auth/announcement'),
}
