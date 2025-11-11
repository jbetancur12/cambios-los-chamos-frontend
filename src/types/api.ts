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

// Bank Types
export interface Bank {
  id: string
  name: string
  code?: string
}

// Bank Account Types
export type AccountType = 'AHORROS' | 'CORRIENTE'

export interface BankAccount {
  id: string
  accountNumber: string
  accountHolder: string
  accountType: AccountType
  balance: number
  bank: Bank
  transferencista?: {
    id: string
    user: {
      fullName: string
      email: string
    }
  }
}

// Transferencista Types
export interface Transferencista {
  id: string
  available: boolean
  user: User
  bankAccounts?: BankAccount[]
}
