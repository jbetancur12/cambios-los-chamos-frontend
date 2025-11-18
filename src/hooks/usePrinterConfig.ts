import { useCallback } from 'react'

export interface PrinterConfig {
  name: string
  type: 'thermal' | 'injection'
}

export function usePrinterConfig() {
  const getPrinterConfig = useCallback((): PrinterConfig | null => {
    try {
      const config = localStorage.getItem('printerConfig')
      return config ? JSON.parse(config) : null
    } catch (error) {
      console.error('Error reading printer config:', error)
      return null
    }
  }, [])

  const setPrinterConfig = useCallback((config: PrinterConfig) => {
    try {
      localStorage.setItem('printerConfig', JSON.stringify(config))
    } catch (error) {
      console.error('Error saving printer config:', error)
    }
  }, [])

  const clearPrinterConfig = useCallback(() => {
    try {
      localStorage.removeItem('printerConfig')
    } catch (error) {
      console.error('Error clearing printer config:', error)
    }
  }, [])

  return {
    getPrinterConfig,
    setPrinterConfig,
    clearPrinterConfig,
  }
}
