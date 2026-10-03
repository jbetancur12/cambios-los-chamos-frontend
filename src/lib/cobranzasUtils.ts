import type { CreditFrequency, CreditStatus, PaymentMethod } from '@/types/cobranzas'

export const formatMoney = (value: number | string | null | undefined): string => {
  const num = Number(value ?? 0)
  return Math.ceil(num).toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

// Las fechas YYYY-MM-DD se interpretan en hora local para evitar desfases de un día
const parseDate = (date: string | Date): Date => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(date)
}

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(parseDate(date))
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export const toDateInput = (date: Date = new Date()): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = {
  active: 'Activo',
  paid_off: 'Pagado',
  cancelled: 'Anulado',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
}

export const FREQUENCY_LABELS: Record<CreditFrequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

export const PERIOD_DAYS: Record<CreditFrequency, number> = {
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

export interface LoanPreview {
  installment: number
  total: number
  firstDate: string
  lastDate: string
}

// Misma fórmula del backend: total = monto*(1+interés/100), cuota = round(total/n), total final = cuota*n
export const computeLoanPreview = (
  amount: number,
  interestRate: number,
  installments: number,
  frequency: CreditFrequency,
  loanDate: string
): LoanPreview | null => {
  if (!amount || amount <= 0 || !installments || installments <= 0 || !loanDate) return null
  const total = amount * (1 + (interestRate || 0) / 100)
  const installment = Math.round(total / installments)
  const period = PERIOD_DAYS[frequency]
  const first = parseDate(loanDate)
  first.setDate(first.getDate() + period)
  const last = new Date(first)
  last.setDate(last.getDate() + (installments - 1) * period)
  return {
    installment,
    total: installment * installments,
    firstDate: toDateInput(first),
    lastDate: toDateInput(last),
  }
}

export const whatsappUrl = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  // Números colombianos de 10 dígitos: anteponer indicativo 57
  const full = digits.length === 10 ? `57${digits}` : digits
  return `https://wa.me/${full}`
}

export const telUrl = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`
