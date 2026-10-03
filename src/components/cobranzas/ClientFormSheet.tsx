import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { createClient, updateClient, type CobranzaClientInput } from '@/services/cobranzasApi'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import type { CobranzaClient } from '@/types/cobranzas'

const EMPTY: CobranzaClientInput = { name: '', identification: '', phone: '', address: '', notes: '' }

export function ClientFormSheet({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: CobranzaClient | null
  onSaved?: (client: CobranzaClient) => void
}) {
  const invalidate = useCobranzasInvalidate()
  const [form, setForm] = useState<CobranzaClientInput>(EMPTY)

  useEffect(() => {
    if (!open) return
    setForm(
      client
        ? {
            name: client.name,
            identification: client.identification,
            phone: client.phone ?? '',
            address: client.address ?? '',
            notes: client.notes ?? '',
          }
        : EMPTY
    )
  }, [open, client])

  const mutation = useMutation({
    mutationFn: (data: CobranzaClientInput) => (client ? updateClient(client.id, data) : createClient(data)),
    onSuccess: (saved) => {
      toast.success(client ? 'Cliente actualizado' : 'Cliente creado')
      invalidate()
      onOpenChange(false)
      onSaved?.(saved)
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const set = (key: keyof CobranzaClientInput, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const valid = form.name.trim().length > 0 && form.identification.trim().length > 0

  const submit = () => {
    if (!valid) return
    mutation.mutate({
      name: form.name.trim(),
      identification: form.identification.trim(),
      phone: form.phone?.trim() || undefined,
      address: form.address?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>{client ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cl-name">Nombre completo *</Label>
            <Input id="cl-name" value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-id">Cédula *</Label>
            <Input
              id="cl-id"
              inputMode="numeric"
              value={form.identification}
              onChange={(e) => set('identification', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-phone">Teléfono / WhatsApp</Label>
            <Input
              id="cl-phone"
              type="tel"
              inputMode="tel"
              placeholder="3001234567"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-address">Dirección</Label>
            <Input id="cl-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-notes">Notas</Label>
            <Input id="cl-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {client ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
