import { Badge } from '@/components/ui/badge'
import { CREDIT_STATUS_LABELS } from '@/lib/cobranzasUtils'
import type { CreditView } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

// "En mora" no es un estado: se deriva de isOverdue en préstamos activos
export function CreditStatusBadge({ credit }: { credit: Pick<CreditView, 'status' | 'isOverdue' | 'daysOverdue'> }) {
  if (credit.status === 'active' && credit.isOverdue) {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">
        En mora · {credit.daysOverdue} d
      </Badge>
    )
  }
  const styles: Record<string, string> = {
    active: 'border-green-200 bg-green-100 text-green-800',
    paid_off: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    cancelled: 'border-gray-200 bg-gray-100 text-gray-700',
  }
  return (
    <Badge variant="outline" className={cn(styles[credit.status])}>
      {CREDIT_STATUS_LABELS[credit.status]}
    </Badge>
  )
}
