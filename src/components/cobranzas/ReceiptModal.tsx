import { useModuleQuery } from '@/hooks/useModuleQuery'
import { Button } from '@/components/ui/button'
import { Loader2, X, Download, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getPaymentReceipt } from '@/services/cobranzasApi'
import { useReceiptImage } from '@/hooks/useReceiptImage'
import { formatMoney, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/cobranzasUtils'

const isMobileOrTablet = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export function ReceiptModal({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const { generateReceiptImage } = useReceiptImage()
  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-receipt', paymentId],
    queryFn: () => (paymentId ? getPaymentReceipt(paymentId) : null),
    enabled: !!paymentId,
  })

  if (!paymentId) return null

  const saveImage = async () => {
    if (!data) return
    setSaving(true)
    try {
      const { blob, filename } = await generateReceiptImage(data)

      if (isMobileOrTablet() && 'share' in navigator) {
        const file = new File([blob], filename, { type: 'image/png' })
        await navigator.share({
          files: [file],
          title: 'Recibo de pago',
          text: 'Recibo de pago',
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError'
      if (!isAbort) {
        toast.error('Error al procesar la imagen')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recibo de pago</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading || !data ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-lg border p-4 font-mono text-sm space-y-1.5">
              <div className="text-center">
                <p className="font-bold">{data.businessName}</p>
                <p className="text-xs">RECIBO DE PAGO · {data.receiptNumber}</p>
              </div>
              <div className="border-t border-dashed my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span>{formatDateTime(data.payment.paymentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span>{data.payment.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cédula</span>
                <span>{data.payment.client.identification}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span>{PAYMENT_METHOD_LABELS[data.payment.paymentMethod] ?? data.payment.paymentMethod}</span>
              </div>
              {data.payment.installmentNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota</span>
                  <span>{data.payment.installmentNumber}</span>
                </div>
              )}
              <div className="border-t border-dashed my-2" />
              <p className="text-center text-lg font-bold">{formatMoney(data.payment.amount)}</p>
              <div className="border-t border-dashed my-2" />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Saldo del crédito</span>
                <span>{formatMoney(data.payment.credit?.balance)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={saveImage} disabled={!data || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {isMobileOrTablet() && 'share' in navigator ? (
              <Share2 className="h-4 w-4 mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            {saving ? 'Guardando...' : 'Guardar imagen'}
          </Button>
        </div>
      </div>
    </div>
  )
}
