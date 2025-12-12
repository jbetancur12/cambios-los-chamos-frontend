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
  minoristaId?: string
  transferencistaId?: string
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
export type BankAccountOwnerType = 'TRANSFERENCISTA' | 'ADMIN'

export interface BankAccount {
  id: string
  accountNumber?: string
  accountHolder: string
  accountType?: AccountType
  balance: number
  bank: Bank
  // ✨ NUEVO: Tipo de propietario
  ownerType: BankAccountOwnerType
  // ✨ NUEVO: ID del propietario (null si es compartida)
  ownerId?: string
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
  creditLimit: number
  availableCredit: number
  creditBalance: number
  user: User
}

// Giro Types
export type GiroStatus = 'PENDIENTE' | 'ASIGNADO' | 'PROCESANDO' | 'COMPLETADO' | 'CANCELADO' | 'DEVUELTO'

export type ExecutionType = 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'EFECTIVO' | 'ZELLE' | 'OTROS' | 'RECARGA'

export type Currency = 'VES' | 'COP' | 'USD'

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
  bankCode: number
  accountNumber: string
  phone: string
  amountInput: number
  currencyInput: Currency
  amountBs: number
  bcvValueApplied: number
  paymentProofKey: string
  systemProfit: number
  minoristaProfit: number
  commission: number | null
  status: GiroStatus
  proofUrl?: string
  executionType?: ExecutionType
  returnReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
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
  executedBy?: {
    id: string
    fullName: string
    email: string
  }
}

// Bank Account Transaction Types
export type BankAccountTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'

export interface BankAccountTransaction {
  id: string
  amount: number
  fee: number
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

// Minorista Transaction Types
export type MinoristaTransactionType = 'RECHARGE' | 'DISCOUNT' | 'ADJUSTMENT' | 'REFUND'

export interface MinoristaTransaction {
  id: string
  amount: number
  type: MinoristaTransactionType
  previousAvailableCredit: number
  availableCredit: number
  currentBalance: number
  previousBalanceInFavor?: number // Optional for backward compatibility with old transactions
  currentBalanceInFavor?: number // Optional for backward compatibility with old transactions
  creditConsumed?: number
  profitEarned?: number
  accumulatedDebt?: number
  accumulatedProfit?: number
  balanceInFavorUsed?: number
  creditUsed?: number
  remainingBalance?: number
  externalDebt?: number
  description?: string
  createdAt: string
}
