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

      // Header (Red bar)
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(0, 80, canvas.width, 50)

      // Date and Rate in header
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'left'
      const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
      ctx.fillText(dateStr, 30, 115)

      ctx.textAlign = 'right'
      ctx.fillText('TASA ' + rate.sellRate.toFixed(1), canvas.width - 30, 115)

      // Table header with blue background
      ctx.fillStyle = '#1e3a5f'
      ctx.fillRect(30, 140, 740, 40)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('COP', 200, 175)
      ctx.fillText('BS', 420, 175)
      ctx.fillText('USD', 640, 175)

      // Table rows
      const amounts = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 200000, 300000]
      const rowHeight = 40
      const startY = 190
      const colWidth = 250

      amounts.forEach((amount, index) => {
        const y = startY + index * rowHeight

        // Draw cell borders (blue lines)
        ctx.strokeStyle = '#2563eb'
        ctx.lineWidth = 2

        // Draw columns
        ctx.strokeRect(30, y - 30, colWidth - 10, rowHeight)
        ctx.strokeRect(30 + colWidth - 10, y - 30, colWidth - 10, rowHeight)
        ctx.strokeRect(30 + (colWidth - 10) * 2, y - 30, colWidth - 10, rowHeight)

        // Dark background for rows
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(31, y - 29, colWidth - 12, rowHeight - 2)
        ctx.fillRect(31 + colWidth - 10, y - 29, colWidth - 12, rowHeight - 2)
        ctx.fillRect(31 + (colWidth - 10) * 2, y - 29, colWidth - 12, rowHeight - 2)

        ctx.fillStyle = '#ffffff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'

        // COP
        ctx.fillText(amount.toLocaleString('es-VE'), 30 + (colWidth - 10) / 2, y)

        // BS
        const bs = (amount / rate.buyRate) * rate.bcv
        ctx.fillText(bs.toFixed(2), 30 + colWidth - 10 + (colWidth - 10) / 2, y)

        // USD
        const usd = amount / rate.usd
        ctx.fillText(usd.toFixed(2), 30 + (colWidth - 10) * 2 + (colWidth - 10) / 2, y)
      })

      // Footer with rate info (red circle with rate)
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.arc(canvas.width - 60, canvas.height - 40, 45, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const sellRateStr = rate.sellRate.toFixed(2)
      ctx.fillText(sellRateStr, canvas.width - 60, canvas.height - 40)

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
