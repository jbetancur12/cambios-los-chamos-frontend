import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { applyDedupConfig } from '@/lib/deduplication'
import type { Bank, BankAccount, BankAccountTransaction } from '@/types/api'

export function useBanksList() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await api.get<{ banks: Bank[] }>('/bank/all')
      return response.banks
    },
    ...applyDedupConfig('LOW_PRIORITY'), // 24 horas - bancos casi nunca cambian
  })
}

export function useBankAccountsList(userRole?: string, forExecution?: boolean) {
  return useQuery({
    queryKey: [
      'bankAccounts',
      userRole === 'TRANSFERENCISTA' ? 'my-accounts' : 'all',
      forExecution ? 'execution' : 'all',
    ],
    queryFn: async () => {
      // TRANSFERENCISTA: obtener sus propias cuentas
      if (userRole === 'TRANSFERENCISTA') {
        const response = await api.get<{ bankAccounts: BankAccount[] }>('/bank-account/my-accounts')
        return response.bankAccounts
      }

      // SUPER_ADMIN/ADMIN: obtener todas las cuentas
      const response = await api.get<{ bankAccounts: BankAccount[] }>('/bank-account/all')

      // Si es para ejecutar giros, filtrar solo cuentas ADMIN
      if (forExecution) {
        return response.bankAccounts.filter((account) => account.ownerType === 'ADMIN')
      }

      return response.bankAccounts
    },
    ...applyDedupConfig('NORMAL'), // 5 min - cuentas cambian moderadamente
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
    ...applyDedupConfig('NORMAL'), // 5 min - detalles de cuenta
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
    ...applyDedupConfig('HIGH_PRIORITY'), // 30s - transacciones que cambian rápido
    enabled: !!accountId,
  })
}
