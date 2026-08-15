import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Loader2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  CalendarClock,
  Banknote,
  CalendarDays,
  HandCoins,
  Flag,
  FileDown,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CurrencyInput } from '@/components/CurrencyInput'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { ActionButton } from '@/components/ui/ActionButton'
import { ReceiptModal } from '@/components/cobranzas/ReceiptModal'
import { ClientPicker } from '@/components/cobranzas/ClientPicker'
import {
  listCredits,
  exportCredits,
  getCreditDetail,
  createCredit,
  updateCredit,
  approveCredit,
  rejectCredit,
  deliverCredit,
  rescheduleCredit,
  registerPayment,
  listClients,
  listLoanFrequencies,
  listFollowUps,
  addFollowUp,
  removeFollowUp,
  type CreateCreditInput,
  type RegisterPaymentInput,
} from '@/services/cobranzasApi'
import {
  formatMoney,
  formatDate,
  formatDateTime,
  CREDIT_STATUS_LABELS,
  CREDIT_STATUS_VARIANTS,
  FREQUENCY_LABELS,
  PERIOD_DAYS,
  SCHEDULE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  downloadCsv,
} from '@/lib/cobranzasUtils'
import type { Credit, CreditStatus, LoanFrequency } from '@/types/cobranzas'

const emptyForm: CreateCreditInput = {
  clientId: '',
  amount: 0,
  frequency: 'daily',
  startDate: new Date().toISOString().slice(0, 10),
  scheduledDeliveryDate: null,
  interestRate: 0,
  totalInstallments: null,
  downPayment: null,
}

export function CobranzasCreditosPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<CreditStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [payCredit, setPayCredit] = useState<Credit | null>(null)
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null)
  const [editCredit, setEditCredit] = useState<Credit | null>(null)
  const [form, setForm] = useState<CreateCreditInput>(emptyForm)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [deliverOpen, setDeliverOpen] = useState(false)

  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-credits', statusFilter, search],
    queryFn: () =>
      listCredits({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        limit: 100,
      }),
  })

  // Clientes más frecuentes (los que más créditos tienen en el listado reciente)
  const frequentClientIds = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of data?.items ?? []) {
      counts.set(c.client.id, (counts.get(c.client.id) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)
  }, [data])

  const { data: clients = [] } = useModuleQuery({
    queryKey: ['cobranza-credit-clients'],
    queryFn: () => listClients({ activeOnly: true, limit: 1000 }).then((r) => r.items),
  })

  const { data: frequencies = [] } = useModuleQuery({
    queryKey: ['cobranza-frequencies'],
    queryFn: () => listLoanFrequencies(),
  })

  const selectedFreq = frequencies.find((f) => f.code === form.frequency)

  // Preseleccionar el primer cliente al abrir el formulario
  useEffect(() => {
    if (formOpen && !form.clientId && clients.length > 0) {
      setForm((f) => ({ ...f, clientId: clients[0].id }))
    }
  }, [formOpen, clients, form.clientId])

  // Auto-calcular: primer pago = entrega + periodo; finalización = entrega + cuotas × periodo
  useEffect(() => {
    const periodDays = selectedFreq?.periodDays
    const installments = Number(form.totalInstallments)
    if (!periodDays || !form.startDate || !installments || installments <= 0) return

    const base = new Date(`${form.startDate}T00:00:00`)
    const end = new Date(base.getTime() + installments * periodDays * 86400000)
    setForm((f) => ({
      ...f,
      scheduledDeliveryDate: form.startDate,
      endDate: end.toISOString().slice(0, 10),
    }))
  }, [form.frequency, form.totalInstallments, form.startDate, selectedFreq?.periodDays])

  const { data: detail } = useModuleQuery({
    queryKey: ['cobranza-credit', detailId],
    queryFn: () => (detailId ? getCreditDetail(detailId) : null),
    enabled: !!detailId,
  })

  const { data: followUps = [] } = useModuleQuery({
    queryKey: ['cobranza-follow-ups', detailId],
    queryFn: () => (detailId ? listFollowUps(detailId) : []),
    enabled: !!detailId,
  })

  const [followUpNote, setFollowUpNote] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cobranza-credits'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-credit'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-client'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-payments'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-today-summary'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-stats'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-financial'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-activity'] })
    queryClient.invalidateQueries({ queryKey: ['cobranzas-portfolio-report'] })
  }

  const createMutation = useMutation({
    mutationFn: createCredit,
    onSuccess: () => {
      toast.success('Crédito creado')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const approveMutation = useMutation({
    mutationFn: ({ id, date, notes }: { id: string; date: string; notes?: string }) => approveCredit(id, date, notes),
    onSuccess: () => {
      toast.success('Crédito aprobado')
      setApproveOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectCredit(id, reason),
    onSuccess: () => {
      toast.success('Crédito rechazado')
      setRejectOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const deliverMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deliverCredit(id),
    onSuccess: () => {
      toast.success('Crédito entregado y activado')
      setDeliverOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => rescheduleCredit(id, date),
    onSuccess: () => {
      toast.success('Entrega reprogramada')
      setRescheduleOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const paymentMutation = useMutation({
    mutationFn: registerPayment,
    onSuccess: (payment) => {
      toast.success('Pago registrado')
      setPayCredit(null)
      setReceiptPaymentId(payment.id)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCreditInput> }) => updateCredit(id, data),
    onSuccess: () => {
      toast.success('Crédito actualizado')
      setEditCredit(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const followUpMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => addFollowUp(id, note),
    onSuccess: () => {
      toast.success('Seguimiento guardado')
      setFollowUpNote('')
      queryClient.invalidateQueries({ queryKey: ['cobranza-follow-ups'] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const removeFollowUpMutation = useMutation({
    mutationFn: ({ creditId, followUpId }: { creditId: string; followUpId: string }) =>
      removeFollowUp(creditId, followUpId),
    onSuccess: () => {
      toast.success('Seguimiento eliminado')
      queryClient.invalidateQueries({ queryKey: ['cobranza-follow-ups'] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!form.clientId) {
      toast.error('Debes seleccionar un cliente')
      return
    }
    if (!form.amount || form.amount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    createMutation.mutate({ ...form, amount: Number(form.amount), interestRate: form.interestRate || 0 })
  }

  const set = (key: keyof CreateCreditInput, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const handleExport = async () => {
    setExporting(true)
    try {
      const items = await exportCredits({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      })

      const headers = [
        'Cliente',
        'Cédula',
        'Teléfono',
        'Frecuencia',
        'Estado',
        'Monto',
        'Total con interés',
        'Interés total',
        'Cuota',
        'N° cuotas',
        'Cuotas pagadas',
        'Cuotas pendientes',
        'Total pagado',
        'Saldo pendiente',
        'Interés cobrado',
        'Interés por cobrar',
      ]

      const rows = items.map((c) => {
        const financed = Number(c.amount) - Number(c.downPayment ?? 0)
        const totalAmount = Number(c.totalAmount ?? 0)
        const totalInterest = Math.max(0, totalAmount - financed)
        const installments = Number(c.totalInstallments ?? 0)
        const paid = Number(c.paidInstallmentsCount ?? 0)
        const ratio = installments > 0 ? paid / installments : 0
        const interestPaid = totalInterest * ratio
        const interestPending = totalInterest - interestPaid

        return [
          c.client.name,
          c.client.identification,
          c.client.phone ?? '',
          FREQUENCY_LABELS[c.frequency] ?? c.frequency,
          CREDIT_STATUS_LABELS[c.status],
          Number(c.amount),
          totalAmount,
          totalInterest,
          Number(c.installmentAmount ?? 0),
          installments,
          paid,
          Math.max(0, installments - paid),
          Number(c.totalPaid ?? 0),
          Number(c.balance),
          interestPaid,
          interestPending,
        ]
      })

      const label = statusFilter === 'all' ? 'todos' : CREDIT_STATUS_LABELS[statusFilter]
      downloadCsv(`creditos-${label}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
      toast.success(`${items.length} créditos exportados`)
    } catch (e) {
      toast.error((e as Error).message || 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Créditos</h1>
          <p className="text-sm text-muted-foreground">Total: {data?.total ?? 0}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
            Exportar
          </Button>
          <Button
            onClick={() => {
              setForm({ ...emptyForm, startDate: new Date().toISOString().slice(0, 10) })
              setSubmitAttempted(false)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nuevo crédito
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'Todos'],
              ['pending_approval', 'Por aprobar'],
              ['waiting_delivery', 'Por entregar'],
              ['active', 'Activos'],
              ['paid_off', 'Saldados'],
              ['defaulted', 'Mora'],
              ['cancelled', 'Cancelados'],
            ] as [CreditStatus | 'all', string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                statusFilter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o cédula"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                    <th className="py-2 pr-3">Saldo</th>
                    <th className="py-2 pr-3">Frecuencia</th>
                    <th className="py-2 pr-3">Cuotas</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Creado</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{c.client.name}</td>
                      <td className="py-2 pr-3">{formatMoney(c.amount)}</td>
                      <td className="py-2 pr-3">{formatMoney(c.balance)}</td>
                      <td className="py-2 pr-3">{FREQUENCY_LABELS[c.frequency] ?? c.frequency}</td>
                      <td className="py-2 pr-3">{c.totalInstallments ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className={CREDIT_STATUS_VARIANTS[c.status]}>
                          {CREDIT_STATUS_LABELS[c.status]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{formatDate(c.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-0.5">
                          <ActionButton icon={Eye} onClick={() => setDetailId(c.id)} title="Ver detalle" />
                          {(c.status === 'active' || c.status === 'waiting_delivery') && (
                            <ActionButton
                              icon={Banknote}
                              tone="success"
                              onClick={() => setPayCredit(c)}
                              title="Registrar pago"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-muted-foreground">
                        Sin créditos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crear crédito */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nuevo crédito</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form onSubmit={handleSubmit} id="credit-form" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente {submitAttempted && !form.clientId && <span className="text-red-500">*</span>}</Label>
                <ClientPicker
                  clients={clients}
                  value={form.clientId}
                  onValueChange={(v) => set('clientId', v)}
                  error={submitAttempted && !form.clientId}
                  frequentIds={frequentClientIds}
                />
                {submitAttempted && !form.clientId && (
                  <p className="text-xs text-red-500">Debes seleccionar un cliente</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Monto</Label>
                  <CurrencyInput value={form.amount} onValueChange={(v) => set('amount', v ?? 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Anticipo (opcional)</Label>
                  <CurrencyInput value={form.downPayment} onValueChange={(v) => set('downPayment', v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Frecuencia</Label>
                  <Select value={form.frequency} onValueChange={(v) => set('frequency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((f) => (
                        <SelectItem key={f.code} value={f.code}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFreq?.interestRate != null && form.interestRate === 0 && (
                    <p className="text-xs text-muted-foreground">Tasa por defecto: {selectedFreq.interestRate}%</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Tasa interés (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.interestRate}
                    onChange={(e) => set('interestRate', Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha de entrega</Label>
                  <Input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>N° cuotas (vacío = por defecto)</Label>
                  <Input
                    type="number"
                    value={form.totalInstallments ?? ''}
                    onChange={(e) => set('totalInstallments', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              {selectedFreq?.periodDays && Number(form.totalInstallments) > 0 && form.startDate && (
                <p className="text-xs text-muted-foreground">
                  Primer pago:{' '}
                  <span className="font-medium text-foreground">
                    {new Date(new Date(`${form.startDate}T00:00:00`).getTime() + selectedFreq.periodDays * 86400000)
                      .toISOString()
                      .slice(0, 10)}
                  </span>{' '}
                  · Finalización estimada:{' '}
                  <span className="font-medium text-foreground">
                    {new Date(
                      new Date(`${form.startDate}T00:00:00`).getTime() +
                        Number(form.totalInstallments) * selectedFreq.periodDays * 86400000
                    )
                      .toISOString()
                      .slice(0, 10)}
                  </span>
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!form.immediateDeliveryRequested}
                  onChange={(e) => set('immediateDeliveryRequested', e.target.checked)}
                />
                Entrega inmediata solicitada
              </label>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="credit-form" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear crédito'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Detalle crédito */}
      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {detail?.credit.client.name} — {formatMoney(detail?.credit.amount)}
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={CREDIT_STATUS_VARIANTS[detail?.credit.status ?? 'pending_approval']}>
                {CREDIT_STATUS_LABELS[detail?.credit.status ?? 'pending_approval']}
              </Badge>
              {detail?.stats.requiresAttention && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Requiere atención
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <InfoBox label="Monto" value={formatMoney(detail?.credit.amount)} />
              <InfoBox label="Saldo" value={formatMoney(detail?.credit.balance)} />
              <InfoBox label="Total" value={formatMoney(detail?.credit.totalAmount)} />
              <InfoBox label="Cuota" value={formatMoney(detail?.credit.installmentAmount)} />
              <InfoBox
                label="Cuotas pagadas"
                value={`${detail?.stats.completedInstallments}/${detail?.stats.totalInstallments}`}
              />
              <InfoBox label="Vencidas" value={`${detail?.stats.overdueInstallments}`} />
              <InfoBox label="Morosidad" value={formatMoney(detail?.stats.overdueAmount)} />
              <InfoBox label="Días atraso" value={`${detail?.stats.daysOverdue}`} />
            </div>

            <div className="flex flex-wrap gap-2">
              {(detail?.credit.status === 'pending_approval' || detail?.credit.status === 'waiting_delivery') && (
                <Button size="sm" variant="outline" onClick={() => detail && setEditCredit(detail.credit)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
              {detail?.credit.status === 'pending_approval' && (
                <>
                  <Button size="sm" onClick={() => setApproveOpen(true)} disabled={approveMutation.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectOpen(true)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                </>
              )}
              {detail?.credit.status === 'waiting_delivery' && (
                <>
                  <Button size="sm" onClick={() => setDeliverOpen(true)} disabled={deliverMutation.isPending}>
                    <Truck className="h-4 w-4 mr-1" /> Entregar crédito
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRescheduleDate(new Date().toISOString().slice(0, 10))
                      setRescheduleOpen(true)
                    }}
                    disabled={rescheduleMutation.isPending}
                  >
                    <CalendarClock className="h-4 w-4 mr-1" /> Reprogramar
                  </Button>
                </>
              )}
              {(detail?.credit.status === 'active' || detail?.credit.status === 'waiting_delivery') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPayCredit(detail.credit)
                  }}
                >
                  <Banknote className="h-4 w-4 mr-1" /> Registrar pago
                </Button>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Cronograma de pagos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1.5 pr-2">#</th>
                      <th className="py-1.5 pr-2">Vence</th>
                      <th className="py-1.5 pr-2">Monto</th>
                      <th className="py-1.5 pr-2">Pagado</th>
                      <th className="py-1.5 pr-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail?.schedule.map((s) => (
                      <tr key={s.installment_number} className="border-b">
                        <td className="py-1.5 pr-2">{s.installment_number}</td>
                        <td className="py-1.5 pr-2">{s.due_date}</td>
                        <td className="py-1.5 pr-2">{formatMoney(s.amount)}</td>
                        <td className="py-1.5 pr-2">{formatMoney(s.paid_amount)}</td>
                        <td className="py-1.5 pr-2">
                          <Badge
                            variant="outline"
                            className={
                              s.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : s.status === 'partial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : s.status === 'overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {SCHEDULE_STATUS_LABELS[s.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detail?.credit.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                <p className="font-medium text-red-800">Rechazado</p>
                <p className="text-red-700">{detail.credit.rejectionReason}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Seguimiento de cobro</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (detail && followUpNote.trim()) {
                    followUpMutation.mutate({ id: detail.credit.id, note: followUpNote.trim() })
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Registra una gestión (llamé, prometió pagar...)"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={followUpMutation.isPending || !followUpNote.trim()}>
                  <Loader2 className={cn('h-4 w-4 mr-1', !followUpMutation.isPending && 'hidden')} />
                  Guardar
                </Button>
              </form>
              <div className="mt-2 space-y-1.5">
                {followUps.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p>{f.note}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(f.createdAt)} {f.createdBy ? `· ${f.createdBy.fullName}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 shrink-0"
                      onClick={() =>
                        detail && removeFollowUpMutation.mutate({ creditId: detail.credit.id, followUpId: f.id })
                      }
                      title="Eliminar"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {followUps.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin seguimientos registrados</p>
                )}
              </div>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Registrar pago */}
      <PayModal
        open={!!payCredit}
        credit={payCredit}
        onOpenChange={(o) => !o && setPayCredit(null)}
        onSubmit={(input) => paymentMutation.mutate(input)}
        pending={paymentMutation.isPending}
      />

      <ReceiptModal paymentId={receiptPaymentId} onClose={() => setReceiptPaymentId(null)} />

      {/* Editar crédito */}
      <EditCreditModal
        open={!!editCredit}
        credit={editCredit}
        frequencies={frequencies}
        onOpenChange={(o) => !o && setEditCredit(null)}
        onSubmit={(data) => {
          if (editCredit) editMutation.mutate({ id: editCredit.id, data })
        }}
        pending={editMutation.isPending}
      />

      {/* Aprobar crédito */}
      <ApproveModal
        open={approveOpen}
        credit={detail?.credit ?? null}
        onOpenChange={setApproveOpen}
        onConfirm={() => {
          if (detail) approveMutation.mutate({ id: detail.credit.id, date: detail.credit.startDate })
          setApproveOpen(false)
        }}
        pending={approveMutation.isPending}
      />

      {/* Rechazar crédito */}
      <PromptDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Rechazar crédito"
        description="Indica el motivo del rechazo"
        placeholder="Motivo del rechazo"
        confirmText="Rechazar"
        onConfirm={(reason) => detail && rejectMutation.mutate({ id: detail.credit.id, reason })}
      />

      {/* Reprogramar entrega */}
      <PromptDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        title="Reprogramar entrega"
        description="Nueva fecha de entrega"
        inputType="date"
        defaultValue={rescheduleDate}
        confirmText="Reprogramar"
        onConfirm={(date) => detail && rescheduleMutation.mutate({ id: detail.credit.id, date })}
      />

      {/* Entregar crédito */}
      <Sheet open={deliverOpen} onOpenChange={setDeliverOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Entregar crédito</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <p className="text-sm text-muted-foreground">
              El primer pago vencerá en {PERIOD_DAYS[detail?.credit.frequency ?? 'daily']} día(s) (frecuencia:{' '}
              {FREQUENCY_LABELS[detail?.credit.frequency ?? 'daily']}). ¿Confirmas la entrega?
            </p>
            <Button
              className="w-full"
              onClick={() => {
                if (detail) deliverMutation.mutate({ id: detail.credit.id })
                setDeliverOpen(false)
              }}
              disabled={deliverMutation.isPending}
            >
              <Truck className="h-4 w-4 mr-1" /> Entregar crédito
            </Button>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function computeDate(startDate: string | undefined, addDays: number): string | undefined {
  if (!startDate || !addDays) return startDate
  return new Date(new Date(`${startDate}T00:00:00`).getTime() + addDays * 86400000).toISOString().slice(0, 10)
}

function EditCreditModal({
  open,
  credit,
  frequencies,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean
  credit: Credit | null
  frequencies: LoanFrequency[]
  onOpenChange: (o: boolean) => void
  onSubmit: (data: Partial<CreateCreditInput>) => void
  pending: boolean
}) {
  const [form, setForm] = useState<Partial<CreateCreditInput>>({})

  useEffect(() => {
    if (credit) {
      setForm({
        amount: Number(credit.amount),
        downPayment: credit.downPayment,
        interestRate: Number(credit.interestRate),
        totalInstallments: credit.totalInstallments,
        frequency: credit.frequency,
        startDate: credit.startDate,
        description: credit.description ?? '',
      })
    }
  }, [credit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!credit) return
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Monto inválido')
      return
    }
    onSubmit({ ...form, amount: Number(form.amount), interestRate: Number(form.interestRate ?? 0) })
  }

  const set = (key: keyof CreateCreditInput, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar crédito</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <form onSubmit={handleSubmit} id="edit-credit-form" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <CurrencyInput value={form.amount ?? 0} onValueChange={(v) => set('amount', v ?? 0)} />
              </div>
              <div className="space-y-1.5">
                <Label>Anticipo</Label>
                <CurrencyInput value={form.downPayment ?? null} onValueChange={(v) => set('downPayment', v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tasa interés (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.interestRate ?? 0}
                  onChange={(e) => set('interestRate', Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="space-y-1.5">
                <Label>N° cuotas</Label>
                <Input
                  type="number"
                  value={form.totalInstallments ?? ''}
                  onChange={(e) => set('totalInstallments', e.target.value ? Number(e.target.value) : null)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Frecuencia</Label>
                <Select value={form.frequency ?? 'daily'} onValueChange={(v) => set('frequency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f.code} value={f.code}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de entrega</Label>
                <Input type="date" value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-credit-form" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ApproveModal({
  open,
  credit,
  onOpenChange,
  onConfirm,
  pending,
}: {
  open: boolean
  credit: Credit | null
  onOpenChange: (o: boolean) => void
  onConfirm: () => void
  pending: boolean
}) {
  const period = PERIOD_DAYS[credit?.frequency ?? 'daily'] ?? 1
  const installments = Number(credit?.totalInstallments ?? 0)
  const firstPay = computeDate(credit?.startDate, period)
  const finish = computeDate(credit?.startDate, period * installments)

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0'
      )}
      onClick={() => !pending && onOpenChange(false)}
    >
      <div
        className={cn(
          'bg-background rounded-xl shadow-xl w-full max-w-sm overflow-hidden transition-all duration-200 transform',
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-background">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Aprobar crédito</h2>
              <p className="text-xs text-muted-foreground">
                {credit?.client.name} · {credit ? formatMoney(credit.amount) : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          <DateTile
            icon={<HandCoins className="h-4 w-4" />}
            label="Entrega"
            value={formatDate(credit?.startDate)}
            accent="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
          />
          <DateTile
            icon={<CalendarDays className="h-4 w-4" />}
            label={`Primer pago (${FREQUENCY_LABELS[credit?.frequency ?? 'daily'] ?? credit?.frequency})`}
            value={formatDate(firstPay)}
            accent="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
          />
          <DateTile
            icon={<Flag className="h-4 w-4" />}
            label="Finalización"
            value={formatDate(finish)}
            accent="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
          />
          {installments > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {installments} cuota(s) de {formatMoney(credit?.installmentAmount)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending} className="bg-green-600 hover:bg-green-700">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aprobar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DateTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold leading-tight">{value}</p>
      </div>
    </div>
  )
}

function PayModal({
  open,
  credit,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean
  credit: Credit | null
  onOpenChange: (o: boolean) => void
  onSubmit: (input: RegisterPaymentInput) => void
  pending: boolean
}) {
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<'cash' | 'transfer' | 'card' | 'mobile_payment'>('cash')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!credit) return
    if (!amount || amount <= 0) {
      toast.error('Monto inválido')
      return
    }
    onSubmit({ creditId: credit.id, amount, paymentMethod: method })
    setAmount(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Registrar pago</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {credit && (
            <form onSubmit={handleSubmit} id="pay-form" className="space-y-4">
              <div className="rounded-md border p-3 space-y-1.5 text-sm">
                <p className="font-semibold">{credit.client.name}</p>
                <p className="text-xs text-muted-foreground">
                  Cédula: {credit.client.identification} · {FREQUENCY_LABELS[credit.frequency] ?? credit.frequency}
                </p>
                <div className="flex justify-between pt-1.5 border-t">
                  <span className="text-muted-foreground">Monto total</span>
                  <span className="font-medium">{formatMoney(credit.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota</span>
                  <span className="font-medium">{formatMoney(credit.installmentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuotas pagadas</span>
                  <span className="font-medium">
                    {credit.paidInstallmentsCount}/{credit.totalInstallments ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo pendiente</span>
                  <span className="font-semibold text-green-600">{formatMoney(credit.balance)}</span>
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
                    onClick={() => setAmount(Math.ceil(Number(credit.installmentAmount ?? 0)))}
                  >
                    Cuota: {formatMoney(Math.ceil(Number(credit.installmentAmount ?? 0)))}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-green-600"
                    onClick={() => setAmount(Math.ceil(Number(credit.balance)))}
                  >
                    Saldo: {formatMoney(Math.ceil(Number(credit.balance)))}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="pay-form" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar pago'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
