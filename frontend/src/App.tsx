import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Landing } from '@/pages/Landing'
import { LoginPage } from '@/pages/Auth/LoginPage'
import { RegisterPage } from '@/pages/Auth/RegisterPage'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { EditorPage } from '@/pages/Editor/EditorPage'
import { ProfilePage } from '@/pages/Profile/ProfilePage'
import { AdminDashboard } from '@/pages/Admin/AdminDashboard'
import { UserManagement } from '@/pages/Admin/UserManagement'
import { ResumeManagement } from '@/pages/Admin/ResumeManagement'
import { AccessStats } from '@/pages/Admin/AccessStats'
import { SystemConfig } from '@/pages/Admin/SystemConfig'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/resumes" element={<ResumeManagement />} />
          <Route path="/admin/stats" element={<AccessStats />} />
          <Route path="/admin/config" element={<SystemConfig />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
