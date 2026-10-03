import { api } from '@/lib/api'
import type {
  ClientDetail,
  CobranzaClient,
  CobranzaClientListItem,
  Collections,
  CreditFrequency,
  CreditStatus,
  CreditView,
  FollowUp,
  Paginated,
  Payment,
  PaymentMethod,
  PaymentReceipt,
  ScheduleItem,
} from '@/types/cobranzas'

const BASE = '/cobranzas'

// ------------------ Por cobrar ------------------
export const getCollections = () => api.get<Collections>(`${BASE}/collections`)

// ------------------ Clientes ------------------
export interface CobranzaClientInput {
  name: string
  identification: string
  phone?: string
  address?: string
  notes?: string
}

export const listClients = (params?: { search?: string; page?: number; limit?: number }) =>
  api.get<Paginated<CobranzaClientListItem>>(`${BASE}/clients`, { params })

export const getClient = (id: string) => api.get<ClientDetail>(`${BASE}/clients/${id}`)

export const createClient = (data: CobranzaClientInput) =>
  api.post<{ client: CobranzaClient }>(`${BASE}/clients`, data).then((r) => r.client)

export const updateClient = (id: string, data: Partial<CobranzaClientInput>) =>
  api.patch<{ client: CobranzaClient }>(`${BASE}/clients/${id}`, data).then((r) => r.client)

export const deleteClient = (id: string) => api.delete<unknown>(`${BASE}/clients/${id}`)

// ------------------ Préstamos ------------------
export interface CreditInput {
  clientId: string
  amount: number
  interestRate: number
  totalInstallments: number
  frequency: CreditFrequency
  loanDate?: string
  description?: string
}

export interface CreditListParams {
  status?: CreditStatus
  clientId?: string
  search?: string
  overdueOnly?: boolean
  page?: number
  limit?: number
}

export const listCredits = (params?: CreditListParams) =>
  api.get<Paginated<CreditView>>(`${BASE}/credits`, { params: params as Record<string, unknown> })

export interface CreditDetail {
  credit: CreditView
  schedule: ScheduleItem[]
  payments: Payment[]
  followUps: FollowUp[]
}

export const getCredit = (id: string) => api.get<CreditDetail>(`${BASE}/credits/${id}`)

export const createCredit = (data: CreditInput) =>
  api.post<{ credit: CreditView }>(`${BASE}/credits`, data).then((r) => r.credit)

export const updateCredit = (id: string, data: Partial<CreditInput>) =>
  api.patch<{ credit: CreditView }>(`${BASE}/credits/${id}`, data).then((r) => r.credit)

export const cancelCredit = (id: string) =>
  api.post<{ credit: CreditView }>(`${BASE}/credits/${id}/cancel`).then((r) => r.credit)

export const addFollowUp = (creditId: string, note: string) =>
  api.post<{ followUp: FollowUp }>(`${BASE}/credits/${creditId}/follow-ups`, { note }).then((r) => r.followUp)

export const deleteFollowUp = (creditId: string, followUpId: string) =>
  api.delete<unknown>(`${BASE}/credits/${creditId}/follow-ups/${followUpId}`)

// ------------------ Pagos ------------------
export interface PaymentInput {
  creditId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate?: string
}

export interface PaymentResult {
  payment: Payment
  credit: CreditView
  coverage: { installmentsCovered: number; remainingBalance: number }
}

export const registerPayment = (data: PaymentInput) => api.post<PaymentResult>(`${BASE}/payments`, data)

export const cancelPayment = (id: string) => api.delete<unknown>(`${BASE}/payments/${id}`)

export const getPaymentReceipt = (id: string) => api.get<PaymentReceipt>(`${BASE}/payments/${id}/receipt`)
