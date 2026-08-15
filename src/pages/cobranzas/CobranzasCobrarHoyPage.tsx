import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, HandCoins, CheckCircle2, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { getTodayCollections, registerPayment, type TodayCollection } from '@/services/cobranzasApi'
import { CurrencyInput } from '@/components/CurrencyInput'
import { ReceiptModal } from '@/components/cobranzas/ReceiptModal'
import { formatMoney, formatDate, PAYMENT_METHOD_LABELS, FREQUENCY_LABELS } from '@/lib/cobranzasUtils'

export function CobranzasCobrarHoyPage() {
  const queryClient = useQueryClient()
  const [payTarget, setPayTarget] = useState<TodayCollection | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<'cash' | 'transfer' | 'card' | 'mobile_payment'>('cash')
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null)

  const { data: collections = [], isLoading } = useModuleQuery({
    queryKey: ['cobranza-collections-today'],
    queryFn: getTodayCollections,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cobranza-collections-today'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-credits'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-payments'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-today-summary'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-stats'] })
    queryClient.invalidateQueries({ queryKey: ['cobranzas-portfolio-report'] })
  }

  const payMutation = useMutation({
    mutationFn: registerPayment,
    onSuccess: (payment) => {
      toast.success('Pago registrado')
      setPayTarget(null)
      setReceiptPaymentId(payment.id)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const openPay = (item: TodayCollection) => {
    setPayTarget(item)
    setAmount(Math.ceil(Number(item.amount)))
    setMethod('cash')
  }

  const dueToday = collections.filter((c) => c.daysLate === 0)
  const overdue = collections.filter((c) => c.daysLate > 0)
  const totalToCollect = collections.reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cobrar hoy</h1>
          <p className="text-sm text-muted-foreground">
            {collections.length} cuota(s) por cobrar · Total: {formatMoney(totalToCollect)}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : collections.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">🎉 Nada por cobrar hoy. Todo al día.</p>
          ) : (
            <div className="space-y-2">
              {collections.map((c) => (
                <div key={c.creditId} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{c.client}</p>
                      {c.daysLate > 0 ? (
                        <Badge variant="outline" className="bg-red-100 text-red-800 shrink-0">
                          {c.daysLate} día(s) atrasado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 shrink-0">
                          Vence hoy
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[c.frequency] ?? c.frequency} · vence {formatDate(c.dueDate)} ·{' '}
                      {c.identification}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(c.amount)}</p>
                      <p className="text-xs text-muted-foreground">saldo {formatMoney(c.balance)}</p>
                    </div>
                    <Button onClick={() => openPay(c)}>
                      <HandCoins className="h-4 w-4 mr-1" /> Cobrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {dueToday.length > 0 && overdue.length > 0 && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            <p>
              <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-600" />
              {dueToday.length} vencen hoy · <CalendarClock className="inline h-4 w-4 mx-1 text-red-600" />
              {overdue.length} atrasada(s)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cobrar */}
      <Sheet open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Cobrar — {payTarget?.client}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {payTarget && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!amount || amount <= 0) {
                    toast.error('Monto inválido')
                    return
                  }
                  payMutation.mutate({ creditId: payTarget.creditId, amount, paymentMethod: method })
                }}
                id="collect-form"
                className="space-y-4"
              >
                <div className="rounded-md border p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuota que vence</span>
                    <span>{formatDate(payTarget.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto de la cuota</span>
                    <span className="font-semibold">{formatMoney(payTarget.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo del crédito</span>
                    <span className="font-semibold text-green-600">{formatMoney(payTarget.balance)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Monto</Label>
                  <CurrencyInput value={amount} onValueChange={setAmount} autoFocus />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(Math.ceil(Number(payTarget.amount)))}
                    >
                      Cuota: {formatMoney(Math.ceil(Number(payTarget.amount)))}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      onClick={() => setAmount(Math.ceil(Number(payTarget.balance)))}
                    >
                      Saldo: {formatMoney(Math.ceil(Number(payTarget.balance)))}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PAYMENT_METHOD_LABELS) as (keyof typeof PAYMENT_METHOD_LABELS)[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {PAYMENT_METHOD_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            )}
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="collect-form" disabled={payMutation.isPending}>
              {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar pago'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ReceiptModal paymentId={receiptPaymentId} onClose={() => setReceiptPaymentId(null)} />
    </div>
  )
}
