import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { BankAccount } from '@/types/api'
import { Wallet } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    if (!account) return

    try {
      setLoading(true)
      await api.patch('/api/bank-account/update', {
        bankAccountId: account.id,
        amount: numericAmount,
      })

      setAmount('')
      onBalanceUpdated()
      toast.success('Saldo recargado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al recargar saldo')
    } finally {
      setLoading(false)
    }
  }

  if (!account) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Recargar Saldo</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {/* Account Info */}
          <div className="mb-6 p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Cuenta</p>
            <p className="font-semibold">{account.bank.name}</p>
            <p className="text-sm text-muted-foreground mt-2">Número: {account.accountNumber}</p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Saldo actual:</span>
              <span className="font-bold text-green-600">{formatCurrency(account.balance)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto a Recargar (Bs)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el monto en bolívares que deseas agregar al saldo actual
              </p>
            </div>

            {/* Preview */}
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-900 font-medium mb-2">Nuevo saldo:</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(account.balance + parseFloat(amount))}
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
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Recargando...' : 'Recargar Saldo'}
              </Button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
