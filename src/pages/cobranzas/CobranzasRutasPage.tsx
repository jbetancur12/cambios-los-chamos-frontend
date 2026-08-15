import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Plus, Loader2, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ActionButton } from '@/components/ui/ActionButton'
import {
  listRoutes,
  getAvailableClients,
  createRoute,
  updateRoute,
  assignClientsToRoute,
  deleteRoute,
  type CobranzaRouteInput,
} from '@/services/cobranzasApi'

export function CobranzasRutasPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assignRouteId, setAssignRouteId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [form, setForm] = useState<CobranzaRouteInput>({ name: '', description: '', cobradorId: user?.id ?? '' })

  const { data: routes = [], isLoading } = useModuleQuery({
    queryKey: ['cobranza-routes'],
    queryFn: listRoutes,
  })

  const { data: availableClients = [] } = useModuleQuery({
    queryKey: ['cobranza-available-clients'],
    queryFn: getAvailableClients,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cobranza-routes'] })

  const createMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      toast.success('Ruta creada')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CobranzaRouteInput> }) => updateRoute(id, data),
    onSuccess: () => {
      toast.success('Ruta actualizada')
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const assignMutation = useMutation({
    mutationFn: ({ id, ids }: { id: string; ids: string[] }) => assignClientsToRoute(id, ids),
    onSuccess: () => {
      toast.success('Clientes asignados')
      setAssignRouteId(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      toast.success('Ruta eliminada')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, cobradorId: form.cobradorId || user?.id || '' }
    if (editingId) updateMutation.mutate({ id: editingId, data })
    else createMutation.mutate(data)
  }

  const assignRoute = routes.find((r) => r.id === assignRouteId)

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutas de cobranza</h1>
          <p className="text-sm text-muted-foreground">{routes.length} rutas</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setForm({ name: '', description: '', cobradorId: user?.id ?? '' })
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nueva ruta
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
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Descripción</th>
                    <th className="py-2 pr-3">Clientes</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{r.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.description || '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {r.clients?.length ?? 0}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            onClick={() => {
                              setAssignRouteId(r.id)
                              setSelectedClients(r.clients?.map((c) => c.id) ?? [])
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" /> Asignar clientes
                          </Button>
                          <ActionButton
                            icon={Pencil}
                            onClick={() => {
                              setEditingId(r.id)
                              setForm({
                                name: r.name,
                                description: r.description ?? '',
                                cobradorId: r.cobrador?.id ?? user?.id ?? '',
                              })
                              setFormOpen(true)
                            }}
                            title="Editar"
                          />
                          <ActionButton
                            icon={Trash2}
                            tone="danger"
                            onClick={() => setDeleteTarget(r.id)}
                            title="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {routes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Sin rutas creadas
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
            <SheetTitle>{editingId ? 'Editar ruta' : 'Nueva ruta'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form onSubmit={handleSubmit} id="route-form" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Cobrador: {user?.fullName} (Super Admin)</p>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="route-form" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!assignRouteId} onOpenChange={(o) => !o && setAssignRouteId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Asignar clientes a "{assignRoute?.name}"</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            {availableClients.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedClients.includes(c.id)}
                  onChange={(e) =>
                    setSelectedClients((prev) =>
                      e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                    )
                  }
                />
                <span className="text-sm">
                  {c.name} <span className="text-muted-foreground">({c.identification})</span>
                </span>
              </label>
            ))}
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setAssignRouteId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => assignRouteId && assignMutation.mutate({ id: assignRouteId, ids: selectedClients })}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar asignación'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar ruta"
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
