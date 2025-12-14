import { AlertCircle, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

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
  const [isBalanceOpen, setIsBalanceOpen] = useState(false)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

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
    <div className="space-y-2 md:space-y-3">
      {/* Balances Available */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsBalanceOpen(!isBalanceOpen)}
          className="w-full flex items-center justify-between p-3 text-sm font-medium text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <span>Tu Balance</span>
          </div>
          {isBalanceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isBalanceOpen && (
          <div className="p-3 pt-0 border-t border-blue-200 dark:border-blue-800 mt-2">
            {/* Two column layout for balances */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {/* Crédito Disponible */}
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-muted-foreground mb-1">Crédito Disponible</p>
                <p className="text-base md:text-lg font-semibold text-blue-700 dark:text-blue-300">
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
                <p className="text-base md:text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(minoristaBalanceInFavor ?? 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consumption Breakdown when amount is entered */}
      {/* Transaction Details (Collapsible) */}
      {amountInput && parseFloat(amountInput) > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
            className="w-full flex items-center justify-between p-3 text-sm font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <span>Detalles de la Transacción</span>
            {isBreakdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isBreakdownOpen && (
            <div className="p-3 pt-0 space-y-4 border-t border-amber-200 dark:border-amber-800 mt-2">
              {/* Consumption Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                  Desglose del Consumo
                </p>
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
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    💡 El saldo a favor se consume primero
                  </p>
                )}
              </div>

              {/* Profit and Remaining Balance */}
              <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                  Proyección
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-muted-foreground">Ganancia</p>
                    <p className={`text-lg font-semibold text-green-600 dark:text-green-400`}>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                      }).format(getEarnedProfit() ?? 0)}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-muted-foreground">Balance Total Después</p>
                    <p
                      className={`text-lg font-semibold ${
                        hasInsufficientBalance()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
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

                  // Net Liquidity Logic: Combine everything into "Total Purchasing Power"
                  const totalAvailable = availableCredit + balanceInFavor
                  const totalAfterPurchase = totalAvailable - amount

                  // If insufficient, we stop (the parent handles validation, but here we just show negative or 0)
                  if (totalAfterPurchase < 0) {
                    // Should technically be prevented by validations, but as a fallback
                    return (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800 text-center">
                        <p className="text-sm font-semibold text-red-600">Balance insuficiente</p>
                      </div>
                    )
                  }

                  // Now redistribute back into "Credit" vs "Surplus"
                  // Assuming we don't know the exact Credit Limit here directly from props...
                  // Wait, looking at props, we receive `minoristaBalance` (which usually is capped at Credit Limit if we used the right hook)
                  // BUT `BalanceInfo` doesn't receive `creditLimit` prop.
                  // We can infer Credit Limit as: (currentAvailable + currentUsed) ??? No, we don't know currentUsed.
                  // Actually, `minoristaBalance` passed from parent IS `availableCredit`.
                  // If we don't have `creditLimit`, we can't perfectly separate Surplus from Credit unless we assume `minoristaBalance` was ALREADY capped?
                  //
                  // Let's assume the standard behavior:
                  // The system treats `availableCredit` as money inside the credit line.
                  // `balanceInFavor` is money ON TOP of the credit line.
                  // So the "Virtual Credit Limit" is basically `availableCredit` (if full) + `debt` (if any).
                  //
                  // Actually, simpler approach:
                  // Use `balanceInFavor` first (Surplus).
                  // Then use `availableCredit` (Credit Line).
                  //
                  // Profit restores `availableCredit` first (paying back debt? NO, `availableCredit` IS the empty space).
                  // Profit adds to `balanceInFavor`? Or restores Credit?
                  //
                  // Let's stick to the user's simplified request: "Total Money".
                  // However, to keep "Credit" and "Surplus" boxes accurate:
                  // 1. Pay with Surplus first.
                  // 2. Pay with Credit next.
                  // 3. Profit adds to Surplus (Net Liquidity increase).
                  //
                  // WAIT! If I use Credit, I am borrowing. Profit should REDUCE the debt (increase available credit).
                  //
                  // Let's look at how it calculates consumption currently:
                  // it consumes BalanceInFavor first.
                  //
                  // Logic for "After":
                  // remainingBalanceInFavor = (BalanceInFavor - UsedBalanceInFavor) + Profit ???
                  // NO. Profit acts as a repayment if there is debt?
                  //
                  // Let's assume Profit is CASH (Surplus).
                  // So:
                  // NewSurplus = (OldSurplus - UsedSurplus) + Profit.
                  // NewCredit = (OldCredit - UsedCredit).
                  //
                  // This seems safer without knowing Credit Limit.

                  const usedFromSurplus = Math.min(amount, balanceInFavor)
                  const usedFromCredit = Math.min(amount - usedFromSurplus, availableCredit)

                  // New State before Profit
                  let newSurplus = balanceInFavor - usedFromSurplus
                  let newCredit = availableCredit - usedFromCredit

                  // Apply Profit
                  // Does profit fill the credit hole? Usually yes, "Liquidez Neta".
                  // If I have used generic credit, and I earn profit, my net position improves.
                  // Ideally: newLiquidity = newSurplus + newCredit + profit.
                  // But how to split?
                  // Without Credit Limit, we will assume Profit goes to Surplus (Cash).

                  newSurplus += profit

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-muted-foreground">Crédito Después</p>
                        <p className="text-base font-semibold text-blue-700 dark:text-blue-300">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(newCredit)}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
                        <p className="text-xs text-muted-foreground">Saldo a Favor Después</p>
                        <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(newSurplus)}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
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
