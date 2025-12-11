import { Skeleton } from '@/components/ui/skeleton'
import type { GiroStatus } from '@/types/api'

export const GiroDetailSkeleton = ({ status }: { status?: GiroStatus }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Minimalist Key-Value Pairs Skeleton */}
        <div className="space-y-4">
          {/* Cliente Name */}
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Cédula */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>

          {/* Cuenta */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>

          {/* Banco */}
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Monto USD/COP */}
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Bolívares */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-4" />

        {/* Actions Skeleton - Height varies by status */}
        <div className="space-y-4 pt-4">{renderActionButtonsSkeleton(status)}</div>
      </div>

      {/* Footer Text Skeleton */}
      <div className="px-6 py-4 text-right bg-slate-50 dark:bg-slate-900 border-t flex flex-col items-end gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}

const renderActionButtonsSkeleton = (status?: string) => {
  if (status === 'COMPLETADO') {
    // Image placeholder + button
    return (
      <div className="flex flex-col items-center">
        <Skeleton className="h-32 w-full max-w-[200px] mb-2" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    )
  }
  if (status === 'PROCESANDO') {
    // Form fields (taller)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }
  // Default (ASIGNADO/PENDIENTE/ETC)
  return (
    <>
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </>
  )
}
