import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { GirosPage } from '@/pages/GirosPage'
import { CalculadoraPage } from '@/pages/CalculadoraPage'
import { ExchangeRatePage } from '@/pages/ExchangeRatePage'
import { BankTransactionsPage } from '@/pages/BankTransactionsPage'

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

          {/* Giros */}
          <Route
            path="/giros"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <GirosPage />
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
            path="/tasas"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ExchangeRatePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Calculadora*/}
          <Route
            path="/calculadora"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CalculadoraPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Bank Transactions */}
          <Route
            path="/bank-account/:bankAccountId/transactions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BankTransactionsPage />
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
