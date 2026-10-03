import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { CurrencyInput } from '@/components/CurrencyInput'
import { ClientPicker } from '@/components/cobranzas/ClientPicker'
import { createCredit, updateCredit } from '@/services/cobranzasApi'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import {
  computeLoanPreview,
  formatDate,
  formatMoney,
  FREQUENCY_LABELS,
  PERIOD_DAYS,
  toDateInput,
} from '@/lib/cobranzasUtils'
import type { CobranzaClient, CreditFrequency, CreditView } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

const FREQUENCIES: CreditFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly']

// Crea o edita un préstamo (edición solo permitida sin pagos). Incluye vista previa en vivo.
export function CreditFormSheet({
  open,
  onOpenChange,
  credit,
  initialClient,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  credit?: CreditView | null
  initialClient?: CobranzaClient | null
  onSaved?: (credit: CreditView) => void
}) {
  const invalidate = useCobranzasInvalidate()
  const [client, setClient] = useState<CobranzaClient | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [rate, setRate] = useState('20')
  const [installments, setInstallments] = useState('10')
  const [frequency, setFrequency] = useState<CreditFrequency>('weekly')
  const [loanDate, setLoanDate] = useState(toDateInput())
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setTouched(false)
    if (credit) {
      setClient(credit.client)
      setAmount(credit.amount)
      setRate(String(credit.interestRate))
      setInstallments(String(credit.totalInstallments))
      setFrequency(credit.frequency)
      // startDate = fecha del préstamo + 1 periodo
      const start = new Date(`${credit.startDate.slice(0, 10)}T00:00:00`)
      start.setDate(start.getDate() - PERIOD_DAYS[credit.frequency])
      setLoanDate(toDateInput(start))
      setDescription(credit.description ?? '')
    } else {
      setClient(initialClient ?? null)
      setAmount(null)
      setRate('20')
      setInstallments('10')
      setFrequency('weekly')
      setLoanDate(toDateInput())
      setDescription('')
    }
  }, [open, credit, initialClient])

  const rateNum = Number(rate)
  const nNum = Math.floor(Number(installments))

  const preview = useMemo(
    () => computeLoanPreview(amount ?? 0, isNaN(rateNum) ? 0 : rateNum, nNum, frequency, loanDate),
    [amount, rateNum, nNum, frequency, loanDate]
  )

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        clientId: client!.id,
        amount: amount!,
        interestRate: rateNum,
        totalInstallments: nNum,
        frequency,
        loanDate,
        description: description.trim() || undefined,
      }
      return credit ? updateCredit(credit.id, data) : createCredit(data)
    },
    onSuccess: (saved) => {
      toast.success(credit ? 'Préstamo actualizado' : 'Préstamo creado')
      invalidate()
      onOpenChange(false)
      onSaved?.(saved)
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const errors = {
    client: !client,
    amount: !amount || amount <= 0,
    rate: isNaN(rateNum) || rateNum < 0,
    installments: !nNum || nNum < 1,
  }
  const valid = !Object.values(errors).some(Boolean)

  const submit = () => {
    setTouched(true)
    if (valid) mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>{credit ? 'Editar préstamo' : 'Nuevo préstamo'}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <ClientPicker value={client} onChange={setClient} error={touched && errors.client} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cr-amount">Monto a prestar</Label>
            <CurrencyInput
              id="cr-amount"
              value={amount}
              onValueChange={setAmount}
              placeholder="0"
              className={cn('h-12 text-lg font-semibold', touched && errors.amount && 'border-red-500')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cr-rate">Interés (%)</Label>
              <Input
                id="cr-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={cn(touched && errors.rate && 'border-red-500')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cr-n">Nº de cuotas</Label>
              <Input
                id="cr-n"
                type="number"
                inputMode="numeric"
                min={1}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className={cn(touched && errors.installments && 'border-red-500')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Frecuencia de pago</Label>
            <div className="grid grid-cols-4 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'rounded-md border px-1 py-2.5 text-xs sm:text-sm font-medium transition-colors',
                    f === frequency ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  )}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cr-date">Fecha del préstamo</Label>
            <Input id="cr-date" type="date" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cr-desc">Nota (opcional)</Label>
            <Input id="cr-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa</p>
            {preview ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cuota {FREQUENCY_LABELS[frequency].toLowerCase()}
                  </span>
                  <span className="text-2xl font-bold">{formatMoney(preview.installment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total a pagar</span>
                  <span className="font-semibold">{formatMoney(preview.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Primera cuota</span>
                  <span>{formatDate(preview.firstDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última cuota</span>
                  <span>{formatDate(preview.lastDate)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Ingresa monto y cuotas para ver el detalle.</p>
            )}
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {credit ? 'Guardar cambios' : 'Crear préstamo'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
