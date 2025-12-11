import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface BeneficiaryData {
  name: string
  id: string
  phone: string
  bankId: string
  accountNumber: string
  executionType: 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'RECARGA' | 'EFECTIVO' | 'ZELLE' | 'OTROS'
}

const BENEFICIARY_SUGGESTIONS_QUERY_KEY = ['beneficiary-suggestions']

export function useBeneficiarySuggestions() {
  const queryClient = useQueryClient()

  // Load suggestions from API using React Query
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: BENEFICIARY_SUGGESTIONS_QUERY_KEY,
    queryFn: async () => {
      const data = await api.get<{ suggestions: Record<string, any>[] }>('/beneficiary-suggestion/list')
      return data.suggestions.map((s) => ({
        name: s.beneficiaryName,
        id: s.beneficiaryId,
        phone: s.phone,
        bankId: s.bankId,
        accountNumber: s.accountNumber,
        executionType: s.executionType || 'TRANSFERENCIA',
      }))
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Add or update a beneficiary suggestion
  const addSuggestion = useCallback(
    async (beneficiary: BeneficiaryData) => {
      try {
        await api.post('/beneficiary-suggestion/save', {
          beneficiaryName: beneficiary.name,
          beneficiaryId: beneficiary.id,
          phone: beneficiary.phone,
          bankId: beneficiary.bankId,
          accountNumber: beneficiary.accountNumber,
          executionType: beneficiary.executionType,
        })

        // Invalidate the query to force refetch of updated suggestions
        await queryClient.invalidateQueries({
          queryKey: BENEFICIARY_SUGGESTIONS_QUERY_KEY,
        })
      } catch (error) {
        console.error('Error saving beneficiary:', error)
      }
    },
    [queryClient]
  )

  // Get suggestions based on search query
  const getSuggestions = useCallback(
    (
      query: string,
      executionType?: 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'RECARGA' | 'EFECTIVO' | 'ZELLE' | 'OTROS'
    ): BeneficiaryData[] => {
      const searchLower = query.toLowerCase()

      return suggestions.filter((b) => {
        // Filter by execution type if provided
        if (executionType && b.executionType !== executionType) {
          return false
        }

        // If no query, return all suggestions of that type
        if (!query.trim()) {
          return true
        }

        // Search by name, ID, or phone
        return (
          b.name.toLowerCase().includes(searchLower) ||
          b.id.toLowerCase().includes(searchLower) ||
          b.phone.includes(searchLower)
        )
      })
    },
    [suggestions]
  )

  // Get suggestions by name
  const getSuggestionsByName = useCallback(
    (name: string) => {
      if (!name.trim()) return []
      const searchLower = name.toLowerCase()
      return suggestions.filter((b) => b.name.toLowerCase().includes(searchLower))
    },
    [suggestions]
  )

  // Get suggestions by phone
  const getSuggestionsByPhone = useCallback(
    (phone: string) => {
      if (!phone.trim()) return []
      return suggestions.filter((b) => b.phone.includes(phone))
    },
    [suggestions]
  )

  // Get suggestions by ID
  const getSuggestionsById = useCallback(
    (id: string) => {
      if (!id.trim()) return []
      const searchLower = id.toLowerCase()
      return suggestions.filter((b) => b.id.toLowerCase().includes(searchLower))
    },
    [suggestions]
  )

  // Clear all suggestions
  const clearAllSuggestions = useCallback(async () => {
    try {
      await api.delete('/beneficiary-suggestion')
      await queryClient.invalidateQueries({
        queryKey: BENEFICIARY_SUGGESTIONS_QUERY_KEY,
      })
    } catch (error) {
      console.error('Error clearing suggestions:', error)
    }
  }, [queryClient])

  return {
    suggestions,
    isLoading,
    addSuggestion,
    getSuggestions,
    getSuggestionsByName,
    getSuggestionsByPhone,
    getSuggestionsById,
    clearAllSuggestions,
  }
}
