import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { MinoristaTransactionType } from '@/types/api'
import { ArrowLeft, CreditCard, DollarSign, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useMinoristaBalance, useMinoristaTransactions } from '@/hooks/queries/useMinoristaQueries'
import type { DateRange } from '@/components/DateRangeFilter'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { useAuth } from '@/contexts/AuthContext'
import { MinoristaSimpleTransactionTable } from '@/components/MinoristaSimpleTransactionTable'

export function MinoristaTransactionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [typeFilter, setTypeFilter] = useState<MinoristaTransactionType | 'ALL'>('ALL')

  // React Query hooks
  const minoristaQuery = useMinoristaBalance(user?.role)
  const transactionsQuery = useMinoristaTransactions({
    minoristaId: minoristaQuery.data?.id || '',
    page,
    limit: 50,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const minorista = minoristaQuery.data
  const transactionsResponse = transactionsQuery.data
  const transactions = transactionsResponse?.transactions || []
  const totalPages = transactionsResponse?.pagination.totalPages || 1
  const isLoading = transactionsQuery.isLoading

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
  const creditUsed = minorista.creditLimit - minorista.availableCredit
  const percentUsed = minorista.creditLimit > 0 ? Math.min(100, (creditUsed / minorista.creditLimit) * 100) : 0

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
                  Crédito Disponible
                </span>
                <span className="text-4xl font-extrabold text-green-600 dark:text-green-400">
                  {formatCurrency(minorista.availableCredit)}
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
                  Cupo Utilizado: <span className="font-semibold">{formatCurrency(creditUsed)}</span>
                </span>
                <span className={`font-bold ${percentUsed > 75 ? 'text-red-500' : 'text-blue-500'}`}>
                  {percentUsed.toFixed(1)}%
                </span>
              </div>

              <Progress value={percentUsed} className="h-2" />

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
        <DateRangeFilter
          onDateRangeChange={(range) => {
            setDateRange(range)
            setPage(1)
          }}
          onClear={() => {
            setDateRange({ startDate: null, endDate: null })
            setPage(1)
          }}
        />
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
                <MinoristaSimpleTransactionTable transactions={transactions} typeFilter={typeFilter} />
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
