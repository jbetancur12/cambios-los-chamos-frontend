import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users as UsersIcon,
  Mail,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { CreateUserSheet } from '@/components/CreateUserSheet'
import { useAllUsers } from '@/hooks/queries/useUserQueries'
import type { UserRole } from '@/types/api'
import { Switch } from '@/components/ui/switch'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Minoristas</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona minoristas y sus saldos</p>
        </div>
        <Button onClick={() => setSheetOpen(true)} className="bg-[linear-gradient(to_right,#136BBC,#274565)] text-white hidden md:flex">
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando usuarios...</p>
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
                </Card>
              )
            })}
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
    </div>
  )
}
