import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User, LoginRequest, LoginResponse } from '@/types/api'

import { api, ApiError } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ user: User }>('/user/me')
      setUser(response.user)
      localStorage.setItem('user', JSON.stringify(response.user)) // Sync localStorage for WebSocket usage
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error)

      // Only clear session if explicitly unauthorized (expired or invalid token)
      // This protects against network errors (offline/flakey connection) clearing the session
      if (error instanceof ApiError && (error.code === 'UNAUTHORIZED' || error.code === 'INVALID_TOKEN')) {
        setUser(null)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
      // If it's a network error or other server error, we keep the local user state
      // This allows the app to stay "logged in" while offline or during server hiccups
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
