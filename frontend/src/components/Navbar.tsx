import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from './ui/Button'
import './Navbar.css'

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
              <path d="M8 8h12v2H10v4h8v2H10v6H8V8z" fill="white" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="navbar-brand-text">ResumeMaker</span>
        </Link>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">我的简历</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">后台管理</Button>
                </Link>
              )}
              <div className="navbar-user">
                <div className="navbar-avatar">
                  {user?.nickname?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="navbar-email">{user?.nickname || user?.email}</span>
              </div>
              <Link to="/profile">
                <Button variant="ghost" size="sm">个人中心</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                退出
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">注册</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
