import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import './Auth.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { login, isLoading } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email) newErrors.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '邮箱格式不正确'
    if (!password) newErrors.password = '请输入密码'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await login(email, password)
      addToast('success', '登录成功')
      navigate(from, { replace: true })
    } catch {
      addToast('error', '邮箱或密码错误')
    }
  }

  return (
    <Card className="auth-card">
      <h2 className="auth-title">登录</h2>
      <p className="auth-subtitle">欢迎回来，请输入你的账号信息</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="邮箱"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
          error={errors.email}
        />
        <Input
          label="密码"
          type="password"
          placeholder="输入密码"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
          error={errors.password}
        />
        <Button type="submit" loading={isLoading} className="auth-submit">
          登录
        </Button>
      </form>
      <p className="auth-footer">
        还没有账号？ <Link to="/register">立即注册</Link>
      </p>
    </Card>
  )
}
