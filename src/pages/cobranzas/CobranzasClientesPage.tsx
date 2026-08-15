import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Loader2, Pencil, Eye, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { CurrencyInput } from '@/components/CurrencyInput'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ActionButton } from '@/components/ui/ActionButton'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  toggleClientActive,
  deleteClient,
  type CobranzaClientInput,
} from '@/services/cobranzasApi'
import { listCategories } from '@/services/cobranzasApi'
import { formatMoney, formatDate, CREDIT_STATUS_LABELS } from '@/lib/cobranzasUtils'

const emptyForm: CobranzaClientInput = {
  name: '',
  identification: '',
  phone: '',
  email: '',
  address: '',
  categoryId: null,
  creditLimitOverride: null,
  maxCreditsOverride: null,
  notes: '',
}

export function CobranzasClientesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<CobranzaClientInput>(emptyForm)

  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-clients', search],
    queryFn: () => listClients({ search: search || undefined, limit: 100 }),
  })

  const { data: categories } = useModuleQuery({
    queryKey: ['cobranza-categories'],
    queryFn: () => listCategories(),
  })

  const { data: detail } = useModuleQuery({
    queryKey: ['cobranza-client', detailId],
    queryFn: () => (detailId ? getClient(detailId) : null),
    enabled: !!detailId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cobranza-clients'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-client'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-credit-clients'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-stats'] })
  }

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success('Cliente creado')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CobranzaClientInput> }) => updateClient(id, data),
    onSuccess: () => {
      toast.success('Cliente actualizado')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const toggleMutation = useMutation({ mutationFn: toggleClientActive, onSuccess: () => invalidate() })
  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success('Cliente eliminado')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (client: NonNullable<typeof data>['items'][number]) => {
    setEditingId(client.id)
    setForm({
      name: client.name,
      identification: client.identification,
      phone: client.phone ?? '',
      email: client.email ?? '',
      address: client.address ?? '',
      categoryId: client.category?.id ?? null,
      creditLimitOverride: client.creditLimitOverride,
      maxCreditsOverride: client.maxCreditsOverride,
      notes: client.notes ?? '',
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const set = (key: keyof CobranzaClientInput, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes de Cobranza</h1>
          <p className="text-sm text-muted-foreground">Total: {data?.total ?? 0}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo cliente
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, cédula o teléfono"
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
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Cédula</th>
                    <th className="py-2 pr-3">Teléfono</th>
                    <th className="py-2 pr-3">Categoría</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((client) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{client.name}</td>
                      <td className="py-2 pr-3">{client.identification}</td>
                      <td className="py-2 pr-3">{client.phone || '—'}</td>
                      <td className="py-2 pr-3">
                        {client.category ? <Badge variant="outline">{client.category.name}</Badge> : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant="outline"
                          className={client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                        >
                          {client.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-0.5">
                          <ActionButton icon={Eye} onClick={() => setDetailId(client.id)} title="Ver detalle" />
                          <ActionButton icon={Pencil} onClick={() => openEdit(client)} title="Editar" />
                          <ActionButton
                            icon={Power}
                            tone={client.isActive ? 'warning' : 'success'}
                            onClick={() => {
                              setActingId(client.id)
                              toggleMutation.mutate(client.id, { onSettled: () => setActingId(null) })
                            }}
                            title={client.isActive ? 'Desactivar cliente' : 'Activar cliente'}
                            pending={actingId === client.id}
                          />
                          <ActionButton
                            icon={Trash2}
                            tone="danger"
                            onClick={() => setDeleteTarget(client.id)}
                            title="Eliminar"
                            pending={actingId === client.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        Sin clientes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form onSubmit={handleSubmit} className="space-y-4" id="client-form">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cédula/RIF</Label>
                  <Input required value={form.identification} onChange={(e) => set('identification', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select
                    value={form.categoryId ?? 'none'}
                    onValueChange={(v) => set('categoryId', v === 'none' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Límite de crédito</Label>
                  <CurrencyInput
                    value={form.creditLimitOverride}
                    onValueChange={(v) => set('creditLimitOverride', v)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Máx. créditos</Label>
                  <Input
                    type="number"
                    value={form.maxCreditsOverride ?? ''}
                    onChange={(e) => set('maxCreditsOverride', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notas</Label>
                <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="client-form" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detail?.client.name}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">
                Cédula: <span className="text-foreground font-medium">{detail?.client.identification}</span>
              </p>
              <p className="text-muted-foreground">
                Teléfono: <span className="text-foreground font-medium">{detail?.client.phone || '—'}</span>
              </p>
              <p className="text-muted-foreground">
                Categoría: <span className="text-foreground font-medium">{detail?.client.category?.name || '—'}</span>
              </p>
              <p className="text-muted-foreground">
                Dirección: <span className="text-foreground font-medium">{detail?.client.address || '—'}</span>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Créditos activos</h3>
              <div className="space-y-2">
                {detail?.activeCredits.map((c) => (
                  <div key={c.id} className="border rounded-md p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatMoney(c.amount)}</span>
                      <Badge variant="outline" className="text-xs">
                        {CREDIT_STATUS_LABELS[c.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {formatMoney(c.balance)} · Inicio: {formatDate(c.startDate)}
                    </p>
                  </div>
                ))}
                {detail?.activeCredits.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin créditos activos</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Historial de pagos</h3>
              <div className="space-y-2">
                {detail?.paymentHistory.map((p) => (
                  <div key={p.id} className="border rounded-md p-3 text-sm flex justify-between">
                    <span>{formatDate(p.paymentDate)}</span>
                    <span className="font-semibold text-green-600">{formatMoney(p.amount)}</span>
                  </div>
                ))}
                {detail?.paymentHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                )}
              </div>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar cliente"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => {
          if (deleteTarget) {
            setActingId(deleteTarget)
            deleteMutation.mutate(deleteTarget, { onSettled: () => setActingId(null) })
          }
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
