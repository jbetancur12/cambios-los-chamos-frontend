import { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Minorista, MinoristaTransaction, MinoristaTransactionType } from '@/types/api'
import { AlertCircle, Eye, DollarSign, Calendar, ChevronDown } from 'lucide-react'
import { MinoristaSimpleTransactionTable } from './MinoristaSimpleTransactionTable'
import { type DateRange } from './DateRangeFilter'
import { NumericFormat } from 'react-number-format'

interface RechargeMinoristaBalanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minorista: Minorista | null
  onBalanceUpdated: () => void
}

export function RechargeMinoristaBalanceSheet({
  open,
  onOpenChange,
  minorista,
  onBalanceUpdated,
}: RechargeMinoristaBalanceSheetProps) {
  const [loading, setLoading] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [creditLimitAmount, setCreditLimitAmount] = useState('')
  const [activeTab, setActiveTab] = useState('view')
  const [transactions, setTransactions] = useState<MinoristaTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [localMinorista, setLocalMinorista] = useState<Minorista | null>(minorista)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Standardized Date Filter State
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [filterType, setFilterType] = useState<'SINGLE' | 'CUSTOM'>('SINGLE')
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0])
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay,
    to: endOfDay,
    startDate: today.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  })
  const [typeFilter, setTypeFilter] = useState<MinoristaTransactionType | 'ALL'>('ALL')

  const handleSingleDateChange = (date: string) => {
    setSingleDate(date)
    setFilterType('SINGLE')

    const [year, month, day] = date.split('-').map(Number)
    const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    const toDate = new Date(year, month - 1, day, 23, 59, 59, 999)

    setDateRange({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      startDate: date,
      endDate: date,
    })
    setPage(1)
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newRange = { ...dateRange, [field]: value }

    if (newRange.startDate && newRange.endDate) {
      const [fromYear, fromMonth, fromDay] = newRange.startDate.split('-').map(Number)
      const [toYear, toMonth, toDay] = newRange.endDate.split('-').map(Number)

      const fromDate = new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0)
      const toDate = new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999)

      newRange.from = fromDate.toISOString()
      newRange.to = toDate.toISOString()
    }

    setDateRange(newRange)
    setPage(1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const fetchTransactions = async () => {
    if (!localMinorista) return
    try {
      setTransactionsLoading(true)
      let url = `/minorista/${localMinorista.id}/transactions?page=${page}&limit=10`

      if (dateRange.from && dateRange.to) {
        url += `&startDate=${encodeURIComponent(dateRange.from)}&endDate=${encodeURIComponent(dateRange.to)}`
      }

      const response = await api.get<{
        transactions: MinoristaTransaction[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(url)
      setTransactions(response.transactions || [])
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    setLocalMinorista(minorista)
  }, [minorista])

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (open && minorista) {
      const loadUpdatedMinorista = async () => {
        try {
          const response = await api.get<{ minorista: Minorista }>(`/minorista/${minorista.id}`)
          setLocalMinorista(response.minorista)
        } catch (error) {
          console.error('Error loading updated minorista:', error)
        }
      }
      loadUpdatedMinorista()
    }
  }, [open, minorista?.id])

  // Cargar transacciones cuando cambia la paginación o filtros
  useEffect(() => {
    if (open && activeTab === 'view' && localMinorista) {
      fetchTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, page, dateRange, localMinorista])

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(payAmount)
    if (isNaN(numericAmount) || numericAmount === 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    if (!localMinorista) return

    try {
      setLoading(true)
      await api.post(`/minorista/${localMinorista.id}/pay-debt`, {
        amount: numericAmount,
      })
      setPayAmount('')
      onBalanceUpdated()
      toast.success('Deuda pagada exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al pagar deuda'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(creditLimitAmount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    if (!localMinorista) return

    try {
      setLoading(true)
      const response = await api.post<{ minorista: Minorista }>(`/minorista/${localMinorista.id}/credit-limit`, {
        creditLimit: numericAmount,
      })
      setLocalMinorista(response.minorista)
      setCreditLimitAmount('')
      onBalanceUpdated() // Invalidar query para actualizar la lista
      toast.success('Cupo de crédito asignado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al asignar cupo'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!localMinorista) return null

  const hasDebt = localMinorista.availableCredit < 0
  // Deuda real = Cupo - (Crédito Disponible + Saldo a Favor)
  // El saldo a favor también es dinero disponible del minorista
  const totalAvailable = localMinorista.availableCredit + (localMinorista.creditBalance || 0)
  const debtAmount = Math.max(0, localMinorista.creditLimit - totalAvailable)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>{localMinorista.user.fullName}</SheetTitle>
        </SheetHeader>

        <div className="w-full mt-6 space-y-4 px-4 sm:px-6 md:px-6 pb-5">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Ver
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Asignar Cupo
            </button>
            <button
              onClick={() => setActiveTab('pay')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pay'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Pagar Deuda
            </button>
          </div>

          {/* Vista General */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              {/* Minorista Info */}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Minorista</p>
                <p className="font-semibold">{localMinorista.user.fullName}</p>
                <p className="text-sm text-muted-foreground">{localMinorista.user.email}</p>
              </div>

              {/* Resumen de Crédito */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-muted-foreground mb-1">Cupo Asignado</p>
                  <p className="text-lg font-semibold">{formatCurrency(localMinorista.creditLimit)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-muted-foreground mb-1">Crédito Disponible</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(localMinorista.availableCredit)}
                  </p>
                </div>
                {localMinorista.creditBalance > 0 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-muted-foreground mb-1">Saldo a Favor</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(localMinorista.creditBalance)}
                    </p>
                  </div>
                )}
                {debtAmount > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-muted-foreground mb-1">Deuda Actual</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(debtAmount)}</p>
                  </div>
                )}
              </div>

              {hasDebt && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Este minorista tiene deuda. Usa la pestaña "Pagar Deuda" para abonar fondos y reducir la deuda.
                  </p>
                </div>
              )}

              {/* Historial de Transacciones */}
              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Historial Detallado de Transacciones</h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
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
                    Giros
                  </Button>
                  <Button
                    variant={typeFilter === 'RECHARGE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter('RECHARGE')}
                  >
                    Abonos
                  </Button>
                </div>

                {/* Date Filter */}
                <Card className="mb-4">
                  <CardHeader
                    className="cursor-pointer hover:bg-accent/50 transition-colors py-3 px-4"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Filtrar por Fecha</CardTitle>
                      {isFilterExpanded ? (
                        <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      )}
                    </div>
                  </CardHeader>

                  {isFilterExpanded && (
                    <CardContent className="space-y-4 pt-0 px-4 pb-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                          <Button
                            variant={filterType === 'SINGLE' ? 'default' : 'outline'}
                            size="sm"
                            className={`relative overflow-hidden ${filterType === 'SINGLE' ? 'text-white' : ''}`}
                            style={
                              filterType === 'SINGLE'
                                ? { background: 'linear-gradient(to right, #136BBC, #274565)' }
                                : {}
                            }
                            onClick={() => dateInputRef.current?.showPicker()}
                          >
                            <Calendar className="mr-2 h-3 w-3" />
                            {singleDate === new Date().toISOString().split('T')[0]
                              ? 'Ver día (Hoy)'
                              : `Ver día: ${singleDate}`}
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
                            style={
                              filterType === 'CUSTOM'
                                ? { background: 'linear-gradient(to right, #136BBC, #274565)' }
                                : {}
                            }
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Personalizado
                          </Button>
                        </div>

                        {filterType === 'CUSTOM' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <Label className="mb-2 block">Desde</Label>
                              <Input
                                type="date"
                                value={dateRange.startDate || ''}
                                onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label className="mb-2 block">Hasta</Label>
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

                {/* Transactions */}
                {transactionsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Cargando historial...</p>
                  </div>
                ) : (
                  <>
                    <MinoristaSimpleTransactionTable
                      transactions={transactions}
                      typeFilter={typeFilter}
                      creditLimit={localMinorista?.creditLimit || 0}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4 border-t">
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
              </div>
            </div>
          )}

          {/* Asignar Cupo */}
          {activeTab === 'assign' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Asignar o Modificar Cupo de Crédito
                </p>
                <p className="text-xs text-muted-foreground">
                  El cupo se puede modificar en cualquier momento después de su asignación inicial.
                </p>
              </div>

              <form onSubmit={handleSetCreditLimit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credit-limit">Nuevo Cupo de Crédito (COP)</Label>
                  <NumericFormat
                    id="credit-limit"
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale={false}
                    prefix=""
                    value={creditLimitAmount}
                    onValueChange={(values) => {
                      setCreditLimitAmount(values.floatValue ? values.floatValue.toString() : '')
                    }}
                    placeholder="0"
                    allowNegative={false}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cupo actual: {formatCurrency(localMinorista.creditLimit)}
                  </p>
                </div>

                {creditLimitAmount && !isNaN(parseFloat(creditLimitAmount)) && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">Nuevo cupo:</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(parseFloat(creditLimitAmount))}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Asignar Cupo'}
                </Button>
              </form>
            </div>
          )}

          {/* Pagar Deuda */}
          {activeTab === 'pay' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 space-y-2">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Pagar Deuda y Liberar Cupo</p>
                <p className="text-xs text-muted-foreground">
                  Paga la deuda acumulada para liberar cupo disponible. Las ganancias acumuladas se reiniciarán.
                </p>
              </div>

              <form onSubmit={handlePayDebt} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Monto a Pagar (COP)</Label>
                  <div className="flex gap-2">
                    <NumericFormat
                      id="pay-amount"
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale={false}
                      prefix=""
                      value={payAmount}
                      onValueChange={(values) => {
                        setPayAmount(values.floatValue ? values.floatValue.toString() : '')
                      }}
                      placeholder="0"
                      allowNegative={true}
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => setPayAmount(debtAmount.toString())}
                      variant="outline"
                      className="flex-shrink-0"
                      disabled={loading || debtAmount <= 0}
                    >
                      Pagar Todo
                    </Button>
                  </div>
                  <p className="text-sm">Deuda actual: {formatCurrency(debtAmount)}</p>
                </div>

                {payAmount && !isNaN(parseFloat(payAmount)) && parseFloat(payAmount) > 0 && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                      <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-2">
                        Deuda después del pago:
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(Math.max(0, debtAmount - parseFloat(payAmount)))}
                      </p>
                    </div>
                    {parseFloat(payAmount) > debtAmount && !isNaN(debtAmount) && (
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                          Saldo a Favor Después:
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(parseFloat(payAmount) - debtAmount + localMinorista.creditBalance)}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Exceso de pago + saldo anterior</p>
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading} variant="destructive">
                  {loading ? 'Procesando...' : 'Pagar Deuda'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
