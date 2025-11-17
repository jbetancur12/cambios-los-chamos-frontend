import { useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  FileText,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Calculator,
  Building,
  BarChart3,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NavItem {
  icon: typeof Home
  label: string
  href: string
  roles?: ('SUPER_ADMIN' | 'ADMIN' | 'TRANSFERENCISTA' | 'MINORISTA')[]
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Inicio', href: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA', 'MINORISTA'] },
  { icon: FileText, label: 'Giros', href: '/giros', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA', 'MINORISTA'] },
  { icon: Users, label: 'Usuarios', href: '/usuarios', roles: ['SUPER_ADMIN'] },
  { icon: Building, label: 'Cuentas', href: '/cuentas-bancarias', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { icon: DollarSign, label: 'Tasas', href: '/tasas', roles: ['SUPER_ADMIN'] },
  { icon: BarChart3, label: 'Reportes', href: '/reportes', roles: ['SUPER_ADMIN'] },
  { icon: BarChart3, label: 'Mis Reportes', href: '/mis-reportes', roles: ['MINORISTA'] },
  { icon: Wallet, label: 'Transacciones', href: '/transacciones-minorista', roles: ['MINORISTA'] },
  {
    icon: Calculator,
    label: 'Calculadora',
    href: '/calculadora',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA', 'MINORISTA'],
  },
  {
    icon: Calculator,
    label: 'Calc. Compra VES',
    href: '/calculadora-ves-compra',
    roles: ['SUPER_ADMIN'],
  },
  { icon: Settings, label: 'Config', href: '/configuracion', roles: ['SUPER_ADMIN', 'ADMIN'] },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const role = user?.role
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const nav = document.querySelector('#mobileNav')
    nav?.scrollTo({ left: 40, behavior: 'smooth' })
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada')
      navigate('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const visibleItems = navItems.filter((item) => {
    if (!role) return false // evita el undefined
    return item.roles?.includes(role)
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 border-r bg-card">
          {/* Header */}
          <div className="flex items-center gap-3 h-16 px-6 border-b">
            <img src="/icons/icon-48x48.png" alt="Logo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-foreground">Cambios los Chamos</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {visibleItems.map((item) => {
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
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-card px-4 md:hidden">
          <img src="/icons/icon-48x48.png" alt="Logo" className="h-8 w-8" />
          <h1 className="text-lg font-semibold">Cambios los Chamos</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-6">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav id="mobileNav" className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:hidden overflow-x-auto">
          <div className="flex h-16 items-center space-x-4 px-4 w-max">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 transition-colors min-w-[80px] shrink-0',
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
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground min-w-[80px] shrink-0"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Salir</span>
            </button>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-card/95 via-card/60 to-transparent" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-card/95 via-card/60 to-transparent" />
        </nav>
      </div>
    </div>
  )
}
