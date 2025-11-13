import { AlertCircle, Wallet } from 'lucide-react'

interface BalanceInfoProps {
  minoristaBalance: number | null
  amountInput: string
  getEarnedProfit: () => number | null
  getRemainingBalance: () => number | null
  hasInsufficientBalance: () => boolean
}

export function BalanceInfo({
  minoristaBalance,
  amountInput,
  getEarnedProfit,
  getRemainingBalance,
  hasInsufficientBalance,
}: BalanceInfoProps) {
  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Tu Balance</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Balance Actual</p>
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 2,
            }).format(minoristaBalance ?? 0)}
          </p>
        </div>
        {amountInput && (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Ganancia</p>
              <p className={`text-lg font-semibold text-green-600 dark:text-green-400`}>
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 2,
                }).format(getEarnedProfit() ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance Después</p>
              <p
                className={`text-lg font-semibold ${
                  hasInsufficientBalance() ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 2,
                }).format(getRemainingBalance() ?? 0)}
              </p>
            </div>
          </>
        )}
      </div>
      {hasInsufficientBalance() && (
        <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">
            Balance insuficiente. Necesitas recargar tu balance para crear este giro.
          </p>
        </div>
      )}
    </div>
  )
}
