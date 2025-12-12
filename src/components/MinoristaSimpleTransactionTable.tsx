import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { MinoristaTransaction, MinoristaTransactionType } from '@/types/api'
import { Card } from '@/components/ui/card'

interface MinoristaSimpleTransactionTableProps {
  transactions: MinoristaTransaction[]
  typeFilter?: MinoristaTransactionType | 'ALL'
  creditLimit: number
}

export function MinoristaSimpleTransactionTable({
  transactions,
  typeFilter = 'ALL',
  creditLimit,
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
      case 'DISCOUNT':
        return 'Giro'
      case 'RECHARGE':
        return 'Abono'
      case 'ADJUSTMENT':
        return 'Ajuste'
      case 'REFUND':
        return 'Reembolso'
      default:
        return type
    }
  }

  const getTransactionTypeColor = (type: MinoristaTransactionType) => {
    switch (type) {
      case 'DISCOUNT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'ADJUSTMENT':
      case 'RECHARGE':
      case 'REFUND':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay transacciones registradas</div>
  }

  // Filtrar por tipo si se especifica
  const filteredTransactions = typeFilter === 'ALL' ? transactions : transactions.filter((t) => t.type === typeFilter)

  // Agrupar transacciones de abono (RECHARGE) que ocurrieron en el mismo instante (split por deuda/saldo a favor)
  const groupedTransactions: MinoristaTransaction[] = []

  for (let i = 0; i < filteredTransactions.length; i++) {
    const current = filteredTransactions[i]
    const next = filteredTransactions[i + 1]

    // Verificar si podemos agrupar con la siguiente (que es más antigua en la lista descendente)
    // Criterios:
    // 1. Ambas son RECHARGE
    // 2. La siguiente existe
    // 3. Ocurrieron con menos de 2 segundos de diferencia
    if (
      current.type === 'RECHARGE' &&
      next &&
      next.type === 'RECHARGE' &&
      Math.abs(new Date(current.createdAt).getTime() - new Date(next.createdAt).getTime()) < 2000
    ) {
      // Crear transacción fusionada
      const merged: MinoristaTransaction = {
        ...current,
        amount: Number(current.amount) + Number(next.amount),
        // Mantener el saldo final de la más reciente (current)
        accumulatedDebt: current.accumulatedDebt,
        // Mantener el estado inicial de la más antigua (next)
        previousAvailableCredit: next.previousAvailableCredit,
        // Sumar ganancias si las hubiera (aunque en recargas suele ser 0)
        profitEarned: (Number(current.profitEarned) || 0) + (Number(next.profitEarned) || 0),
      }
      groupedTransactions.push(merged)
      i++ // Saltar la siguiente transacción ya que fue fusionada
    } else {
      groupedTransactions.push(current)
    }
  }

  if (groupedTransactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay transacciones de este tipo</div>
  }

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
              <th className="pb-3 font-medium text-right pr-6 hidden">De</th>
              <th className="pb-3 font-medium text-right pr-6">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {groupedTransactions.map((transaction) => {
              // Para RECHARGE, mostrar el monto tal cual (puede ser negativo). Para otros, invertir si es necesario.
              // DISCOUNT siempre es negativo en lógica, pero se muestra positivo o negativo según contexto?
              // Original logic: isPositive ? amount : -amount.
              // RECHARGE was always positive. Now it can be negative.
              // DISCOUNT is expenditure, so usually shown as negative or red.

              // New logic:
              // If RECHARGE: show amount as is.
              // If DISCOUNT: show as negative (or just amount if it's stored as negative? usually stored as positive in db for amount, but context implies subtraction).
              // Let's look at previous logic: `displayAmount = isPositive ? transaction.amount : -transaction.amount`
              // If RECHARGE (was always positive): displayAmount = amount.
              // If DISCOUNT (was always negative): displayAmount = -amount.

              // Adjusted logic:
              let displayAmount = transaction.amount
              if (transaction.type !== 'RECHARGE' && transaction.type !== 'ADJUSTMENT' && transaction.type !== 'REFUND') {
                displayAmount = -transaction.amount
              }

              // Recalculate isPositive based on displayAmount for color
              const isGreen = displayAmount >= 0
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
                    className={`py-3 text-right font-semibold whitespace-nowrap ${isGreen ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {isGreen && '+'}
                    {formatCurrency(displayAmount)}
                  </td>
                  <td className="py-3 text-right text-sm font-semibold text-blue-600 whitespace-nowrap">
                    {transaction.profitEarned ? `+${formatCurrency(transaction.profitEarned)}` : '$ 0,00'}
                  </td>
                  <td className="py-3 text-right text-sm text-muted-foreground pr-6 whitespace-nowrap hidden">
                    {formatCurrency(creditLimit - transaction.previousAvailableCredit)}
                  </td>
                  <td
                    className={`py-3 text-right font-semibold pr-6 whitespace-nowrap ${isBalanceInFavor ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {formatCurrency(isBalanceInFavor ? balanceQueda : (transaction.accumulatedDebt as number))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {groupedTransactions.map((transaction) => {
          let displayAmount = transaction.amount
          if (transaction.type !== 'RECHARGE' && transaction.type !== 'ADJUSTMENT' && transaction.type !== 'REFUND') {
            displayAmount = -transaction.amount
          }
          const isGreen = displayAmount >= 0

          const balanceQueda = transaction.currentBalanceInFavor || 0
          const isBalanceInFavor = balanceQueda > 0

          return (
            <Card key={transaction.id} className="p-2">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isGreen ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <Badge variant="outline" className={getTransactionTypeColor(transaction.type)}>
                    {getTransactionTypeLabel(transaction.type)}
                  </Badge>
                </div>
                <span className={`text-lg font-bold ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                  {isGreen && '+'}
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
                <div className="flex justify-between hidden">
                  <span className="text-muted-foreground">De</span>
                  <span>{formatCurrency(creditLimit - transaction.previousAvailableCredit)}</span>
                </div>
                <div
                  className={`flex justify-between font-semibold ${isBalanceInFavor ? 'text-green-600' : 'text-red-600'}`}
                >
                  <span>Saldo</span>
                  <span>
                    {formatCurrency(isBalanceInFavor ? balanceQueda : (transaction.accumulatedDebt as number))}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
