import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, MapPin, Pencil, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ClientFormSheet } from '@/components/cobranzas/ClientFormSheet'
import { ContactLinks } from '@/components/cobranzas/ContactLinks'
import { CreditDetailSheet } from '@/components/cobranzas/CreditDetailSheet'
import { CreditFormSheet } from '@/components/cobranzas/CreditFormSheet'
import { CreditStatusBadge } from '@/components/cobranzas/CreditStatusBadge'
import { PaginationBar } from '@/components/cobranzas/PaginationBar'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import { deleteClient, getClient, listClients } from '@/services/cobranzasApi'
import { formatDateTime, formatMoney, FREQUENCY_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/cobranzasUtils'
import type { CobranzaClient } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

function ClientSheet({ clientId, onClose }: { clientId: string | null; onClose: () => void }) {
  const invalidate = useCobranzasInvalidate()
  const [editing, setEditing] = useState(false)
  const [newCredit, setNewCredit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [creditId, setCreditId] = useState<string | null>(null)

  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-client', clientId],
    queryFn: () => getClient(clientId!),
    enabled: !!clientId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(clientId!),
    onSuccess: () => {
      toast.success('Cliente eliminado')
      setConfirmDelete(false)
      invalidate()
      onClose()
    },
    onError: (e) => {
      setConfirmDelete(false)
      toast.error((e as Error).message)
    },
  })

  if (!clientId) return null

  const client = data?.client
  const payments = (data?.payments ?? []).filter((p) => p.status === 'completed')

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader onClose={onClose}>
            <SheetTitle>{client?.name ?? 'Cliente'}</SheetTitle>
            {client && <p className="text-xs text-muted-foreground">Cédula {client.identification}</p>}
          </SheetHeader>
          <SheetBody className="space-y-5">
            {isLoading || !data || !client ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">Debe</p>
                    <p className="font-bold tabular-nums">{formatMoney(data.summary.totalDebt)}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">En mora</p>
                    <p
                      className={cn(
                        'font-bold tabular-nums',
                        data.summary.overdueAmount > 0 ? 'text-red-600' : 'text-muted-foreground'
                      )}
                    >
                      {formatMoney(data.summary.overdueAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">Ha pagado</p>
                    <p className="font-bold tabular-nums text-green-600">{formatMoney(data.summary.totalPaid)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {client.phone && <p>Tel: {client.phone}</p>}
                  {client.address && (
                    <p className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      {client.address}
                    </p>
                  )}
                  {client.notes && <p className="text-muted-foreground">{client.notes}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <ContactLinks phone={client.phone} />
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </Button>
                  </div>
                </div>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Préstamos ({data.credits.length})</h3>
                    <Button size="sm" onClick={() => setNewCredit(true)}>
                      <Plus className="h-4 w-4" /> Nuevo préstamo
                    </Button>
                  </div>
                  {data.credits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Este cliente aún no tiene préstamos.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.credits.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCreditId(c.id)}
                          className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium tabular-nums">{formatMoney(c.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {FREQUENCY_LABELS[c.frequency]} · {c.paidInstallments}/{c.totalInstallments} cuotas ·
                              saldo {formatMoney(c.balance)}
                            </p>
                          </div>
                          <CreditStatusBadge credit={c} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Últimos pagos</h3>
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium tabular-nums">{formatMoney(p.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(p.paymentDate)} · {PAYMENT_METHOD_LABELS[p.paymentMethod]}
                            </p>
                          </div>
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

      <ClientFormSheet open={editing} onOpenChange={setEditing} client={client} />
      <CreditFormSheet
        open={newCredit}
        onOpenChange={setNewCredit}
        initialClient={client as CobranzaClient | undefined}
        onSaved={(c) => setCreditId(c.id)}
      />
      <CreditDetailSheet creditId={creditId} onClose={() => setCreditId(null)} />
      <DeleteConfirmationModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar este cliente?"
        description="Solo se puede eliminar si no tiene préstamos."
        confirmText="Eliminar cliente"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}

export function CobranzasClientesPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching } = useModuleQuery({
    queryKey: ['cobranza-clients', debounced, page],
    queryFn: () => listClients({ search: debounced || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-4 pb-28 md:max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? 'Cargando...' : `${total} cliente(s)`}</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, cédula o teléfono"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <>
          <div className="hidden space-y-1.5 md:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <div className="space-y-2 md:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">{debounced ? 'Sin resultados' : 'Aún no tienes clientes'}</p>
            <p className="text-sm text-muted-foreground">
              {debounced ? 'Prueba con otro nombre o cédula.' : 'Crea tu primer cliente para empezar a prestar.'}
            </p>
            {!debounced && (
              <Button className="mt-2" onClick={() => setCreating(true)}>
                <UserPlus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn('space-y-3', isFetching && 'opacity-70 transition-opacity')}>
          {/* Desktop: tabla compacta */}
          <div className="hidden max-h-[calc(100vh-22rem)] min-h-[200px] overflow-auto rounded-lg border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold">Cédula</th>
                  <th className="px-3 py-2 text-left font-semibold">Teléfono</th>
                  <th className="px-3 py-2 text-center font-semibold">Préstamos activos</th>
                  <th className="px-3 py-2 text-right font-semibold">Deuda</th>
                  <th className="px-3 py-2 text-right font-semibold">En mora</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver ficha de ${c.name}`}
                    onClick={() => setSelectedId(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedId(c.id)
                    }}
                    className={cn(
                      'cursor-pointer border-b border-l-2 border-l-transparent transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
                      c.overdueAmount > 0 && 'border-l-red-500 bg-red-500/5'
                    )}
                  >
                    <td className="max-w-[16rem] truncate px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.identification}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.phone || '—'}</td>
                    <td className="px-3 py-2 text-center tabular-nums">{c.activeCredits}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {c.totalDebt > 0 ? formatMoney(c.totalDebt) : '—'}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right tabular-nums',
                        c.overdueAmount > 0 ? 'font-semibold text-red-600' : 'text-muted-foreground'
                      )}
                    >
                      {c.overdueAmount > 0 ? formatMoney(c.overdueAmount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas compactas */}
          <div className="space-y-2 md:hidden">
            {items.map((c) => (
              <Card
                key={c.id}
                tabIndex={0}
                role="button"
                className="cursor-pointer"
                onClick={() => setSelectedId(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedId(c.id)
                }}
              >
                <CardContent className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.identification}
                      {c.phone ? ` · ${c.phone}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {c.totalDebt > 0 ? (
                      <>
                        <p className="text-sm font-bold tabular-nums">{formatMoney(c.totalDebt)}</p>
                        {c.overdueAmount > 0 ? (
                          <p className="text-xs font-semibold text-red-600">Mora {formatMoney(c.overdueAmount)}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Al día</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin deuda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationBar page={page} pages={pages} total={total} onPageChange={setPage} disabled={isFetching} />
        </div>
      )}

      <ClientFormSheet open={creating} onOpenChange={setCreating} onSaved={(c) => setSelectedId(c.id)} />
      <ClientSheet clientId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
