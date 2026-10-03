import { useEffect, useState } from 'react'
import { Landmark, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditDetailSheet } from '@/components/cobranzas/CreditDetailSheet'
import { CreditFormSheet } from '@/components/cobranzas/CreditFormSheet'
import { CreditStatusBadge } from '@/components/cobranzas/CreditStatusBadge'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { listCredits, type CreditListParams } from '@/services/cobranzasApi'
import { formatDate, formatMoney, FREQUENCY_LABELS } from '@/lib/cobranzasUtils'
import { cn } from '@/lib/utils'

type Filter = 'active' | 'overdue' | 'paid_off'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Activos' },
  { key: 'overdue', label: 'En mora' },
  { key: 'paid_off', label: 'Pagados' },
]

const PAGE_SIZE = 20

const filterParams = (f: Filter): CreditListParams =>
  f === 'overdue' ? { status: 'active', overdueOnly: true } : { status: f }

export function CobranzasPrestamosPage() {
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching } = useModuleQuery({
    queryKey: ['cobranza-credits', filter, debounced, page],
    queryFn: () => listCredits({ ...filterParams(filter), search: debounced || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-4 pb-28">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Préstamos</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? 'Cargando...' : `${total} resultado(s)`}</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nuevo préstamo
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key)
              setPage(1)
            }}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              f.key === filter
                ? f.key === 'overdue'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40'
                  : 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-muted/50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o cédula"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Landmark className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">
              {debounced
                ? 'Sin resultados'
                : filter === 'active'
                  ? 'Aún no hay préstamos activos'
                  : 'No hay préstamos aquí'}
            </p>
            <p className="text-sm text-muted-foreground">
              {debounced ? 'Prueba con otro nombre o cédula.' : 'Crea tu primer préstamo en menos de un minuto.'}
            </p>
            {!debounced && filter === 'active' && (
              <Button className="mt-2" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Nuevo préstamo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn('space-y-3', isFetching && 'opacity-70 transition-opacity')}>
          {items.map((c) => (
            <Card key={c.id} className="cursor-pointer" onClick={() => setDetailId(c.id)}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(c.amount)} · {FREQUENCY_LABELS[c.frequency].toLowerCase()} · {c.paidInstallments}/
                      {c.totalInstallments} cuotas
                    </p>
                  </div>
                  <CreditStatusBadge credit={c} />
                </div>
                <div className="flex items-end justify-between text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-lg font-bold tabular-nums">{formatMoney(c.balance)}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {c.status === 'active' ? (
                      c.isOverdue ? (
                        <span className="font-semibold text-red-600">Vencido {formatMoney(c.overdueAmount)}</span>
                      ) : c.nextDueDate ? (
                        <>Próxima cuota {formatDate(c.nextDueDate)}</>
                      ) : null
                    ) : (
                      <>Desde {formatDate(c.createdAt)}</>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      <CreditFormSheet open={creating} onOpenChange={setCreating} onSaved={(c) => setDetailId(c.id)} />
      <CreditDetailSheet creditId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
