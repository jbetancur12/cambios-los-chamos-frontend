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

export function useBankAccountsList() {
  return useQuery({
    queryKey: ['bankAccounts', 'my-accounts'],
    queryFn: async () => {
      const response = await api.get<{ accounts: BankAccount[] }>('/bank-account/my-accounts')
      return response.accounts
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useBankAccountDetail(accountId: string | null) {
  return useQuery({
    queryKey: ['bankAccount', accountId],
    queryFn: async () => {
      if (!accountId) return null
      return await api.get<BankAccount>(`/bank-account/${accountId}`)
    },
    enabled: !!accountId,
  })
}

interface BankAccountTransactionsParams {
  accountId: string
  page?: number
  limit?: number
}

export function useBankAccountTransactions(params: BankAccountTransactionsParams) {
  const { accountId, page = 1, limit = 50 } = params

  return useQuery({
    queryKey: ['bankAccountTransactions', accountId, page, limit],
    queryFn: async () => {
      const response = await api.get<{
        transactions: BankAccountTransaction[]
        pagination: any
      }>(`/bank-account/${accountId}/transactions?page=${page}&limit=${limit}`)
      return response.transactions
    },
    enabled: !!accountId,
  })
}
