import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminStats, EndpointStat } from '@/types'
import { Card } from '@/components/ui/Card'
import './Admin.css'

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    adminApi.getStats().then((res) => setStats(res.data))
  }, [])

  const statCards = [
    { label: '总用户数', value: stats?.total_users ?? '-', icon: '👥' },
    { label: '总简历数', value: stats?.total_resumes ?? '-', icon: '📄' },
    { label: '今日活跃', value: stats?.today_active ?? '-', icon: '📈' },
  ]

  // 按日期分组
  const groupedByDate = (stats?.endpoint_stats ?? []).reduce<Record<string, EndpointStat[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">后台概览</h1>
      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <Card key={card.label} className="admin-stat-card">
            <div className="admin-stat-icon">{card.icon}</div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{card.value}</div>
              <div className="admin-stat-label">{card.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="admin-recent-card">
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
