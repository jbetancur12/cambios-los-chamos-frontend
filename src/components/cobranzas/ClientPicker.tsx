import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { ChevronDown, Loader2, Search, UserCheck, UserPlus } from 'lucide-react'
import { useModuleQuery } from '@/hooks/useModuleQuery'
import { listClients } from '@/services/cobranzasApi'
import { ClientFormSheet } from '@/components/cobranzas/ClientFormSheet'
import type { CobranzaClient } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

// Selector de cliente con búsqueda en servidor y creación inline.
export function ClientPicker({
  value,
  onChange,
  error,
  disabled,
}: {
  value: CobranzaClient | null
  onChange: (client: CobranzaClient) => void
  error?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useModuleQuery({
    queryKey: ['cobranza-clients-picker', debounced],
    queryFn: () => listClients({ search: debounced || undefined, limit: 30 }),
    enabled: open,
  })
  const clients = data?.items ?? []

  const pick = (c: CobranzaClient) => {
    onChange(c)
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setSearch('')
          setOpen(true)
        }}
        className={cn('w-full h-11 justify-between font-normal', error && 'border-red-500')}
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value ? `${value.name} · ${value.identification}` : 'Buscar o crear cliente'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader onClose={() => setOpen(false)}>
            <SheetTitle>Seleccionar cliente</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre, cédula o teléfono"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={() => setCreating(true)}>
              <UserPlus className="h-4 w-4" />
              Crear cliente nuevo
            </Button>

            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : clients.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {debounced ? 'Ningún cliente coincide. Puedes crearlo arriba.' : 'Aún no tienes clientes.'}
                </p>
              ) : (
                clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pick(c)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50',
                      c.id === value?.id ? 'border-green-500 bg-green-50 dark:bg-green-950/40' : 'border-input'
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium truncate">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.identification}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </span>
                    </span>
                    {c.id === value?.id && <UserCheck className="h-4 w-4 text-green-600 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ClientFormSheet open={creating} onOpenChange={setCreating} onSaved={pick} />
    </>
  )
}
