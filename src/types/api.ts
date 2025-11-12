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

// Minorista Types
export interface Minorista {
  id: string
  balance: number
  user: User
}

// Giro Types
export enum GiroStatus {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  PROCESANDO = 'PROCESANDO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

export enum ExecutionType {
  TRANSFERENCIA = 'TRANSFERENCIA',
  PAGO_MOVIL = 'PAGO_MOVIL',
  EFECTIVO = 'EFECTIVO',
  ZELLE = 'ZELLE',
  OTROS = 'OTROS',
}

export enum Currency {
  VES = 'VES',
  COP = 'COP',
  USD = 'USD',
}

export interface ExchangeRate {
  id: string
  buyRate: number
  sellRate: number
  usd: number
  bcv: number
  createdAt: string
}

export interface Giro {
  id: string
  beneficiaryName: string
  beneficiaryId: string
  bankName: string
  accountNumber: string
  phone: string
  amountInput: number
  currencyInput: Currency
  amountBs: number
  bcvValueApplied: number
  systemProfit: number
  minoristaProfit: number
  status: GiroStatus
  proofUrl?: string
  executionType?: ExecutionType
  createdAt: string
  updatedAt: string
  minorista?: {
    id: string
    user: User
  }
  transferencista?: {
    id: string
    user: User
  }
  rateApplied: ExchangeRate
  createdBy: User
  bankAccountUsed?: BankAccount
}

// Bank Account Transaction Types
export enum BankAccountTransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface BankAccountTransaction {
  id: string
  amount: number
  type: BankAccountTransactionType
  reference?: string
  previousBalance: number
  currentBalance: number
  createdBy: {
    id: string
    fullName: string
    email: string
  }
  createdAt: string
}
