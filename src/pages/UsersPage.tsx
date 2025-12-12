import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users as UsersIcon, Search, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { CreateUserSheet } from '@/components/CreateUserSheet'
import { RechargeMinoristaBalanceSheet } from '@/components/RechargeMinoristaBalanceSheet'
import { useAllUsers } from '@/hooks/queries/useUserQueries'
import type { Minorista } from '@/types/api'
import { Switch } from '@/components/ui/switch'

import { useEffect } from 'react'
import { useGiroWebSocket } from '@/hooks/useGiroWebSocket'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [rechargeMinoristaSheetOpen, setRechargeMinoristaSheetOpen] = useState(false)
  const [selectedMinorista, setSelectedMinorista] = useState<Minorista | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // WebSocket for real-time updates
  const { subscribe } = useGiroWebSocket()

  useEffect(() => {
    const handleGiroChange = () => {
      // Invalidate users query to update balances/debts
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }

    const unsubCreated = subscribe('giro:created', handleGiroChange)
    const unsubUpdated = subscribe('giro:updated', handleGiroChange)
    const unsubExecuted = subscribe('giro:executed', handleGiroChange)
    const unsubDeleted = subscribe('giro:deleted', handleGiroChange)
    const unsubProcessing = subscribe('giro:processing', handleGiroChange)
    const unsubReturned = subscribe('giro:returned', handleGiroChange)

    return () => {
      unsubCreated()
      unsubUpdated()
      unsubExecuted()
      unsubDeleted()
      unsubProcessing()
      unsubReturned()
    }
  }, [subscribe, queryClient])

  const isSuperAdmin =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'TRANSFERENCISTA'

  // React Query hook for fetching users - always fetch MINORISTA role
  const usersQuery = useAllUsers(isSuperAdmin ? 'MINORISTA' : null)
  const users = usersQuery.data || []
  const isLoading = usersQuery.isLoading

  const handleUserCreated = () => {
    setSheetOpen(false)
    // Invalidate users query to refetch
    queryClient.invalidateQueries({ queryKey: ['users'] })
    toast.success('Usuario creado exitosamente')
  }

  const handleRechargeMinorista = (minoristaId: string, fullName: string, email: string, balance: number) => {
    setSelectedMinorista({
      id: minoristaId,
      balance,
      creditLimit: 0,
      availableCredit: 0,
      creditBalance: 0,
      user: {
        id: minoristaId,
        fullName,
        email,
        role: 'MINORISTA',
        isActive: true,
      },
    })
    setRechargeMinoristaSheetOpen(true)
  }

  const handleMinoristaBalanceUpdated = () => {
    setRechargeMinoristaSheetOpen(false)
    setSelectedMinorista(null)
    // Invalidate users query to refetch updated balance
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const handleToggleActive = async (userId: string, newValue: boolean) => {
    try {
      await api.put(`/user/${userId}/toggle-active`, { isActive: newValue })
      // Invalidate users query to refetch updated state
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(newValue ? 'Usuario activado' : 'Usuario desactivado')
    } catch (error) {
      toast.error('Error al cambiar estado del usuario')
      console.error(error)
    }
  }

  const handleToggleAvailable = async (transferencistaId: string, newValue: boolean) => {
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

      // Invalidate users query to refetch updated availability
      queryClient.invalidateQueries({ queryKey: ['users'] })

      // Mostrar mensaje de éxito
      toast.success(response.message || (newValue ? 'Transferencista disponible' : 'Transferencista no disponible'))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar disponibilidad'
      toast.error(message)
      console.error(error)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">No tienes permisos para acceder a esta sección</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter and sort users based on search query
  const filteredUsers = users
    .filter((user) => {
      const searchLower = searchQuery.toLowerCase()
      return user.fullName.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower)
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName))

  // Calculate totals
  const totals = {
    count: filteredUsers.length,
    totalCredit: filteredUsers.reduce((sum, user) => sum + (user.creditLimit || 0), 0),
    totalDebt: filteredUsers.reduce((sum, user) => {
      const creditLimit = user.creditLimit || 0
      const availableCredit = user.availableCredit || 0
      return sum + Math.max(0, creditLimit - availableCredit)
    }, 0),
    totalCreditBalance: filteredUsers.reduce((sum, user) => sum + (user.creditBalance || 0), 0),
  }

  const netDebt = totals.totalDebt - totals.totalCreditBalance

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Minoristas</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona minoristas y sus saldos</p>
        </div>
        <Button
          onClick={() => setSheetOpen(true)}
          className="bg-[linear-gradient(to_right,#136BBC,#274565)] text-white hidden md:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Minorista
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="py-0">
              <CardHeader className="px-4 py-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between p-1 rounded-md bg-muted">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hay usuarios registrados</p>
            <Button className="mt-4" onClick={() => setSheetOpen(true)}>
              Crear primer minorista
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {searchQuery && (
            <div className="mb-4 text-sm text-muted-foreground">
              Se encontraron {filteredUsers.length} resultado(s) para "{searchQuery}"
            </div>
          )}
          <div className="grid gap-4 grid-cols-2">
            {filteredUsers.map((user) => {
              return (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-lg hover:bg-muted/50 transition-all py-0"
                  onClick={() => {
                    if (user.minoristaId) {
                      handleRechargeMinorista(user.minoristaId, user.fullName, user.email, user.availableCredit || 0)
                    }
                  }}
                >
                  <CardHeader className="px-4 py-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{user.fullName}</CardTitle>
                      </div>
                      {!user.isActive && (
                        <div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      {/* Switch activar/desactivar */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {user.isActive ? 'Activo' : 'Desactivado'}
                        </span>
                      </div>
                      {/* Switch disponibilidad transferencista */}
                      {user.role === 'TRANSFERENCISTA' && user.transferencistaId && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={user.available ?? true}
                            onCheckedChange={(checked) => handleToggleAvailable(user.transferencistaId!, checked)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {user.available ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {user.minoristaId && (
                    <CardContent className="px-4 py-1">
                      {/* Balance Display */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-1.5 rounded-md bg-muted gap-1 md:gap-0">
                        <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-2">
                          <span className="text-xs text-muted-foreground md:text-sm">Cupo:</span>
                          <span className="font-bold text-green-600 text-xs md:text-sm">
                            {formatCurrency(user.creditLimit || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-2">
                          {(user.creditBalance || 0) > 0 ? (
                            <>
                              <span className="text-xs text-muted-foreground md:text-sm">A Favor:</span>
                              <span className="font-bold text-blue-600 text-xs md:text-sm">
                                {formatCurrency(user.creditBalance || 0)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground md:text-sm">Deuda:</span>
                              <span className="font-bold text-red-600 text-xs md:text-sm">
                                {formatCurrency(Math.max(0, (user.creditLimit || 0) - (user.availableCredit || 0)))}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Totalizador */}
          <div
            className="mt-4 rounded border text-white text-sm"
            style={{ background: 'linear-gradient(to right, #136BBC, #274565)', borderColor: '#136BBC' }}
          >
            <div className="p-3 md:p-4 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <div className="text-center">
                <p className="text-xs opacity-80 mb-1">Total Minoristas</p>
                <p className="text-xl md:text-2xl font-bold">{totals.count}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80 mb-1">Cupo Total</p>
                <p className="text-lg md:text-xl font-bold">{formatCurrency(totals.totalCredit)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80 mb-1">Total Deuda</p>
                <p className="text-lg md:text-xl font-bold">{formatCurrency(totals.totalDebt)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80 mb-1">Total Saldo a Favor</p>
                <p className="text-lg md:text-xl font-bold">{formatCurrency(totals.totalCreditBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80 mb-1">Deuda Neta</p>
                <p className="text-lg md:text-xl font-bold">{formatCurrency(netDebt)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FAB Button - Mobile Only */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:hidden z-50 bg-[linear-gradient(to_right,#136BBC,#274565)] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create User Sheet */}
      <CreateUserSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUserCreated={handleUserCreated}
        role="MINORISTA"
      />

      {/* Minorista Balance Recharge Sheet */}
      <RechargeMinoristaBalanceSheet
        open={rechargeMinoristaSheetOpen}
        onOpenChange={setRechargeMinoristaSheetOpen}
        minorista={selectedMinorista}
        onBalanceUpdated={handleMinoristaBalanceUpdated}
      />
    </div>
  )
}
