import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, TrendingUp, DollarSign } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export function DashboardPage() {
  const { user } = useAuth()
  const { stats, loading, error } = useDashboardStats()

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const isTransferencista = user?.role === 'TRANSFERENCISTA'
  const isMinorista = user?.role === 'MINORISTA'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(amount)
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Bienvenido, {user?.fullName}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Rol: {user?.role}
        </p>
      </div>

      {/* Stats Grid - Different for each role */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Giros - Shown to all roles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">
              {stats?.girosLabel || 'Giros'}
            </CardTitle>
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.girosCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {isTransferencista ? 'Asignados' : 'Pendientes'}
            </p>
          </CardContent>
        </Card>

        {/* Users - Only Super Admin */}
        {isSuperAdmin && stats?.usersCount !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                Usuarios
              </CardTitle>
              <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats.usersCount}</div>
              <p className="text-xs text-muted-foreground">
                Activos
              </p>
            </CardContent>
          </Card>
        )}

        {/* Volume - Only Super Admin */}
        {isSuperAdmin && stats?.volume !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                Volumen
              </CardTitle>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.volume)}</div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>
        )}

        {/* Earnings/Income - Super Admin and Minorista only */}
        {(isSuperAdmin || isMinorista) && stats?.earnings !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                {isMinorista ? 'Mis Ganancias' : 'Ingresos'}
              </CardTitle>
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.earnings)}</div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isTransferencista ? 'Mis Giros Recientes' : isMinorista ? 'Mis Giros Recientes' : 'Actividad Reciente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay actividad reciente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
