export type CreditStatus = 'active' | 'paid_off' | 'cancelled'
export type CreditFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type PaymentMethod = 'cash' | 'transfer' | 'mobile_payment'

export interface CobranzaClient {
  id: string
  name: string
  identification: string
  phone?: string | null
  address?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
}

export interface CobranzaClientListItem extends CobranzaClient {
  activeCredits: number
  totalDebt: number
  overdueAmount: number
}

export interface CreditView {
  id: string
  client: CobranzaClient
  amount: number
  interestRate: number
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  totalPaid: number
  balance: number
  frequency: CreditFrequency
  startDate: string
  endDate: string
  status: CreditStatus
  description?: string | null
  createdAt: string
  completedAt?: string | null
  isOverdue: boolean
  overdueInstallments: number
  overdueAmount: number
  daysOverdue: number
  nextDueDate: string | null
}

export interface ScheduleItem {
  installment_number: number
  due_date: string
  amount: number
  paid_amount: number
  remaining_amount: number
  status: 'paid' | 'partial' | 'overdue' | 'pending'
}

export interface Payment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  status: 'completed' | 'cancelled'
  createdAt: string
  credit?: { id: string; balance?: number }
  client?: CobranzaClient
}

export interface FollowUp {
  id: string
  note: string
  createdAt: string
  createdBy?: { id: string; fullName: string }
}

export interface Paginated<T> {
  items: T[]
  total: number
}

export interface CollectionsSummary {
  overdueCount: number
  overdueAmount: number
  dueTodayCount: number
  dueTodayAmount: number
  collectedToday: number
  outstandingBalance: number
  activeCredits: number
}

export interface CollectionItem {
  creditId: string
  client: { id: string; name: string; identification: string; phone?: string | null; address?: string | null }
  frequency: CreditFrequency
  installmentAmount: number
  amountDue: number
  overdueInstallments: number
  daysLate: number
  dueDate: string
  balance: number
  paidInstallments: number
  totalInstallments: number
  lastFollowUp?: { note: string; createdAt: string } | null
}

export interface Collections {
  summary: CollectionsSummary
  items: CollectionItem[]
}

export interface ClientDetail {
  client: CobranzaClient
  credits: CreditView[]
  payments: Payment[]
  summary: { totalDebt: number; overdueAmount: number; totalPaid: number }
}

export interface PaymentReceipt {
  payment: Payment & { client: CobranzaClient }
  receiptNumber: string
  businessName: string
}
