import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ToastContainer } from '@/components/ui/Toast'

export function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <ToastContainer />
    </>
  )
}
