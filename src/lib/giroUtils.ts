import { Banknote, Wallet, Signal, CreditCard, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { ExecutionType, GiroStatus, Currency } from '@/types/api'

export const getExecutionTypeBadge = (executionType?: ExecutionType) => {
  const typeMap: Record<ExecutionType, { label: string; className: string; icon: any }> = {
    TRANSFERENCIA: {
      label: 'Transferencia',
      className: 'bg-blue-50 text-blue-700 border border-blue-200',
      icon: Banknote,
    },
    PAGO_MOVIL: {
      label: 'Pago Móvil',
      className: 'bg-green-50 text-green-700 border border-green-200',
      icon: Wallet,
    },
    RECARGA: {
      label: 'Recarga Celular',
      className: 'bg-orange-50 text-orange-700 border border-orange-200',
      icon: Signal,
    },
    EFECTIVO: {
      label: 'Efectivo',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: CreditCard,
    },
    ZELLE: { label: 'Zelle', className: 'bg-purple-50 text-purple-700 border border-purple-200', icon: CreditCard },
    OTROS: { label: 'Otros', className: 'bg-gray-50 text-gray-700 border border-gray-200', icon: ArrowRight },
  }
  return executionType && typeMap[executionType]
    ? typeMap[executionType]
    : { label: 'Desconocido', className: 'bg-gray-50 text-gray-700 border border-gray-200', icon: ArrowRight }
}

export const getGiroStatusBadge = (status: GiroStatus) => {
  const statusMap: Record<GiroStatus, { label: string; className: string; icon: any }> = {
    PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    ASIGNADO: { label: 'Asignado', className: 'bg-blue-100 text-blue-800', icon: ArrowRight },
    PROCESANDO: { label: 'Procesando', className: 'bg-purple-100 text-purple-800', icon: Clock },
    COMPLETADO: { label: 'Completado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: XCircle },
    DEVUELTO: { label: 'Devuelto', className: 'bg-orange-100 text-orange-800', icon: ArrowRight },
  }
  return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Clock }
}

export const formatGiroCurrency = (amount: number, currency: Currency) => {
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  } else if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  } else {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(amount)
  }
}
