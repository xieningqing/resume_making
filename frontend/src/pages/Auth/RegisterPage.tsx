import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import './Auth.css'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [registering, setRegistering] = useState(false)
  const { setToken, fetchUser } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendCode = async () => {
    if (!email) {
      setErrors({ email: '请输入邮箱' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: '邮箱格式不正确' })
      return
    }
    setSendingCode(true)
    try {
      await authApi.sendCode({ email, purpose: 'register' })
      setCountdown(60)
      addToast('success', '验证码已发送')
    } catch {
      addToast('error', '发送验证码失败，请稍后重试')
    } finally {
      setSendingCode(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '邮箱格式不正确'
    if (!code) newErrors.code = '请输入验证码'
    else if (code.length !== 6) newErrors.code = '验证码为6位数字'
    if (!password) newErrors.password = '请输入密码'
    else if (password.length < 8) newErrors.password = '密码至少8位'
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) newErrors.password = '密码需包含字母和数字'
    if (password !== confirmPassword) newErrors.confirmPassword = '两次密码不一致'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setRegistering(true)
    try {
      const res = await authApi.register({ email, password, code })
      setToken(res.data.access_token)
      await fetchUser()
      addToast('success', '注册成功')
      navigate('/dashboard', { replace: true })
    } catch {
      addToast('error', '注册失败，请检查验证码是否正确')
    } finally {
      setRegistering(false)
    }
  }

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <Card className="auth-card">
      <h2 className="auth-title">注册</h2>
      <p className="auth-subtitle">创建账号，开始制作你的简历</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="邮箱"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError('email') }}
          error={errors.email}
        />
        <Input
          label="验证码"
          placeholder="6位数字验证码"
          value={code}
          onChange={(e) => { setCode(e.target.value); clearError('code') }}
          error={errors.code}
          suffix={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={countdown > 0 || sendingCode}
              onClick={handleSendCode}
            >
              {countdown > 0 ? `${countdown}s` : '发送验证码'}
            </Button>
          }
        />
        <Input
          label="密码"
          type="password"
          placeholder="至少8位，包含字母和数字"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError('password') }}
          error={errors.password}
        />
        <Input
          label="确认密码"
          type="password"
          placeholder="再次输入密码"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
          error={errors.confirmPassword}
        />
        <Button type="submit" loading={registering} className="auth-submit">
          注册
        </Button>
      </form>
      <p className="auth-footer">
        已有账号？ <Link to="/login">立即登录</Link>
      </p>
    </Card>
  )
}
