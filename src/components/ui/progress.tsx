import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  // Puedes extender las propiedades aquí si lo necesitas
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    // Contenedor principal del componente (el "fondo" o track)
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800', className)}
      {...props}
    >
      {/* Barra de progreso que muestra el valor */}
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-blue-600 transition-transform duration-500 ease-in-out dark:bg-blue-400"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
)

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
