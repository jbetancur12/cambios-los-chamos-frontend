import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Truck, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { getWaitingList, approveCredit, rejectCredit, deliverCredit, rescheduleCredit } from '@/services/cobranzasApi'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { formatMoney, formatDate, FREQUENCY_LABELS } from '@/lib/cobranzasUtils'
import type { Credit } from '@/types/cobranzas'

export function CobranzasEsperaPage() {
  const queryClient = useQueryClient()
  const [approveTarget, setApproveTarget] = useState<Credit | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Credit | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Credit | null>(null)
  const [deliverTarget, setDeliverTarget] = useState<Credit | null>(null)

  const { data: list, isLoading } = useModuleQuery({
    queryKey: ['cobranza-waiting-list'],
    queryFn: getWaitingList,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cobranza-waiting-list'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-credits'] })
    queryClient.invalidateQueries({ queryKey: ['cobranzas-portfolio-report'] })
  }

  const approveMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => approveCredit(id, date),
    onSuccess: () => {
      toast.success('Crédito aprobado')
      setApproveTarget(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectCredit(id, reason),
    onSuccess: () => {
      toast.success('Crédito rechazado')
      setRejectTarget(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const deliverMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deliverCredit(id),
    onSuccess: () => {
      toast.success('Crédito entregado y activado')
      setDeliverTarget(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => rescheduleCredit(id, date),
    onSuccess: () => {
      toast.success('Entrega reprogramada')
      setRescheduleTarget(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  if (isLoading || !list) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lista de espera</h1>
        <p className="text-sm text-muted-foreground">Organiza el flujo de entrega de créditos</p>
      </div>

      <QueueCard
        title="Por aprobar"
        icon={<CheckCircle2 className="h-4 w-4" />}
        count={list.counts.pendingApproval}
        tone="bg-yellow-100 text-yellow-800"
        empty="Sin créditos por aprobar"
      >
        {list.pendingApproval.map((c) => (
          <QueueRow
            key={c.id}
            credit={c}
            extra={`Creado: ${formatDate(c.createdAt)}`}
            actions={
              <>
                <Button size="sm" onClick={() => setApproveTarget(c)}>
                  Aprobar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectTarget(c)}>
                  Rechazar
                </Button>
              </>
            }
          />
        ))}
      </QueueCard>

      <QueueCard
        title="Atrasados en entrega"
        icon={<XCircle className="h-4 w-4" />}
        count={list.counts.overdueDelivery}
        tone="bg-red-100 text-red-800"
        empty="Sin entregas atrasadas"
      >
        {list.overdueDelivery.map((c) => (
          <QueueRow
            key={c.id}
            credit={c}
            extra={`Programada: ${formatDate(c.scheduledDeliveryDate)} (vencida)`}
            actions={
              <>
                <Button size="sm" onClick={() => setDeliverTarget(c)}>
                  <Truck className="h-4 w-4 mr-1" /> Entregar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRescheduleTarget(c)}>
                  <CalendarClock className="h-4 w-4 mr-1" /> Reprogramar
                </Button>
              </>
            }
          />
        ))}
      </QueueCard>

      <QueueCard
        title="Listos para entregar hoy"
        icon={<Truck className="h-4 w-4" />}
        count={list.counts.readyToday}
        tone="bg-green-100 text-green-800"
        empty="Nada listo para hoy"
      >
        {list.readyToday.map((c) => (
          <QueueRow
            key={c.id}
            credit={c}
            extra={`Programada: ${formatDate(c.scheduledDeliveryDate)}`}
            actions={
              <Button size="sm" onClick={() => setDeliverTarget(c)}>
                <Truck className="h-4 w-4 mr-1" /> Entregar
              </Button>
            }
          />
        ))}
      </QueueCard>

      <QueueCard
        title="Por entregar (próximos)"
        icon={<CalendarClock className="h-4 w-4" />}
        count={list.counts.waitingDelivery}
        tone="bg-blue-100 text-blue-800"
        empty="Sin créditos por entregar"
      >
        {list.waitingDelivery.map((c) => (
          <QueueRow
            key={c.id}
            credit={c}
            extra={`Programada: ${formatDate(c.scheduledDeliveryDate)}`}
            actions={
              <Button size="sm" variant="outline" onClick={() => setRescheduleTarget(c)}>
                <CalendarClock className="h-4 w-4 mr-1" /> Reprogramar
              </Button>
            }
          />
        ))}
      </QueueCard>

      {/* Aprobar */}
      <PromptDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        title="Aprobar crédito"
        description="Fecha de entrega programada"
        inputType="date"
        defaultValue={approveTarget?.startDate ?? new Date().toISOString().slice(0, 10)}
        confirmText="Aprobar"
        onConfirm={(date) => approveTarget && approveMutation.mutate({ id: approveTarget.id, date })}
      />

      {/* Rechazar */}
      <PromptDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="Rechazar crédito"
        description="Motivo del rechazo"
        placeholder="Motivo"
        confirmText="Rechazar"
        onConfirm={(reason) => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason })}
      />

      {/* Reprogramar */}
      <PromptDialog
        open={!!rescheduleTarget}
        onOpenChange={(o) => !o && setRescheduleTarget(null)}
        title="Reprogramar entrega"
        description="Nueva fecha de entrega"
        inputType="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
        confirmText="Reprogramar"
        onConfirm={(date) => rescheduleTarget && rescheduleMutation.mutate({ id: rescheduleTarget.id, date })}
      />

      {/* Entregar */}
      <DeleteConfirmationModal
        open={!!deliverTarget}
        onOpenChange={(o) => !o && setDeliverTarget(null)}
        title="Entregar crédito"
        description="El primer pago vencerá al siguiente periodo de la frecuencia. ¿Confirmas la entrega?"
        confirmText="Entregar"
        onConfirm={() => {
          if (deliverTarget) deliverMutation.mutate({ id: deliverTarget.id })
          setDeliverTarget(null)
        }}
      />
    </div>
  )
}

function QueueCard({
  title,
  icon,
  count,
  tone,
  empty,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  tone: string
  empty: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${tone}`}>{icon}</span>
          {title}
          <Badge variant="outline" className="ml-auto">
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {count === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : children}
      </CardContent>
    </Card>
  )
}

function QueueRow({ credit, extra, actions }: { credit: Credit; extra: string; actions: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border p-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{credit.client.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(credit.amount)} · {FREQUENCY_LABELS[credit.frequency] ?? credit.frequency} · {extra}
        </p>
      </div>
      <div className="flex items-center gap-1.5">{actions}</div>
    </div>
  )
}
