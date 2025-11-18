import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Users as UsersIcon,
  Mail,
  ShieldCheck,
  User,
  Briefcase,
  Building2,
  Wallet,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CreateUserSheet } from '@/components/CreateUserSheet'
import { TransferencistaAccountsSheet } from '@/components/TransferencistaAccountsSheet'
import { RechargeMinoristaBalanceSheet } from '@/components/RechargeMinoristaBalanceSheet'
import type { UserRole, Minorista } from '@/types/api'
import { Switch } from '@/components/ui/switch'

interface UserData {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  available?: boolean
  transferencistaId?: string // ID del transferencista si el usuario es TRANSFERENCISTA
  minoristaId?: string // ID del minorista si el usuario es MINORISTA
  balance?: number // Saldo del minorista si el usuario es MINORISTA
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL')
  const [createUserRole, setCreateUserRole] = useState<UserRole>('ADMIN')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountsSheetOpen, setAccountsSheetOpen] = useState(false)
  const [selectedTransferencista, setSelectedTransferencista] = useState<{
    id: string
    name: string
  } | null>(null)
  const [rechargeMinoristaSheetOpen, setRechargeMinoristaSheetOpen] = useState(false)
  const [selectedMinorista, setSelectedMinorista] = useState<Minorista | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const fetchUsers = async (role?: UserRole | 'ALL') => {
    try {
      setLoading(true)
      let usersData: UserData[] = []

      if (role && role !== 'ALL') {
        const response = await api.get<{ users: any[] }>(`/api/user/by-role/${role}`)
        usersData = response.users

        // Si es TRANSFERENCISTA, obtener los IDs de transferencista y disponibilidad
        if (role === 'TRANSFERENCISTA') {
          const transferencistaResponse = await api.get<{
            transferencistas: { id: string; available: boolean; user: { id: string } }[]
          }>('/api/transferencista/list')
          const transferencistaMap = new Map(
            transferencistaResponse.transferencistas.map((t: any) => [t.user.id, { id: t.id, available: t.available }])
          )
          usersData = usersData.map((user) => {
            const transferencistaData = transferencistaMap.get(user.id)
            return {
              ...user,
              available: transferencistaData?.available,
              transferencistaId: transferencistaData?.id,
            }
          })
        }

        // Si es MINORISTA, obtener los IDs de minorista y saldo
        if (role === 'MINORISTA') {
          const minoristaResponse = await api.get<{
            minoristas: { id: string; balance: number; user: { id: string } }[]
          }>('/api/minorista/list')
          const minoristaMap = new Map(
            minoristaResponse.minoristas.map((m: any) => [m.user.id, { id: m.id, balance: m.balance }])
          )
          usersData = usersData.map((user) => {
            const minoristaData = minoristaMap.get(user.id)
            return {
              ...user,
              minoristaId: minoristaData?.id,
              balance: minoristaData?.balance,
            }
          })
        }
      } else {
        // Fetch all roles
        const [admins, transferencistasUsers, minoristasUsers, transferencistasList, minoristasList] =
          await Promise.all([
            api.get<{ users: any[] }>('/api/user/by-role/ADMIN'),
            api.get<{ users: any[] }>('/api/user/by-role/TRANSFERENCISTA'),
            api.get<{ users: any[] }>('/api/user/by-role/MINORISTA'),
            api.get<{ transferencistas: { id: string; available: boolean; user: { id: string } }[] }>(
              '/api/transferencista/list'
            ),
            api.get<{ minoristas: { id: string; balance: number; user: { id: string } }[] }>('/api/minorista/list'),
          ])

        // Map transferencista IDs and availability
        const transferencistaMap = new Map(
          transferencistasList.transferencistas.map((t: any) => [t.user.id, { id: t.id, available: t.available }])
        )

        const transferencistaData = transferencistasUsers.users.map((user) => {
          const transferencista = transferencistaMap.get(user.id)
          return {
            ...user,
            available: transferencista?.available,
            transferencistaId: transferencista?.id,
          }
        })

        // Map minorista IDs and balances
        const minoristaMap = new Map(
          minoristasList.minoristas.map((m: any) => [m.user.id, { id: m.id, balance: m.balance }])
        )

        const minoristaData = minoristasUsers.users.map((user) => {
          const minorista = minoristaMap.get(user.id)
          return {
            ...user,
            minoristaId: minorista?.id,
            balance: minorista?.balance,
          }
        })

        usersData = [...admins.users, ...transferencistaData, ...minoristaData]
      }

      setUsers(usersData)
    } catch (error) {
      toast.error('Error al cargar usuarios')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers(selectedRole === 'ALL' ? undefined : selectedRole)
    }
  }, [selectedRole, isSuperAdmin])

  const handleUserCreated = () => {
    setSheetOpen(false)
    setMenuOpen(false)
    fetchUsers(selectedRole === 'ALL' ? undefined : selectedRole)
    toast.success('Usuario creado exitosamente')
  }

  const handleCreateUser = (role: UserRole) => {
    setCreateUserRole(role)
    setSheetOpen(true)
    setMenuOpen(false)
  }

  const handleViewAccounts = (transferencistaId: string, name: string) => {
    setSelectedTransferencista({ id: transferencistaId, name })
    setAccountsSheetOpen(true)
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
    fetchUsers(selectedRole === 'ALL' ? undefined : selectedRole)
  }

  const handleToggleActive = async (userId: string, newValue: boolean) => {
    try {
      await api.put(`/api/user/${userId}/toggle-active`, { isActive: newValue })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: newValue } : u)))
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
      }>(`/api/transferencista/${transferencistaId}/toggle-availability`, {
        isAvailable: newValue,
      })

      // Actualizar estado local
      setUsers((prev) =>
        prev.map((u) => (u.transferencistaId === transferencistaId ? { ...u, available: newValue } : u))
      )

      // Mostrar mensaje de éxito
      toast.success(response.message || (newValue ? 'Transferencista disponible' : 'Transferencista no disponible'))
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar disponibilidad')
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

  const getRoleBadge = (role: UserRole) => {
    const roleMap: Record<UserRole, { label: string; className: string }> = {
      SUPER_ADMIN: { label: 'Super Admin', className: 'bg-purple-100 text-purple-800' },
      ADMIN: { label: 'Admin', className: 'bg-blue-100 text-blue-800' },
      TRANSFERENCISTA: { label: 'Transferencista', className: 'bg-green-100 text-green-800' },
      MINORISTA: { label: 'Minorista', className: 'bg-orange-100 text-orange-800' },
    }
    return roleMap[role] || { label: role, className: 'bg-gray-100 text-gray-800' }
  }

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase()
    return user.fullName.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower)
  })

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona transferencistas y minoristas</p>
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

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={selectedRole === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('ALL')}
          style={selectedRole == "ALL" ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
        >
          Todos
        </Button>
        <Button
          variant={selectedRole === 'ADMIN' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('ADMIN')}
          style={selectedRole == "ADMIN" ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}

        >
          Admins
        </Button>
        <Button
          variant={selectedRole === 'TRANSFERENCISTA' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('TRANSFERENCISTA')}
          style={selectedRole == "TRANSFERENCISTA" ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}

        >
          Transferencistas
        </Button>
        <Button
          variant={selectedRole === 'MINORISTA' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('MINORISTA')}
          style={selectedRole == "MINORISTA" ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}

        >
          Minoristas
        </Button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hay usuarios registrados</p>
            <Button className="mt-4" onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer usuario
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
          <div className="grid gap-4 grid-cols-1">
            {filteredUsers.map((user) => {
              const roleBadge = getRoleBadge(user.role)
              return (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{user.fullName}</CardTitle>
                        <div className="flex items-center gap-2 mt-2 min-w-0">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <span
                            title={user.emailVerified ? 'Email verificado' : 'Email no verificado'}
                            className="flex-shrink-0"
                          >
                            {user.emailVerified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                        {!user.isActive && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-3 flex-wrap">
                      {/* Switch activar/desactivar */}
                      <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-2">
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
                  {user.role === 'TRANSFERENCISTA' && user.transferencistaId && (
                    <CardContent className="pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleViewAccounts(user.transferencistaId!, user.fullName)}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Ver Cuentas Bancarias
                      </Button>
                    </CardContent>
                  )}
                  {user.role === 'MINORISTA' && user.minoristaId && (
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {/* Balance Display */}
                        <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">Saldo:</span>
                          </div>
                          <span className="font-bold text-green-600">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0,
                            }).format(user.balance || 0)}
                          </span>
                        </div>
                        {/* Recharge Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            handleRechargeMinorista(user.minoristaId!, user.fullName, user.email, user.balance || 0)
                          }
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Recargar Saldo
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* FAB - Create User Menu */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
        {/* Menu Options */}
        {menuOpen && (
          <div className="absolute bottom-16 right-0 bg-card border rounded-lg shadow-lg p-2 space-y-1 min-w-[200px] mb-2 z-50">
            <button
              onClick={() => handleCreateUser('ADMIN')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-left"
            >
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Crear Admin</span>
            </button>
            <button
              onClick={() => handleCreateUser('TRANSFERENCISTA')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-left"
            >
              <Briefcase className="h-5 w-5 text-green-600" />
              <span className="font-medium">Crear Transferencista</span>
            </button>
            <button
              onClick={() => handleCreateUser('MINORISTA')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-left"
            >
              <User className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Crear Minorista</span>
            </button>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 ${menuOpen ? 'rotate-45' : ''
            }`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/20 z-40" style={{ bottom: 0 }} />
      )}

      {/* Create User Sheet */}
      <CreateUserSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUserCreated={handleUserCreated}
        role={createUserRole}
      />

      {/* Transferencista Bank Accounts Sheet */}
      <TransferencistaAccountsSheet
        open={accountsSheetOpen}
        onOpenChange={setAccountsSheetOpen}
        transferencistaId={selectedTransferencista?.id || null}
        transferencistaName={selectedTransferencista?.name || ''}
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
