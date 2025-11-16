import { ChevronDown, TrendingDown, TrendingUp, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import type { MinoristaTransaction } from '@/types/api'

interface MinoristaTransactionHistoryProps {
  transactions: MinoristaTransaction[]
  creditLimit: number
}

export function MinoristaTransactionHistory({ transactions, creditLimit }: MinoristaTransactionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionColor = (type: MinoristaTransaction['type']) => {
    switch (type) {
      case 'DISCOUNT':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      case 'PROFIT':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
      case 'RECHARGE':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
      case 'ADJUSTMENT':
        return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
    }
  }

  const getTransactionIcon = (type: MinoristaTransaction['type']) => {
    switch (type) {
      case 'DISCOUNT':
        return <Minus className="h-4 w-4 text-red-600" />
      case 'PROFIT':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'RECHARGE':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'ADJUSTMENT':
        return <TrendingDown className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getTransactionLabel = (type: MinoristaTransaction['type']) => {
    switch (type) {
      case 'DISCOUNT':
        return 'Consumo de Cupo'
      case 'PROFIT':
        return 'Ganancia de Giro'
      case 'RECHARGE':
        return 'Recarga de Saldo'
      case 'ADJUSTMENT':
        return 'Ajuste'
      default:
        return type
    }
  }
  const lastTransaction = transactions.length > 0 ? transactions[0] : null

  const tc = lastTransaction?.accumulatedDebt ?? 0
  const tp = lastTransaction?.accumulatedProfit ?? 0
  const ac = lastTransaction?.availableCredit ?? 0

  return (
    <div className="space-y-6">
      {/* Resumen de Tarjeta de Crédito */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Estado de Crédito</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Cupo */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950">
            <p className="text-xs text-muted-foreground mb-1">Límite de Crédito</p>
            <p className="text-2xl font-bold text-blue-600">
              {creditLimit > 0 ? formatCurrency(creditLimit) : 'Sin asignar'}
            </p>
            <p className="text-xs text-muted-foreground mt-2 mb-4">Cupo total asignado</p>
          </div>

          {/* Consumo Total */}
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950">
            <p className="text-xs text-muted-foreground mb-1">
              Consumo Total <span className="text-[10px]">(Descuento Giros + Ganancias)</span>
            </p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(tc)}</p>
            <p className="text-xs text-muted-foreground mt-2">Por todos los giros</p>
          </div>

          {/* Ganancias */}
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950">
            <p className="text-xs text-muted-foreground mb-1">Ganancias Acumuladas</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(tp)}</p>
            <p className="text-xs text-muted-foreground mt-2">Abonos automáticos</p>
          </div>

          <div className="p-4 rounded-lg border border-yellow-200 bg-orange-50 dark:bg-yellow-950">
            <p className="text-xs text-muted-foreground mb-1">Cupo Disponible</p>
            <p className="text-2xl font-bold text-green-600">{creditLimit > 0 ? formatCurrency(ac) : 'Sin asignar'}</p>
            <p className="text-xs text-muted-foreground mt-2">Crédito restante</p>
          </div>
        </div>

        {/* Deuda Neta */}
        <div className="p-4 rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">DEUDA NETA (Lo que debe pagar)</p>
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(tc)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Cálculo: {formatCurrency(tc + tp)} - {formatCurrency(tp)} = {formatCurrency(tc)}
          </p>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Historial Detallado de Transacciones</h3>

        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No hay transacciones registradas aún</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`rounded-lg border overflow-hidden transition-colors ${getTransactionColor(transaction.type)}`}
              >
                <button
                  onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {transaction.description || getTransactionLabel(transaction.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          transaction.type === 'DISCOUNT' || transaction.type === 'ADJUSTMENT'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {transaction.type === 'DISCOUNT' || transaction.type === 'ADJUSTMENT' ? '-' : '+'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedId === transaction.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Detalles expandidos */}
                {expandedId === transaction.id && (
                  <div className="border-t px-4 py-3 space-y-3 bg-opacity-50">
                    {/* Información del Giro */}
                    {transaction.creditConsumed !== undefined && transaction.creditConsumed > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Cupo Consumido</p>
                          <p className="font-semibold">{formatCurrency(transaction.creditConsumed)}</p>
                        </div>
                        {transaction.profitEarned !== undefined && transaction.profitEarned > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Ganancia (5%)</p>
                            <p className="font-semibold text-green-600">+{formatCurrency(transaction.profitEarned)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Desglose de Saldo a Favor y Crédito (Solo para DISCOUNT) */}
                    {transaction.type === 'DISCOUNT' && (transaction.balanceInFavorUsed !== undefined || transaction.creditUsed !== undefined) && (
                      <div className="space-y-2 pt-2 border-t border-dashed">
                        <p className="text-xs font-semibold text-muted-foreground">Desglose del Consumo:</p>
                        {transaction.balanceInFavorUsed !== undefined && transaction.balanceInFavorUsed > 0 && (
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded p-2">
                            <p className="text-xs text-muted-foreground">Saldo a Favor Usado</p>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(transaction.balanceInFavorUsed)}</p>
                          </div>
                        )}
                        {transaction.creditUsed !== undefined && transaction.creditUsed > 0 && (
                          <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-2">
                            <p className="text-xs text-muted-foreground">Crédito Disponible Usado</p>
                            <p className="font-semibold text-blue-700 dark:text-blue-300">{formatCurrency(transaction.creditUsed)}</p>
                          </div>
                        )}
                        {transaction.remainingBalance !== undefined && transaction.remainingBalance > 0 && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-2">
                            <p className="text-xs text-muted-foreground">Saldo a Favor Restante</p>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(transaction.remainingBalance)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cambio de Balance */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Balance Anterior</p>
                        <p className="font-mono">{formatCurrency(transaction.previousAvailableCredit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Balance Nuevo</p>
                        <p className="font-mono">{formatCurrency(transaction.availableCredit)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
