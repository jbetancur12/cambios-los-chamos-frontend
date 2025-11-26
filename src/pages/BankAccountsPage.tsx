import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Eye, Search, X, CheckCircle2, AlertCircle, Briefcase, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useBankAccountsList } from '@/hooks/queries/useBankQueries'
import { useAuth } from '@/contexts/AuthContext'
import { useAllUsers } from '@/hooks/queries/useUserQueries'
import { useQueryClient } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { CreateUserSheet } from '@/components/CreateUserSheet'
import { CreateBankAccountSheet } from '@/components/CreateBankAccountSheet'
import { RechargeBalanceSheet } from '@/components/RechargeBalanceSheet'
import { cn } from '@/lib/utils'
import type { BankAccount } from '@/types/api'

export function BankAccountsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'cuentas' | 'trasferencistas'>('cuentas')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTransferencistasTerm, setSearchTransferencistasTerm] = useState('')
  const [createTrasferencistaSheetOpen, setCreateTrasferencistaSheetOpen] = useState(false)
  const [createAdminBankAccountSheetOpen, setCreateAdminBankAccountSheetOpen] = useState(false)
  const [createTransferencistaBankAccountSheetOpen, setCreateTransferencistaBankAccountSheetOpen] = useState(false)
  const [rechargeSheetOpen, setRechargeSheetOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [selectedTransferencista, setSelectedTransferencista] = useState<{
    id: string
    name: string
    transferencistaId: string
  } | null>(null)

  // React Query hook for bank accounts
  const accountsQuery = useBankAccountsList(user?.role)
  const accounts = accountsQuery.data || []
  const isLoading = accountsQuery.isLoading

  // React Query hook for trasferencistas
  const transferencistaQuery = useAllUsers(user?.role === 'SUPER_ADMIN' ? 'TRANSFERENCISTA' : null)
  const trasferencistas = transferencistaQuery.data || []
  const isLoadingTrasferencistas = transferencistaQuery.isLoading

  // Client-side filtering for accounts
  const filteredAccounts =
    searchTerm.trim() === ''
      ? accounts
      : accounts.filter(
          (account) =>
            account.bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.accountHolder.toLowerCase().includes(searchTerm.toLowerCase())
        )

  // Client-side filtering for trasferencistas
  const filteredTrasferencistas =
    searchTransferencistasTerm.trim() === ''
      ? trasferencistas
      : trasferencistas.filter(
          (t) =>
            t.fullName.toLowerCase().includes(searchTransferencistasTerm.toLowerCase()) ||
            t.email.toLowerCase().includes(searchTransferencistasTerm.toLowerCase())
        )

  // Handle errors
  if (accountsQuery.error) {
    toast.error('Error al cargar cuentas bancarias')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleViewTransactions = (accountId: string) => {
    navigate(`/bank-account/${accountId}/transactions`)
  }

  const handleToggleTrasferencistaActive = async (userId: string, newValue: boolean) => {
    try {
      await api.put(`/user/${userId}/toggle-active`, { isActive: newValue })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(newValue ? 'Trasferencista activado' : 'Trasferencista desactivado')
    } catch (error) {
      toast.error('Error al cambiar estado del trasferencista')
      console.error(error)
    }
  }

  const handleToggleTrasferencistaAvailable = async (transferencistaId: string, newValue: boolean) => {
    try {
      const response = await api.put<{
        data: {
          success: boolean
          available: boolean
          girosRedistributed?: number
          redistributionErrors?: number
        }
        message: string
      }>(`/transferencista/${transferencistaId}/toggle-availability`, {
        isAvailable: newValue,
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(response.message || (newValue ? 'Trasferencista disponible' : 'Trasferencista no disponible'))
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar disponibilidad')
      console.error(error)
    }
  }

  const handleTrasferencistaCreated = () => {
    setCreateTrasferencistaSheetOpen(false)
    queryClient.invalidateQueries({ queryKey: ['users'] })
    toast.success('Trasferencista creado exitosamente')
  }

  const handleAdminBankAccountCreated = () => {
    setCreateAdminBankAccountSheetOpen(false)
    queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
    toast.success('Cuenta bancaria compartida creada exitosamente')
  }

  const handleRechargeBalance = (account: BankAccount) => {
    setSelectedAccount(account)
    setRechargeSheetOpen(true)
  }

  const handleBalanceUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
    setRechargeSheetOpen(false)
    setSelectedAccount(null)
  }

  const handleCreateBankAccountForTransferencista = (userId: string, fullName: string, transferencistaId: string) => {
    setSelectedTransferencista({ id: userId, name: fullName, transferencistaId })
    setCreateTransferencistaBankAccountSheetOpen(true)
  }

  const handleTransferencistaBankAccountCreated = () => {
    setCreateTransferencistaBankAccountSheetOpen(false)
    setSelectedTransferencista(null)
    queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
    toast.success('Cuenta bancaria creada exitosamente')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Cuentas</h1>
          <p className="text-muted-foreground">Gestiona cuentas bancarias y trasferencistas</p>
        </div>

        {/* Tab Navigation - Only for SuperAdmin */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('cuentas')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-all border-b-2',
                activeTab === 'cuentas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Cuentas Bancarias
            </button>
            <button
              onClick={() => setActiveTab('trasferencistas')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-all border-b-2',
                activeTab === 'trasferencistas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Trasferencistas
            </button>
          </div>
        )}

        {/* Search Bar - Cuentas */}
        {activeTab === 'cuentas' && (
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por banco o titular..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar - Trasferencistas */}
        {activeTab === 'trasferencistas' && (
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTransferencistasTerm}
                  onChange={(e) => setSearchTransferencistasTerm(e.target.value)}
                  className="pl-9 pr-10"
                />
                {searchTransferencistasTerm && (
                  <button
                    onClick={() => setSearchTransferencistasTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts List - Tab Cuentas */}
        {activeTab === 'cuentas' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Cuentas Bancarias ({filteredAccounts.length})
                </CardTitle>
                {/* ✨ NUEVO: Botón para crear cuenta ADMIN solo visible para SUPERADMIN */}
                {user?.role === 'SUPER_ADMIN' && (
                  <Button
                    onClick={() => setCreateAdminBankAccountSheetOpen(true)}
                    className="gap-2 bg-[linear-gradient(to_right,#136BBC,#274565)] text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Crear Cuenta Compartida</span>
                    <span className="sm:hidden">Nueva</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {/* Desktop Table Skeleton */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Banco</th>
                          <th className="pb-3 font-medium">Titular</th>
                          <th className="pb-3 font-medium text-right">Saldo</th>
                          <th className="pb-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </td>
                            <td className="py-4">
                              <Skeleton className="h-4 w-28" />
                            </td>
                            <td className="py-4">
                              <Skeleton className="h-4 w-28" />
                            </td>
                            <td className="py-4 text-right">
                              <Skeleton className="h-4 w-24 ml-auto" />
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <Skeleton className="h-9 w-32" />
                                <Skeleton className="h-9 w-20" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards Skeleton */}
                  <div className="md:hidden space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-5 w-28" />
                              </div>
                              <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="text-right">
                              <Skeleton className="h-3 w-12 mb-1" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 w-24" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'No se encontraron cuentas con ese criterio de búsqueda'
                      : 'No hay cuentas bancarias registradas'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Banco</th>
                          <th className="pb-3 font-medium">Titular</th>
                          <th className="pb-3 font-medium text-right">Saldo</th>
                          <th className="pb-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((account) => (
                          <tr key={account.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{account.bank.name}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm">{account.accountHolder}</td>
                            <td className="py-4 text-right font-semibold text-green-600">
                              {formatCurrency(account.balance)}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewTransactions(account.id)}
                                  className="gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver Transacciones
                                </Button>
                                {user?.role === 'SUPER_ADMIN' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRechargeBalance(account)}
                                    className="gap-1 bg-[linear-gradient(to_right,#136BBC,#274565)] text-white"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Recargar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredAccounts.map((account) => (
                      <Card key={account.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{account.bank.name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Saldo</p>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(account.balance)}</p>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Titular</span>
                              <span>{account.accountHolder}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTransactions(account.id)}
                              className="flex-1 gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Transacciones
                            </Button>
                            {user?.role === 'SUPER_ADMIN' && (
                              <Button
                                size="sm"
                                onClick={() => handleRechargeBalance(account)}
                                className="gap-1 bg-[linear-gradient(to_right,#136BBC,#274565)] text-white"
                              >
                                <Plus className="h-4 w-4" />
                                Recargar
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trasferencistas List - Tab Trasferencistas */}
        {activeTab === 'trasferencistas' && (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trasferencistas</h3>
              <Button
                onClick={() => setCreateTrasferencistaSheetOpen(true)}
                className="bg-[linear-gradient(to_right,#136BBC,#274565)] text-white"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Crear Trasferencista
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-1">
              {isLoadingTrasferencistas ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-6 w-40 mb-2" />
                            <div className="flex items-center gap-2 mt-2">
                              <Skeleton className="h-4 w-4 rounded-full" />
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-4 rounded-full" />
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-10 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-10 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Skeleton className="h-9 w-full" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </>
              ) : filteredTrasferencistas.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTransferencistasTerm
                        ? 'No se encontraron trasferencistas con ese criterio'
                        : 'No hay trasferencistas registrados'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTrasferencistas.map((t) => (
                  <Card key={t.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{t.fullName}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 min-w-0">
                            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">{t.email}</p>
                            <span
                              title={t.emailVerified ? 'Email verificado' : 'Email no verificado'}
                              className="flex-shrink-0"
                            >
                              {t.emailVerified ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Trasferencista
                          </span>
                          {!t.isActive && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={t.isActive}
                            onCheckedChange={(checked) => handleToggleTrasferencistaActive(t.id, checked)}
                          />
                          <span className="text-sm text-muted-foreground">{t.isActive ? 'Activo' : 'Desactivado'}</span>
                        </div>
                        {t.transferencistaId && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={t.available ?? true}
                              onCheckedChange={(checked) =>
                                handleToggleTrasferencistaAvailable(t.transferencistaId!, checked)
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {t.available ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>
                        )}
                      </div>
                      {t.transferencistaId && (
                        <div className="mt-4">
                          <Button
                            onClick={() =>
                              handleCreateBankAccountForTransferencista(t.id, t.fullName, t.transferencistaId!)
                            }
                            className="w-full gap-2 bg-[linear-gradient(to_right,#136BBC,#274565)] text-white"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                            Crear Cuenta Bancaria
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Create Trasferencista Sheet */}
        <CreateUserSheet
          open={createTrasferencistaSheetOpen}
          onOpenChange={setCreateTrasferencistaSheetOpen}
          onUserCreated={handleTrasferencistaCreated}
          role="TRANSFERENCISTA"
        />

        {/* ✨ NUEVO: Create ADMIN Bank Account Sheet */}
        <CreateBankAccountSheet
          open={createAdminBankAccountSheetOpen}
          onOpenChange={setCreateAdminBankAccountSheetOpen}
          mode="admin"
          onAccountCreated={handleAdminBankAccountCreated}
        />

        {/* Create Transferencista Bank Account Sheet */}
        <CreateBankAccountSheet
          open={createTransferencistaBankAccountSheetOpen}
          onOpenChange={setCreateTransferencistaBankAccountSheetOpen}
          mode="transferencista"
          transferencistaId={selectedTransferencista?.transferencistaId}
          transferencistaName={selectedTransferencista?.name}
          onAccountCreated={handleTransferencistaBankAccountCreated}
        />

        {/* Recharge Balance Sheet */}
        <RechargeBalanceSheet
          open={rechargeSheetOpen}
          onOpenChange={setRechargeSheetOpen}
          account={selectedAccount}
          onBalanceUpdated={handleBalanceUpdated}
        />
      </div>
    </div>
  )
}
