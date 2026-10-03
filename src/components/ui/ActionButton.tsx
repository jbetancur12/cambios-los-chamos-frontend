import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'success' | 'warning' | 'danger'

interface ActionButtonProps {
  icon: LucideIcon
  onClick: () => void
  title: string
  pending?: boolean
  disabled?: boolean
  tone?: Tone
  className?: string
}

const TONES: Record<Tone, string> = {
  default: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
  success: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40',
  warning: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40',
  danger: 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40',
}

export function ActionButton({
  icon: Icon,
  onClick,
  title,
  pending,
  disabled,
  tone = 'default',
  className,
}: ActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title}
      disabled={disabled || pending}
      className={cn('transition-all duration-200', TONES[tone], className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </Button>
  )
}
