import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, HandCoins, Loader2, NotebookPen, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { ContactLinks } from '@/components/cobranzas/ContactLinks'
import { CreditDetailSheet } from '@/components/cobranzas/CreditDetailSheet'
import { PaySheet, type PayTarget } from '@/components/cobranzas/PaySheet'
import { ReceiptModal } from '@/components/cobranzas/ReceiptModal'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import { addFollowUp, getCollections } from '@/services/cobranzasApi'
import { formatMoney, FREQUENCY_LABELS } from '@/lib/cobranzasUtils'
import type { CollectionItem } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'red' | 'amber' | 'green' | 'blue'
}) {
  const tones = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
  }
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('mt-1 text-lg sm:text-2xl font-bold tabular-nums', tones[tone])}>{formatMoney(value)}</p>
      </CardContent>
    </Card>
  )
}

export function CobranzasPorCobrarPage() {
  const invalidate = useCobranzasInvalidate()
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [noteTarget, setNoteTarget] = useState<CollectionItem | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading, isFetching, refetch } = useModuleQuery({
    queryKey: ['cobranza-collections'],
    queryFn: getCollections,
  })

  const noteMutation = useMutation({
    mutationFn: ({ creditId, note }: { creditId: string; note: string }) => addFollowUp(creditId, note),
    onSuccess: () => {
      toast.success('Nota guardada')
      setNoteTarget(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const summary = data?.summary
  const items = data?.items ?? []

  const openPay = (item: CollectionItem) =>
    setPayTarget({
      creditId: item.creditId,
      clientName: item.client.name,
      installmentAmount: item.installmentAmount,
      balance: item.balance,
      suggested: item.amountDue,
    })

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Por cobrar</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Cargando...' : `${items.length} cliente${items.length === 1 ? '' : 's'} por cobrar hoy`}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Actualizar">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isLoading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)
        ) : (
          <>
            <SummaryCard label={`En mora (${summary.overdueCount})`} value={summary.overdueAmount} tone="red" />
            <SummaryCard label={`Vence hoy (${summary.dueTodayCount})`} value={summary.dueTodayAmount} tone="amber" />
            <SummaryCard label="Cobrado hoy" value={summary.collectedToday} tone="green" />
            <SummaryCard
              label={`Por cobrar total (${summary.activeCredits})`}
              value={summary.outstandingBalance}
              tone="blue"
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold">Todo al día</p>
            <p className="text-sm text-muted-foreground">No hay cobros pendientes para hoy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const late = item.daysLate > 0
            return (
              <Card key={item.creditId} className={cn(late && 'border-red-200 dark:border-red-900')}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setDetailId(item.creditId)}
                    >
                      <p className="truncate font-semibold">{item.client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {FREQUENCY_LABELS[item.frequency]} · cuota {item.paidInstallments + 1}/{item.totalInstallments}
                        {item.overdueInstallments > 0 &&
                          ` · ${item.overdueInstallments} atrasada${item.overdueInstallments === 1 ? '' : 's'}`}
                      </p>
                    </button>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{formatMoney(item.amountDue)}</p>
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          late ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {late ? `${item.daysLate} día${item.daysLate === 1 ? '' : 's'} de atraso` : 'Hoy'}
                      </span>
                    </div>
                  </div>

                  {item.lastFollowUp && (
                    <p className="rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                      Nota: {item.lastFollowUp.note}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button className="h-10 flex-1" onClick={() => openPay(item)}>
                      <HandCoins className="h-4 w-4" />
                      Pagar
                    </Button>
                    <ContactLinks phone={item.client.phone} compact />
                    <Button
                      variant="outline"
                      size="icon"
                      title="Agregar nota"
                      aria-label="Agregar nota"
                      onClick={() => setNoteTarget(item)}
                    >
                      <NotebookPen className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <PaySheet target={payTarget} onClose={() => setPayTarget(null)} onPaid={(r) => setReceiptId(r.payment.id)} />
      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
      <CreditDetailSheet creditId={detailId} onClose={() => setDetailId(null)} />
      <PromptDialog
        open={!!noteTarget}
        onOpenChange={(o) => !o && setNoteTarget(null)}
        title="Nota de seguimiento"
        description={noteTarget ? `Para ${noteTarget.client.name}` : undefined}
        placeholder="Ej: prometió pagar el viernes"
        confirmText="Guardar nota"
        loading={noteMutation.isPending}
        onConfirm={(note) => noteTarget && noteMutation.mutate({ creditId: noteTarget.creditId, note })}
      />
    </div>
  )
}
