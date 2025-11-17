import { AlertCircle, Wallet } from 'lucide-react'

interface BalanceInfoProps {
  minoristaBalance: number | null
  minoristaBalanceInFavor: number | null
  amountInput: string
  getEarnedProfit: () => number | null
  getRemainingBalance: () => number | null
  hasInsufficientBalance: () => boolean
}

export function BalanceInfo({
  minoristaBalance,
  minoristaBalanceInFavor,
  amountInput,
  getEarnedProfit,
  getRemainingBalance,
  hasInsufficientBalance,
}: BalanceInfoProps) {
  // Calculate how much will be consumed from each balance type
  const calculateConsumption = () => {
    const amount = parseFloat(amountInput) || 0
    if (amount === 0) return { fromBalanceInFavor: 0, fromCredit: 0 }

    const balanceInFavor = minoristaBalanceInFavor ?? 0
    const availableCredit = minoristaBalance ?? 0

    // Saldo a favor se consume primero
    const fromBalanceInFavor = Math.min(amount, balanceInFavor)
    const remaining = amount - fromBalanceInFavor
    const fromCredit = Math.min(remaining, availableCredit)

    return { fromBalanceInFavor, fromCredit }
  }

  const consumption = calculateConsumption()
  return (
    <div className="space-y-3">
      {/* Balances Available */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Tu Balance</p>
        </div>

        {/* Two column layout for balances */}
        <div className="grid grid-cols-2 gap-3">
          {/* Crédito Disponible */}
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-muted-foreground mb-1">Crédito Disponible</p>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              }).format(minoristaBalance ?? 0)}
            </p>
          </div>

          {/* Saldo a Favor */}
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
            <p className="text-xs text-muted-foreground mb-1">Saldo a Favor</p>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              }).format(minoristaBalanceInFavor ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Consumption Breakdown when amount is entered */}
      {amountInput && parseFloat(amountInput) > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Desglose del Consumo</p>
          <div className="space-y-2 text-sm">
            {consumption.fromBalanceInFavor > 0 && (
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
                <p className="text-xs text-muted-foreground">Del Saldo a Favor</p>
                <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(consumption.fromBalanceInFavor)}
                </p>
              </div>
            )}
            {consumption.fromCredit > 0 && (
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-muted-foreground">Del Crédito Disponible</p>
                <p className="text-base font-semibold text-blue-700 dark:text-blue-300">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(consumption.fromCredit)}
                </p>
              </div>
            )}
          </div>
          {consumption.fromBalanceInFavor > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">💡 El saldo a favor se consume primero</p>
          )}
        </div>
      )}

      {/* Profit and Remaining Balance */}
      {amountInput && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Ganancia</p>
              <p className={`text-lg font-semibold text-green-600 dark:text-green-400`}>
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(getEarnedProfit() ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance Total Después</p>
              <p
                className={`text-lg font-semibold ${
                  hasInsufficientBalance() ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(getRemainingBalance() ?? 0)}
              </p>
            </div>
          </div>

          {/* Breakdown of remaining balances */}
          {(() => {
            const amount = parseFloat(amountInput) || 0
            const balanceInFavor = minoristaBalanceInFavor ?? 0
            const availableCredit = minoristaBalance ?? 0
            const profit = getEarnedProfit() || 0

            // Apply processTransfer logic
            let userBalance = balanceInFavor
            let remainingAmount = amount
            let externalDebt = 0
            let remainingBalanceInFavor = 0
            let remainingCredit = 0

            // Step 1: Deduct from balance (saldo a favor)
            if (remainingAmount <= userBalance) {
              remainingBalanceInFavor = userBalance - remainingAmount
              remainingAmount = 0
            } else {
              remainingAmount -= userBalance
              remainingBalanceInFavor = 0
            }

            // Step 2: Deduct from credit
            let creditUsed = 0
            if (remainingAmount > 0) {
              if (remainingAmount <= availableCredit) {
                creditUsed = remainingAmount
                remainingCredit = availableCredit - remainingAmount
                remainingAmount = 0
              } else {
                creditUsed = availableCredit
                externalDebt = remainingAmount - availableCredit
                remainingCredit = 0
                remainingAmount = 0
              }
            } else {
              remainingCredit = availableCredit
            }

            // Step 3: Apply profit
            if (creditUsed === 0 && externalDebt === 0) {
              // Only balance was used → profit goes to balance
              remainingBalanceInFavor += profit
            } else {
              // Profit first covers external debt
              const paidExternalDebt = Math.min(profit, externalDebt)
              let remainingProfit = profit - paidExternalDebt

              // Then restores used credit
              const restoreCredit = Math.min(remainingProfit, creditUsed)
              remainingCredit += restoreCredit
              remainingProfit -= restoreCredit

              // Anything extra goes to balance
              if (remainingProfit > 0) {
                remainingBalanceInFavor += remainingProfit
              }
            }

            return (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-muted-foreground">Crédito Después</p>
                  <p className="text-base font-semibold text-blue-700 dark:text-blue-300">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                    }).format(remainingCredit)}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
                  <p className="text-xs text-muted-foreground">Saldo a Favor Después</p>
                  <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                    }).format(remainingBalanceInFavor)}
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance() && (
        <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">
            Balance insuficiente. Necesitas recargar tu balance para crear este giro.
          </p>
        </div>
      )}
    </div>
  )
}
