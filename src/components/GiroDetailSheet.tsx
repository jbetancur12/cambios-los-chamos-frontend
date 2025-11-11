import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import type { RecentGiro } from '@/hooks/useRecentGiros'
import { Clock, User, Building2, Hash, TrendingUp, DollarSign } from 'lucide-react'
import type { UserRole } from '@/types/api'

interface GiroDetailSheetProps {
  giro: RecentGiro | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: UserRole
}

export function GiroDetailSheet({ giro, open, onOpenChange, userRole }: GiroDetailSheetProps) {
  const formatCurrency = (amount: number, currency: 'VES' | 'COP' | 'USD' = 'VES') => {
    const locale = currency === 'COP' ? 'es-CO' : currency === 'USD' ? 'en-US' : 'es-VE'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDIENTE: 'text-yellow-600 bg-yellow-50',
      ASIGNADO: 'text-blue-600 bg-blue-50',
      PROCESANDO: 'text-purple-600 bg-purple-50',
      COMPLETADO: 'text-green-600 bg-green-50',
      CANCELADO: 'text-red-600 bg-red-50',
    }
    return statusMap[status] || 'text-gray-600 bg-gray-50'
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ASIGNADO: 'Asignado',
      PROCESANDO: 'Procesando',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
    }
    return statusMap[status] || status
  }

  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
  const isMinorista = userRole === 'MINORISTA'

  if (!giro) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Detalle del Giro</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(giro.status)}`}>
              {getStatusLabel(giro.status)}
            </span>
          </div>

          {/* Beneficiary Info */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Beneficiario</h3>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-lg">{giro.beneficiaryName}</p>
              </div>
            </div>
          </div>

          <div className="border-t my-6" />

          {/* Amount Info */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Montos</h3>

            {giro.amountInput && giro.currencyInput ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto Original:</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(giro.amountInput, giro.currencyInput as 'COP' | 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto en Bolívares:</span>
                  <span className="font-semibold text-lg text-green-600">{formatCurrency(giro.amountBs, 'VES')}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-semibold text-lg">{formatCurrency(giro.amountBs, 'VES')}</span>
              </div>
            )}

            {isMinorista && giro.earnings !== undefined && (
              <>
                <div className="border-t pt-3 mt-3" />
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Tu Ganancia:</span>
                  </div>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(giro.earnings, 'COP')}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t my-6" />

          {/* Bank Info */}
          {giro.bankName && (
            <>
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Banco</h3>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{giro.bankName}</p>
                </div>
              </div>
              <div className="border-t my-6" />
            </>
          )}

          {/* Additional Info */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Información Adicional</h3>

            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ID del Giro</p>
                <p className="font-mono text-sm">{giro.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha de Creación</p>
                <p className="font-medium">{formatDate(giro.createdAt)}</p>
              </div>
            </div>

            {isSuperAdmin && giro.minoristaName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Minorista</p>
                  <p className="font-medium">{giro.minoristaName}</p>
                </div>
              </div>
            )}

            {giro.transferencistaNombre && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Transferencista</p>
                  <p className="font-medium">{giro.transferencistaNombre}</p>
                </div>
              </div>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
