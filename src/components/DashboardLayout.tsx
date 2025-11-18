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
  { icon: Settings, label: 'Config', href: '/configuracion', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA'] },
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
        <div className="flex flex-col flex-1 min-h-0 border-r" style={{ background: 'linear-gradient(to bottom, #136BBC, #274565)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 h-40 px-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <img src="/LogoLosChamos.avif" alt="Logo" className="h-30 w-30" />
            {/* <h1 className="text-xl font-bold text-white">Cambios los Chamos</h1> */}
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
                      ? 'text-white'
                      : 'text-blue-100 hover:text-white'
                  )}
                  style={isActive ? { backgroundColor: 'rgba(255, 255, 255, 0.15)' } : { backgroundColor: 'transparent' }}
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
            <Button className="w-full justify-start gap-2 text-white hover:text-white" style={{ backgroundColor: '#37B6FF', border: 'none' }} onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 px-4 md:hidden text-white" style={{ background: 'linear-gradient(to right, #136BBC, #274565)', borderBottomColor: 'rgba(255, 255, 255, 0.1)' }} >
          <img src="/LogoLosChamos.avif" alt="Logo" className="h-20 w-20" />
          <h1 className="text-lg font-semibold">Cambios los Chamos</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-6">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav id="mobileNav" className="fixed bottom-0 left-0 right-0 z-50 md:hidden overflow-x-auto text-white" style={{ background: 'linear-gradient(to right, #136BBC, #274565)', borderTopColor: 'rgba(255, 255, 255, 0.1)' }}>
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
                    isActive ? 'text-white font-semibold' : 'text-blue-100 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 text-blue-100 hover:text-white min-w-[80px] shrink-0 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Salir</span>
            </button>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12" style={{ background: 'linear-gradient(to left, #274565, transparent)' }} />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-12" style={{ background: 'linear-gradient(to right, #136BBC, transparent)' }} />
        </nav>
      </div>
    </div>
  )
}
