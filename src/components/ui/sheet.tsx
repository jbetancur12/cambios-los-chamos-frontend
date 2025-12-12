import * as React from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200 "
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onOpenChange(false)
          }
        }}
      />
      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[60] animate-in slide-in-from-bottom duration-300"
        onClick={() => onOpenChange(false)}
      >
        {children}
      </div>
    </>
  )
}

export function SheetContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-background rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto w-full lg:rounded-xl  lg:max-h-[90vh] lg:m-auto',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function SheetHeader({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl lg:rounded-xl',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="ml-4 p-2 rounded-full hover:bg-accent transition-colors">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-xl font-semibold', className)}>{children}</h2>
}

import { cn } from '@/lib/utils'

export function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}
