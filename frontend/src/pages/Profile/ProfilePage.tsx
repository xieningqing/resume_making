import { useState, useEffect, type FormEvent } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import './ProfilePage.css'

export function ProfilePage() {
  const { user, fetchUser } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)

  // nickname state
  const [nickname, setNickname] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)

  // password state
  const [passwordMode, setPasswordMode] = useState<'old' | 'reset'>('old')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) setNickname(user.nickname || '')
  }, [user])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) {
      addToast('error', '昵称不能为空')
      return
    }
    if (trimmed.length > 100) {
      addToast('error', '昵称不能超过100个字符')
      return
    }
    setSavingNickname(true)
    try {
      await authApi.updateNickname(trimmed)
      await fetchUser()
      addToast('success', '昵称修改成功')
    } catch {
      addToast('error', '昵称修改失败')
    } finally {
      setSavingNickname(false)
    }
  }

  const handleSendCode = async () => {
    if (!user?.email) return
    setSendingCode(true)
    try {
      await authApi.sendCode({ email: user.email, purpose: 'reset' })
      setCountdown(60)
      addToast('success', '验证码已发送')
    } catch {
      addToast('error', '发送验证码失败')
    } finally {
      setSendingCode(false)
    }
  }

  const validatePassword = () => {
    const newErrors: Record<string, string> = {}
    if (passwordMode === 'old' && !oldPassword) newErrors.oldPassword = '请输入旧密码'
    if (!newPassword) newErrors.newPassword = '请输入新密码'
    else if (newPassword.length < 8) newErrors.newPassword = '密码至少8位'
    else if (newPassword.length > 32) newErrors.newPassword = '密码不能超过32位'
    if (newPassword !== confirmPassword) newErrors.confirmPassword = '两次密码不一致'
    if (passwordMode === 'reset') {
      if (!code) newErrors.code = '请输入验证码'
      else if (code.length !== 6) newErrors.code = '验证码为6位数字'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!validatePassword()) return
    setChangingPassword(true)
    try {
      if (passwordMode === 'old') {
        await authApi.changePassword(oldPassword, newPassword)
      } else {
        await authApi.changePassword(null, newPassword, code)
      }
      addToast('success', '密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setCode('')
      setErrors({})
    } catch {
      addToast('error', '密码修改失败')
    } finally {
      setChangingPassword(false)
    }
  }

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="profile-page">
      <h1 className="profile-title">个人中心</h1>

      <Card className="profile-card">
        <h2 className="profile-card-title">个人信息</h2>
        <div className="profile-field">
          <label className="profile-label">邮箱</label>
          <div className="profile-value">{user?.email}</div>
        </div>
        <div className="profile-field">
          <Input
            label="昵称"
            placeholder="设置你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Button
            variant="primary"
            size="sm"
            loading={savingNickname}
            onClick={handleSaveNickname}
            className="profile-save-btn"
          >
            保存
          </Button>
        </div>
      </Card>

      <Card className="profile-card">
        <h2 className="profile-card-title">修改密码</h2>
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab ${passwordMode === 'old' ? 'active' : ''}`}
            onClick={() => { setPasswordMode('old'); setErrors({}) }}
          >
            我知道旧密码
          </button>
          <button
            type="button"
            className={`profile-tab ${passwordMode === 'reset' ? 'active' : ''}`}
            onClick={() => { setPasswordMode('reset'); setErrors({}) }}
          >
            忘记密码
          </button>
        </div>
        <form className="profile-form" onSubmit={handleChangePassword}>
          {passwordMode === 'old' ? (
            <Input
              label="旧密码"
              type="password"
              placeholder="请输入当前密码"
              value={oldPassword}
              onChange={(e) => { setOldPassword(e.target.value); clearError('oldPassword') }}
              error={errors.oldPassword}
            />
          ) : (
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
          )}
          <Input
            label="新密码"
            type="password"
            placeholder="8-32位新密码"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); clearError('newPassword') }}
            error={errors.newPassword}
          />
          <Input
            label="确认新密码"
            type="password"
            placeholder="再次输入新密码"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
            error={errors.confirmPassword}
          />
          <Button type="submit" loading={changingPassword} className="profile-submit-btn">
            修改密码
          </Button>
        </form>
      </Card>
    </div>
  )
}
