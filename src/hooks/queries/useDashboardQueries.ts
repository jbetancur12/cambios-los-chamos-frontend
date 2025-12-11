import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { applyDedupConfig } from '@/lib/deduplication'

interface DashboardStats {
  girosCount?: number
  girosLabel?: string
  fees?: number
  volumeBs?: number
  volumeCOP?: number
  volumeUSD?: number
  systemEarnings?: number
  minoristaEarnings?: number
  earnings?: number
  processingToday?: number
  completedToday?: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats')
      return response
    },
    ...applyDedupConfig('NORMAL'), // 5 min - stats cambian moderadamente
  })
}

export function useMinoristaBalance(userRole?: string) {
  return useQuery({
    queryKey: ['minorista', 'balance'],
    queryFn: async () => {
      const response = await api.get<{ balance: number; credit: Record<string, unknown> }>('/minorista/me')
      return response
    },
    ...applyDedupConfig('NORMAL'), // 5 min - balance actualiza regularmente
    enabled: userRole === 'MINORISTA',
  })
}
