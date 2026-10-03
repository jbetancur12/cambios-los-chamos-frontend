import { useEffect, useState } from 'react'
import { Landmark, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditDetailSheet } from '@/components/cobranzas/CreditDetailSheet'
import { CreditFormSheet } from '@/components/cobranzas/CreditFormSheet'
import { CreditStatusBadge } from '@/components/cobranzas/CreditStatusBadge'
import { PaginationBar } from '@/components/cobranzas/PaginationBar'
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

const PAGE_SIZE = 15

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
    <div className="container mx-auto max-w-3xl space-y-4 p-4 pb-28 md:max-w-6xl">
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
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
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
        <>
          <div className="hidden space-y-1.5 md:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <div className="space-y-2 md:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </>
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
          {/* Desktop: tabla compacta */}
          <div className="hidden max-h-[calc(100vh-22rem)] min-h-[200px] overflow-auto rounded-lg border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                  <th className="px-3 py-2 text-right font-semibold">Prestado</th>
                  <th className="px-3 py-2 text-right font-semibold">Saldo</th>
                  <th className="px-3 py-2 text-center font-semibold">Cuotas</th>
                  <th className="px-3 py-2 text-left font-semibold">Próxima cuota</th>
                  <th className="px-3 py-2 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const late = c.status === 'active' && c.isOverdue
                  return (
                    <tr
                      key={c.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver préstamo de ${c.client.name}`}
                      onClick={() => setDetailId(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setDetailId(c.id)
                      }}
                      className={cn(
                        'cursor-pointer border-b border-l-2 border-l-transparent transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
                        late && 'border-l-red-500 bg-red-500/5'
                      )}
                    >
                      <td className="max-w-[16rem] px-3 py-1.5">
                        <p className="truncate font-medium">{c.client.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.client.identification}</p>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(c.amount)}</td>
                      <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{formatMoney(c.balance)}</td>
                      <td className="px-3 py-1.5 text-center tabular-nums">
                        {c.paidInstallments}/{c.totalInstallments}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {c.status === 'active' && c.nextDueDate ? formatDate(c.nextDueDate) : '—'}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex flex-col items-start gap-0.5">
                          <CreditStatusBadge credit={c} />
                          {late && (
                            <span className="text-xs font-semibold text-red-600">
                              Vencido {formatMoney(c.overdueAmount)}
                            </span>
                          )}
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
            {items.map((c) => (
              <Card
                key={c.id}
                tabIndex={0}
                role="button"
                className="cursor-pointer"
                onClick={() => setDetailId(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setDetailId(c.id)
                }}
              >
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(c.amount)} · {FREQUENCY_LABELS[c.frequency].toLowerCase()} · {c.paidInstallments}/
                        {c.totalInstallments} cuotas
                      </p>
                    </div>
                    <CreditStatusBadge credit={c} />
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="font-bold tabular-nums">
                      <span className="mr-1 text-xs font-normal text-muted-foreground">Saldo</span>
                      {formatMoney(c.balance)}
                    </p>
                    <div className="text-right text-xs text-muted-foreground">
                      {c.status === 'active' ? (
                        c.isOverdue ? (
                          <span className="font-semibold text-red-600">Vencido {formatMoney(c.overdueAmount)}</span>
                        ) : c.nextDueDate ? (
                          <>Próxima {formatDate(c.nextDueDate)}</>
                        ) : null
                      ) : (
                        <>Desde {formatDate(c.createdAt)}</>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationBar page={page} pages={pages} total={total} onPageChange={setPage} disabled={isFetching} />
        </div>
      )}

      <CreditFormSheet open={creating} onOpenChange={setCreating} onSaved={(c) => setDetailId(c.id)} />
      <CreditDetailSheet creditId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
