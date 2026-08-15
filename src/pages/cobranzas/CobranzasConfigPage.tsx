import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Plus, Loader2, Pencil, Trash2, Power, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ActionButton } from '@/components/ui/ActionButton'
import {
  listInterestRates,
  createInterestRate,
  updateInterestRate,
  toggleInterestRateActive,
  deleteInterestRate,
  listLoanFrequencies,
  updateLoanFrequency,
  type InterestRateInput,
  type LoanFrequencyInput,
} from '@/services/cobranzasApi'

type ConfigTab = 'rates' | 'frequencies'

export function CobranzasConfigPage() {
  const [tab, setTab] = useState<ConfigTab>('rates')

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Cobranzas</h1>
        <p className="text-sm text-muted-foreground">Tasas de interés y frecuencias de pago</p>
      </div>

      <div className="inline-flex items-center rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab('rates')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            tab === 'rates' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tasas de interés
        </button>
        <button
          type="button"
          onClick={() => setTab('frequencies')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            tab === 'frequencies'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Frecuencias de pago
        </button>
      </div>

      {tab === 'rates' ? (
        <>
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-sm text-blue-900 dark:text-blue-200">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">Tasas de interés:</span> porcentaje aplicado sobre el monto del crédito al
              crearlo (<span className="font-mono">Total = Monto × (1 + tasa/100)</span>). Se usa en el formulario{' '}
              <span className="font-semibold">"Nuevo crédito"</span> (campo{' '}
              <span className="font-semibold">Tasa interés</span>); si lo dejas en 0, se toma la tasa por defecto de la
              frecuencia.
            </p>
          </div>
          <InterestRatesTab />
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-sm text-blue-900 dark:text-blue-200">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">Frecuencias de pago:</span> definen cuántos días pasan entre cuota y cuota
              (diario 1, semanal 7, quincenal 15, mensual 30) y cuántas cuotas sugeridas. Aparecen en el formulario{' '}
              <span className="font-semibold">"Nuevo crédito"</span> (campo{' '}
              <span className="font-semibold">Frecuencia</span>) y determinan el{' '}
              <span className="font-semibold">cronograma de pagos</span> del crédito y la{' '}
              <span className="font-semibold">fecha de entrega programada</span> auto-calculada.
            </p>
          </div>
          <FrequenciesTab />
        </>
      )}
    </div>
  )
}

function InterestRatesTab() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [form, setForm] = useState<InterestRateInput>({ name: '', rate: 0 })

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['cobranza-interest-rates'],
    queryFn: () => listInterestRates(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cobranza-interest-rates'] })

  const createMutation = useMutation({
    mutationFn: createInterestRate,
    onSuccess: () => {
      toast.success('Tasa creada')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterestRateInput> }) => updateInterestRate(id, data),
    onSuccess: () => {
      toast.success('Tasa actualizada')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const toggleMutation = useMutation({ mutationFn: toggleInterestRateActive, onSuccess: () => invalidate() })
  const deleteMutation = useMutation({
    mutationFn: deleteInterestRate,
    onSuccess: () => {
      toast.success('Tasa eliminada')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) updateMutation.mutate({ id: editingId, data: form })
    else createMutation.mutate(form)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-end mb-3">
          <Button
            onClick={() => {
              setEditingId(null)
              setForm({ name: '', rate: 0 })
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nueva tasa
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Tasa</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-medium">{r.name || 'Sin nombre'}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center font-semibold">{r.rate}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant="outline"
                        className={r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                      >
                        {r.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-0.5">
                        <ActionButton
                          icon={Pencil}
                          onClick={() => {
                            setEditingId(r.id)
                            setForm({ name: r.name ?? '', rate: r.rate })
                            setFormOpen(true)
                          }}
                          title="Editar"
                        />
                        <ActionButton
                          icon={Power}
                          tone={r.isActive ? 'warning' : 'success'}
                          onClick={() => {
                            setActingId(r.id)
                            toggleMutation.mutate(r.id, { onSettled: () => setActingId(null) })
                          }}
                          title={r.isActive ? 'Desactivar tasa' : 'Activar tasa'}
                          pending={actingId === r.id}
                        />
                        <ActionButton
                          icon={Trash2}
                          tone="danger"
                          onClick={() => setDeleteTarget(r.id)}
                          title="Eliminar"
                          pending={actingId === r.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Sin tasas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Editar tasa' : 'Nueva tasa de interés'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form onSubmit={handleSubmit} id="rate-form" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tasa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={form.rate}
                  onChange={(e) => setForm((f) => ({ ...f, rate: Number(e.target.value) }))}
                />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="rate-form" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar tasa de interés"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </Card>
  )
}

function FrequenciesTab() {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [form, setForm] = useState<LoanFrequencyInput>({})

  const { data: frequencies = [], isLoading } = useQuery({
    queryKey: ['cobranza-frequencies'],
    queryFn: () => listLoanFrequencies(false),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cobranza-frequencies'] })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoanFrequencyInput }) => updateLoanFrequency(id, data),
    onSuccess: () => {
      toast.success('Frecuencia actualizada')
      setEditOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const openEdit = (f: (typeof frequencies)[number]) => {
    setEditingId(f.id)
    setForm({
      name: f.name,
      description: f.description ?? '',
      isEnabled: f.isEnabled,
      isFixedDuration: f.isFixedDuration,
      fixedInstallments: f.fixedInstallments,
      fixedDurationDays: f.fixedDurationDays,
      periodDays: f.periodDays,
      defaultInstallments: f.defaultInstallments,
      minInstallments: f.minInstallments,
      maxInstallments: f.maxInstallments,
      interestRate: f.interestRate,
    })
    setEditOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) updateMutation.mutate({ id: editingId, data: form })
  }

  const set = (key: keyof LoanFrequencyInput, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  return (
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
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Código</th>
                  <th className="py-2 pr-3">Periodo (días)</th>
                  <th className="py-2 pr-3">Cuotas</th>
                  <th className="py-2 pr-3">Tasa</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {frequencies.map((f) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{f.name}</td>
                    <td className="py-2 pr-3">{f.code}</td>
                    <td className="py-2 pr-3">{f.periodDays}</td>
                    <td className="py-2 pr-3">
                      {f.isFixedDuration && f.fixedInstallments
                        ? `${f.fixedInstallments} fijas`
                        : f.defaultInstallments
                          ? `Def: ${f.defaultInstallments} (${f.minInstallments ?? '—'}–${f.maxInstallments ?? '—'})`
                          : '—'}
                    </td>
                    <td className="py-2 pr-3">{f.interestRate != null ? `${f.interestRate}%` : '—'}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant="outline"
                        className={f.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                      >
                        {f.isEnabled ? 'Habilitada' : 'Deshabilitada'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-0.5">
                        <ActionButton icon={Pencil} onClick={() => openEdit(f)} title="Editar" />
                        <ActionButton
                          icon={Power}
                          tone={f.isEnabled ? 'warning' : 'success'}
                          onClick={() => {
                            setActingId(f.id)
                            updateLoanFrequency(f.id, { isEnabled: !f.isEnabled })
                              .then(() => {
                                toast.success(`Frecuencia ${f.isEnabled ? 'deshabilitada' : 'habilitada'}`)
                                invalidate()
                              })
                              .finally(() => setActingId(null))
                          }}
                          title={f.isEnabled ? 'Deshabilitar frecuencia' : 'Habilitar frecuencia'}
                          pending={actingId === f.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar frecuencia</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form onSubmit={handleSubmit} id="frequency-form" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Periodo (días)</Label>
                  <Input
                    type="number"
                    required
                    value={form.periodDays ?? ''}
                    onChange={(e) => set('periodDays', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Tasa (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.interestRate ?? ''}
                    onChange={(e) => set('interestRate', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cuotas def.</Label>
                  <Input
                    type="number"
                    value={form.defaultInstallments ?? ''}
                    onChange={(e) => set('defaultInstallments', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mínimo</Label>
                  <Input
                    type="number"
                    value={form.minInstallments ?? ''}
                    onChange={(e) => set('minInstallments', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Máximo</Label>
                  <Input
                    type="number"
                    value={form.maxInstallments ?? ''}
                    onChange={(e) => set('maxInstallments', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duración fija (cuotas)</Label>
                  <Input
                    type="number"
                    value={form.fixedInstallments ?? ''}
                    onChange={(e) => set('fixedInstallments', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!form.isFixedDuration}
                  onChange={(e) => set('isFixedDuration', e.target.checked)}
                />
                Duración fija (la frecuencia fija el n° de cuotas)
              </label>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="frequency-form" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  )
}
