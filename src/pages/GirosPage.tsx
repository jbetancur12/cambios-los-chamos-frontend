import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  CreditCard,
  Calendar,
  ChevronDown,
  Banknote,
  Wallet,
  Signal,
  Printer,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { GiroDetailSheet } from '@/components/GiroDetailSheet'
import { PrintTicketModal } from '@/components/PrintTicketModal'
import { useGirosList } from '@/hooks/queries/useGiroQueries'
import { useMinoristaBalance } from '@/hooks/queries/useMinoristaQueries'
import { useAllUsers } from '@/hooks/queries/useUserQueries'
import type { GiroStatus, Currency, ExecutionType } from '@/types/api'
import { getTodayString, getStartOfDayISO, getEndOfDayISO } from '@/lib/dateUtils'

type DateFilterType =
  | 'SINGLE_DATE'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'CUSTOM'
  | 'ALL'

export const getExecutionTypeBadge = (executionType?: ExecutionType) => {
  const typeMap: Record<ExecutionType, { label: string; className: string; icon: any }> = {
    TRANSFERENCIA: {
      label: 'Transferencia',
      className: 'bg-blue-50 text-blue-700 border border-blue-200',
      icon: Banknote,
    },
    PAGO_MOVIL: {
      label: 'Pago Móvil',
      className: 'bg-green-50 text-green-700 border border-green-200',
      icon: Wallet,
    },
    RECARGA: {
      label: 'Recarga Celular',
      className: 'bg-orange-50 text-orange-700 border border-orange-200',
      icon: Signal,
    },
    EFECTIVO: {
      label: 'Efectivo',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: CreditCard,
    },
    ZELLE: { label: 'Zelle', className: 'bg-purple-50 text-purple-700 border border-purple-200', icon: CreditCard },
    OTROS: { label: 'Otros', className: 'bg-gray-50 text-gray-700 border border-gray-200', icon: ArrowRight },
  }
  return executionType && typeMap[executionType]
    ? typeMap[executionType]
    : { label: 'Desconocido', className: 'bg-gray-50 text-gray-700 border border-gray-200', icon: ArrowRight }
}

export function GirosPage() {
  const { user } = useAuth()

  // Filter states
  const [filterStatus, setFilterStatus] = useState<GiroStatus | 'ALL'>('ASIGNADO')
  const [filterDate, setFilterDate] = useState<DateFilterType>('SINGLE_DATE')
  const [singleDate, setSingleDate] = useState(getTodayString())
  const [filterUserType, setFilterUserType] = useState<'MINORISTA' | 'TRANSFERENCISTA' | 'ALL'>('MINORISTA')
  const [selectedTransferencistaId, setSelectedTransferencistaId] = useState<string | 'ALL'>('ALL')
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({
    from: getTodayString(),
    to: getTodayString(),
  })

  // UI states
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false)
  const [dateFiltersExpanded, setDateFiltersExpanded] = useState(false)
  const [userFiltersExpanded, setUserFiltersExpanded] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedGiroId, setSelectedGiroId] = useState<string | null>(null)
  const [searchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedGiroForPrint, setSelectedGiroForPrint] = useState<string | null>(null)
  const itemsPerPage = 15

  // Calculate date range based on filter
  const getDateRange = (filterType: DateFilterType) => {
    // Get "today" in Venezuela timezone
    const todayStr = getTodayString()

    // Default to today
    let dateFromISO = getStartOfDayISO(todayStr)
    let dateToISO = getEndOfDayISO(todayStr)

    switch (filterType) {
      case 'SINGLE_DATE':
        dateFromISO = getStartOfDayISO(singleDate)
        dateToISO = getEndOfDayISO(singleDate)
        break

      case 'YESTERDAY':
        const today = new Date(todayStr)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        dateFromISO = getStartOfDayISO(yesterdayStr)
        dateToISO = getEndOfDayISO(yesterdayStr)
        break

      case 'THIS_WEEK':
        // Logic: Start from Monday of this week
        const t = new Date(todayStr)
        const day = t.getDay() || 7 // 1 (Mon) to 7 (Sun)
        if (day !== 1) t.setHours(-24 * (day - 1))
        const startOfWeekStr = t.toISOString().split('T')[0]
        dateFromISO = getStartOfDayISO(startOfWeekStr)
        // dateTo uses default today end
        break

      case 'LAST_WEEK':
        // Logic: Monday to Sunday of last week
        const t2 = new Date(todayStr)
        const day2 = t2.getDay() || 7
        const endOfLastWeek = new Date(t2)
        endOfLastWeek.setDate(t2.getDate() - day2) // Last Sunday
        const startOfLastWeek = new Date(endOfLastWeek)
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6) // Last Monday

        dateFromISO = getStartOfDayISO(startOfLastWeek.toISOString().split('T')[0])
        dateToISO = getEndOfDayISO(endOfLastWeek.toISOString().split('T')[0])
        break

      case 'THIS_MONTH':
        const t3 = new Date(todayStr)
        t3.setDate(1) // First day of month
        dateFromISO = getStartOfDayISO(t3.toISOString().split('T')[0])
        // dateTo is today (end of day)
        break

      case 'LAST_MONTH':
        const t4 = new Date(todayStr) // Current day
        // Go to first day of current month, then subtract 1 day to get last day of prev month
        const firstOfCurrent = new Date(t4.getFullYear(), t4.getMonth(), 1)
        const lastOfPrev = new Date(firstOfCurrent.getTime() - 24 * 60 * 60 * 1000)
        const firstOfPrev = new Date(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1)

        dateFromISO = getStartOfDayISO(firstOfPrev.toISOString().split('T')[0])
        dateToISO = getEndOfDayISO(lastOfPrev.toISOString().split('T')[0])
        break

      case 'CUSTOM':
        dateFromISO = getStartOfDayISO(customDateRange.from)
        dateToISO = getEndOfDayISO(customDateRange.to)
        break

      case 'ALL':
        // Optional: Return undefined or wide range. Current logic returned undefined default, so...
        // But wait, existing code returns object with ISOs.
        // If default returns undefined in original code, we should keep that behavior if 'ALL' mimics 'default' case?
        // Existing code: switch default returns undefined.
        // But 'ALL' case is not in the switch in original code?
        // Ah, getDateRange is called with filterDate which is DateFilterType.
        // And DateFilterType includes 'ALL'.
        // The query param ignores date if 'ALL' might be passed?
        // In original code:
        // case 'ALL' was NOT handled in switch, so it fell to default -> returned undefined.

        if (filterType === 'ALL') return undefined
        return undefined // Should likely be covered by default
    }

    return { from: dateFromISO, to: dateToISO }
  }

  // Build query params
  // Build query params
  // Fetch Minorista Balance if user is minorista
  const { data: minoristaBalanceData } = useMinoristaBalance(user?.role)

  const dateRange = getDateRange(filterDate)

  // For ASIGNADO and PROCESANDO, we want to see ALL active giros regardless of date
  // For other statuses (COMPLETADO, CANCELADO, etc), we respect the date filter
  const ignoreDateFilter = filterStatus === 'ASIGNADO' || filterStatus === 'PROCESANDO'

  const queryParams = {
    // Cuando es ASIGNADO, no enviamos filtro para obtener todos y filtrar en frontend (incluir DEVUELTO)
    status: filterStatus !== 'ALL' && filterStatus !== 'ASIGNADO' ? filterStatus : undefined,
    dateFrom: ignoreDateFilter ? undefined : dateRange?.from,
    dateTo: ignoreDateFilter ? undefined : dateRange?.to,
  }

  // React Query hooks
  const { data: giros = [], isLoading, error } = useGirosList(queryParams)
  const { data: transferencistas = [] } = useAllUsers(
    user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'TRANSFERENCISTA' : null
  )

  const getStatusBadge = (status: GiroStatus) => {
    const statusMap = {
      PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ASIGNADO: { label: 'Asignado', className: 'bg-blue-100 text-blue-800', icon: ArrowRight },
      PROCESANDO: { label: 'Procesando', className: 'bg-purple-100 text-purple-800', icon: Clock },
      COMPLETADO: { label: 'Completado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: XCircle },
      DEVUELTO: { label: 'Devuelto', className: 'bg-orange-100 text-orange-800', icon: ArrowRight },
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Clock }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount)
    } else if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    } else {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
      }).format(amount)
    }
  }

  const handleGiroClick = (giroId: string) => {
    setSelectedGiroId(giroId)
    setDetailSheetOpen(true)
  }

  // Filter giros based on search query and user type
  const filteredGiros = giros.filter((giro) => {
    const searchLower = searchQuery.toLowerCase()

    // Search filter
    const matchesSearch =
      giro.beneficiaryName.toLowerCase().includes(searchLower) ||
      giro.beneficiaryId.toLowerCase().includes(searchLower) ||
      giro.bankName.toLowerCase().includes(searchLower) ||
      giro.accountNumber.includes(searchLower) ||
      (giro.transferencista?.user.fullName.toLowerCase().includes(searchLower) ?? false) ||
      (giro.minorista?.user.fullName.toLowerCase().includes(searchLower) ?? false)

    // User type filter
    let matchesUserType = true
    if (filterUserType === 'MINORISTA') {
      // Mostrar giros con minorista asignado O giros creados por admin/super_admin
      matchesUserType = !!giro.minorista || giro.createdBy?.role === 'ADMIN' || giro.createdBy?.role === 'SUPER_ADMIN'
    } else if (filterUserType === 'TRANSFERENCISTA') {
      matchesUserType = !!giro.transferencista
    }

    // Transferencista specific filter
    let matchesTransferencista = true
    if (filterUserType === 'TRANSFERENCISTA' && selectedTransferencistaId !== 'ALL') {
      matchesTransferencista = giro.transferencista?.id === selectedTransferencistaId
    }

    // Status filter - cuando es ASIGNADO, incluir también DEVUELTO
    let matchesStatus = true
    if (filterStatus === 'ASIGNADO') {
      matchesStatus = giro.status === 'ASIGNADO' || giro.status === 'DEVUELTO'
    } else if (filterStatus !== 'ALL') {
      matchesStatus = giro.status === filterStatus
    }

    return matchesSearch && matchesUserType && matchesTransferencista && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredGiros.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedGiros = filteredGiros.slice(startIndex, endIndex)

  // Calculate totals
  const totals = {
    count: filteredGiros.length,
    cop: filteredGiros.reduce((sum, g) => sum + (g.currencyInput === 'COP' ? g.amountInput : 0), 0),
    bs: filteredGiros.reduce((sum, g) => sum + g.amountBs, 0),
    minoristaProfit: filteredGiros.reduce((sum, g) => sum + (g.minoristaProfit || 0), 0),
    systemProfit: filteredGiros.reduce((sum, g) => sum + (g.systemProfit || 0), 0),
    bankCommission: filteredGiros.reduce((sum, g) => sum + (g.commission || 0), 0),
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      {/* <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Giros</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona tus giros y transferencias</p>
      </div> */}

      {/* Search Bar */}
      {/* <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, beneficiario, banco, transferencista..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div> */}

      {/* Status Filters */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Estado</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === 'ASIGNADO' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ASIGNADO')}
            className={filterStatus === 'ASIGNADO' ? 'text-white' : ''}
            style={filterStatus === 'ASIGNADO' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Asignados
          </Button>
          <Button
            variant={filterStatus === 'PROCESANDO' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('PROCESANDO')}
            className={filterStatus === 'PROCESANDO' ? 'text-white' : ''}
            style={filterStatus === 'PROCESANDO' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            En Proceso
          </Button>
          <Button
            variant={filterStatus === 'COMPLETADO' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('COMPLETADO')}
            className={filterStatus === 'COMPLETADO' ? 'text-white' : ''}
            style={filterStatus === 'COMPLETADO' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Completados
          </Button>
          <Button
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
            className={filterStatus === 'ALL' ? 'text-white' : ''}
            style={filterStatus === 'ALL' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Todos
          </Button>
        </div>
      </div>

      {/* User Type Filters - Only for Admin/SuperAdmin */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
        <div className="mb-4 border rounded-lg bg-card">
          <button
            onClick={() => setUserFiltersExpanded(!userFiltersExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <p className="text-xs font-semibold text-muted-foreground">Tipo de Usuario</p>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                userFiltersExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {userFiltersExpanded && (
            <div className="border-t p-3 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={filterUserType === 'MINORISTA' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterUserType('MINORISTA')
                    setSelectedTransferencistaId('ALL')
                  }}
                  className={filterUserType === 'MINORISTA' ? 'text-white' : ''}
                  style={
                    filterUserType === 'MINORISTA' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}
                  }
                >
                  Minoristas
                </Button>
                <Button
                  variant={filterUserType === 'TRANSFERENCISTA' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterUserType('TRANSFERENCISTA')}
                  className={filterUserType === 'TRANSFERENCISTA' ? 'text-white' : ''}
                  style={
                    filterUserType === 'TRANSFERENCISTA'
                      ? { background: 'linear-gradient(to right, #136BBC, #274565)' }
                      : {}
                  }
                >
                  Trasferencistas
                </Button>
              </div>

              {/* Subfiltro de Trasferencistas */}
              {filterUserType === 'TRANSFERENCISTA' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Filtrar por Trasferencista</p>
                  <div className="flex flex-wrap gap-2">
                    {transferencistas.map((t) => (
                      <Button
                        key={t.transferencistaId}
                        variant="outline"
                        size="sm"
                        onClick={() => t.transferencistaId && setSelectedTransferencistaId(t.transferencistaId)}
                        className={
                          selectedTransferencistaId === t.transferencistaId
                            ? 'bg-[linear-gradient(to_right,#136BBC,#274565)] text-white hover:bg-[linear-gradient(to_right,#136BBC,#274565)]'
                            : ''
                        }
                      >
                        {t.fullName}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Date Filters */}
      <div className="mb-6 border rounded-lg bg-card">
        <button
          onClick={() => setDateFiltersExpanded(!dateFiltersExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <p className="text-xs font-semibold text-muted-foreground">Fecha</p>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${dateFiltersExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {dateFiltersExpanded && (
          <div className="border-t p-3 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
              <Button
                variant={filterDate === 'SINGLE_DATE' ? 'default' : 'outline'}
                size="sm"
                className={`relative overflow-hidden ${filterDate === 'SINGLE_DATE' ? 'text-white' : ''}`}
                style={
                  filterDate === 'SINGLE_DATE' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}
                }
                onClick={() => dateInputRef.current?.showPicker()}
              >
                <Calendar className="mr-2 h-3 w-3" />
                {singleDate === new Date().toISOString().split('T')[0] ? 'Ver día (Hoy)' : `Ver día: ${singleDate}`}
              </Button>
              <input
                ref={dateInputRef}
                type="date"
                value={singleDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSingleDate(e.target.value)
                    setFilterDate('SINGLE_DATE')
                  }
                }}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
                tabIndex={-1}
                title="Seleccionar día"
              />
              {/* <Button
                variant={filterDate === 'YESTERDAY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('YESTERDAY')}
                className={filterDate === 'YESTERDAY' ? 'text-white' : ''}
                style={filterDate === 'YESTERDAY' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Ayer
              </Button>
              <Button
                variant={filterDate === 'THIS_WEEK' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('THIS_WEEK')}
                className={filterDate === 'THIS_WEEK' ? 'text-white' : ''}
                style={filterDate === 'THIS_WEEK' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Esta Semana
              </Button>
              <Button
                variant={filterDate === 'LAST_WEEK' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('LAST_WEEK')}
                className={filterDate === 'LAST_WEEK' ? 'text-white' : ''}
                style={filterDate === 'LAST_WEEK' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Semana Pasada
              </Button>
              <Button
                variant={filterDate === 'THIS_MONTH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('THIS_MONTH')}
                className={filterDate === 'THIS_MONTH' ? 'text-white' : ''}
                style={filterDate === 'THIS_MONTH' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Este Mes
              </Button>
              <Button
                variant={filterDate === 'LAST_MONTH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('LAST_MONTH')}
                className={filterDate === 'LAST_MONTH' ? 'text-white' : ''}
                style={filterDate === 'LAST_MONTH' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Mes Pasado
              </Button> */}
              <Button
                variant={filterDate === 'CUSTOM' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCustomDateModalOpen(true)}
                className={filterDate === 'CUSTOM' ? 'text-white' : ''}
                style={filterDate === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Personalizado
              </Button>
              {/* <Button
                variant={filterDate === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('ALL')}
                className={filterDate === 'ALL' ? 'text-white' : ''}
                style={filterDate === 'ALL' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Todos
              </Button> */}
            </div>
          </div>
        )}
      </div>

      {/* Giros List */}
      {isLoading ? (
        <>
          {/* Desktop Skeleton: Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {user?.role !== 'MINORISTA' && (
                      <th className="px-3 py-2 text-left font-semibold w-28">
                        {filterUserType === 'TRANSFERENCISTA' ? 'Trasferencista' : 'Minorista'}
                      </th>
                    )}
                    <th className="px-3 py-2 text-right font-semibold w-24">COP</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Bs</th>
                    <th className="px-3 py-2 text-left font-semibold w-32">Banco</th>
                    <th className="px-3 py-2 text-center font-semibold w-20">Estado</th>
                    <th className="px-3 py-2 text-center font-semibold w-24">Tipo</th>
                    <th className="px-3 py-2 text-center font-semibold w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {user?.role !== 'MINORISTA' && (
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </td>
                      {/* <td className="px-3 py-2">
                        <div className="flex justify-center">
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                      </td> */}
                      <td className="px-3 py-2">
                        <div className="flex justify-center">
                          <Skeleton className="h-4 w-4 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Skeleton: Cards */}
          <div className="md:hidden space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border rounded p-3">
                <div className={`grid ${user?.role === 'MINORISTA' ? 'grid-cols-2' : 'grid-cols-2'} gap-2 text-xs`}>
                  {user?.role !== 'MINORISTA' && (
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  )}
                  <div className={user?.role === 'MINORISTA' ? 'col-span-1' : ''}>
                    <Skeleton className="h-3 w-8 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-6 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Error al cargar giros'}
            </p>
          </CardContent>
        </Card>
      ) : giros.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ArrowRight className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay giros registrados</p>
          </CardContent>
        </Card>
      ) : filteredGiros.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No se encontraron giros</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Compact Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {user?.role !== 'MINORISTA' && (
                      <th className="px-3 py-2 text-left font-semibold w-28">
                        {filterUserType === 'TRANSFERENCISTA' ? 'Trasferencista' : 'Minorista'}
                      </th>
                    )}
                    <th className="px-3 py-2 text-right font-semibold w-24">COP</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Bs</th>
                    <th className="px-3 py-2 text-left font-semibold w-32">Banco</th>
                    <th className="px-3 py-2 text-center font-semibold w-20">Estado</th>
                    {/* <th className="px-3 py-2 text-center font-semibold w-24">Tipo</th> */}
                    <th className="px-3 py-2 text-center font-semibold w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGiros.map((giro) => {
                    const statusBadge = getStatusBadge(giro.status)
                    {
                      /* const executionTypeBadge = getExecutionTypeBadge(giro.executionType) */
                    }
                    const copAmount = giro.currencyInput === 'COP' ? giro.amountInput : 0
                    const userName =
                      filterUserType === 'TRANSFERENCISTA'
                        ? giro.transferencista?.user?.fullName || '—'
                        : user?.role === 'TRANSFERENCISTA'
                          ? giro.createdBy?.fullName || '—'
                          : giro.minorista?.user?.fullName || giro.createdBy?.fullName || '—'
                    return (
                      <tr
                        key={giro.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => handleGiroClick(giro.id)}
                      >
                        {user?.role !== 'MINORISTA' && (
                          <td className="px-3 py-2 truncate text-sm w-28">
                            <div className="font-medium text-foreground truncate">{userName}</div>
                          </td>
                        )}
                        <td className="px-3 py-2 text-right whitespace-nowrap font-semibold w-24">
                          {copAmount > 0 ? formatCurrency(copAmount, 'COP') : '—'}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap font-semibold w-20">
                          {giro.amountBs > 0 ? giro.amountBs.toLocaleString('es-VE') : '—'}
                        </td>
                        <td className="px-3 py-2 truncate w-32">
                          <div className="text-xs truncate" title={giro.bankName}>
                            {giro.bankName}
                          </div>
                        </td>
                        <td className="px-3 py-2 w-20">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                        </td>
                        {/* <td className="px-3 py-2 w-24">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${executionTypeBadge.className}`}
                            >
                              {executionTypeBadge.label}
                            </span>
                          </div>
                        </td> */}
                        <td className="px-3 py-2 w-16">
                          <div className="flex justify-center">
                            {giro.status === 'COMPLETADO' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedGiroForPrint(giro.id)
                                  setShowPrintModal(true)
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                                title="Imprimir"
                              >
                                <Printer className="h-4 w-4 text-blue-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Compact Cards */}
          <div className="md:hidden space-y-2">
            {paginatedGiros.map((giro) => {
              const statusBadge = getStatusBadge(giro.status)
              const executionTypeBadge = getExecutionTypeBadge(giro.executionType)
              const copAmount = giro.currencyInput === 'COP' ? giro.amountInput : 0
              const userName =
                filterUserType === 'TRANSFERENCISTA'
                  ? giro.transferencista?.user?.fullName || '—'
                  : user?.role === 'TRANSFERENCISTA'
                    ? giro.createdBy?.fullName || '—'
                    : giro.minorista?.user?.fullName || giro.createdBy?.fullName || '—'
              return (
                <div
                  key={giro.id}
                  className="bg-card border rounded p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleGiroClick(giro.id)}
                >
                  <div className={`grid ${user?.role === 'MINORISTA' ? 'grid-cols-2' : 'grid-cols-2'} gap-2 text-xs`}>
                    {user?.role !== 'MINORISTA' && (
                      <div>
                        <p className="text-muted-foreground font-semibold">
                          {filterUserType === 'TRANSFERENCISTA' ? 'Trasferencista' : 'Minorista'}
                        </p>
                        <p className="font-medium truncate">{userName}</p>
                      </div>
                    )}
                    <div className={user?.role === 'MINORISTA' ? 'col-span-1' : ''}>
                      <p className="text-muted-foreground font-semibold">COP</p>
                      <p className="font-semibold">{copAmount > 0 ? formatCurrency(copAmount, 'COP') : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Bs</p>
                      <p className="font-semibold">{giro.amountBs > 0 ? giro.amountBs.toLocaleString('es-VE') : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Banco</p>
                      <p className="truncate text-xs">{giro.bankName}</p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${executionTypeBadge.className}`}
                      >
                        {executionTypeBadge.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ultra-thin Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 py-0.5 text-xs border rounded hover:bg-muted disabled:opacity-50"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-2 py-0.5 text-xs border rounded ${
                    page === pageNum ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-2 py-0.5 text-xs border rounded hover:bg-muted disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}

          {/* Compact Summary Footer */}
          <div
            className="mt-3 rounded border text-white text-xs md:text-base"
            style={{ background: 'linear-gradient(to right, #136BBC, #274565)', borderColor: '#136BBC' }}
          >
            <div className="p-3 flex justify-between items-center gap-4">
              <div>
                <span className="font-semibold md:text-lg">{totals.count}</span>
                <span className="ml-1">giro{totals.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">COP: </span>
                <span className="font-mono md:text-lg">{formatCurrency(totals.cop, 'COP')}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">Bs: </span>
                <span className="font-mono md:text-lg">{totals.bs.toLocaleString('es-VE')}</span>
              </div>
            </div>

            {/* Additional info when viewing completed giros - only for Admin/SuperAdmin */}
            {/* Additional info */}
            {((filterStatus === 'COMPLETADO' && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN')) ||
              user?.role === 'MINORISTA') && (
              <div className="border-t border-white border-opacity-30 px-3 py-2">
                {user?.role === 'SUPER_ADMIN' ? (
                  // SUPER_ADMIN: COP, BS, Ganancia Minoristas, Comisión Banco, Ganancias Sitio
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="text-left">
                      <p className="text-xs opacity-80">Ganancia Minoristas</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Comisión Banco</p>
                      <p className="font-semibold">{formatCurrency(totals.bankCommission, 'VES')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Ganancia del Sitio</p>
                      <p className="font-semibold">{formatCurrency(totals.systemProfit, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Total Ganancias</p>
                      <p className="font-semibold">
                        {formatCurrency(totals.minoristaProfit + totals.systemProfit, 'COP')}
                      </p>
                    </div>
                  </div>
                ) : user?.role === 'ADMIN' ? (
                  // ADMIN: COP, BS, Ganancia Minoristas, Comisión Banco
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="text-left">
                      <p className="text-xs opacity-80">Ganancia Minoristas</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Comisión Banco</p>
                      <p className="font-semibold">{formatCurrency(totals.bankCommission, 'COP')}</p>
                    </div>
                  </div>
                ) : user?.role === 'MINORISTA' && minoristaBalanceData ? (
                  // MINORISTA: Deuda Actual, Crédito Asignado
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-left">
                      <p className="text-xs opacity-80">Total Ganancia</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Deuda Actual</p>
                      <p className="font-semibold text-red-100">
                        {formatCurrency(
                          Math.max(0, minoristaBalanceData.creditLimit - minoristaBalanceData.availableCredit),
                          'COP'
                        )}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Crédito Asignado</p>
                      <p className="font-semibold">{formatCurrency(minoristaBalanceData.creditLimit, 'COP')}</p>
                    </div>
                  </div>
                ) : (
                  // Default fallback for Minorista if data not loaded or just showing profit if preferred
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="text-left">
                      <p className="text-xs opacity-80">Total Ganancia</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit, 'COP')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Custom Date Range Modal */}
      {customDateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCustomDateModalOpen(false)
            }
          }}
        >
          <Card className="w-full max-w-sm">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Rango de Fechas Personalizado</h2>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Desde</label>
                <Input
                  type="date"
                  value={customDateRange.from}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Hasta</label>
                <Input
                  type="date"
                  value={customDateRange.to}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setFilterDate('CUSTOM')
                    setCustomDateModalOpen(false)
                  }}
                  className="flex-1"
                  size="sm"
                >
                  Aplicar
                </Button>
                <Button onClick={() => setCustomDateModalOpen(false)} variant="outline" className="flex-1" size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Giro Detail Sheet */}
      {selectedGiroId && (
        <GiroDetailSheet
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          giroId={selectedGiroId}
          onUpdate={() => {}}
        />
      )}

      {/* Print Modal */}
      {selectedGiroForPrint && (
        <PrintTicketModal
          giroId={selectedGiroForPrint}
          open={showPrintModal}
          onOpenChange={(open) => {
            setShowPrintModal(open)
          }}
        />
      )}
    </div>
  )
}
