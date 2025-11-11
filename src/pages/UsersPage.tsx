import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users as UsersIcon, Mail, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CreateUserSheet } from '@/components/CreateUserSheet'
import type { UserRole } from '@/types/api'

interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL')

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const fetchUsers = async (role?: UserRole) => {
    try {
      setLoading(true)
      if (role && role !== 'ALL') {
        const response = await api.get<{ users: User[] }>(`/api/user/by-role/${role}`)
        setUsers(response.users)
      } else {
        // Fetch all roles
        const [admins, transferencistas, minoristas] = await Promise.all([
          api.get<{ users: User[] }>('/api/user/by-role/ADMIN'),
          api.get<{ users: User[] }>('/api/user/by-role/TRANSFERENCISTA'),
          api.get<{ users: User[] }>('/api/user/by-role/MINORISTA'),
        ])
        setUsers([...admins.users, ...transferencistas.users, ...minoristas.users])
      }
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
    fetchUsers(selectedRole === 'ALL' ? undefined : selectedRole)
    toast.success('Usuario creado exitosamente')
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona transferencistas y minoristas</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={selectedRole === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('ALL')}
        >
          Todos
        </Button>
        <Button
          variant={selectedRole === 'ADMIN' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('ADMIN')}
        >
          Admins
        </Button>
        <Button
          variant={selectedRole === 'TRANSFERENCISTA' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('TRANSFERENCISTA')}
        >
          Transferencistas
        </Button>
        <Button
          variant={selectedRole === 'MINORISTA' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRole('MINORISTA')}
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
        <div className="grid gap-4">
          {users.map((user) => {
            const roleBadge = getRoleBadge(user.role)
            return (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.fullName}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{user.email}</p>
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
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      {/* FAB - Create User */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create User Sheet */}
      <CreateUserSheet open={sheetOpen} onOpenChange={setSheetOpen} onUserCreated={handleUserCreated} />
    </div>
  )
}
