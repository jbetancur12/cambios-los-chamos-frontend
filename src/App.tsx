import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryMetricsPanel } from '@/components/QueryMetricsPanel'
import { useQueryMonitor } from '@/hooks/useQueryMonitor'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { GirosPage } from '@/pages/GirosPage'
import { SendGiroPage } from '@/pages/SendGiroPage'
import { CalculadoraPage } from '@/pages/CalculadoraPage'
import { CalculadoraVesCompraPage } from '@/pages/CalculadoraVesCompraPage'
import { ExchangeRatePage } from '@/pages/ExchangeRatePage'
import { BankTransactionsPage } from '@/pages/BankTransactionsPage'
import { BankAccountsPage } from '@/pages/BankAccountsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { MinoristaReportsPage } from '@/pages/MinoristaReportsPage'
import { MinoristaTransactionsPage } from './pages/MinoristaTransactionsPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { useEffect } from 'react'
import { requestNotifyPermission } from './firebase/messaging'
import { useGiroWebSocket } from '@/hooks/useGiroWebSocket'
import { setupWebSocketSync } from '@/lib/websocketSync'

function QueryMonitorInitializer() {
  useQueryMonitor()
  return null
}

function WebSocketSyncInitializer() {
  const { subscribe } = useGiroWebSocket()

  useEffect(() => {
    const { setupGiroSync } = setupWebSocketSync(queryClient)
    const unsubscribe = setupGiroSync(subscribe)

    return () => {
      unsubscribe()
    }
  }, [subscribe])

  return null
}

function PushInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      requestNotifyPermission(user.id)
    }
  }, [user])

  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryMonitorInitializer />
      <WebSocketSyncInitializer />
      <BrowserRouter>
        <AuthProvider>
          {/* <PushInitializer /> */}
          <PushInitializer />
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <DashboardPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Giros */}
              <Route
                path="/giros"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <GirosPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Enviar Giro */}
              <Route
                path="/enviar-giro"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <SendGiroPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <UsersPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tasas"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <ExchangeRatePage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Transaciones Minorista*/}
              <Route
                path="/transacciones-minorista"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <MinoristaTransactionsPage />
                      </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

              {/* Calculadora*/}
              <Route
                path="/calculadora"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <CalculadoraPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Calculadora VES Compra (Super Admin) */}
              <Route
                path="/calculadora-ves-compra"
                element={
                  <ProtectedRoute requiredRole="SUPER_ADMIN">
                    <ErrorBoundary>
                      <DashboardLayout>
                        <CalculadoraVesCompraPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Bank Accounts */}
              <Route
                path="/cuentas-bancarias"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <BankAccountsPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Bank Transactions */}
              <Route
                path="/bank-account/:bankAccountId/transactions"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <BankTransactionsPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <ReportsPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Minorista Reports */}
              <Route
                path="/mis-reportes"
                element={
                  <ProtectedRoute requiredRole="MINORISTA">
                    <ErrorBoundary>
                      <DashboardLayout>
                        <MinoristaReportsPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA']}>
                    <ErrorBoundary>
                      <DashboardLayout>
                        <ConfigPage />
                      </DashboardLayout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to enviar-giro */}
              <Route path="/" element={<Navigate to="/enviar-giro" replace />} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>

        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>

    {/* Development Tools - only visible in development */}
    <QueryMetricsPanel />
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
