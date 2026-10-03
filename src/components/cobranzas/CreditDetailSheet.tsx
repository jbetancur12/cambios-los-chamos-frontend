import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { HandCoins, Loader2, Pencil, Receipt, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { CreditStatusBadge } from '@/components/cobranzas/CreditStatusBadge'
import { ContactLinks } from '@/components/cobranzas/ContactLinks'
import { CreditFormSheet } from '@/components/cobranzas/CreditFormSheet'
import { PaySheet, type PayTarget } from '@/components/cobranzas/PaySheet'
import { ReceiptModal } from '@/components/cobranzas/ReceiptModal'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import { addFollowUp, cancelCredit, cancelPayment, deleteFollowUp, getCredit } from '@/services/cobranzasApi'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  FREQUENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  SCHEDULE_STATUS_LABELS,
} from '@/lib/cobranzasUtils'
import { cn } from '@/lib/utils'

const SCHEDULE_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
  pending: 'bg-muted text-muted-foreground',
}

export function CreditDetailSheet({ creditId, onClose }: { creditId: string | null; onClose: () => void }) {
  const invalidate = useCobranzasInvalidate()
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [paymentToCancel, setPaymentToCancel] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [showAllSchedule, setShowAllSchedule] = useState(false)

  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-credit', creditId],
    queryFn: () => getCredit(creditId!),
    enabled: !!creditId,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelCredit(creditId!),
    onSuccess: () => {
      toast.success('Préstamo anulado')
      setConfirmCancel(false)
      invalidate()
      onClose()
    },
    onError: (e) => {
      setConfirmCancel(false)
      toast.error((e as Error).message)
    },
  })

  const noteMutation = useMutation({
    mutationFn: (text: string) => addFollowUp(creditId!, text),
    onSuccess: () => {
      setNote('')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteFollowUp(creditId!, id),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error((e as Error).message),
  })

  const cancelPaymentMutation = useMutation({
    mutationFn: (id: string) => cancelPayment(id),
    onSuccess: () => {
      toast.success('Pago anulado')
      setPaymentToCancel(null)
      invalidate()
    },
    onError: (e) => {
      setPaymentToCancel(null)
      toast.error((e as Error).message)
    },
  })

  if (!creditId) return null

  const credit = data?.credit
  const payments = (data?.payments ?? []).filter((p) => p.status === 'completed')
  const hasPayments = payments.length > 0
  const isActive = credit?.status === 'active'
  const schedule = data?.schedule ?? []
  // por defecto solo cuotas pendientes (primeras 6) para no abrumar
  const visibleSchedule = showAllSchedule ? schedule : schedule.filter((s) => s.status !== 'paid').slice(0, 6)
  const progress = credit && credit.totalAmount > 0 ? Math.min((credit.totalPaid / credit.totalAmount) * 100, 100) : 0

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader onClose={onClose}>
            <SheetTitle>{credit ? credit.client.name : 'Préstamo'}</SheetTitle>
            {credit && (
              <div className="mt-1 flex items-center gap-2">
                <CreditStatusBadge credit={credit} />
                <span className="text-xs text-muted-foreground">{credit.client.identification}</span>
              </div>
            )}
          </SheetHeader>
          <SheetBody className="space-y-5">
            {isLoading || !credit ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Resumen */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Saldo pendiente</span>
                    <span className="text-2xl font-bold">{formatMoney(credit.balance)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <span className="text-muted-foreground">Prestado</span>
                    <span className="text-right">{formatMoney(credit.amount)}</span>
                    <span className="text-muted-foreground">Interés</span>
                    <span className="text-right">{credit.interestRate}%</span>
                    <span className="text-muted-foreground">Total a pagar</span>
                    <span className="text-right">{formatMoney(credit.totalAmount)}</span>
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="text-right">{formatMoney(credit.totalPaid)}</span>
                    <span className="text-muted-foreground">
                      Cuota {FREQUENCY_LABELS[credit.frequency].toLowerCase()}
                    </span>
                    <span className="text-right">{formatMoney(credit.installmentAmount)}</span>
                    <span className="text-muted-foreground">Cuotas pagadas</span>
                    <span className="text-right">
                      {credit.paidInstallments} / {credit.totalInstallments}
                    </span>
                    <span className="text-muted-foreground">Primera / última</span>
                    <span className="text-right">
                      {formatDate(credit.startDate)} · {formatDate(credit.endDate)}
                    </span>
                    {isActive && credit.isOverdue && (
                      <>
                        <span className="text-red-600">Vencido</span>
                        <span className="text-right font-semibold text-red-600">
                          {formatMoney(credit.overdueAmount)} ({credit.overdueInstallments} cuota
                          {credit.overdueInstallments === 1 ? '' : 's'})
                        </span>
                      </>
                    )}
                  </div>
                  {credit.description && <p className="text-xs text-muted-foreground">{credit.description}</p>}
                </div>

                {/* Acciones */}
                {isActive && (
                  <div className="space-y-2">
                    <Button
                      className="w-full h-12 text-base"
                      onClick={() =>
                        setPayTarget({
                          creditId: credit.id,
                          clientName: credit.client.name,
                          installmentAmount: credit.installmentAmount,
                          balance: credit.balance,
                          suggested: credit.isOverdue ? credit.overdueAmount : credit.installmentAmount,
                        })
                      }
                    >
                      <HandCoins className="h-5 w-5" />
                      Registrar pago
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      <ContactLinks phone={credit.client.phone} />
                      {!hasPayments && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                            <Pencil className="h-4 w-4" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => setConfirmCancel(true)}
                          >
                            <XCircle className="h-4 w-4" /> Anular
                          </Button>
                        </>
                      )}
                    </div>
                    {hasPayments && (
                      <p className="text-xs text-muted-foreground">
                        Un préstamo con pagos no se puede editar ni anular. Anula primero los pagos si fue un error.
                      </p>
                    )}
                  </div>
                )}

                {/* Cronograma */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Cronograma</h3>
                    {schedule.length > 0 && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setShowAllSchedule((v) => !v)}
                      >
                        {showAllSchedule ? 'Ver solo pendientes' : `Ver las ${schedule.length} cuotas`}
                      </button>
                    )}
                  </div>
                  {visibleSchedule.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todas las cuotas están pagadas.</p>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {visibleSchedule.map((s) => (
                        <div key={s.installment_number} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="w-6 text-muted-foreground">#{s.installment_number}</span>
                          <span className="flex-1">{formatDate(s.due_date)}</span>
                          <span className="font-medium">
                            {formatMoney(s.status === 'paid' ? s.amount : s.remaining_amount)}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                              SCHEDULE_STYLES[s.status]
                            )}
                          >
                            {SCHEDULE_STATUS_LABELS[s.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Pagos */}
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Pagos ({payments.length})</h3>
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{formatMoney(p.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(p.paymentDate)} · {PAYMENT_METHOD_LABELS[p.paymentMethod]}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" title="Ver recibo" onClick={() => setReceiptId(p.id)}>
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Anular pago"
                            className="text-red-600"
                            onClick={() => setPaymentToCancel(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Notas */}
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Notas de seguimiento</h3>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (note.trim()) noteMutation.mutate(note.trim())
                    }}
                  >
                    <Input
                      placeholder="Ej: prometió pagar el viernes"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <Button type="submit" disabled={!note.trim() || noteMutation.isPending}>
                      Agregar
                    </Button>
                  </form>
                  {(data?.followUps ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin notas.</p>
                  ) : (
                    <div className="space-y-2">
                      {data!.followUps.map((f) => (
                        <div key={f.id} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                          <div className="flex-1">
                            <p>{f.note}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(f.createdAt)}
                              {f.createdBy ? ` · ${f.createdBy.fullName}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-red-600"
                            title="Eliminar nota"
                            onClick={() => deleteNoteMutation.mutate(f.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <PaySheet
        target={payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={(result) => setReceiptId(result.payment.id)}
      />
      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
      <CreditFormSheet open={editing} onOpenChange={setEditing} credit={credit} />
      <DeleteConfirmationModal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="¿Anular este préstamo?"
        description="El préstamo quedará anulado y dejará de aparecer en Por cobrar."
        confirmText="Anular préstamo"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
      <DeleteConfirmationModal
        open={!!paymentToCancel}
        onOpenChange={(o) => !o && setPaymentToCancel(null)}
        title="¿Anular este pago?"
        description="Se recalculará el saldo y las cuotas del préstamo."
        confirmText="Anular pago"
        loading={cancelPaymentMutation.isPending}
        onConfirm={() => paymentToCancel && cancelPaymentMutation.mutate(paymentToCancel)}
      />
    </>
  )
}
