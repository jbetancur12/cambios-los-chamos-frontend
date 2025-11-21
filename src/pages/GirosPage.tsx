import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  X as XIcon,
  Banknote,
  Wallet,
  Signal,
  CreditCard,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CreateGiroSheet } from '@/components/CreateGiroSheet'
import { GiroDetailSheet } from '@/components/GiroDetailSheet'
import { MobilePaymentSheet } from '@/components/MobilePaymentSheet'
import { RechargeSheet } from '@/components/RechargeSheet'
import { useGirosList } from '@/hooks/queries/useGiroQueries'
import type { GiroStatus, Currency, ExecutionType } from '@/types/api'

type DateFilterType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM' | 'ALL'

export function GirosPage() {
  const { user } = useAuth()

  // Filter states
  const [filterStatus, setFilterStatus] = useState<GiroStatus | 'ALL'>('ASIGNADO')
  const [filterDate, setFilterDate] = useState<DateFilterType>('TODAY')
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  // UI states
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false)
  const [dateFiltersExpanded, setDateFiltersExpanded] = useState(false)
  const [giroTypeMenuOpen, setGiroTypeMenuOpen] = useState(false)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [mobilePaymentOpen, setMobilePaymentOpen] = useState(false)
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedGiroId, setSelectedGiroId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 15

  const canCreateGiro = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MINORISTA'

  // Calculate date range based on filter
  const getDateRange = (filterType: DateFilterType) => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const formatLocalDate = (date: Date): string => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    let fromDate: string, toDate: string

    switch (filterType) {
      case 'TODAY':
        fromDate = `${year}-${month}-${day}`
        toDate = `${year}-${month}-${day}`
        break
      case 'YESTERDAY':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        fromDate = formatLocalDate(yesterday)
        toDate = formatLocalDate(yesterday)
        break
      case 'THIS_WEEK':
        const dayOfWeek = today.getDay()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - dayOfWeek)
        fromDate = formatLocalDate(startOfWeek)
        toDate = `${year}-${month}-${day}`
        break
      case 'LAST_WEEK':
        const dayOfWeekLast = today.getDay()
        const endOfLastWeek = new Date(today)
        endOfLastWeek.setDate(today.getDate() - dayOfWeekLast - 1)
        const startOfLastWeek = new Date(endOfLastWeek)
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6)
        fromDate = formatLocalDate(startOfLastWeek)
        toDate = formatLocalDate(endOfLastWeek)
        break
      case 'THIS_MONTH':
        fromDate = `${year}-${month}-01`
        toDate = `${year}-${month}-${day}`
        break
      case 'LAST_MONTH':
        const lastMonth = new Date(year, parseInt(month) - 2, 1)
        const lastMonthYear = lastMonth.getFullYear()
        const lastMonthNum = String(lastMonth.getMonth() + 1).padStart(2, '0')
        const lastDayOfLastMonth = new Date(lastMonthYear, parseInt(lastMonthNum), 0).getDate()
        fromDate = `${lastMonthYear}-${lastMonthNum}-01`
        toDate = `${lastMonthYear}-${lastMonthNum}-${String(lastDayOfLastMonth).padStart(2, '0')}`
        break
      case 'CUSTOM':
        fromDate = customDateRange.from
        toDate = customDateRange.to
        break
      default:
        return undefined
    }

    return { from: fromDate, to: toDate }
  }

  // Build query params
  const dateRange = getDateRange(filterDate)
  const queryParams = {
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  }

  // React Query hook
  const { data: giros = [], isLoading, error } = useGirosList(queryParams)

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

  const getExecutionTypeBadge = (executionType?: ExecutionType) => {
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

  // Filter giros based on search query
  const filteredGiros = giros.filter((giro) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      giro.beneficiaryName.toLowerCase().includes(searchLower) ||
      giro.beneficiaryId.toLowerCase().includes(searchLower) ||
      giro.bankName.toLowerCase().includes(searchLower) ||
      giro.accountNumber.includes(searchLower) ||
      (giro.transferencista?.user.fullName.toLowerCase().includes(searchLower) ?? false)
    )
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
    bankCommission: filteredGiros.reduce((sum, g) => sum + (g.commision || 0), 0),
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Giros</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona tus giros y transferencias</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
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
      </div>

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

      {/* Collapsible Date Filters */}
      <div className="mb-6 border rounded-lg bg-card">
        <button
          onClick={() => setDateFiltersExpanded(!dateFiltersExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <p className="text-xs font-semibold text-muted-foreground">Fecha</p>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              dateFiltersExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {dateFiltersExpanded && (
          <div className="border-t p-3 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
              <Button
                variant={filterDate === 'TODAY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('TODAY')}
                className={filterDate === 'TODAY' ? 'text-white' : ''}
                style={filterDate === 'TODAY' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Hoy
              </Button>
              <Button
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
              </Button>
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
              <Button
                variant={filterDate === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDate('ALL')}
                className={filterDate === 'ALL' ? 'text-white' : ''}
                style={filterDate === 'ALL' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Todos
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Giros List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Cargando giros...</p>
        </div>
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
            <p className="text-sm text-muted-foreground mb-3">No hay giros registrados</p>
            {canCreateGiro && (
              <Button onClick={() => setGiroTypeMenuOpen(true)} size="sm" className="text-white" style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer giro
              </Button>
            )}
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
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {user?.role !== 'MINORISTA' && (
                      <th className="px-3 py-2 text-left font-semibold w-28">Minorista</th>
                    )}
                    <th className="px-3 py-2 text-right font-semibold w-24">COP</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Bs</th>
                    <th className="px-3 py-2 text-left font-semibold w-32">Banco</th>
                    <th className="px-3 py-2 text-center font-semibold w-20">Estado</th>
                    <th className="px-3 py-2 text-center font-semibold w-24">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGiros.map((giro) => {
                    const statusBadge = getStatusBadge(giro.status)
                    const executionTypeBadge = getExecutionTypeBadge(giro.executionType)
                    const copAmount = giro.currencyInput === 'COP' ? giro.amountInput : 0
                    const minoristaName = user?.role === 'TRANSFERENCISTA' ? (giro.createdBy?.fullName || '—') : (giro.minorista?.user?.fullName || giro.createdBy?.fullName || '—')

                    return (
                      <tr
                        key={giro.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => handleGiroClick(giro.id)}
                      >
                        {user?.role !== 'MINORISTA' && (
                          <td className="px-3 py-2 truncate text-sm w-28">
                            <div className="font-medium text-foreground truncate">{minoristaName}</div>
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
                        <td className="px-3 py-2 w-24">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${executionTypeBadge.className}`}
                            >
                              {executionTypeBadge.label}
                            </span>
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
              const minoristaName = user?.role === 'TRANSFERENCISTA' ? (giro.createdBy?.fullName || '—') : (giro.minorista?.user?.fullName || giro.createdBy?.fullName || '—')

              return (
                <div
                  key={giro.id}
                  className="bg-card border rounded p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleGiroClick(giro.id)}
                >
                  <div className={`grid ${user?.role === 'MINORISTA' ? 'grid-cols-2' : 'grid-cols-2'} gap-2 text-xs`}>
                    {user?.role !== 'MINORISTA' && (
                      <div>
                        <p className="text-muted-foreground font-semibold">Minorista</p>
                        <p className="font-medium truncate">{minoristaName}</p>
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
          <div className="mt-3 rounded border text-white text-xs" style={{ background: 'linear-gradient(to right, #136BBC, #274565)', borderColor: '#136BBC' }}>
            <div className="p-3 flex justify-between items-center gap-4">
              <div>
                <span className="font-semibold">{totals.count}</span>
                <span className="ml-1">giro{totals.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">COP: </span>
                <span className="font-mono">{formatCurrency(totals.cop, 'COP')}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">Bs: </span>
                <span className="font-mono">{totals.bs.toLocaleString('es-VE')}</span>
              </div>
            </div>

            {/* Additional info when viewing completed giros */}
            {filterStatus === 'COMPLETADO' && (
              <div className="border-t border-white border-opacity-30 px-3 py-2">
                {user?.role === 'MINORISTA' ? (
                  // MINORISTA: COP, BS, Ganancia Minorista
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="text-left">
                      <p className="text-xs opacity-80">Ganancia</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit, 'COP')}</p>
                    </div>
                  </div>
                ) : user?.role === 'SUPER_ADMIN' ? (
                  // SUPER_ADMIN: COP, BS, Ganancia Minoristas, Comisión Banco, Ganancias Sitio
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="text-left">
                      <p className="text-xs opacity-80">Ganancia Minoristas</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Comisión Banco</p>
                      <p className="font-semibold">{formatCurrency(totals.bankCommission, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Ganancia del Sitio</p>
                      <p className="font-semibold">{formatCurrency(totals.systemProfit, 'COP')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs opacity-80">Total Ganancias</p>
                      <p className="font-semibold">{formatCurrency(totals.minoristaProfit + totals.systemProfit, 'COP')}</p>
                    </div>
                  </div>
                ) : (
                  // TRASFERENCISTA / ADMIN: COP, BS, Ganancia Minoristas, Comisión Banco
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
                )}
              </div>
            )}
          </div>
        </>
      )}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
        {/* Menu Options */}
        {giroTypeMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-card border rounded-lg shadow-lg p-2 space-y-1 min-w-[200px] mb-2 z-50">
            <button
              onClick={() => {
                setCreateSheetOpen(true)
                setGiroTypeMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-left"
            >
              <Banknote className="h-5 w-5" style={{ color: '#136BBC' }} />
              <span className="font-medium">Transferencia</span>
            </button>
            <button
              onClick={() => {
                setMobilePaymentOpen(true)
                setGiroTypeMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-left"
            >
              <Wallet className="h-5 w-5 text-green-600" />
              <span className="font-medium">Pago Movil</span>
            </button>
            <button
              onClick={() => {
                setRechargeOpen(true)
                setGiroTypeMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors text-left"
            >
              <Signal className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Recarga</span>
            </button>
          </div>
        )}

        {/* FAB - Create Giro */}
        {canCreateGiro && (
          <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
            <button
              onClick={() => setGiroTypeMenuOpen(!giroTypeMenuOpen)}
              className={`text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 ${
                giroTypeMenuOpen ? 'rotate-45' : ''
              }`}
              style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>

      {/* Create Giro Sheet */}
      <CreateGiroSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} onSuccess={() => {}} />

      {/* Mobile Payment Sheet */}
      <MobilePaymentSheet open={mobilePaymentOpen} onOpenChange={setMobilePaymentOpen} />

      {/* Recharge Sheet */}
      <RechargeSheet open={rechargeOpen} onOpenChange={setRechargeOpen} />

      {/* Giro Detail Sheet */}
      <GiroDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        giroId={selectedGiroId}
        onUpdate={() => {}}
      />

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
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, from: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Hasta</label>
                <Input
                  type="date"
                  value={customDateRange.to}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, to: e.target.value })
                  }
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
                <Button
                  onClick={() => setCustomDateModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
