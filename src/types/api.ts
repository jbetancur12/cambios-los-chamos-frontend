// API Response Standard
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  meta?: {
    timestamp?: string
    requestId?: string
  }
}

// User Types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MINORISTA' | 'TRANSFERENCISTA'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: User
}
