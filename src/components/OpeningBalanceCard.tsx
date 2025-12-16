import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

interface OpeningBalanceCardProps {
  startBalance: number
  startBalanceInFavor?: number
  creditLimit: number
  startDate: string
  endDate: string
  formatCurrency: (val: number) => string
}

export function OpeningBalanceCard({
  startBalance,
  startBalanceInFavor,
  creditLimit,
  startDate,
  endDate,
  formatCurrency,
}: OpeningBalanceCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fix timezone issue by parsing date parts directly
  const parseDate = (dStr: string) => {
    const [y, m, d] = dStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const startObj = parseDate(startDate)
  const endObj = parseDate(endDate)

  const formatDate = (d: Date) =>
    d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  // Determine if it's a range or single date
  const isRange = startDate !== endDate
  const dateLabel = isRange ? `${formatDate(startObj)} - ${formatDate(endObj)}` : formatDate(startObj)

  const headerPrefix = isRange ? 'Saldo Inicial del Periodo' : 'Saldo Inicial al'

  // Calculations
  const startAvailable = startBalance
  const startFavor = startBalanceInFavor || 0

  const totalStartAvailable = startAvailable + startFavor
  const startNetPosition = totalStartAvailable - creditLimit

  // NetPosition < 0 => Debt (Owes money)
  // NetPosition > 0 => Surplus (Balance in Favor)
  const isDebt = startNetPosition < 0
  const amount = Math.abs(startNetPosition)

  return (
    <div className="mb-6 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {headerPrefix} {dateLabel}
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="p-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
          <div
            className={`p-3 rounded border text-center ${isDebt ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'}`}
          >
            <p className="text-sm font-medium text-muted-foreground mb-1">Saldo</p>
            <p
              className={`text-2xl font-bold font-mono ${isDebt ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}
            >
              {formatCurrency(amount)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
