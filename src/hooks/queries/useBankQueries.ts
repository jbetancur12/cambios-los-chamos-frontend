import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Bank, BankAccount, BankAccountTransaction } from '@/types/api'

export function useBanksList() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await api.get<{ banks: Bank[] }>('/bank/all')
      return response.banks
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}

export function useBankAccountsList(userRole?: string) {
  return useQuery({
    queryKey: ['bankAccounts', userRole === 'TRANSFERENCISTA' ? 'my-accounts' : 'all'],
    queryFn: async () => {
      // SUPER_ADMIN/ADMIN: obtener todas las cuentas
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
        const response = await api.get<{ bankAccounts: BankAccount[] }>('/bank-account/all')
        return response.bankAccounts
      }

      // TRANSFERENCISTA: obtener sus propias cuentas
      const response = await api.get<{ bankAccounts: BankAccount[] }>('/bank-account/my-accounts')
      return response.bankAccounts
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: userRole === 'TRANSFERENCISTA' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN',
  })
}

export function useBankAccountDetail(accountId: string | null) {
  return useQuery({
    queryKey: ['bankAccount', accountId],
    queryFn: async () => {
      if (!accountId) return null
      const response = await api.get<{ bankAccount: BankAccount }>(`/bank-account/${accountId}`)
      return response.bankAccount
    },
    enabled: !!accountId,
  })
}

export interface BankAccountTransactionsParams {
  accountId: string
  page?: number
  limit?: number
  startDate?: string | null
  endDate?: string | null
}

export interface BankAccountTransactionsResponse {
  transactions: BankAccountTransaction[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useBankAccountTransactions(params: BankAccountTransactionsParams) {
  const { accountId, page = 1, limit = 50, startDate = null, endDate = null } = params

  return useQuery({
    queryKey: ['bankAccountTransactions', accountId, page, limit, startDate, endDate],
    queryFn: async () => {
      let url = `/bank-account/${accountId}/transactions?page=${page}&limit=${limit}`

      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }

      const response = await api.get<BankAccountTransactionsResponse>(url)
      return response
    },
    enabled: !!accountId,
  })
}
