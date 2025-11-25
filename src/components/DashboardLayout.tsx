import { useEffect, useState, type ReactNode } from 'react'
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
  Send,
  Menu,
  X,
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

// Main items for bottom navigation (5 total including hamburger)
const bottomNavItems: NavItem[] = [
  { icon: Home, label: 'Inicio', href: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA', 'MINORISTA'] },
  {
    icon: Send,
    label: 'Enviar giro',
    href: '/enviar-giro',
    roles: ['SUPER_ADMIN', 'ADMIN', 'MINORISTA'],
  },
  {
    icon: FileText,
    label: 'Solicitudes',
    href: '/giros',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA', 'MINORISTA'],
  },
  { icon: Users, label: 'Usuarios', href: '/usuarios', roles: ['SUPER_ADMIN'] },
  { icon: Building, label: 'Cuentas', href: '/cuentas-bancarias', roles: ['SUPER_ADMIN', 'ADMIN'] },
]

// Additional items for side menu
const sideMenuItems: NavItem[] = [
  { icon: DollarSign, label: 'Tasas', href: '/tasas', roles: ['SUPER_ADMIN'] },
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
  { icon: BarChart3, label: 'Reportes', href: '/reportes', roles: ['SUPER_ADMIN'] },
  { icon: BarChart3, label: 'Mis Reportes', href: '/mis-reportes', roles: ['MINORISTA'] },
  { icon: Wallet, label: 'Transacciones', href: '/transacciones-minorista', roles: ['MINORISTA'] },

  { icon: Settings, label: 'Config', href: '/configuracion', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA'] },
]

// All items for desktop sidebar
const allNavItems: NavItem[] = [...bottomNavItems, ...sideMenuItems]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const role = user?.role
  const location = useLocation()
  const navigate = useNavigate()
  const [sideMenuOpen, setSideMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada')
      navigate('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  // Filter items based on role
  const visibleDesktopItems = allNavItems.filter((item) => {
    if (!role) return false
    return item.roles?.includes(role)
  })

  const visibleBottomItems = bottomNavItems.filter((item) => {
    if (!role) return false
    return item.roles?.includes(role)
  })

  const visibleSideItems = sideMenuItems.filter((item) => {
    if (!role) return false
    return item.roles?.includes(role)
  })

  // Close side menu when route changes
  useEffect(() => {
    setSideMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div
          className="flex flex-col flex-1 min-h-0 border-r"
          style={{ background: 'linear-gradient(to bottom, #136BBC, #274565)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 h-40 px-6 border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <img src="/LogoLosChamos.avif" alt="Logo" className="h-30 w-30" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {visibleDesktopItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive ? 'text-white' : 'text-blue-100 hover:text-white'
                  )}
                  style={
                    isActive ? { backgroundColor: 'rgba(255, 255, 255, 0.15)' } : { backgroundColor: 'transparent' }
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-blue-100">{user?.email}</p>
            </div>
            <Button
              className="w-full justify-start gap-2 text-white hover:text-white bg-[linear-gradient(to_right,#510200,#f80000)]"
              style={{ border: 'none' }}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Side Menu */}
      {sideMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setSideMenuOpen(false)} />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 z-50 md:hidden transform transition-transform duration-300',
          sideMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'linear-gradient(to bottom, #136BBC, #274565)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="flex items-center justify-between h-16 px-4 border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <img src="/LogoLosChamos.avif" alt="Logo" className="h-10 w-10" />
            <button onClick={() => setSideMenuOpen(false)} className="text-white hover:text-blue-200">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleSideItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSideMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive ? 'text-white' : 'text-blue-100 hover:text-white'
                  )}
                  style={
                    isActive ? { backgroundColor: 'rgba(255, 255, 255, 0.15)' } : { backgroundColor: 'transparent' }
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-blue-100 truncate">{user?.email}</p>
            </div>
            <Button
              className="w-full justify-start gap-2 text-white hover:text-white text-sm bg-[linear-gradient(to_right,#510200,#f80000)]"
              style={{ border: 'none' }}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header
          className="sticky top-0 z-40 flex h-16 items-center gap-3 px-4 md:hidden text-white"
          style={{
            background: 'linear-gradient(to right, #136BBC, #274565)',
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <img src="/LogoLosChamos.avif" alt="Logo" className="h-20 w-20" />
          <h1 className="text-lg font-semibold">Cambios los Chamos</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-6">{children}</main>

        {/* Mobile Bottom Navigation - 5 icons */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t text-white"
          style={{
            background: 'linear-gradient(to right, #136BBC, #274565)',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex h-16 items-center justify-around">
            {/* Solicitudes */}
            {visibleBottomItems.find((item) => item.href === '/giros') && (
              <Link
                to="/giros"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-16 transition-colors',
                  location.pathname === '/giros' ? 'text-white font-semibold' : 'text-blue-100 hover:text-white'
                )}
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs">Solicitudes</span>
              </Link>
            )}

            {/* Cuentas */}
            {visibleBottomItems.find((item) => item.href === '/cuentas-bancarias') && (
              <Link
                to="/cuentas-bancarias"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-16 transition-colors',
                  location.pathname === '/cuentas-bancarias'
                    ? 'text-white font-semibold'
                    : 'text-blue-100 hover:text-white'
                )}
              >
                <Building className="w-6 h-6" />
                <span className="text-xs">Cuentas</span>
              </Link>
            )}

            {/* Enviar Giro */}
            {visibleBottomItems.find((item) => item.href === '/enviar-giro') && (
              <Link
                to="/enviar-giro"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-16 transition-colors',
                  location.pathname === '/enviar-giro' ? 'text-white font-semibold' : 'text-blue-100 hover:text-white'
                )}
              >
                <Send className="w-6 h-6" />
                <span className="text-xs">Enviar</span>
              </Link>
            )}

            {/* Usuarios */}
            {visibleBottomItems.find((item) => item.href === '/usuarios') && (
              <Link
                to="/usuarios"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-16 transition-colors',
                  location.pathname === '/usuarios' ? 'text-white font-semibold' : 'text-blue-100 hover:text-white'
                )}
              >
                <Users className="w-6 h-6" />
                <span className="text-xs">Usuarios</span>
              </Link>
            )}

            {/* Hamburger Menu */}
            <button
              onClick={() => setSideMenuOpen(!sideMenuOpen)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-16 transition-colors',
                sideMenuOpen ? 'text-white font-semibold' : 'text-blue-100 hover:text-white'
              )}
            >
              <Menu className="w-6 h-6" />
              <span className="text-xs">Más</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
