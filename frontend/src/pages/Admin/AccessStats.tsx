import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/uiStore'
import type { AdminStats, EndpointStat } from '@/types'
import { Card } from '@/components/ui/Card'
import './Admin.css'

export function AccessStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    adminApi.getStats().then((res) => setStats(res.data)).catch(() => addToast('error', '加载统计数据失败'))
  }, [addToast])

  const groupedByDate = (stats?.endpoint_stats ?? []).reduce<Record<string, EndpointStat[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">访问统计</h1>

      <div className="admin-stats-grid">
        <Card className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.total_users ?? '-'}</div>
            <div className="admin-stat-label">总用户数</div>
          </div>
        </Card>
        <Card className="admin-stat-card">
          <div className="admin-stat-icon">📄</div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.total_resumes ?? '-'}</div>
            <div className="admin-stat-label">总简历数</div>
          </div>
        </Card>
        <Card className="admin-stat-card">
          <div className="admin-stat-icon">🔥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.today_active ?? '-'}</div>
            <div className="admin-stat-label">今日活跃</div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="admin-section-title">接口访问统计（近 7 天）</h2>
        {dates.length === 0 ? (
          <div className="admin-table-empty">暂无数据</div>
        ) : (
          dates.map((date) => (
            <div key={date} className="endpoint-date-group">
              <h3 className="endpoint-date-title">{date}</h3>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>接口路径</th>
                      <th>方法</th>
                      <th>访问次数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByDate[date].map((item, i) => (
                      <tr key={i}>
                        <td className="admin-table-path">{item.path}</td>
                        <td><span className={`admin-method admin-method-${item.method.toLowerCase()}`}>{item.method}</span></td>
                        <td className="admin-table-mono">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
