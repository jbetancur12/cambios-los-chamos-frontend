import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  placeholder?: string
  defaultValue?: string
  inputType?: 'text' | 'date'
  confirmText?: string
  onConfirm: (value: string) => void
  loading?: boolean
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  defaultValue = '',
  inputType = 'text',
  confirmText = 'Confirmar',
  onConfirm,
  loading = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(defaultValue)
      setVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setVisible(false), 200)
      document.body.style.overflow = 'unset'
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open, defaultValue])

  if (!visible && !open) return null

  const handleConfirm = () => {
    if (!value.trim()) return
    onConfirm(value.trim())
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0'
      )}
      onClick={() => !loading && onOpenChange(false)}
    >
      <div
        className={cn(
          'bg-background rounded-lg shadow-xl w-full max-w-sm overflow-hidden transition-all duration-200 transform',
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <Input
            type={inputType}
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading || !value.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
