import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface DashboardStats {
  totalGiros: number
  totalAmount: number
  pendingGiros: number
  completedToday: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats')
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useMinoristaBalance() {
  return useQuery({
    queryKey: ['minorista', 'balance'],
    queryFn: async () => {
      const response = await api.get<{ balance: number; credit: any }>('/minorista/me')
      return response
    },
    staleTime: 1000 * 60, // 1 minuto
  })
}
