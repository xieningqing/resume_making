export interface User {
  id: number
  email: string
  nickname: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Resume {
  id: number
  user_id: number
  title: string
  content: string
  avatar: string
  template_id: number
  created_at: string
  updated_at: string
}

export interface Template {
  id: number
  name: string
  background_css: string
  preview_image: string
  is_active: boolean
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  code: string
}

export interface SendCodeRequest {
  email: string
  purpose: 'register' | 'reset'
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface EndpointStat {
  path: string
  method: string
  date: string
  count: number
}

export interface AdminStats {
  total_users: number
  total_resumes: number
  today_active: number
  endpoint_stats: EndpointStat[]
}

export interface AccessLog {
  id: number
  user_id: number | null
  path: string
  method: string
  ip: string
  user_agent: string
  created_at: string
}

export interface SystemConfig {
  code_expiry_minutes: number
  token_expiry_hours: number
  auto_save_interval_seconds: number
  announcement: string
}
