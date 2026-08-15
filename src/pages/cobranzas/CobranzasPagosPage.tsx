import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Ban, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ActionButton } from '@/components/ui/ActionButton'
import { ReceiptModal } from '@/components/cobranzas/ReceiptModal'
import { listPayments, getTodayPaymentSummary, cancelPayment } from '@/services/cobranzasApi'
import { formatMoney, formatDateTime, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/cobranzasUtils'

export function CobranzasPagosPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null)
  const [method, setMethod] = useState<'all' | 'cash' | 'transfer' | 'card' | 'mobile_payment'>('all')

  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-payments', search, method],
    queryFn: () => listPayments({ paymentMethod: method === 'all' ? undefined : method, limit: 100 }),
  })

  const { data: todaySummary } = useModuleQuery({
    queryKey: ['cobranza-today-summary'],
    queryFn: getTodayPaymentSummary,
  })

  const cancelMutation = useMutation({
    mutationFn: cancelPayment,
    onSuccess: () => {
      toast.success('Pago cancelado')
      queryClient.invalidateQueries({ queryKey: ['cobranza-payments'] })
      queryClient.invalidateQueries({ queryKey: ['cobranza-today-summary'] })
      queryClient.invalidateQueries({ queryKey: ['cobranza-credit'] })
      queryClient.invalidateQueries({ queryKey: ['cobranza-stats'] })
      queryClient.invalidateQueries({ queryKey: ['cobranza-financial'] })
      queryClient.invalidateQueries({ queryKey: ['cobranzas-portfolio-report'] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const filtered = search
    ? data?.items.filter(
        (p) =>
          p.client.name.toLowerCase().includes(search.toLowerCase()) ||
          p.client.identification.toLowerCase().includes(search.toLowerCase())
      )
    : data?.items

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-sm text-muted-foreground">
            Hoy: {formatMoney(todaySummary?.totalCollected)} en {todaySummary?.paymentCount ?? 0} pagos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o cédula"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={method} onValueChange={(v) => setMethod(v as typeof method)} className="w-[160px]">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los métodos</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
            <SelectItem value="card">Tarjeta</SelectItem>
            <SelectItem value="mobile_payment">Pago móvil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Monto</th>
                    <th className="py-2 pr-3">Método</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Cuota</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{p.client.name}</td>
                      <td className="py-2 pr-3 font-semibold text-green-600">{formatMoney(p.amount)}</td>
                      <td className="py-2 pr-3">{PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</td>
                      <td className="py-2 pr-3">{formatDateTime(p.paymentDate)}</td>
                      <td className="py-2 pr-3">{p.installmentNumber ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant="outline"
                          className={
                            p.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : p.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-0.5">
                          <ActionButton icon={Printer} onClick={() => setReceiptPaymentId(p.id)} title="Ver recibo" />
                          {p.status === 'completed' && (
                            <ActionButton
                              icon={Ban}
                              tone="danger"
                              onClick={() => setCancelTarget(p.id)}
                              title="Cancelar pago"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        Sin pagos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancelar pago"
        description="El pago se marcará como cancelado y se recalculará el crédito."
        confirmText="Cancelar pago"
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget)
          setCancelTarget(null)
        }}
      />

      <ReceiptModal paymentId={receiptPaymentId} onClose={() => setReceiptPaymentId(null)} />
    </div>
  )
}
