import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import type { Minorista, MinoristaTransaction, MinoristaTransactionType } from '@/types/api'
import { ArrowLeft, CreditCard, DollarSign, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function MinoristaTransactionsPage() {
  const navigate = useNavigate()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
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

  const [minorista, setMinorista] = useState<Minorista | null>(null)
  const [transactions, setTransactions] = useState<MinoristaTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchMinorista = useCallback(async () => {
    try {
      const response = await api.get<{ minorista: Minorista }>(`/api/minorista/me`)
      setMinorista(response.minorista)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar información del minorista')
      navigate('/')
    }
  }, [navigate])

  const fetchTransactions = useCallback(async () => {
    if (!minorista?.id) return

    try {
      setLoading(true)
      const response = await api.get<{
        transactions: MinoristaTransaction[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(`/api/minorista/${minorista.id}/transactions?page=${page}&limit=50`)

      setTransactions(response.transactions)
      setTotalPages(response.pagination.totalPages)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }, [page, minorista?.id])

  useEffect(() => {
    fetchMinorista()
  }, [fetchMinorista])

  useEffect(() => {
    if (minorista?.id) {
      fetchTransactions()
    }
  }, [page, minorista?.id, fetchTransactions])

  const getTransactionTypeLabel = (type: MinoristaTransactionType) => {
    switch (type) {
      case 'PROFIT':
        return 'Ganancia'
      case 'DISCOUNT':
        return 'Descuento'
      case 'RECHARGE':
        return 'Recarga'
      default:
        return type
    }
  }

  const getTransactionTypeColor = (type: MinoristaTransactionType) => {
    switch (type) {
      case 'PROFIT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'DISCOUNT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'ADJUSTMENT':
      case 'RECHARGE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const isPositiveTransaction = (type: MinoristaTransactionType) => {
    return type === 'PROFIT' || type === 'RECHARGE'
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
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Disponible para Uso
              </span>
              <span className="text-4xl font-extrabold text-green-600 dark:text-green-400">
                {formatCurrency(minorista.availableCredit)}
              </span>
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

      {/* Transactions Table */}
      <div className="max-w-5xl mx-auto mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando transacciones...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay transacciones registradas</div>
            ) : (
              <div className="space-y-3">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Fecha</th>
                        <th className="pb-3 font-medium">Tipo</th>
                        <th className="pb-3 font-medium text-right">Monto</th>
                        <th className="pb-3 font-medium text-right pr-6">Dé</th>
                        <th className="pb-3 font-medium text-right pr-6">Ahora</th>
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
                              {formatCurrency(transaction.previousAvailableCredit)}
                            </td>
                            <td className="py-3 text-right font-semibold pr-6 whitespace-nowrap">
                              {formatCurrency(transaction.availableCredit as number)}
                            </td>
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
                            <span>{formatCurrency(transaction.previousAvailableCredit)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Ahora</span>
                            <span>{formatCurrency(transaction.availableCredit)}</span>
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
