import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { MinoristaTransaction, MinoristaTransactionType } from '@/types/api'
import { Card } from '@/components/ui/card'

interface MinoristaSimpleTransactionTableProps {
  transactions: MinoristaTransaction[]
  typeFilter?: MinoristaTransactionType | 'ALL'
}

export function MinoristaSimpleTransactionTable({
  transactions,
  typeFilter = 'ALL',
}: MinoristaSimpleTransactionTableProps) {
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

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay transacciones registradas</div>
  }

  // Filtrar por tipo si se especifica - excluir transacciones PROFIT
  const filteredTransactions =
    typeFilter === 'ALL'
      ? transactions.filter((t) => t.type !== 'PROFIT')
      : transactions.filter((t) => t.type === typeFilter)

  if (filteredTransactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay transacciones de este tipo</div>
  }

  // Ordenar transacciones de más reciente a más viejo
  const sortedTransactions = [...filteredTransactions].reverse()

  return (
    <div className="space-y-3">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">Fecha</th>
              <th className="pb-3 font-medium">Tipo</th>
              <th className="pb-3 font-medium text-right">Monto</th>
              <th className="pb-3 font-medium text-right">Ganancia</th>
              <th className="pb-3 font-medium text-right pr-6">De</th>
              <th className="pb-3 font-medium text-right pr-6">Ahora</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction) => {
              const isPositive = isPositiveTransaction(transaction.type)
              const displayAmount = isPositive ? transaction.amount : -transaction.amount
              const balanceQueda = transaction.currentBalanceInFavor || 0
              const isBalanceInFavor = balanceQueda > 0

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
                  <td className="py-3 text-right text-sm font-semibold text-blue-600 whitespace-nowrap">
                    {transaction.profitEarned ? `+${formatCurrency(transaction.profitEarned)}` : '$ 0,00'}
                  </td>
                  <td className="py-3 text-right text-sm text-muted-foreground pr-6 whitespace-nowrap">
                    {formatCurrency(transaction.previousAvailableCredit)}
                  </td>
                  <td
                    className={`py-3 text-right font-semibold pr-6 whitespace-nowrap ${
                      isBalanceInFavor ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
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
        {sortedTransactions.map((transaction) => {
          const isPositive = isPositiveTransaction(transaction.type)
          const displayAmount = isPositive ? transaction.amount : -transaction.amount
          const balanceQueda = transaction.currentBalanceInFavor || 0
          const isBalanceInFavor = balanceQueda > 0

          return (
            <Card key={transaction.id} className="p-2">
              <div className="flex items-start justify-between mb-1">
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
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha</span>
                  <span>{formatDate(transaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ganancia</span>
                  <span className="text-blue-600 font-semibold">
                    {transaction.profitEarned ? `+${formatCurrency(transaction.profitEarned)}` : '$ 0,00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">De</span>
                  <span>{formatCurrency(transaction.previousAvailableCredit)}</span>
                </div>
                <div
                  className={`flex justify-between font-semibold ${isBalanceInFavor ? 'text-green-600' : 'text-red-600'}`}
                >
                  <span>Ahora</span>
                  <span>{formatCurrency(transaction.availableCredit)}</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
