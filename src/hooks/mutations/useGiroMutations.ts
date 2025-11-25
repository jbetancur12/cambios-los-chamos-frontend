import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro, Currency } from '@/types/api'

interface CreateGiroInput {
  beneficiaryName: string
  beneficiaryId: string
  phone: string
  bankId: string
  accountNumber: string
  amountInput: number
  currencyInput: Currency
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
    beneficiaryName: string
    beneficiaryId: string
    phone: string
    bankId: string
    accountNumber: string
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
      // Invalidar TODAS las queries relacionadas a giros (con exact: false)
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false })
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
      // Invalidar giro específico y lista + balance de cuentas bancarias
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id] })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
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
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id] })
      queryClient.invalidateQueries({ queryKey: ['giros'] })
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
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id] })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
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
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
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
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id] })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
    },
  })
}

export function useUpdateGiroRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ giroId, data }: UpdateGiroRateInput) => {
      const response = await api.patch<{ giro: Giro; message: string }>(`/giro/${giroId}/rate`, data)
      return response.giro
    },
    onSuccess: (giro) => {
      queryClient.invalidateQueries({ queryKey: ['giro', giro.id] })
      queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
    },
  })
}
