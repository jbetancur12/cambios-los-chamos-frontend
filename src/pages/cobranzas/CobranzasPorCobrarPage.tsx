import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, HandCoins, Loader2, NotebookPen, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { ContactLinks } from '@/components/cobranzas/ContactLinks'
import { CreditDetailSheet } from '@/components/cobranzas/CreditDetailSheet'
import { PaginationBar } from '@/components/cobranzas/PaginationBar'
import { PaySheet, type PayTarget } from '@/components/cobranzas/PaySheet'
import { ReceiptModal } from '@/components/cobranzas/ReceiptModal'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import { addFollowUp, getCollections } from '@/services/cobranzasApi'
import { formatMoney, FREQUENCY_LABELS } from '@/lib/cobranzasUtils'
import type { CollectionItem } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

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

function LateChip({ daysLate }: { daysLate: number }) {
  const late = daysLate > 0
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold',
        late
          ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
          : 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300'
      )}
    >
      {late ? `${daysLate} día${daysLate === 1 ? '' : 's'}` : 'Hoy'}
    </span>
  )
}

const lateText = (n: number) => (n > 0 ? ` · ${n} atrasada${n === 1 ? '' : 's'}` : '')

export function CobranzasPorCobrarPage() {
  const invalidate = useCobranzasInvalidate()
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [noteTarget, setNoteTarget] = useState<CollectionItem | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

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
  const items = useMemo(() => data?.items ?? [], [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) => i.client.name.toLowerCase().includes(q) || i.client.identification.toLowerCase().includes(q)
    )
  }, [items, search])

  useEffect(() => {
    setPage(1)
  }, [data, search])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openPay = (item: CollectionItem) =>
    setPayTarget({
      creditId: item.creditId,
      clientName: item.client.name,
      installmentAmount: item.installmentAmount,
      balance: item.balance,
      suggested: item.amountDue,
    })

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-4 pb-28 md:max-w-6xl">
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
        <>
          <div className="hidden space-y-1.5 md:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <div className="space-y-2 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold">Todo al día</p>
            <p className="text-sm text-muted-foreground">No hay cobros pendientes para hoy.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o cédula"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="font-semibold">Sin resultados</p>
                <p className="text-sm text-muted-foreground">Prueba con otro nombre o cédula.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Desktop: tabla compacta */}
              <div className="hidden max-h-[calc(100vh-28rem)] min-h-[200px] overflow-auto rounded-lg border bg-card md:block">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted">
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                      <th className="px-3 py-2 text-left font-semibold">Atraso</th>
                      <th className="px-3 py-2 text-left font-semibold">Cuotas</th>
                      <th className="px-3 py-2 text-right font-semibold">Debe</th>
                      <th className="px-3 py-2 text-left font-semibold">Última nota</th>
                      <th className="px-3 py-2 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => {
                      const late = item.daysLate > 0
                      return (
                        <tr
                          key={item.creditId}
                          tabIndex={0}
                          aria-label={`Ver préstamo de ${item.client.name}`}
                          onClick={() => setDetailId(item.creditId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target === e.currentTarget) setDetailId(item.creditId)
                          }}
                          className={cn(
                            'cursor-pointer border-b border-l-2 border-l-transparent transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
                            late && 'border-l-red-500 bg-red-500/5'
                          )}
                        >
                          <td className="max-w-[14rem] px-3 py-1.5">
                            <p className="truncate font-medium">{item.client.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.client.identification}</p>
                          </td>
                          <td className="px-3 py-1.5">
                            <LateChip daysLate={item.daysLate} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-muted-foreground">
                            {item.paidInstallments}/{item.totalInstallments}
                            {lateText(item.overdueInstallments)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold tabular-nums">
                            {formatMoney(item.amountDue)}
                          </td>
                          <td className="max-w-[14rem] px-3 py-1.5 text-xs text-muted-foreground">
                            {item.lastFollowUp ? (
                              <span className="block truncate" title={item.lastFollowUp.note}>
                                {item.lastFollowUp.note}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" onClick={() => openPay(item)}>
                                <HandCoins className="h-4 w-4" />
                                Pagar
                              </Button>
                              <ContactLinks phone={item.client.phone} compact className="h-8 w-8" />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="Agregar nota"
                                aria-label="Agregar nota"
                                onClick={() => setNoteTarget(item)}
                              >
                                <NotebookPen className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Móvil: tarjetas compactas */}
              <div className="space-y-2 md:hidden">
                {pageItems.map((item) => {
                  const late = item.daysLate > 0
                  return (
                    <Card key={item.creditId} className={cn(late && 'border-red-200 dark:border-red-900')}>
                      <CardContent className="space-y-2 p-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setDetailId(item.creditId)}
                          >
                            <p className="truncate text-sm font-semibold">{item.client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {FREQUENCY_LABELS[item.frequency]} · cuota {item.paidInstallments + 1}/
                              {item.totalInstallments}
                              {lateText(item.overdueInstallments)}
                            </p>
                          </button>
                          <div className="text-right">
                            <p className="font-bold tabular-nums">{formatMoney(item.amountDue)}</p>
                            <LateChip daysLate={item.daysLate} />
                          </div>
                        </div>

                        {item.lastFollowUp && (
                          <p className="truncate rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            Nota: {item.lastFollowUp.note}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Button className="h-9 flex-1" onClick={() => openPay(item)}>
                            <HandCoins className="h-4 w-4" />
                            Pagar
                          </Button>
                          <ContactLinks phone={item.client.phone} compact className="h-9 w-9" />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
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

              <PaginationBar page={safePage} pages={pages} total={filtered.length} onPageChange={setPage} />
            </div>
          )}
        </>
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
