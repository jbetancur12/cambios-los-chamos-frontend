import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { MinoristaTransactionType } from '@/types/api'
import { ArrowLeft, CreditCard, DollarSign, User, Calendar, ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useMinoristaBalance, useMinoristaTransactions } from '@/hooks/queries/useMinoristaQueries'
import type { DateRange } from '@/components/DateRangeFilter'

import { useAuth } from '@/contexts/AuthContext'
import { MinoristaSimpleTransactionTable } from '@/components/MinoristaSimpleTransactionTable'
import { getTodayString, getStartOfDayISO, getEndOfDayISO } from '@/lib/dateUtils'

export function MinoristaTransactionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  // New Filter State
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [filterType, setFilterType] = useState<'SINGLE' | 'CUSTOM'>('SINGLE')
  // Use today in Venezuela timezone
  const todayStr = getTodayString()
  const [singleDate, setSingleDate] = useState(todayStr)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // Initialize with today's date for consistency with "Ver día" default
  const startOfDay = getStartOfDayISO(todayStr)
  const endOfDay = getEndOfDayISO(todayStr)

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay,
    to: endOfDay,
    startDate: todayStr,
    endDate: todayStr,
  })
  const [typeFilter, setTypeFilter] = useState<MinoristaTransactionType | 'ALL'>('ALL')

  // React Query hooks
  const minoristaQuery = useMinoristaBalance(user?.role)
  const transactionsQuery = useMinoristaTransactions({
    minoristaId: minoristaQuery.data?.id || '',
    page,
    limit: 50,
    startDate: dateRange.from,
    endDate: dateRange.to,
  })

  const minorista = minoristaQuery.data
  const transactionsResponse = transactionsQuery.data
  const transactions = transactionsResponse?.transactions || []
  const totalPages = transactionsResponse?.pagination.totalPages || 1
  const isLoading = transactionsQuery.isLoading

  // Handle Update Logic
  const handleSingleDateChange = (date: string) => {
    setSingleDate(date)
    setFilterType('SINGLE')

    setDateRange({
      from: getStartOfDayISO(date),
      to: getEndOfDayISO(date),
      startDate: date,
      endDate: date,
    })
    setPage(1)
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newRange = { ...dateRange, [field]: value }

    if (newRange.startDate && newRange.endDate) {
      newRange.from = getStartOfDayISO(newRange.startDate)
      newRange.to = getEndOfDayISO(newRange.endDate)
    }

    setDateRange(newRange)
    setPage(1)
  }

  // Handle errors
  if (minoristaQuery.error) {
    toast.error('Error al cargar información del minorista')
    navigate('/')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (!minorista) {
    return (
      <Card className="border-2 border-gray-300 shadow-md">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Cargando información del minorista...</p>
        </CardContent>
      </Card>
    )
  }

  // Lógica UI/UX
  const creditUsed = Math.max(0, minorista.creditLimit - minorista.availableCredit)
  const percentAvailable = minorista.creditLimit > 0 ? (minorista.availableCredit / minorista.creditLimit) * 100 : 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Transacciones Minorista</h1>
        </div>
      </div>

      {/* Crédito Info Card (Mejorado con UX) */}
      <div className="max-w-5xl mx-auto mt-6">
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl">
          <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-3 font-semibold text-blue-600 dark:text-blue-400">
              <CreditCard className="h-6 w-6" />
              Línea de Crédito
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Saldo
                </span>
                <span
                  className={`text-4xl font-extrabold ${creditUsed === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {formatCurrency(creditUsed)}
                </span>
              </div>

              {minorista.creditBalance > 0 && (
                <div className="flex flex-col space-y-1 bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Saldo a Favor
                  </span>
                  <span className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(minorista.creditBalance)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700 dark:text-gray-300">
                  Crédito Disponible: <span className="font-semibold">{formatCurrency(minorista.availableCredit)}</span>
                </span>
                <span className={`font-bold ${percentAvailable < 25 ? 'text-red-500' : 'text-green-500'}`}>
                  {percentAvailable.toFixed(1)}%
                </span>
              </div>

              <Progress value={percentAvailable} className="h-2" />

              <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                <span className="font-semibold flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Cupo Total Asignado:
                </span>
                <span className="font-semibold">{formatCurrency(minorista.creditLimit)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Titular
                </span>
                <span className="font-semibold text-base">{minorista.user.fullName}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <div className="max-w-5xl mx-auto mt-6">
        <Card className="mb-6">
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors py-4"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtrar por Fecha</CardTitle>
              {isFilterExpanded ? (
                <ChevronDown className="h-5 w-5 rotate-180 transition-transform" />
              ) : (
                <ChevronDown className="h-5 w-5 transition-transform" />
              )}
            </div>
          </CardHeader>

          {isFilterExpanded && (
            <CardContent className="space-y-4 pt-0">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                  <Button
                    variant={filterType === 'SINGLE' ? 'default' : 'outline'}
                    size="sm"
                    className={`relative overflow-hidden ${filterType === 'SINGLE' ? 'text-white' : ''}`}
                    style={filterType === 'SINGLE' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                    onClick={() => dateInputRef.current?.showPicker()}
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {singleDate === getTodayString() ? 'Ver día (Hoy)' : `Ver día: ${singleDate}`}
                  </Button>

                  <input
                    ref={dateInputRef}
                    type="date"
                    value={singleDate}
                    onChange={(e) => {
                      if (e.target.value) handleSingleDateChange(e.target.value)
                    }}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                  />

                  <Button
                    variant={filterType === 'CUSTOM' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('CUSTOM')}
                    className={filterType === 'CUSTOM' ? 'text-white' : ''}
                    style={filterType === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Personalizado
                  </Button>
                </div>

                {filterType === 'CUSTOM' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium mb-2">Desde</label>
                      <Input
                        type="date"
                        value={dateRange.startDate || ''}
                        onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Hasta</label>
                      <Input
                        type="date"
                        value={dateRange.endDate || ''}
                        onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Transactions Table */}
      <div className="max-w-5xl mx-auto mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Historial de Transacciones</CardTitle>
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={typeFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('ALL')}
              >
                Todas
              </Button>
              <Button
                variant={typeFilter === 'DISCOUNT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('DISCOUNT')}
              >
                Descuentos
              </Button>
              <Button
                variant={typeFilter === 'RECHARGE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('RECHARGE')}
              >
                Recargas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando transacciones...</div>
            ) : (
              <>
                <MinoristaSimpleTransactionTable
                  transactions={transactions}
                  typeFilter={typeFilter}
                  creditLimit={minorista.creditLimit}
                />
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
