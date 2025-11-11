import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Placeholder routes for navigation */}
          <Route
            path="/giros"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Giros</h1>
                    <p className="text-muted-foreground">Próximamente...</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Configuración</h1>
                    <p className="text-muted-foreground">Próximamente...</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
