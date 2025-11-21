import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// System Report Types
export interface SystemProfitReport {
  totalProfit: number
  totalGiros: number
  completedGiros: number
  averageProfitPerGiro: number
  profitByStatus: Array<{
    status: string
    count: number
    totalProfit: number
  }>
}

export interface ProfitTrendData {
  date: string
  profit: number
}

export interface SystemProfitTrendReport {
  trendData: ProfitTrendData[]
  totalProfit: number
  totalGiros: number
  completedGiros: number
  averageProfitPerGiro: number
}

// Minorista Report Types
export interface MinoristaProfit {
  minoristaId: string
  minoristaName: string
  email: string
  totalProfit: number
  giroCount: number
  availableCredit: number
}

export interface TopMinoristaReport {
  minoristas: MinoristaProfit[]
  totalMinoristas: number
}

// Bank Report Types
export interface BankTransactionReport {
  totalTransactions: number
  totalDeposits: number
  totalWithdrawals: number
  totalAdjustments: number
  depositAmount: number
  withdrawalAmount: number
  adjustmentAmount: number
  netAmount: number
}

// Minorista Transaction Report Types
export interface MinoristaTransactionReport {
  totalTransactions: number
  recharges: number
  discounts: number
  adjustments: number
  profits: number
  totalRechargeAmount: number
  totalDiscountAmount: number
  totalAdjustmentAmount: number
  totalProfitAmount: number
}

// Minorista Giro Report Types
export interface MinoristaGiroTrendData {
  date: string
  moneyTransferred: number
  profit: number
}

export interface MinoristaGiroReport {
  totalMoneyTransferred: number
  totalProfit: number
  totalGiros: number
  completedGiros: number
  averageProfitPerGiro: number
  moneyTransferredByStatus: {
    status: string
    count: number
    totalAmount: number
    totalProfit: number
  }[]
}

export interface MinoristaGiroTrendReport {
  trendData: MinoristaGiroTrendData[]
  totalMoneyTransferred: number
  totalProfit: number
  totalGiros: number
  completedGiros: number
  averageProfitPerGiro: number
}

// Query hook for system profit report
export function useSystemProfitReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'system-profit', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<SystemProfitReport>(
        `/reports/system-profit?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Query hook for system profit trend report
export function useSystemProfitTrendReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'system-profit-trend', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<SystemProfitTrendReport>(
        `/reports/system-profit-trend?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Query hook for minorista profit report
export function useMinoristaProfitReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'minorista-profit', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<TopMinoristaReport>(
        `/reports/minorista-profit?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Query hook for bank transaction report
export function useBankTransactionReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'bank-transactions', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<BankTransactionReport>(
        `/reports/bank-transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Query hook for minorista transaction report
export function useMinoristaTransactionReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'minorista-transactions', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<MinoristaTransactionReport>(
        `/reports/minorista-transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Query hook for minorista giro report
export function useMinoristaGiroReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'minorista-giros', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<MinoristaGiroReport>(
        `/reports/minorista/giros?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Query hook for minorista giro trend report
export function useMinoristaGiroTrendReport(
  dateFrom: string | null,
  dateTo: string | null
) {
  return useQuery({
    queryKey: ['reports', 'minorista-giros-trend', { dateFrom, dateTo }],
    queryFn: async () => {
      const response = await api.get<MinoristaGiroTrendReport>(
        `/reports/minorista/giros-trend?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      return response
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
