import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { CurrencyInput } from '@/components/CurrencyInput'
import { registerPayment, type PaymentResult } from '@/services/cobranzasApi'
import { useCobranzasInvalidate } from '@/hooks/useCobranzasInvalidate'
import { formatMoney, PAYMENT_METHOD_LABELS } from '@/lib/cobranzasUtils'
import type { PaymentMethod } from '@/types/cobranzas'
import { cn } from '@/lib/utils'

export interface PayTarget {
  creditId: string
  clientName: string
  installmentAmount: number
  balance: number
  // monto sugerido (lo que debe para quedar al día)
  suggested: number
}

const METHODS: PaymentMethod[] = ['cash', 'transfer', 'mobile_payment']

export function PaySheet({
  target,
  onClose,
  onPaid,
}: {
  target: PayTarget | null
  onClose: () => void
  onPaid: (result: PaymentResult) => void
}) {
  const invalidate = useCobranzasInvalidate()
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('cash')

  useEffect(() => {
    if (target) {
      setAmount(Math.min(Math.ceil(target.suggested), Math.ceil(target.balance)))
      setMethod('cash')
    }
  }, [target])

  const mutation = useMutation({
    mutationFn: registerPayment,
    onSuccess: (result) => {
      const n = result.coverage.installmentsCovered
      toast.success(
        result.credit.status === 'paid_off'
          ? 'Préstamo pagado por completo'
          : `Pago registrado${n > 0 ? ` · cubre ${n} cuota${n === 1 ? '' : 's'}` : ''}`
      )
      invalidate()
      onClose()
      onPaid(result)
    },
    onError: (e) => toast.error((e as Error).message),
  })

  if (!target) return null

  const value = amount ?? 0
  const overBalance = value > Math.ceil(target.balance)
  const covers = target.installmentAmount > 0 ? Math.floor(value / target.installmentAmount) : 0
  const valid = value > 0 && !overBalance

  const quick: { label: string; value: number }[] = [
    { label: 'Al día', value: Math.min(Math.ceil(target.suggested), Math.ceil(target.balance)) },
    { label: '1 cuota', value: Math.min(Math.ceil(target.installmentAmount), Math.ceil(target.balance)) },
    { label: 'Saldo total', value: Math.ceil(target.balance) },
  ]

  return (
    <Sheet open onOpenChange={(o) => !o && !mutation.isPending && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader onClose={onClose}>
          <SheetTitle>Registrar pago</SheetTitle>
          <p className="text-sm text-muted-foreground">{target.clientName}</p>
        </SheetHeader>
        <SheetBody className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Monto recibido</Label>
            <CurrencyInput
              id="pay-amount"
              value={amount}
              onValueChange={setAmount}
              className="h-14 text-2xl font-bold"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quick.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setAmount(q.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted/50',
                    q.value === value && 'border-primary bg-primary/10 text-primary'
                  )}
                >
                  {q.label} · {formatMoney(q.value)}
                </button>
              ))}
            </div>
            {overBalance ? (
              <p className="text-xs text-red-600">El monto supera el saldo ({formatMoney(target.balance)}).</p>
            ) : value > 0 ? (
              <p className="text-xs text-muted-foreground">
                {covers > 0
                  ? `Cubre aprox. ${covers} cuota${covers === 1 ? '' : 's'} de ${formatMoney(target.installmentAmount)}`
                  : `Abono parcial (cuota: ${formatMoney(target.installmentAmount)})`}
                {' · '}Saldo restante {formatMoney(Math.max(target.balance - value, 0))}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    'rounded-md border px-2 py-2.5 text-sm font-medium transition-colors',
                    m === method ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  )}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate({ creditId: target.creditId, amount: value, paymentMethod: method })}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Cobrar {formatMoney(value)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
