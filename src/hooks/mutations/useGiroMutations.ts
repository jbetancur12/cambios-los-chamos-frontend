import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro, Currency } from '@/types/api'

export interface CreateGiroInput {
  beneficiaryName: string
  beneficiaryId: string
  phone: string
  bankId: string
  accountNumber: string
  amountInput: number
  currencyInput: Currency
  customRate?: {
    buyRate: number
    sellRate: number
    usd: number
    bcv: number
  }
}

interface ExecuteGiroInput {
  giroId: string
  data: {
    bankAccountId: string
    executionType: string
    fee: number
    proofUrl?: string
  }
}

interface ReturnGiroInput {
  giroId: string
  reason: string
}

interface UpdateGiroInput {
  giroId: string
  data: {
    beneficiaryName?: string
    beneficiaryId?: string
    phone?: string
    bankId?: string
    accountNumber?: string
    status?: string
  }
}

interface UpdateGiroRateInput {
  giroId: string
  data: {
    buyRate: number
    sellRate: number
    usd: number
    bcv: number
  }
}

export function useCreateGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGiroInput) => {
      const response = await api.post<{ giro: Giro; message: string }>('/giro/create', data)
      return response.giro
    },
    onSuccess: () => {
      // Invalidar y refetchear inmediatamente las queries activas
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false, refetchType: 'active' })
    },
  })
}

export function useExecuteGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ giroId, data }: ExecuteGiroInput) => {
      const response = await api.post<{ giro: Giro; message: string }>(`/giro/${giroId}/execute`, data)
      return response.giro
    },
    onSuccess: (giro) => {
      // Invalidar giro específico y lista + balance de cuentas bancarias - refetchear inmediatamente
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false, refetchType: 'active' })
    },
  })
}

export function useMarkGiroAsProcessing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (giroId: string) => {
      const response = await api.post<{ giro: Giro; message: string }>(`/giro/${giroId}/mark-processing`, {})
      return response.giro
    },
    onSuccess: (giro) => {
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'active' })
      // Invalidar cuentas bancarias porque se abrirá el formulario de ejecución
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false, refetchType: 'active' })
    },
  })
}

export function useReturnGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ giroId, reason }: ReturnGiroInput) => {
      const response = await api.post<{ giro: Giro; message: string }>(`/giro/${giroId}/return`, {
        reason,
      })
      return response.giro
    },
    onSuccess: (giro) => {
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false, refetchType: 'active' })
    },
  })
}

export function useDeleteGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (giroId: string) => {
      await api.delete(`/giro/${giroId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false, refetchType: 'active' })
    },
  })
}

export function useUpdateGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ giroId, data }: UpdateGiroInput) => {
      const response = await api.patch<{ giro: Giro; message: string }>(`/giro/${giroId}`, data)
      return response.giro
    },
    onSuccess: (giro) => {
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'active' })
    },
  })
}

// ... existing code ...
export function useUpdateGiroRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ giroId, data }: UpdateGiroRateInput) => {
      const response = await api.patch<{ giro: Giro; message: string }>(`/giro/${giroId}/rate`, data)
      return response.giro
    },
    onSuccess: (giro) => {
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'active' })
    },
  })
}

interface CreateMobilePaymentInput {
  cedula: string
  bankId: string
  phone: string
  contactoEnvia: string
  amountCop: number
  customRate?: {
    buyRate: number
    sellRate: number
    usd: number
    bcv: number
  }
}

export function useCreateMobilePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMobilePaymentInput) => {
      // Note: The backend endpoint is /giro/mobile-payment/create.
      // We assume the caller constructs the payload correctly.
      await api.post('/giro/mobile-payment/create', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false, refetchType: 'all' })
    },
  })
}

interface CreateRechargeInput {
  operatorId: string
  amountBsId: string
  phone: string
  contactoEnvia: string
}

export function useCreateRecharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRechargeInput) => {
      await api.post('/giro/recharge/create', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false, refetchType: 'all' })
    },
  })
}
