import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, TrendingUp, DollarSign, Wallet, Coins, Clock, ArrowRight, Building } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useRecentGiros } from '@/hooks/useRecentGiros'
import type { RecentGiro } from '@/hooks/useRecentGiros'
import { GiroDetailSheet } from '@/components/GiroDetailSheet'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Minorista, BankAccount } from '@/types/api'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, loading, error } = useDashboardStats()
  const { giros, loading: girosLoading } = useRecentGiros(5)
  const [selectedGiro, setSelectedGiro] = useState<RecentGiro | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Minorista balance
  const [minoristaBalance, setMinoristaBalance] = useState<number | null>(null)
  const [minoristaBalanceInFavor, setMinoristaBalanceInFavor] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Transferencista bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const isTransferencista = user?.role === 'TRANSFERENCISTA'
  const isMinorista = user?.role === 'MINORISTA'

  useEffect(() => {
    if (isMinorista) {
      fetchMinoristaBalance()
    }
    if (isTransferencista) {
      fetchBankAccounts()
    }
  }, [isMinorista, isTransferencista])

  const fetchMinoristaBalance = async () => {
    try {
      setLoadingBalance(true)
      const response = await api.get<{ minorista: Minorista }>('/api/minorista/me')
      setMinoristaBalance(response.minorista.availableCredit)
      setMinoristaBalanceInFavor(response.minorista.creditBalance || 0)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const response = await api.get<{ bankAccounts: BankAccount[] }>('/api/bank-account/my-accounts')
      setBankAccounts(response.bankAccounts)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar cuentas bancarias')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleGiroClick = (giro: RecentGiro) => {
    setSelectedGiro(giro)
    setSheetOpen(true)
  }

  const handleDetailClose = () => {
    setSheetOpen(false)
    // Recargar giros recientes si es necesario
  }

  const formatCurrency = (amount: number, currency: 'VES' | 'COP' | 'USD' = 'VES') => {
    const locale = currency === 'COP' ? 'es-CO' : currency === 'USD' ? 'en-US' : 'es-VE'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours}h`
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      ASIGNADO: { label: 'Asignado', className: 'bg-blue-100 text-blue-800' },
      PROCESANDO: { label: 'Procesando', className: 'bg-purple-100 text-purple-800' },
      COMPLETADO: { label: 'Completado', className: 'bg-green-100 text-green-800' },
      CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      DEVUELTO: { label: 'Devuelto', className: 'bg-orange-100 text-orange-800' }, // Nuevo estado
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bienvenido, {user?.fullName}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Rol: {user?.role}</p>
      </div>

      {/* Stats Grid - Different for each role */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Giros - Shown to all roles */}
        <Card className={isTransferencista && stats?.minoristaGiroStats && stats.minoristaGiroStats.length > 0 ? 'lg:col-span-2' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">{stats?.girosLabel || 'Giros'}</CardTitle>
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.girosCount ?? 0}</div>
            {isTransferencista && stats?.minoristaGiroStats && stats.minoristaGiroStats.length > 0 ? (
              <div className="text-xs text-muted-foreground space-y-2 mt-3">
                <p className="font-semibold text-foreground text-xs">Por minorista:</p>
                {stats.minoristaGiroStats.map((stat) => (
                  <div key={stat.minoristaId} className="border-t pt-1.5">
                    <p className="font-medium text-foreground truncate text-xs">{stat.minoristaName}</p>
                    <div className="flex gap-2 text-xs mt-1 flex-wrap">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        Asignados: <span className="font-semibold">{stat.assignedTotal}</span>
                      </span>
                      <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                        Procesando: <span className="font-semibold">{stat.processingToday}</span>
                      </span>
                      <span className="bg-green-50 px-2 py-0.5 rounded text-green-700">
                        Completados: <span className="font-semibold">{stat.completedToday}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{isTransferencista ? 'Asignados' : 'Pendientes'}</p>
            )}
          </CardContent>
        </Card>

        {/* Users - Only Super Admin */}
        {isSuperAdmin && stats?.usersCount !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats.usersCount}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>
        )}

        {/* Volume Bs - Only Super Admin */}
        {isSuperAdmin && stats?.volumeBs !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Volumen Bs</CardTitle>
              <Wallet className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.volumeBs, 'VES')}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}

        {/* Volume COP - Only Super Admin */}
        {isSuperAdmin && stats?.volumeCOP !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Volumen COP</CardTitle>
              <Coins className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.volumeCOP, 'COP')}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}

        {/* Volume USD - Only Super Admin */}
        {isSuperAdmin && stats?.volumeUSD !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Volumen USD</CardTitle>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.volumeUSD, 'USD')}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}

        {/* System Earnings - Only Super Admin */}
        {isSuperAdmin && stats?.systemEarnings !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Ganancias Sistema</CardTitle>
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.systemEarnings, 'COP')}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}

        {/* Minorista Earnings - Only Super Admin */}
        {isSuperAdmin && stats?.minoristaEarnings !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Ganancias Minoristas</CardTitle>
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.minoristaEarnings, 'COP')}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}

        {/* Earnings - Minorista only */}
        {isMinorista && stats?.earnings !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Mis Ganancias</CardTitle>
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.earnings, 'COP')}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Minorista Balance Card */}
      {isMinorista && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                Saldo Disponible
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBalance ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Cargando balance...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crédito Disponible */}
                <div className="space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Crédito Disponible
                  </p>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">
                    {minoristaBalance !== null ? formatCurrency(minoristaBalance, 'COP') : '$ 0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground">Para crear giros</p>
                </div>

                {/* Saldo a Favor - Solo mostrar si existe */}
                {minoristaBalanceInFavor !== null && minoristaBalanceInFavor > 0 && (
                  <div className="space-y-2 bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs md:text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Saldo a Favor
                    </p>
                    <div className="text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(minoristaBalanceInFavor, 'COP')}
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Balance acreditado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transferencista Bank Accounts Card */}
      {isTransferencista && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Building className="h-5 w-5" />
              Mis Cuentas Bancarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAccounts ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Cargando cuentas...</p>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No tienes cuentas bancarias registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bank-account/${account.id}/transactions`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-sm md:text-base">{account.bank.name}</p>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">{account.accountNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{account.accountHolder}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p className="text-lg md:text-xl font-bold text-green-600">
                          {formatCurrency(account.balance, 'VES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total Balance */}
                {bankAccounts.length > 1 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Total</p>
                      <p className="text-xl md:text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          bankAccounts.reduce((sum, account) => sum + account.balance, 0),
                          'VES'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">
            {isTransferencista ? 'Mis Giros Recientes' : isMinorista ? 'Mis Giros Recientes' : 'Actividad Reciente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          {girosLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : giros.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No hay giros recientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {giros.map((giro) => {
                const statusBadge = getStatusBadge(giro.status)
                return (
                  <div
                    key={giro.id}
                    onClick={() => handleGiroClick(giro)}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors active:scale-[0.98] cursor-pointer"
                  >
                    {/* Left side - Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm md:text-base truncate">{giro.beneficiaryName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Amount & Currency */}
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {giro.amountInput && giro.currencyInput
                            ? `${formatCurrency(giro.amountInput, giro.currencyInput as 'COP' | 'USD')}`
                            : formatCurrency(giro.amountBs, 'VES')}
                        </span>
                        {giro.amountInput && giro.currencyInput && (
                          <span>→ {formatCurrency(giro.amountBs, 'VES')}</span>
                        )}
                      </div>

                      {/* Additional info based on role */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(giro.createdAt)}</span>
                        {isSuperAdmin && giro.minoristaName && (
                          <>
                            <span>•</span>
                            <span>{giro.minoristaName}</span>
                          </>
                        )}
                        {(isTransferencista || isMinorista) && giro.bankName && (
                          <>
                            <span>•</span>
                            <span>{giro.bankName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side - Earnings or Arrow */}
                    <div className="flex items-center ml-2">
                      {isMinorista && giro.earnings !== undefined ? (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Ganancia</p>
                          <p className="font-semibold text-sm text-green-600">{formatCurrency(giro.earnings, 'COP')}</p>
                        </div>
                      ) : (
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Giro Detail Sheet */}
      <GiroDetailSheet
        giroId={selectedGiro?.id || null}
        open={sheetOpen}
        onOpenChange={handleDetailClose}
        onUpdate={() => {
          // Recargar estadísticas si es necesario
        }}
      />
    </div>
  )
}
