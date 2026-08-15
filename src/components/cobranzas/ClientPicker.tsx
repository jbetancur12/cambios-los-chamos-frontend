import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { ChevronDown, Search, UserCheck } from 'lucide-react'
import type { CobranzaClient } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

export function ClientPicker({
  clients,
  value,
  onValueChange,
  error,
  frequentIds = [],
}: {
  clients: CobranzaClient[]
  value: string
  onValueChange: (clientId: string) => void
  error?: boolean
  frequentIds?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = clients.find((c) => c.id === value)

  const frequent = frequentIds
    .map((id) => clients.find((c) => c.id === id))
    .filter((c): c is CobranzaClient => !!c)
    .slice(0, 5)

  const filtered = search
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.identification.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? '').includes(search)
      )
    : clients

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setSearch('')
          setOpen(true)
        }}
        className={cn('w-full h-11 justify-between font-normal', error && 'border-red-500 focus:ring-red-500')}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {selected ? `${selected.name} (${selected.identification})` : 'Seleccionar cliente'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Seleccionar cliente</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o teléfono"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {!search ? (
              <div className="space-y-3">
                {frequent.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Frecuentes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {frequent.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onValueChange(c.id)
                            setOpen(false)
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted/50',
                            c.id === value
                              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40'
                              : 'border-input'
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {clients.length > 0
                    ? `Tienes ${clients.length} cliente(s). Escribe arriba para buscar.`
                    : 'Sin clientes registrados'}
                </p>
              </div>
            ) : (
              <div className="max-h-[55vh] overflow-y-auto space-y-1">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onValueChange(c.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50',
                      c.id === value ? 'border-green-500 bg-green-50 dark:bg-green-950/40' : 'border-input'
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium truncate">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.identification}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </span>
                    </span>
                    {c.id === value && <UserCheck className="h-4 w-4 text-green-600 shrink-0" />}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin clientes que coincidan con la búsqueda
                  </p>
                )}
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}
