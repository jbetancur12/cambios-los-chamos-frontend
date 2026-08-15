import { useCallback } from 'react'
import type { Payment } from '@/types/cobranzas'
import { formatMoney, formatDateTime, PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/cobranzasUtils'

interface ReceiptData {
  payment: Payment
  receiptNumber: string
  businessName: string
}

function dashedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.setLineDash([6, 5])
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.setLineDash([])
}

export function useReceiptImage() {
  const generateReceiptImage = useCallback(async (data: ReceiptData): Promise<{ blob: Blob; filename: string }> => {
    const { payment, receiptNumber, businessName } = data
    const W = 600
    const pad = 40
    const rows: [string, string][] = [
      ['Fecha', formatDateTime(payment.paymentDate)],
      ['Cliente', payment.client.name],
      ['Cédula', payment.client.identification],
      ['Método', PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod],
      ['Tipo', PAYMENT_TYPE_LABELS[payment.paymentType] ?? payment.paymentType],
      ...(payment.installmentNumber ? [['Cuota', String(payment.installmentNumber)] as [string, string]] : []),
    ]

    const lineH = 34
    const headerH = 170
    const dividerGap = 30
    const amountH = 70
    const footerH = 80

    const H = headerH + dividerGap + rows.length * lineH + dividerGap + amountH + dividerGap + lineH * 2 + footerH

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas no soportado')

    // fondo
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#111827'
    ctx.textAlign = 'center'
    ctx.font = 'bold 34px monospace'
    ctx.fillText(businessName, W / 2, 60)
    ctx.font = 'bold 20px monospace'
    ctx.fillText('RECIBO DE PAGO', W / 2, 96)
    ctx.font = '18px monospace'
    ctx.fillText(receiptNumber, W / 2, 124)

    dashedLine(ctx, pad, 148, W - pad)

    // filas
    ctx.font = '18px monospace'
    let y = 192
    for (const [k, v] of rows) {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(k, pad, y)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#111827'
      ctx.fillText(v, W - pad, y)
      y += lineH
    }

    dashedLine(ctx, pad, y + 4, W - pad)
    y += dividerGap

    // monto
    ctx.textAlign = 'center'
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 40px monospace'
    ctx.fillText(formatMoney(payment.amount), W / 2, y + 40)
    y += amountH

    dashedLine(ctx, pad, y, W - pad)
    y += dividerGap

    ctx.font = '18px monospace'
    const footerRows: [string, string][] = [
      ['Saldo del crédito', formatMoney(payment.credit?.balance)],
      ['Recibido por', payment.receivedBy?.fullName ?? ''],
    ]
    for (const [k, v] of footerRows) {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(k, pad, y)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#111827'
      ctx.fillText(v, W - pad, y)
      y += lineH
    }

    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b7280'
    ctx.font = '16px monospace'
    ctx.fillText('¡Gracias por su pago!', W / 2, H - 24)

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Error generando imagen'))), 'image/png')
    )

    return { blob, filename: `${receiptNumber}.png` }
  }, [])

  return { generateReceiptImage }
}
