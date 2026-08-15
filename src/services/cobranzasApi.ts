import { api } from '@/lib/api'
import type {
  CashBalance,
  ClientCategory,
  CobranzaClient,
  CobranzaRoute,
  Credit,
  CreditDetail,
  CreditFrequency,
  CreditStatus,
  InterestRate,
  LoanFrequency,
  Paginated,
  Payment,
  PaymentMethod,
} from '@/types/cobranzas'

const BASE = '/cobranzas'

// ------------------ Dashboard ------------------
export interface CobranzasStats {
  credits: Record<string, number>
  totalClients: number
  activeClients: number
  totalPortfolio: number
  totalCollectedToday: number
  paymentsToday: number
  overdueAmount: number
  requiringAttention: number
  openCashBalance: number
  pendingClosures: number
}

export const getCobranzasStats = () =>
  api.get<{ stats: CobranzasStats }>(`${BASE}/dashboard/stats`).then((r) => r.stats)

export const getRecentActivity = () =>
  api
    .get<{
      activity: {
        payments: { id: string; clientName: string; amount: number; paymentDate: string; paymentMethod: string }[]
        newCredits: { id: string; clientName: string; amount: number; createdAt: string; status: string }[]
      }
    }>(`${BASE}/dashboard/recent-activity`)
    .then((r) => r.activity)

export const getFinancialSummary = () =>
  api
    .get<{
      summary: {
        totalFinanced: number
        totalCollected: number
        outstanding: number
        defaultedAmount: number
        monthlyCollected: { month: string; total: number }[]
      }
    }>(`${BASE}/dashboard/financial-summary`)
    .then((r) => r.summary)

// ------------------ Clientes ------------------
export interface CobranzaClientInput {
  name: string
  identification: string
  phone?: string
  email?: string
  address?: string
  categoryId?: string | null
  creditLimitOverride?: number | null
  maxCreditsOverride?: number | null
  latitude?: number | null
  longitude?: number | null
  notes?: string
}

export const listClients = (params?: Record<string, unknown>) =>
  api.get<Paginated<CobranzaClient>>(`${BASE}/clients`, { params }).then((r) => r)

export const getClient = (id: string) =>
  api
    .get<{ client: CobranzaClient; activeCredits: Credit[]; paymentHistory: Payment[] }>(`${BASE}/clients/${id}`)
    .then((r) => r)

export const createClient = (data: CobranzaClientInput) =>
  api.post<{ client: CobranzaClient }>(`${BASE}/clients`, data).then((r) => r.client)

export const updateClient = (id: string, data: Partial<CobranzaClientInput>) =>
  api.patch<{ client: CobranzaClient }>(`${BASE}/clients/${id}`, data).then((r) => r.client)

export const toggleClientActive = (id: string) =>
  api.patch<{ client: CobranzaClient }>(`${BASE}/clients/${id}/toggle-active`).then((r) => r.client)

export const deleteClient = (id: string) => api.delete<{ message: string }>(`${BASE}/clients/${id}`)

// ------------------ Categorías ------------------
export interface ClientCategoryInput {
  code: string
  name: string
  description?: string
  isActive?: boolean
  minOverdueCount?: number | null
  maxOverdueCount?: number | null
  maxAmount?: number | null
  minAmount?: number
  maxCredits?: number | null
}

export const listCategories = (activeOnly = false) =>
  api.get<{ categories: ClientCategory[] }>(`${BASE}/categories`, { params: { activeOnly } }).then((r) => r.categories)

export const createCategory = (data: ClientCategoryInput) =>
  api.post<{ category: ClientCategory }>(`${BASE}/categories`, data).then((r) => r.category)

export const updateCategory = (id: string, data: Partial<ClientCategoryInput>) =>
  api.patch<{ category: ClientCategory }>(`${BASE}/categories/${id}`, data).then((r) => r.category)

export const toggleCategoryActive = (id: string) =>
  api.patch<{ category: ClientCategory }>(`${BASE}/categories/${id}/toggle-active`).then((r) => r.category)

export const deleteCategory = (id: string) => api.delete<{ message: string }>(`${BASE}/categories/${id}`)

// ------------------ Tasas de interés ------------------
export interface InterestRateInput {
  name?: string
  rate: number
  isActive?: boolean
}

export const listInterestRates = (activeOnly = false) =>
  api.get<{ rates: InterestRate[] }>(`${BASE}/interest-rates`, { params: { activeOnly } }).then((r) => r.rates)

export const createInterestRate = (data: InterestRateInput) =>
  api.post<{ rate: InterestRate }>(`${BASE}/interest-rates`, data).then((r) => r.rate)

export const updateInterestRate = (id: string, data: Partial<InterestRateInput>) =>
  api.patch<{ rate: InterestRate }>(`${BASE}/interest-rates/${id}`, data).then((r) => r.rate)

export const toggleInterestRateActive = (id: string) =>
  api.patch<{ rate: InterestRate }>(`${BASE}/interest-rates/${id}/toggle-active`).then((r) => r.rate)

export const deleteInterestRate = (id: string) => api.delete<{ message: string }>(`${BASE}/interest-rates/${id}`)

// ------------------ Frecuencias ------------------
export const listLoanFrequencies = (enabledOnly = true) =>
  api
    .get<{ frequencies: LoanFrequency[] }>(`${BASE}/loan-frequencies`, { params: { enabledOnly } })
    .then((r) => r.frequencies)

export interface LoanFrequencyInput {
  name?: string
  description?: string
  isEnabled?: boolean
  isFixedDuration?: boolean
  fixedInstallments?: number | null
  fixedDurationDays?: number | null
  periodDays?: number
  defaultInstallments?: number | null
  minInstallments?: number | null
  maxInstallments?: number | null
  interestRate?: number | null
}

export const updateLoanFrequency = (id: string, data: LoanFrequencyInput) =>
  api.patch<{ frequency: LoanFrequency }>(`${BASE}/loan-frequencies/${id}`, data).then((r) => r.frequency)

// ------------------ Rutas ------------------
export interface CobranzaRouteInput {
  name: string
  description?: string
  cobradorId: string
  clientIds?: string[]
}

export const listRoutes = () => api.get<{ routes: CobranzaRoute[] }>(`${BASE}/routes`).then((r) => r.routes)

export const getRoute = (id: string) => api.get<{ route: CobranzaRoute }>(`${BASE}/routes/${id}`).then((r) => r.route)

export const getAvailableClients = () =>
  api.get<{ clients: CobranzaClient[] }>(`${BASE}/routes/available-clients`).then((r) => r.clients)

export const createRoute = (data: CobranzaRouteInput) =>
  api.post<{ route: CobranzaRoute }>(`${BASE}/routes`, data).then((r) => r.route)

export const updateRoute = (id: string, data: Partial<CobranzaRouteInput>) =>
  api.patch<{ route: CobranzaRoute }>(`${BASE}/routes/${id}`, data).then((r) => r.route)

export const assignClientsToRoute = (id: string, clientIds: string[]) =>
  api.post<{ route: CobranzaRoute }>(`${BASE}/routes/${id}/clients`, { clientIds }).then((r) => r.route)

export const removeClientFromRoute = (routeId: string, clientId: string) =>
  api.delete<{ route: CobranzaRoute }>(`${BASE}/routes/${routeId}/clients/${clientId}`).then((r) => r.route)

export const deleteRoute = (id: string) => api.delete<{ message: string }>(`${BASE}/routes/${id}`)

// ------------------ Créditos ------------------
export interface CreateCreditInput {
  clientId: string
  amount: number
  frequency: CreditFrequency
  startDate: string
  endDate?: string
  scheduledDeliveryDate?: string | null
  immediateDeliveryRequested?: boolean
  interestRate?: number
  totalInstallments?: number | null
  description?: string
  downPayment?: number | null
  isCustomCredit?: boolean
  calcOnRemainingAmount?: boolean
  isLegacyCredit?: boolean
}

export const listCredits = (params?: Record<string, unknown>) =>
  api.get<Paginated<Credit>>(`${BASE}/credits`, { params }).then((r) => r)

export const getCreditCounts = () =>
  api.get<{ counts: Record<CreditStatus, number> }>(`${BASE}/credits/counts`).then((r) => r.counts)

export const getCreditDetail = (id: string) => api.get<CreditDetail>(`${BASE}/credits/${id}`).then((r) => r)

export const createCredit = (data: CreateCreditInput) =>
  api.post<{ credit: Credit }>(`${BASE}/credits`, data).then((r) => r.credit)

export const updateCredit = (id: string, data: Partial<CreateCreditInput>) =>
  api.patch<{ credit: Credit }>(`${BASE}/credits/${id}`, data).then((r) => r.credit)

export const approveCredit = (id: string, scheduledDeliveryDate: string, notes?: string) =>
  api.post<{ credit: Credit }>(`${BASE}/credits/${id}/approve`, { scheduledDeliveryDate, notes }).then((r) => r.credit)

export const rejectCredit = (id: string, reason: string) =>
  api.post<{ credit: Credit }>(`${BASE}/credits/${id}/reject`, { reason }).then((r) => r.credit)

export const deliverCredit = (id: string, notes?: string, firstPaymentToday = false) =>
  api.post<{ credit: Credit }>(`${BASE}/credits/${id}/deliver`, { notes, firstPaymentToday }).then((r) => r.credit)

export const rescheduleCredit = (id: string, scheduledDeliveryDate: string, reason?: string) =>
  api
    .post<{ credit: Credit }>(`${BASE}/credits/${id}/reschedule`, { scheduledDeliveryDate, reason })
    .then((r) => r.credit)

// ------------------ Pagos ------------------
export interface RegisterPaymentInput {
  creditId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate?: string
  transactionId?: string
  cashBalanceId?: string | null
}

export const listPayments = (params?: Record<string, unknown>) =>
  api.get<Paginated<Payment>>(`${BASE}/payments`, { params }).then((r) => r)

export const getRecentPayments = (limit = 20) =>
  api.get<{ payments: Payment[] }>(`${BASE}/payments/recent`, { params: { limit } }).then((r) => r.payments)

export const getTodayPaymentSummary = () =>
  api
    .get<{
      summary: {
        totalCollected: number
        paymentCount: number
        byMethod: { method: string; total: number; count: number }[]
      }
    }>(`${BASE}/payments/today-summary`)
    .then((r) => r.summary)

export const registerPayment = (data: RegisterPaymentInput) =>
  api.post<{ payment: Payment }>(`${BASE}/payments`, data).then((r) => r.payment)

export const cancelPayment = (id: string) => api.delete<{ message: string }>(`${BASE}/payments/${id}`)

// ------------------ Caja ------------------
export const listCashBalances = (params?: Record<string, unknown>) =>
  api.get<Paginated<CashBalance>>(`${BASE}/cash-balances`, { params }).then((r) => r)

export const getCurrentCashBalance = () =>
  api.get<{ balance: CashBalance | null }>(`${BASE}/cash-balances/current-status`).then((r) => r.balance)

export const getPendingClosures = () =>
  api.get<{ balances: CashBalance[] }>(`${BASE}/cash-balances/pending-closures`).then((r) => r.balances)

export const openCashBalance = (data: { initialAmount?: number; date?: string; notes?: string }) =>
  api.post<{ balance: CashBalance }>(`${BASE}/cash-balances/open`, data).then((r) => r.balance)

export const autoCalculateCashBalance = (id: string) =>
  api.post<{ balance: CashBalance }>(`${BASE}/cash-balances/${id}/auto-calculate`).then((r) => r.balance)

export const closeCashBalance = (
  id: string,
  data: { lentAmount?: number; notes?: string; requiresReconciliation?: boolean }
) => api.post<{ balance: CashBalance }>(`${BASE}/cash-balances/${id}/close`, data).then((r) => r.balance)

export const getCashBalanceDetail = (id: string) =>
  api
    .get<{
      balance: CashBalance
      payments: {
        id: string
        clientName: string
        amount: number
        paymentDate: string
        paymentMethod: string
        creditId: string
      }[]
      openCreditsCount: number
    }>(`${BASE}/cash-balances/${id}/detailed`)
    .then((r) => r)
