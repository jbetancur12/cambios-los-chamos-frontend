import type { CreditStatus, PaymentMethod, PaymentType } from '@/types/cobranzas'

export const formatMoney = (value: number | string | null | undefined): string => {
  const num = Number(value ?? 0)
  return Math.ceil(num).toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(date))
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = {
  pending_approval: 'Pendiente aprobación',
  waiting_delivery: 'En espera de entrega',
  active: 'Activo',
  paid_off: 'Saldado',
  defaulted: 'Mora',
  cancelled: 'Cancelado',
}

export const CREDIT_STATUS_VARIANTS: Record<CreditStatus, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_delivery: 'bg-blue-100 text-blue-800 border-blue-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  paid_off: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  defaulted: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  mobile_payment: 'Pago móvil',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  regular: 'Cuota',
  down_payment: 'Anticipo',
  extra: 'Extra',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

export const PERIOD_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 15,
  monthly: 30,
}

export const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  paid: 'Pagada',
  partial: 'Parcial',
  overdue: 'Vencida',
  pending: 'Pendiente',
}
