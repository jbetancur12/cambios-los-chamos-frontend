import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, LoginRequest, LoginResponse } from '@/types/api'
import { api } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      setLoading(true)
      console.log('[AuthContext] Fetching user...')
      const response = await api.get<{ user: User }>('/api/user/me')
      console.log('[AuthContext] User fetched successfully:', response.user)
      setUser(response.user)
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/api/user/login', credentials)
    setUser(response.user)
  }

  const logout = async () => {
    await api.post('/api/user/logout')
    setUser(null)
  }

  const refetch = async () => {
    await fetchUser()
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
