import { useCallback } from 'react'
import type { ExchangeRate } from '@/types/api'

export function useSiaRateImage() {
  const generateAndDownloadImage = useCallback(async (rate: ExchangeRate) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Load and draw background image
      const img = new Image()
      img.src = '/rates-background.avif'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Header
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(0, 0, canvas.width, 100)

      // Date and Rate
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'left'
      const dateStr = new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })
      ctx.fillText(dateStr, 30, 60)

      ctx.textAlign = 'right'
      ctx.fillText('TASA 13', canvas.width - 30, 60)

      // Table header
      ctx.fillStyle = '#374151'
      ctx.fillRect(30, 120, 740, 40)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('COP', 180, 155)
      ctx.fillText('BS', 420, 155)
      ctx.fillText('USD', 650, 155)

      // Table rows
      const amounts = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 200000, 300000]
      const rowHeight = 40
      const startY = 170

      ctx.fillStyle = '#1f2937'
      ctx.font = '16px Arial'

      amounts.forEach((amount, index) => {
        const y = startY + index * rowHeight

        // Alternate row colors
        if (index % 2 === 1) {
          ctx.fillStyle = '#111827'
          ctx.fillRect(30, y - 30, 740, rowHeight)
        }

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'

        // COP
        ctx.fillText(amount.toLocaleString('es-VE'), 180, y)

        // BS
        const bs = (amount / rate.buyRate) * rate.bcv
        ctx.fillText(bs.toFixed(2), 420, y)

        // USD
        const usd = amount / rate.usd
        ctx.fillText(usd.toFixed(2), 650, y)
      })

      // Footer with rate info
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      const sellRateStr = rate.sellRate.toFixed(2)
      ctx.fillText(sellRateStr, canvas.width / 2, canvas.height - 20)

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const dateForFilename = new Date().toISOString().split('T')[0]
          a.download = `tasa-sia-${dateForFilename}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Error generating image:', error)
      throw error
    }
  }, [])

  return { generateAndDownloadImage }
}
