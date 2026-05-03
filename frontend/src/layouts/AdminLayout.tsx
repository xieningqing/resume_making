import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import './AdminLayout.css'

export function AdminLayout() {
  return (
    <>
      <Navbar />
      <div className="admin-layout">
        <Sidebar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </>
  )
}
