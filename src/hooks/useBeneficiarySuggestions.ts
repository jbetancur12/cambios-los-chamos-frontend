import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'

export interface BeneficiaryData {
  name: string
  id: string
  phone: string
  bankId: string
  accountNumber: string
  executionType: 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'RECARGA' | 'EFECTIVO' | 'ZELLE' | 'OTROS'
}

export function useBeneficiarySuggestions() {
  const [suggestions, setSuggestions] = useState<BeneficiaryData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load suggestions from API on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoading(true)
      try {
        const data = await api.get<{ suggestions: any[] }>('/beneficiary-suggestion/list')
        const beneficiaries = data.suggestions.map((s: any) => ({
          name: s.beneficiaryName,
          id: s.beneficiaryId,
          phone: s.phone,
          bankId: s.bankId,
          accountNumber: s.accountNumber,
          executionType: s.executionType || 'TRANSFERENCIA',
        }))
        setSuggestions(beneficiaries)
      } catch (error) {
        console.error('Error loading suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [])

  // Add or update a beneficiary suggestion
  const addSuggestion = useCallback(async (beneficiary: BeneficiaryData) => {
    try {
      await api.post('/beneficiary-suggestion/save', {
        beneficiaryName: beneficiary.name,
        beneficiaryId: beneficiary.id,
        phone: beneficiary.phone,
        bankId: beneficiary.bankId,
        accountNumber: beneficiary.accountNumber,
        executionType: beneficiary.executionType,
      })

      // Update local state optimistically
      setSuggestions((prev) => {
        const filtered = prev.filter(
          (b) => !(b.name === beneficiary.name && b.id === beneficiary.id && b.phone === beneficiary.phone && b.executionType === beneficiary.executionType)
        )
        return [beneficiary, ...filtered]
      })
    } catch (error) {
      console.error('Error saving beneficiary:', error)
    }
  }, [])

  // Get suggestions based on search query
  const getSuggestions = useCallback(
    (query: string, executionType?: 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'RECARGA' | 'EFECTIVO' | 'ZELLE' | 'OTROS'): BeneficiaryData[] => {
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
      setSuggestions([])
    } catch (error) {
      console.error('Error clearing suggestions:', error)
    }
  }, [])

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
