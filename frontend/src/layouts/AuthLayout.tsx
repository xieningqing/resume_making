import { Outlet } from 'react-router-dom'
import { ToastContainer } from '@/components/ui/Toast'
import './AuthLayout.css'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-bg" />
      <div className="auth-card-wrapper">
        <div className="auth-brand">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#auth-logo-grad)" />
            <path d="M8 8h12v2H10v4h8v2H10v6H8V8z" fill="white" />
            <defs>
              <linearGradient id="auth-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <span className="auth-brand-text">ResumeMaker</span>
        </div>
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  )
}
