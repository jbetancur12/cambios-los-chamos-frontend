import { MessageCircle, Phone } from 'lucide-react'
import { telUrl, whatsappUrl } from '@/lib/cobranzasUtils'
import { cn } from '@/lib/utils'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent'

// Enlaces de llamada y WhatsApp. `compact` = solo iconos (para filas de lista).
export function ContactLinks({
  phone,
  compact,
  className,
}: {
  phone?: string | null
  compact?: boolean
  className?: string
}) {
  if (!phone) return null
  const size = compact ? 'h-10 w-10' : 'h-9 px-3'
  return (
    <>
      <a href={telUrl(phone)} title="Llamar" aria-label="Llamar" className={cn(base, size, className)}>
        <Phone className="h-4 w-4" />
        {!compact && 'Llamar'}
      </a>
      <a
        href={whatsappUrl(phone)}
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp"
        aria-label="WhatsApp"
        className={cn(base, size, 'text-green-700', className)}
      >
        <MessageCircle className="h-4 w-4" />
        {!compact && 'WhatsApp'}
      </a>
    </>
  )
}
