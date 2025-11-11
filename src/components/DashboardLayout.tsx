import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, Users, DollarSign, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NavItem {
  icon: typeof Home
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Inicio', href: '/dashboard' },
  { icon: FileText, label: 'Giros', href: '/giros' },
  { icon: Users, label: 'Usuarios', href: '/usuarios' },
  { icon: DollarSign, label: 'Tasas', href: '/tasas' },
  { icon: Settings, label: 'Config', href: '/configuracion' },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada')
      navigate('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 border-r bg-card">
          {/* Header */}
          <div className="flex items-center h-16 px-6 border-b">
            <h1 className="text-xl font-bold text-foreground">Cambios los Chamos</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 md:hidden">
          <h1 className="text-lg font-semibold">Cambios los Chamos</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-6">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:hidden">
          <div className="grid grid-cols-6 h-16">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Salir</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
