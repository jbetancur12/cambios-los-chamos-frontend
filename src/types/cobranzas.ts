export type CreditFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type CreditStatus = 'pending_approval' | 'waiting_delivery' | 'active' | 'paid_off' | 'defaulted' | 'cancelled'
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mobile_payment'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'partial'
export type PaymentType = 'regular' | 'down_payment' | 'extra'
export type CashBalanceStatus = 'open' | 'closed'

export interface ClientCategory {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  minOverdueCount?: number | null
  maxOverdueCount?: number | null
  maxAmount?: number | null
  minAmount: number
  maxCredits?: number | null
}

export interface CobranzaClient {
  id: string
  name: string
  identification: string
  phone?: string | null
  email?: string | null
  address?: string | null
  category?: ClientCategory | null
  creditLimitOverride?: number | null
  maxCreditsOverride?: number | null
  latitude?: number | null
  longitude?: number | null
  isActive: boolean
  notes?: string | null
  createdAt: string
}

export interface InterestRate {
  id: string
  name?: string | null
  rate: number
  isActive: boolean
  createdAt: string
}

export interface LoanFrequency {
  id: string
  code: string
  name: string
  description?: string | null
  isEnabled: boolean
  isFixedDuration: boolean
  fixedInstallments?: number | null
  fixedDurationDays?: number | null
  periodDays: number
  defaultInstallments?: number | null
  minInstallments?: number | null
  maxInstallments?: number | null
  interestRate?: number | null
}

export interface CobranzaRoute {
  id: string
  name: string
  description?: string | null
  cobrador: { id: string; fullName: string }
  clients: CobranzaClient[]
  createdAt: string
}

export interface Credit {
  id: string
  client: CobranzaClient
  cobrador?: { id: string; fullName: string } | null
  amount: number
  balance: number
  frequency: CreditFrequency
  startDate: string
  endDate?: string | null
  status: CreditStatus
  interestRate: number
  totalAmount?: number | null
  installmentAmount?: number | null
  totalInstallments?: number | null
  paidInstallmentsCount: number
  totalPaid: number
  scheduledDeliveryDate?: string | null
  approvedAt?: string | null
  deliveredAt?: string | null
  deliveryNotes?: string | null
  rejectionReason?: string | null
  description?: string | null
  downPayment?: number | null
  firstPaymentToday: boolean
  completedAt?: string | null
  createdAt: string
}

export interface Payment {
  id: string
  credit: Credit
  client: CobranzaClient
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  status: PaymentStatus
  transactionId?: string | null
  installmentNumber?: number | null
  receivedBy?: { id: string; fullName: string } | null
  createdAt: string
}

export interface CashBalance {
  id: string
  cobrador: { id: string; fullName: string }
  date: string
  initialAmount: number
  collectedAmount: number
  lentAmount: number
  finalAmount: number
  status: CashBalanceStatus
  closureNotes?: string | null
  createdAt: string
}

export interface CreditScheduleItem {
  installment_number: number
  due_date: string
  amount: number
  paid_amount: number
  remaining_amount: number
  is_paid: boolean
  is_partial: boolean
  status: 'paid' | 'partial' | 'overdue' | 'pending'
  payment_count: number
  last_payment_date: string | null
  payment_method: string | null
  received_by_name: string | null
  payment_id: string | null
}

export interface CreditDetailStats {
  totalInstallments: number
  completedInstallments: number
  pendingInstallments: number
  expectedInstallments: number
  overdueInstallments: number
  isOverdue: boolean
  overdueAmount: number
  daysOverdue: number
  severity: 'none' | 'light' | 'moderate' | 'critical'
  requiresAttention: boolean
  financedAmount: number
  totalPaid: number
}

export interface CreditDetail {
  credit: Credit
  schedule: CreditScheduleItem[]
  stats: CreditDetailStats
}

export interface Paginated<T> {
  items: T[]
  total: number
}
