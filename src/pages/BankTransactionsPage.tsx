import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useBankAccountDetail, useBankAccountTransactions } from '@/hooks/queries/useBankQueries'
import type { BankAccountTransactionType } from '@/types/api'

type DateFilterType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM' | 'ALL'

export function BankTransactionsPage() {
  const { bankAccountId } = useParams<{ bankAccountId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterDate, setFilterDate] = useState<DateFilterType>('ALL')
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })
  const [dateFiltersExpanded, setDateFiltersExpanded] = useState(false)

  // Calculate date range based on filter
  const getDateRange = (filterType: DateFilterType) => {
    const today = new Date()
    let dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    let dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    switch (filterType) {
      case 'TODAY':
        break
      case 'YESTERDAY':
        dateFrom.setDate(dateFrom.getDate() - 1)
        dateTo.setDate(dateTo.getDate() - 1)
        break
      case 'THIS_WEEK':
        dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay())
        break
      case 'LAST_WEEK':
        const dayOfWeekLast = today.getDay()
        const endOfLastWeek = new Date(today)
        endOfLastWeek.setDate(today.getDate() - dayOfWeekLast - 1)
        endOfLastWeek.setHours(23, 59, 59, 999)
        const startOfLastWeek = new Date(endOfLastWeek)
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6)
        startOfLastWeek.setHours(0, 0, 0, 0)
        dateFrom = startOfLastWeek
        dateTo = endOfLastWeek
        break
      case 'THIS_MONTH':
        dateFrom.setDate(1)
        break
      case 'LAST_MONTH':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0)
        dateTo.setHours(23, 59, 59, 999)
        break
      case 'CUSTOM':
        const [customFromYear, customFromMonth, customFromDay] = customDateRange.from.split('-').map(Number)
        const [customToYear, customToMonth, customToDay] = customDateRange.to.split('-').map(Number)
        dateFrom = new Date(customFromYear, customFromMonth - 1, customFromDay, 0, 0, 0, 0)
        dateTo = new Date(customToYear, customToMonth - 1, customToDay, 23, 59, 59, 999)
        break
      default:
        return undefined
    }

    return { from: dateFrom.toISOString(), to: dateTo.toISOString() }
  }

  // Build query params
  const dateRange = filterDate !== 'ALL' ? getDateRange(filterDate) : undefined

  // React Query hooks for bank account and transactions
  const bankAccountQuery = useBankAccountDetail(bankAccountId || null)
  const transactionsQuery = useBankAccountTransactions({
    accountId: bankAccountId || '',
    page,
    limit: 50,
    startDate: dateRange?.from || null,
    endDate: dateRange?.to || null,
  })

  const bankAccount = bankAccountQuery.data
  const transactionsResponse = transactionsQuery.data
  const transactions = transactionsResponse?.transactions || []
  const totalPages = transactionsResponse?.pagination.totalPages || 1
  const isLoading = transactionsQuery.isLoading

  // Handle errors
  if (bankAccountQuery.error) {
    toast.error('Error al cargar cuenta bancaria')
    navigate('/')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionTypeLabel = (type: BankAccountTransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Depósito'
      case 'WITHDRAWAL':
        return 'Retiro'
      case 'ADJUSTMENT':
        return 'Ajuste'
      default:
        return type
    }
  }

  const getTransactionTypeColor = (type: BankAccountTransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'WITHDRAWAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const isPositiveTransaction = (type: BankAccountTransactionType) => {
    return type === 'DEPOSIT'
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cuentas-bancarias')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Transacciones Bancarias</h1>
        </div>

        {/* Bank Account Info Card */}
        {bankAccount && (
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                {bankAccount.bank.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cuenta</span>
                <span className="font-medium">{bankAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Titular</span>
                <span className="font-medium">{bankAccount.accountHolder}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Saldo Actual</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(bankAccount.balance)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Filters */}
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
                  variant={filterDate === 'TODAY' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('TODAY')
                    setPage(1)
                  }}
                  className={filterDate === 'TODAY' ? 'text-white' : ''}
                  style={filterDate === 'TODAY' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Hoy
                </Button>
                <Button
                  variant={filterDate === 'YESTERDAY' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('YESTERDAY')
                    setPage(1)
                  }}
                  className={filterDate === 'YESTERDAY' ? 'text-white' : ''}
                  style={filterDate === 'YESTERDAY' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Ayer
                </Button>
                <Button
                  variant={filterDate === 'THIS_WEEK' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('THIS_WEEK')
                    setPage(1)
                  }}
                  className={filterDate === 'THIS_WEEK' ? 'text-white' : ''}
                  style={filterDate === 'THIS_WEEK' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Esta Semana
                </Button>
                <Button
                  variant={filterDate === 'LAST_WEEK' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('LAST_WEEK')
                    setPage(1)
                  }}
                  className={filterDate === 'LAST_WEEK' ? 'text-white' : ''}
                  style={filterDate === 'LAST_WEEK' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Semana Pasada
                </Button>
                <Button
                  variant={filterDate === 'THIS_MONTH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('THIS_MONTH')
                    setPage(1)
                  }}
                  className={filterDate === 'THIS_MONTH' ? 'text-white' : ''}
                  style={filterDate === 'THIS_MONTH' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Este Mes
                </Button>
                <Button
                  variant={filterDate === 'LAST_MONTH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('LAST_MONTH')
                    setPage(1)
                  }}
                  className={filterDate === 'LAST_MONTH' ? 'text-white' : ''}
                  style={filterDate === 'LAST_MONTH' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Mes Pasado
                </Button>
                <Button
                  variant={filterDate === 'CUSTOM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterDate('CUSTOM')}
                  className={filterDate === 'CUSTOM' ? 'text-white' : ''}
                  style={filterDate === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Personalizado
                </Button>
                <Button
                  variant={filterDate === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterDate('ALL')
                    setPage(1)
                  }}
                  className={filterDate === 'ALL' ? 'text-white' : ''}
                  style={filterDate === 'ALL' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  Todos
                </Button>
              </div>

              {filterDate === 'CUSTOM' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2 border-t">
                  <div>
                    <label className="block text-sm font-medium mb-2">Desde</label>
                    <Input
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hasta</label>
                    <Input
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={() => setPage(1)}
                    className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]"
                    size="sm"
                  >
                    Aplicar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando transacciones...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay transacciones registradas</div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Fecha</th>
                        <th className="pb-3 font-medium">Tipo</th>
                        <th className="pb-3 font-medium text-right">Monto</th>
                        <th className="pb-3 font-medium text-right">Comisión</th>
                        <th className="pb-3 font-medium text-right pr-6">Dé</th>
                        <th className="pb-3 font-medium text-right pr-6">Ahora</th>
                        <th className="pb-3 font-medium pl-4">Creado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => {
                        const isPositive = isPositiveTransaction(transaction.type)
                        const displayAmount = isPositive ? transaction.amount : -transaction.amount

                        return (
                          <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 text-sm whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
                            <td className="py-3">
                              <Badge variant="outline" className={getTransactionTypeColor(transaction.type)}>
                                {getTransactionTypeLabel(transaction.type)}
                              </Badge>
                            </td>
                            <td
                              className={`py-3 text-right font-semibold whitespace-nowrap ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {isPositive && '+'}
                              {formatCurrency(displayAmount)}
                            </td>
                            <td className="py-3 text-right text-sm text-muted-foreground pr-6 whitespace-nowrap">
                              {formatCurrency(transaction.fee)}
                            </td>
                            <td className="py-3 text-right text-sm text-muted-foreground pr-6 whitespace-nowrap">
                              {formatCurrency(transaction.previousBalance)}
                            </td>
                            <td className="py-3 text-right font-semibold pr-6 whitespace-nowrap">
                              {formatCurrency(transaction.currentBalance)}
                            </td>
                            <td className="py-3 text-sm pl-4">{transaction.createdBy.fullName}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {transactions.map((transaction) => {
                    const isPositive = isPositiveTransaction(transaction.type)
                    const displayAmount = isPositive ? transaction.amount : -transaction.amount

                    return (
                      <Card key={transaction.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {isPositive ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                            <Badge variant="outline" className={getTransactionTypeColor(transaction.type)}>
                              {getTransactionTypeLabel(transaction.type)}
                            </Badge>
                          </div>
                          <span className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive && '+'}
                            {formatCurrency(displayAmount)}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha</span>
                            <span>{formatDate(transaction.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">De</span>
                            <span>{formatCurrency(transaction.previousBalance)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Ahora</span>
                            <span>{formatCurrency(transaction.currentBalance)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Creado por</span>
                            <span>{transaction.createdBy.fullName}</span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>

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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
