import { AlertCircle, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface BalanceInfoProps {
  minoristaBalance: number | null
  minoristaBalanceInFavor: number | null
  creditLimit?: number
  amountInput: string
  getEarnedProfit: () => number | null
  getRemainingBalance: () => number | null
  hasInsufficientBalance: () => boolean
}

export function BalanceInfo({
  minoristaBalance,
  minoristaBalanceInFavor,
  creditLimit,
  amountInput,
  getEarnedProfit,
  getRemainingBalance,
  hasInsufficientBalance,
}: BalanceInfoProps) {
  const [isBalanceOpen, setIsBalanceOpen] = useState(false)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  // Net Liquidity Normalization
  const rawAvailable = minoristaBalance ?? 0
  const rawSurplus = minoristaBalanceInFavor ?? 0
  const totalLiquidity = rawAvailable + rawSurplus
  const limit = creditLimit || rawAvailable + rawSurplus // Fallback: Assume total is limit if unknown, effectively showing 0 debt/surplus split based on input

  // NOTE: If we don't have creditLimit, we CANNOT determine the split correctly.
  // However, usually input `minoristaBalance` is `availableCredit` (capped).
  // If `creditLimit` is undefined, we use old behavior (raw inputs).
  const useNormalization = creditLimit !== undefined

  const displayAvailable = useNormalization ? Math.min(totalLiquidity, limit) : rawAvailable
  const displaySurplus = useNormalization ? Math.max(0, totalLiquidity - limit) : rawSurplus

  // Calculate Consumption
  const calculateConsumption = () => {
    const amount = parseFloat(amountInput) || 0
    if (amount === 0) return { fromBalanceInFavor: 0, fromCredit: 0 }

    // Logic: Pay with Surplus first (Normalized Surplus)
    const availableSurplus = displaySurplus
    const availableCred = displayAvailable

    const fromBalanceInFavor = Math.min(amount, availableSurplus)
    const remaining = amount - fromBalanceInFavor
    const fromCredit = Math.min(remaining, availableCred)

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
                  }).format(displayAvailable)}
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
                  }).format(displaySurplus)}
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
                  const profit = getEarnedProfit() || 0

                  // Projected Total Liquidity
                  const totalAfter = totalLiquidity - amount + profit

                  // If insufficient, we stop (the parent handles validation, but here we just show negative or 0)
                  if (totalAfter < 0 && hasInsufficientBalance()) {
                    return (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800 text-center">
                        <p className="text-sm font-semibold text-red-600">Balance insuficiente</p>
                      </div>
                    )
                  }

                  // Normalize Projected State
                  const afterDateLimit = limit

                  const creditAvailableAfter = Math.min(Math.max(0, totalAfter), afterDateLimit)
                  const surplusAfter = Math.max(0, totalAfter - afterDateLimit)

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-muted-foreground">Crédito Después</p>
                        <p className="text-base font-semibold text-blue-700 dark:text-blue-300">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(creditAvailableAfter)}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
                        <p className="text-xs text-muted-foreground">Saldo a Favor Después</p>
                        <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(surplusAfter)}
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
