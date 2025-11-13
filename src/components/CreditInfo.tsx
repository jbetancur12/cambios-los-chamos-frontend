import { AlertCircle, TrendingDown } from 'lucide-react'

interface CreditInfoProps {
  creditLimit: number
  availableCredit: number
  amountToDeduct?: number
}

export function CreditInfo({ creditLimit, availableCredit, amountToDeduct = 0 }: CreditInfoProps) {
  const usedCredit = creditLimit - availableCredit
  const creditPercentage = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0
  const remainingAfterTransaction = availableCredit - amountToDeduct

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-amber-600" />
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Tu Cupo de Crédito</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Cupo Total</p>
          <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
            $ {creditLimit.toLocaleString('es-CO')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Crédito Usado</p>
          <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
            $ {usedCredit.toLocaleString('es-CO')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Crédito Disponible</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            $ {availableCredit.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              creditPercentage > 80 ? 'bg-red-500' : creditPercentage > 50 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Utilizando {creditPercentage.toFixed(1)}% de tu cupo</p>
      </div>

      {amountToDeduct > 0 && (
        <div className="pt-2 border-t border-amber-200 dark:border-amber-800 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Monto a Deducir</p>
              <p className="font-semibold text-red-600">$ {amountToDeduct.toLocaleString('es-CO')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Crédito Después</p>
              <p className={`font-semibold ${remainingAfterTransaction < 0 ? 'text-red-600' : 'text-green-600'}`}>
                $ {Math.max(0, remainingAfterTransaction).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      )}

      {remainingAfterTransaction < 0 && amountToDeduct > 0 && (
        <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">
            Crédito insuficiente. Necesitas pagar tu deuda para crear este giro.
          </p>
        </div>
      )}
    </div>
  )
}
