import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

// Componente Switch estilizado
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex items-center cursor-pointer select-none',
          className
        )}
      >
        {/* Input oculto */}
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />

        {/* Fondo del switch */}
        <span
          className={cn(
            'block w-10 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-primary' : 'bg-muted'
          )}
        />

        {/* Círculo deslizante */}
        <span
          className={cn(
            'absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </label>
    )
  }
)

Switch.displayName = 'Switch'
