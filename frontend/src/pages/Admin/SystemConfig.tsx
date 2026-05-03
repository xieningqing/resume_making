import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/uiStore'
import type { SystemConfig } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import './Admin.css'

export function SystemConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    adminApi.getConfig().then((res) => setConfig(res.data))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      await adminApi.updateConfig(config)
      addToast('success', '配置已保存')
    } catch {
      addToast('error', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: keyof SystemConfig, value: string | number) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  if (!config) return <div className="admin-page">加载中...</div>

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">系统配置</h1>

      <Card className="admin-config-card">
        <h2 className="admin-section-title">基本参数</h2>
        <div className="admin-form-grid">
          <Input
            label="验证码有效期（分钟）"
            type="number"
            value={config.code_expiry_minutes}
            onChange={(e) => updateConfig('code_expiry_minutes', Number(e.target.value))}
          />
          <Input
            label="Token有效期（小时）"
            type="number"
            value={config.token_expiry_hours}
            onChange={(e) => updateConfig('token_expiry_hours', Number(e.target.value))}
          />
          <Input
            label="自动保存间隔（秒）"
            type="number"
            value={config.auto_save_interval_seconds}
            onChange={(e) => updateConfig('auto_save_interval_seconds', Number(e.target.value))}
          />
        </div>

        <h2 className="admin-section-title" style={{ marginTop: 'var(--space-6)' }}>系统公告</h2>
        <textarea
          className="admin-textarea"
          value={config.announcement}
          onChange={(e) => updateConfig('announcement', e.target.value)}
          placeholder="输入系统公告内容..."
          rows={4}
        />

        <div style={{ marginTop: 'var(--space-6)' }}>
          <Button loading={saving} onClick={handleSave}>保存配置</Button>
        </div>
      </Card>
    </div>
  )
}
