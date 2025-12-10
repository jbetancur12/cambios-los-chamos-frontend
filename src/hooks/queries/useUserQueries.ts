import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { UserRole } from '@/types/api'

export interface UserData {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  available?: boolean
  transferencistaId?: string
  minoristaId?: string
  balance?: number
  creditLimit?: number
  availableCredit?: number
  creditBalance?: number
}

interface AdminResponse {
  users: any[]
}

interface TransferencistaResponse {
  transferencistas: {
    id: string
    available: boolean
    user: { id: string }
  }[]
}

interface MinoristaResponse {
  minoristas: {
    id: string
    balance: number
    creditLimit: number
    availableCredit: number
    creditBalance: number
    user: { id: string }
  }[]
}

// Hook for fetching all users by role
export function useAllUsers(role?: UserRole | 'ALL' | null) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: async () => {
      const usersData = await fetchUsersByRole(role)
      return usersData
    },
    enabled: role !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook for fetching transferencistas
export function useTransferencistas() {
  return useQuery({
    queryKey: ['users', 'TRANSFERENCISTA'],
    queryFn: async () => {
      const response = await api.get<AdminResponse>('/user/by-role/TRANSFERENCISTA')
      const transferencistaResponse = await api.get<TransferencistaResponse>('/transferencista/list')

      const transferencistaMap = new Map(
        transferencistaResponse.transferencistas.map((t) => [t.user.id, { id: t.id, available: t.available }])
      )

      return response.users.map((user) => {
        const transferencistaData = transferencistaMap.get(user.id)
        return {
          ...user,
          available: transferencistaData?.available,
          transferencistaId: transferencistaData?.id,
        } as UserData
      })
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook for fetching minoristas
export function useMinoristas() {
  return useQuery({
    queryKey: ['users', 'MINORISTA'],
    queryFn: async () => {
      const response = await api.get<AdminResponse>('/user/by-role/MINORISTA')
      const minoristaResponse = await api.get<MinoristaResponse>('/minorista/list')

      const minoristaMap = new Map(
        minoristaResponse.minoristas.map((m) => [
          m.user.id,
          {
            id: m.id,
            balance: m.balance,
            creditLimit: m.creditLimit,
            availableCredit: m.availableCredit,
            creditBalance: m.creditBalance,
          },
        ])
      )

      return response.users.map((user) => {
        const minoristaData = minoristaMap.get(user.id)
        return {
          ...user,
          minoristaId: minoristaData?.id,
          balance: minoristaData?.balance,
          creditLimit: minoristaData?.creditLimit,
          availableCredit: minoristaData?.availableCredit,
          creditBalance: minoristaData?.creditBalance,
        } as UserData
      })
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook for fetching admins
export function useAdmins() {
  return useQuery({
    queryKey: ['users', 'ADMIN'],
    queryFn: async () => {
      const response = await api.get<AdminResponse>('/user/by-role/ADMIN')
      return response.users as UserData[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Helper function to fetch users by role
async function fetchUsersByRole(role?: UserRole | 'ALL' | null): Promise<UserData[]> {
  if (role && role !== 'ALL') {
    if (role === 'TRANSFERENCISTA') {
      const response = await api.get<AdminResponse>(`/user/by-role/${role}`)
      const transferencistaResponse = await api.get<TransferencistaResponse>('/transferencista/list')

      const transferencistaMap = new Map(
        transferencistaResponse.transferencistas.map((t) => [t.user.id, { id: t.id, available: t.available }])
      )

      return response.users.map((user) => {
        const transferencistaData = transferencistaMap.get(user.id)
        return {
          ...user,
          available: transferencistaData?.available,
          transferencistaId: transferencistaData?.id,
        }
      })
    }

    if (role === 'MINORISTA') {
      const response = await api.get<AdminResponse>(`/user/by-role/${role}`)
      const minoristaResponse = await api.get<MinoristaResponse>('/minorista/list')

      const minoristaMap = new Map(
        minoristaResponse.minoristas.map((m) => [
          m.user.id,
          {
            id: m.id,
            balance: m.balance,
            creditLimit: m.creditLimit,
            availableCredit: m.availableCredit,
            creditBalance: m.creditBalance,
          },
        ])
      )

      return response.users.map((user) => {
        const minoristaData = minoristaMap.get(user.id)
        return {
          ...user,
          minoristaId: minoristaData?.id,
          balance: minoristaData?.balance,
          creditLimit: minoristaData?.creditLimit,
          availableCredit: minoristaData?.availableCredit,
          creditBalance: minoristaData?.creditBalance,
        }
      })
    }

    // ADMIN or other roles
    const response = await api.get<AdminResponse>(`/user/by-role/${role}`)
    return response.users
  }

  // Fetch all roles
  const [
    superAdminsResponse,
    adminsResponse,
    transferencistasResponse,
    minoristasResponse,
    transferencistaListResponse,
    minoristaListResponse,
  ] = await Promise.all([
    api.get<AdminResponse>('/user/by-role/SUPER_ADMIN').catch(() => ({ users: [] })),
    api.get<AdminResponse>('/user/by-role/ADMIN'),
    api.get<AdminResponse>('/user/by-role/TRANSFERENCISTA'),
    api.get<AdminResponse>('/user/by-role/MINORISTA'),
    api.get<TransferencistaResponse>('/transferencista/list'),
    api.get<MinoristaResponse>('/minorista/list'),
  ])

  const transferencistaMap = new Map(
    transferencistaListResponse.transferencistas.map((t) => [t.user.id, { id: t.id, available: t.available }])
  )

  const minoristaMap = new Map(
    minoristaListResponse.minoristas.map((m) => [
      m.user.id,
      {
        id: m.id,
        balance: m.balance,
        creditLimit: m.creditLimit,
        availableCredit: m.availableCredit,
        creditBalance: m.creditBalance,
      },
    ])
  )

  const transferencistasData = transferencistasResponse.users.map((user) => {
    const transferencistaData = transferencistaMap.get(user.id)
    return {
      ...user,
      available: transferencistaData?.available,
      transferencistaId: transferencistaData?.id,
    }
  })

  const minoristasData = minoristasResponse.users.map((user) => {
    const minoristaData = minoristaMap.get(user.id)
    return {
      ...user,
      minoristaId: minoristaData?.id,
      balance: minoristaData?.balance,
      creditLimit: minoristaData?.creditLimit,
      availableCredit: minoristaData?.availableCredit,
      creditBalance: minoristaData?.creditBalance,
    }
  })

  return [...superAdminsResponse.users, ...adminsResponse.users, ...transferencistasData, ...minoristasData]
}
