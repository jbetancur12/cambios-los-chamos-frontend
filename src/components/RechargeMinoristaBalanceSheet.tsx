import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Minorista, MinoristaTransaction, MinoristaTransactionType } from '@/types/api'
import { AlertCircle, Eye, DollarSign } from 'lucide-react'
import { MinoristaSimpleTransactionTable } from './MinoristaSimpleTransactionTable'
import { DateRangeFilter, type DateRange } from './DateRangeFilter'
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
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null, startDate: null, endDate: null })
  const [typeFilter, setTypeFilter] = useState<MinoristaTransactionType | 'ALL'>('ALL')

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
  }, [open, activeTab, page, dateRange])

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(payAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
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
    } catch (error: any) {
      toast.error(error.message || 'Error al pagar deuda')
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
    } catch (error: any) {
      toast.error(error.message || 'Error al asignar cupo')
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
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Ver
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Asignar Cupo
            </button>
            <button
              onClick={() => setActiveTab('pay')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pay'
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
                <DateRangeFilter
                  onDateRangeChange={(range) => {
                    setDateRange(range)
                    setPage(1)
                  }}
                  onClear={() => {
                    setDateRange({ from: null, to: null, startDate: null, endDate: null })
                    setPage(1)
                  }}
                />

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
                      allowNegative={false}
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
                  <p className="text-xs text-muted-foreground">Deuda actual: {formatCurrency(debtAmount)}</p>
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
