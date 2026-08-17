import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMoney } from '@/lib/cobranzasUtils'

export function InstallmentCountPicker({
  cuota,
  maxCuotas,
  value,
  onValueChange,
}: {
  cuota: number
  maxCuotas: number
  value: number | null
  onValueChange: (amount: number | null) => void
}) {
  const limit = Math.max(1, Math.min(Math.floor(maxCuotas), 5))

  const activeCount = value != null && cuota > 0 ? Math.round(Number(value) / cuota) : null
  const activeIsExact = activeCount != null && Math.abs(Number(value) - activeCount * cuota) < 0.01

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Pagar varias cuotas</p>
      <Select
        value={activeIsExact && activeCount ? String(activeCount) : ''}
        onValueChange={(v) => {
          const n = Number(v)
          if (n > 0) onValueChange(Math.round(cuota * n))
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="N° de cuotas" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: limit }, (_, i) => i + 1).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} {n === 1 ? 'cuota' : 'cuotas'} · {formatMoney(Math.round(cuota * n))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
