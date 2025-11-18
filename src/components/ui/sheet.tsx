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
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[60] animate-in slide-in-from-bottom duration-300 
                   lg:inset-0 lg:grid lg:place-items-center lg:slide-in-from-bottom">{children}</div>
    </>
  )
}

export function SheetContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-background rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto w-full
                 lg:rounded-xl lg:max-w-lg lg:max-h-[90vh] lg:m-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function SheetHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl lg:rounded-xl">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="ml-4 p-2 rounded-full hover:bg-accent transition-colors">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold">{children}</h2>
}

export function SheetBody({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-4">{children}</div>
}
