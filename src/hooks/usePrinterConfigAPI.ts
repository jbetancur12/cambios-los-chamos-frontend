import { useCallback } from 'react'
import { api } from '@/lib/api'

export interface PrinterConfig {
  name: string
  type: 'thermal' | 'injection'
}

export function usePrinterConfigAPI() {
  const getPrinterConfig = useCallback(async (): Promise<PrinterConfig | null> => {
    try {
      const response = await api.get<{ config: PrinterConfig | null }>(
        '/api/printer/config'
      )
      return response.config
    } catch (error) {
      console.error('Error reading printer config:', error)
      return null
    }
  }, [])

  const setPrinterConfig = useCallback(async (config: PrinterConfig) => {
    try {
      await api.post('/api/printer/config', {
        name: config.name,
        type: config.type,
      })
    } catch (error) {
      console.error('Error saving printer config:', error)
      throw error
    }
  }, [])

  const clearPrinterConfig = useCallback(async () => {
    try {
      await api.delete('/api/printer/config')
    } catch (error) {
      console.error('Error clearing printer config:', error)
      throw error
    }
  }, [])

  return {
    getPrinterConfig,
    setPrinterConfig,
    clearPrinterConfig,
  }
}
