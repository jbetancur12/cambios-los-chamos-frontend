import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
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
      const response = await api.get<{ user: User }>('/user/me')
      setUser(response.user)
      localStorage.setItem('user', JSON.stringify(response.user)) // Sync localStorage for WebSocket usage
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error)
      setUser(null)
      // Don't clear localStorage here to avoid flashing login screen if just a temporary network error?
      // But if 401, we probably should. userMiddleware usually handles 401.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse & { token?: string }>('/user/login', credentials)
    setUser(response.user)
    // Store token in localStorage as fallback when cookies don't work (e.g., mobile, cross-domain)
    if (response.token) {
      localStorage.setItem('authToken', response.token)
    }
    // Store user data in localStorage for WebSocket initialization and offline support
    localStorage.setItem('user', JSON.stringify(response.user))
  }

  const logout = async () => {
    await api.post('/user/logout')
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  const refetch = async () => {
    await fetchUser()
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
