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
import { BankAccountsPage } from '@/pages/BankAccountsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { RechargeAmountsManager } from '@/components/RechargeAmountsManager'
import { RechargeOperatorsManager } from '@/components/RechargeOperatorsManager'
import { MinoristaTransactionsPage } from './pages/MinoristaTransactionsPage'

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

          {/* Transaciones Minorista*/}
          <Route
            path="/transacciones-minorista"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MinoristaTransactionsPage />
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

          {/* Bank Accounts */}
          <Route
            path="/cuentas-bancarias"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BankAccountsPage />
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

          {/* Reports */}
          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracion"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-8">Configuración</h1>
                    <div className="grid gap-6">
                      {/* Recharge Amounts Manager */}
                      <div>
                        <RechargeAmountsManager />
                      </div>

                      {/* Recharge Operators Manager */}
                      <div>
                        <RechargeOperatorsManager />
                      </div>
                    </div>
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
