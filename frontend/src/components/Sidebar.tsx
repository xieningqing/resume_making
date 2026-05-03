import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { path: '/admin', label: '概览', icon: '📊' },
  { path: '/admin/users', label: '用户管理', icon: '👥' },
  { path: '/admin/resumes', label: '简历管理', icon: '📄' },
  { path: '/admin/stats', label: '访问统计', icon: '📈' },
  { path: '/admin/config', label: '系统配置', icon: '⚙️' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">后台管理</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
