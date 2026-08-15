import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useQueryMonitor } from '@/hooks/useQueryMonitor'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { GirosPage } from '@/pages/GirosPage'
import { CustomerRegistrationPage } from '@/pages/CustomerRegistrationPage'
import { CustomerManagementPage } from '@/pages/CustomerManagementPage'
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
import { AuditPage } from '@/pages/AuditPage'
import { LogsPage } from '@/pages/LogsPage'
import InventoryPage from '@/pages/InventoryPage'
import { CobranzasDashboardPage } from '@/pages/cobranzas/CobranzasDashboardPage'
import { CobranzasClientesPage } from '@/pages/cobranzas/CobranzasClientesPage'
import { CobranzasCategoriasPage } from '@/pages/cobranzas/CobranzasCategoriasPage'
import { CobranzasConfigPage } from '@/pages/cobranzas/CobranzasConfigPage'
import { CobranzasRutasPage } from '@/pages/cobranzas/CobranzasRutasPage'
import { CobranzasCreditosPage } from '@/pages/cobranzas/CobranzasCreditosPage'
import { CobranzasPagosPage } from '@/pages/cobranzas/CobranzasPagosPage'
import { CobranzasCajaPage } from '@/pages/cobranzas/CobranzasCajaPage'
import { CobranzasReportesPage } from '@/pages/cobranzas/CobranzasReportesPage'

import { useEffect } from 'react'
import { requestNotifyPermission } from './firebase/messaging'
import { useGiroWebSocket } from '@/hooks/useGiroWebSocket'
import { setupWebSocketSync } from '@/lib/websocketSync'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { VersionBadge } from '@/components/VersionBadge'

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

import { ThemeProvider } from '@/components/ThemeProvider'
import { PostHogIdentifier } from '@/components/PostHogIdentifier'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryMonitorInitializer />
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
          <AuthProvider>
            <PostHogIdentifier />
            <WebSocketSyncInitializer />
            {/* <PushInitializer /> */}
            <PushInitializer />
            <ErrorBoundary>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/auditoria-oculta"
                  element={
                    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN']}>
                      <DashboardLayout>
                        <AuditPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clientes-facturacion"
                  element={
                    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN']}>
                      <DashboardLayout>
                        <CustomerManagementPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/registro-facturacion" element={<CustomerRegistrationPage />} />

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
                    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN']}>
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

                <Route
                  path="/logs"
                  element={
                    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN']}>
                      <ErrorBoundary>
                        <DashboardLayout>
                          <LogsPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Inventory */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN']}>
                      <ErrorBoundary>
                        <DashboardLayout>
                          <InventoryPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Cobranzas — módulo exclusivo Super Admin */}
                <Route
                  path="/cobranzas"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasDashboardPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/clientes"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasClientesPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/categorias"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasCategoriasPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/configuracion"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasConfigPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/rutas"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasRutasPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/creditos"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasCreditosPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/pagos"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasPagosPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/caja"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasCajaPage />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cobranzas/reportes"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <ErrorBoundary>
                        <DashboardLayout>
                          <CobranzasReportesPage />
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
            <UpdatePrompt />
            <VersionBadge />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
