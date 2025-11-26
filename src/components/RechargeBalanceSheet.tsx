import { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { BankAccount } from '@/types/api'
import { Wallet, MinusCircle, PlusCircle } from 'lucide-react' // Importamos MinusCircle y PlusCircle

interface RechargeBalanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: BankAccount | null
  onBalanceUpdated: () => void
}

export function RechargeBalanceSheet({ open, onOpenChange, account, onBalanceUpdated }: RechargeBalanceSheetProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Lógica para determinar el monto numérico y el tipo de operación
  const numericAmount = useMemo(() => {
    const val = parseFloat(amount)
    return isNaN(val) ? 0 : val
  }, [amount])

  const isRecharge = numericAmount > 0
  const isAdjustment = numericAmount < 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación: El monto debe ser diferente de cero
    if (numericAmount === 0) {
      toast.error('Ingresa un monto diferente de cero para recargar o ajustar.')
      return
    }

    if (!account) return

    // **NOTA IMPORTANTE:** El endpoint /api/bank-account/update debe estar configurado
    // en el backend para manejar montos negativos y restarlos al saldo.
    try {
      setLoading(true)
      await api.patch('/bank-account/update', {
        bankAccountId: account.id,
        amount: numericAmount, // Se envía el monto con el signo (+ o -)
      })

      setAmount('')
      onBalanceUpdated()

      // Mensaje dinámico basado en la operación
      if (isRecharge) {
        toast.success('Saldo recargado exitosamente')
      } else {
        toast.success('Ajuste de saldo realizado exitosamente')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al modificar saldo')
    } finally {
      setLoading(false)
    }
  }

  if (!account) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          {/* Título unificado para recarga y ajuste */}
          <SheetTitle>Modificar Saldo (Recarga / Ajuste)</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {/* Account Info */}
          <div className="mb-6 p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Cuenta</p>
            <p className="font-semibold">{account.bank.name}</p>
            <p className="text-sm text-muted-foreground mt-2">Titular: {account.accountHolder}</p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Saldo actual:</span>
              <span className="font-bold text-green-600">{formatCurrency(account.balance)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base">
                Monto de Recarga o Ajuste (Bs)
              </Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                // **IMPORTANTE: Se remueve el atributo min="0.01" para permitir números negativos**
                placeholder="Ej: 15.00 o -5.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="text-lg h-12"
              />
              <p className="text-xs text-muted-foreground">💡 Positivo para recargar, negativo para restar saldo.</p>
            </div>

            {/* Preview */}
            {numericAmount !== 0 && (
              <div
                className={`rounded-lg p-4 border ${
                  isRecharge ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center mb-2">
                  {isRecharge ? (
                    <PlusCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <MinusCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <p className={`text-sm font-medium ${isRecharge ? 'text-green-900' : 'text-red-900'}`}>
                    {isRecharge ? 'Nuevo saldo estimado:' : 'Saldo tras ajuste:'}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${isRecharge ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(account.balance + numericAmount)}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[linear-gradient(to_right,#136BBC,#274565)]"
                disabled={loading || numericAmount === 0}
              >
                {loading ? 'Procesando...' : isAdjustment ? 'Realizar Ajuste' : 'Recargar Saldo'}
              </Button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
