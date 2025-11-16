import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Minorista, MinoristaTransaction } from '@/types/api'
import { AlertCircle, Eye, DollarSign } from 'lucide-react'
import { MinoristaTransactionHistory } from './MinoristaTransactionHistory'

interface RechargeMinoristaBalanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minorista: Minorista | null
  onBalanceUpdated: () => void
}

export function RechargeMinoristaBalanceSheet({
  open,
  onOpenChange,
  minorista,
  onBalanceUpdated,
}: RechargeMinoristaBalanceSheetProps) {
  const [loading, setLoading] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [creditLimitAmount, setCreditLimitAmount] = useState('')
  const [activeTab, setActiveTab] = useState('view')
  const [transactions, setTransactions] = useState<MinoristaTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [localMinorista, setLocalMinorista] = useState<Minorista | null>(minorista)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const fetchTransactions = async () => {
    if (!localMinorista) return
    try {
      setTransactionsLoading(true)
      const response = await api.get<{ transactions: MinoristaTransaction[] }>(
        `/api/minorista/${localMinorista.id}/transactions`
      )
      setTransactions(response.transactions || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    setLocalMinorista(minorista)
  }, [minorista])

  useEffect(() => {
    if (open && localMinorista) {
      // Cargar datos actualizados del minorista
      const loadUpdatedMinorista = async () => {
        try {
          const response = await api.get<{ minorista: Minorista }>(`/api/minorista/${localMinorista.id}`)
          setLocalMinorista(response.minorista)
        } catch (error) {
          console.error('Error loading updated minorista:', error)
        }
      }
      loadUpdatedMinorista()

      if (activeTab === 'view') {
        fetchTransactions()
      }
    }
  }, [open, activeTab, localMinorista?.id])

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(payAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    if (!localMinorista) return

    const currentDebtAmount = Math.abs(localMinorista.balance)
    if (numericAmount > currentDebtAmount) {
      toast.error(`La deuda es de ${formatCurrency(currentDebtAmount)}`)
      return
    }

    try {
      setLoading(true)
      await api.post(`/api/minorista/${localMinorista.id}/pay-debt`, {
        amount: numericAmount,
      })
      setPayAmount('')
      onBalanceUpdated()
      toast.success('Deuda pagada exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al pagar deuda')
    } finally {
      setLoading(false)
    }
  }

  const handleSetCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(creditLimitAmount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    if (!localMinorista) return

    try {
      setLoading(true)
      const response = await api.post<{ minorista: Minorista }>(`/api/minorista/${localMinorista.id}/credit-limit`, {
        creditLimit: numericAmount,
      })
      setLocalMinorista(response.minorista)
      setCreditLimitAmount('')
      toast.success('Cupo de crédito asignado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al asignar cupo')
    } finally {
      setLoading(false)
    }
  }

  if (!localMinorista) return null

  const hasDebt = localMinorista.availableCredit < 0
  const debtAmount = localMinorista.creditLimit - localMinorista.availableCredit

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Gestión de Crédito</SheetTitle>
        </SheetHeader>

        <div className="w-full mt-6 space-y-4 px-4 sm:px-6 md:px-0">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Ver
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Asignar Cupo
            </button>
            <button
              onClick={() => setActiveTab('pay')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pay'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Pagar Deuda
            </button>
          </div>

          {/* Vista General */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              {/* Minorista Info */}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Minorista</p>
                <p className="font-semibold">{localMinorista.user.fullName}</p>
                <p className="text-sm text-muted-foreground">{localMinorista.user.email}</p>
              </div>

              {hasDebt && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Este minorista tiene deuda. Usa la pestaña "Pagar Deuda" para abonar fondos y reducir la deuda.
                  </p>
                </div>
              )}

              {/* Historial de Transacciones */}
              <div className="mt-6 pt-6 border-t">
                {transactionsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Cargando historial...</p>
                  </div>
                ) : (
                  <MinoristaTransactionHistory transactions={transactions} creditLimit={localMinorista.creditLimit} />
                )}
              </div>
            </div>
          )}

          {/* Asignar Cupo */}
          {activeTab === 'assign' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Asignar o Modificar Cupo de Crédito
                </p>
                <p className="text-xs text-muted-foreground">
                  El cupo se puede modificar en cualquier momento después de su asignación inicial.
                </p>
              </div>

              <form onSubmit={handleSetCreditLimit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credit-limit">Nuevo Cupo de Crédito (COP)</Label>
                  <Input
                    id="credit-limit"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={creditLimitAmount}
                    onChange={(e) => setCreditLimitAmount(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Cupo actual: {formatCurrency(localMinorista.creditLimit)}
                  </p>
                </div>

                {creditLimitAmount && !isNaN(parseFloat(creditLimitAmount)) && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">Nuevo cupo:</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(parseFloat(creditLimitAmount))}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Asignar Cupo'}
                </Button>
              </form>
            </div>
          )}

          {/* Pagar Deuda */}
          {activeTab === 'pay' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 space-y-2">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Pagar Deuda y Liberar Cupo</p>
                <p className="text-xs text-muted-foreground">
                  Paga la deuda acumulada para liberar cupo disponible. Las ganancias acumuladas se reiniciarán.
                </p>
              </div>

              <form onSubmit={handlePayDebt} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Monto a Pagar (COP)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pay-amount"
                      type="number"
                      step="1"
                      min="1"
                      placeholder="0"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => setPayAmount(debtAmount.toString())}
                      variant="outline"
                      className="flex-shrink-0"
                      disabled={loading || debtAmount <= 0}
                    >
                      Pagar Todo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deuda actual: {formatCurrency(debtAmount as number)}
                  </p>
                </div>

                {payAmount && !isNaN(parseFloat(payAmount)) && parseFloat(payAmount) > 0 && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-2">
                      Deuda después del pago:
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(Math.max(0, (debtAmount as number) - parseFloat(payAmount)))}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading} variant="destructive">
                  {loading ? 'Procesando...' : 'Pagar Deuda'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
