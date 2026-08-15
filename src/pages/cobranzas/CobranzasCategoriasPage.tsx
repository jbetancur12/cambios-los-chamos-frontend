import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Plus, Loader2, Pencil, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { CurrencyInput } from '@/components/CurrencyInput'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ActionButton } from '@/components/ui/ActionButton'
import {
  listCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
  type ClientCategoryInput,
} from '@/services/cobranzasApi'
import { formatMoney } from '@/lib/cobranzasUtils'

const emptyForm: ClientCategoryInput = {
  code: '',
  name: '',
  description: '',
  maxAmount: null,
  minAmount: 0,
  maxCredits: null,
}

export function CobranzasCategoriasPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClientCategoryInput>(emptyForm)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['cobranza-categories'],
    queryFn: () => listCategories(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cobranza-categories'] })
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success('Categoría creada')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientCategoryInput> }) => updateCategory(id, data),
    onSuccess: () => {
      toast.success('Categoría actualizada')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const toggleMutation = useMutation({ mutationFn: toggleCategoryActive, onSuccess: () => invalidate() })
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Categoría eliminada')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }
  const openEdit = (c: (typeof categories)[number]) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      name: c.name,
      description: c.description ?? '',
      maxAmount: c.maxAmount,
      minAmount: c.minAmount,
      maxCredits: c.maxCredits,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) updateMutation.mutate({ id: editingId, data: form })
    else createMutation.mutate(form)
  }

  const set = (key: keyof ClientCategoryInput, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorías de clientes</h1>
          <p className="text-sm text-muted-foreground">Límites de crédito por categoría</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nueva categoría
        </Button>
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
                    <th className="py-2 pr-3">Código</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Límite mín.</th>
                    <th className="py-2 pr-3">Límite máx.</th>
                    <th className="py-2 pr-3">Máx. créditos</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{c.code}</td>
                      <td className="py-2 pr-3">{c.name}</td>
                      <td className="py-2 pr-3">{formatMoney(c.minAmount)}</td>
                      <td className="py-2 pr-3">{c.maxAmount != null ? formatMoney(c.maxAmount) : '—'}</td>
                      <td className="py-2 pr-3">{c.maxCredits ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant="outline"
                          className={c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                        >
                          {c.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-0.5">
                          <ActionButton icon={Pencil} onClick={() => openEdit(c)} title="Editar" />
                          <ActionButton
                            icon={Power}
                            tone={c.isActive ? 'warning' : 'success'}
                            onClick={() => {
                              setActingId(c.id)
                              toggleMutation.mutate(c.id, { onSettled: () => setActingId(null) })
                            }}
                            title={c.isActive ? 'Desactivar categoría' : 'Activar categoría'}
                            pending={actingId === c.id}
                          />
                          <ActionButton
                            icon={Trash2}
                            tone="danger"
                            onClick={() => setDeleteTarget(c.id)}
                            title="Eliminar"
                            pending={actingId === c.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        Sin categorías
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
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Editar categoría' : 'Nueva categoría'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form onSubmit={handleSubmit} id="category-form" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input required value={form.code} onChange={(e) => set('code', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input required value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Mínimo</Label>
                  <CurrencyInput value={form.minAmount} onValueChange={(v) => set('minAmount', v ?? 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Máximo</Label>
                  <CurrencyInput value={form.maxAmount} onValueChange={(v) => set('maxAmount', v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Máx. créditos</Label>
                  <Input
                    type="number"
                    value={form.maxCredits ?? ''}
                    onChange={(e) => set('maxCredits', e.target.value ? Number(e.target.value) : null)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="category-form" disabled={createMutation.isPending || updateMutation.isPending}>
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
        title="Eliminar categoría"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
