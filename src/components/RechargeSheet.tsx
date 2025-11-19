import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { ExchangeRate, Minorista } from '@/types/api'
import { BalanceInfo } from './BalanceInfo'

interface RechargeOperator {
  id: string
  name: string
  type: string
}

interface RechargeAmount {
  id: string
  amountBs: number
}

interface OperatorAmount {
  id: string
  operator: RechargeOperator
  amount: RechargeAmount
  isActive: boolean
}

interface RechargeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RechargeSheet({ open, onOpenChange }: RechargeSheetProps) {
  const [selectedOperator, setSelectedOperator] = useState('')
  const [selectedAmount, setSelectedAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [senderName, setSenderName] = useState('')
  const [operators, setOperators] = useState<RechargeOperator[]>([])
  const [amounts, setAmounts] = useState<RechargeAmount[]>([])
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [minoristaBalance, setMinoristaBalance] = useState<number | null>(null)
  const [minoristaBalanceInFavor, setMinoristaBalanceInFavor] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  useEffect(() => {
    if (open) {
      loadOperators()
      loadExchangeRate()
      fetchMinoristaBalance()
    }
  }, [open])

  // Load amounts when operator is selected
  useEffect(() => {
    if (selectedOperator) {
      loadAmountsByOperator(selectedOperator)
    }
  }, [selectedOperator])

  const loadOperators = async () => {
    try {
      const data = await api.get<RechargeOperator[]>('/api/recharge-operators')
      setOperators(data)
      if (data.length > 0 && !selectedOperator) {
        setSelectedOperator(data[0].id)
      }
    } catch (error) {
      console.error('Error loading operators:', error)
      toast.error('Error al cargar los operadores')
    }
  }

  const loadAmountsByOperator = async (operatorId: string) => {
    try {
      const data = await api.get<OperatorAmount[]>(`/api/operator-amounts/${operatorId}`)
      const amounts = data.map((oa) => oa.amount)
      setAmounts(amounts)
      if (amounts.length > 0) {
        setSelectedAmount(amounts[0].id)
      } else {
        setSelectedAmount('')
        toast.warning('Este operador no tiene montos disponibles')
      }
    } catch (error) {
      console.error('Error loading amounts:', error)
      toast.error('Error al cargar los montos del operador')
      setAmounts([])
      setSelectedAmount('')
    }
  }

  const loadExchangeRate = async () => {
    try {
      const response = await api.get<{ rate: ExchangeRate }>('/api/exchange-rate/current')
      setExchangeRate(response.rate)
    } catch (error) {
      console.error('Error loading exchange rate:', error)
      toast.error('Error al cargar la tasa BCV')
    }
  }

  const fetchMinoristaBalance = async () => {
    try {
      setLoadingBalance(true)
      const response = await api.get<{ minorista: Minorista }>('/api/minorista/me')
      setMinoristaBalance(response.minorista.availableCredit)
      setMinoristaBalanceInFavor(response.minorista.creditBalance || 0)
    } catch (error: any) {
      console.error('Error loading balance:', error)
      toast.error(error.message || 'Error al cargar balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const selectedAmountBs = amounts.find((a) => a.id === selectedAmount)?.amountBs || 0

  const amountCop = exchangeRate ? (selectedAmountBs * Number(exchangeRate.sellRate)).toFixed(2) : '0.00'

  const amountUsd = exchangeRate ? (selectedAmountBs / Number(exchangeRate.bcv)).toFixed(2) : '0.00'

  const getEarnedProfit = () => {
    return 0 // No profit for recharges
  }

  const getRemainingBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return null

    const totalBalance = minoristaBalance + minoristaBalanceInFavor
    const amountCopNum = parseFloat(amountCop)

    return totalBalance - amountCopNum
  }

  const hasInsufficientBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return false

    const totalBalance = minoristaBalance + minoristaBalanceInFavor
    const amountCopNum = parseFloat(amountCop)

    return totalBalance < amountCopNum
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedOperator || !selectedAmount || !phone || !senderName) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/giro/recharge/create', {
        operatorId: selectedOperator,
        amountBsId: selectedAmount,
        phone,
        contactoEnvia: senderName,
      })
      toast.success('Recarga registrada exitosamente')
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la recarga')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedOperator('')
    setSelectedAmount('')
    setPhone('')
    setSenderName('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Recarga de Saldo</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 px-6">
          <div>
            <Label htmlFor="operator">Operador</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger id="operator">
                <SelectValue placeholder="Selecciona un operador" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Monto en Bs</Label>
            <Select value={selectedAmount} onValueChange={setSelectedAmount}>
              <SelectTrigger id="amount">
                <SelectValue placeholder="Selecciona un monto" />
              </SelectTrigger>
              <SelectContent>
                {amounts.map((amount) => (
                  <SelectItem key={amount.id} value={amount.id}>
                    {amount.amountBs.toLocaleString('es-VE')} Bs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" placeholder="04141234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="senderName">Contacto que Envía</Label>
            <Input
              id="senderName"
              placeholder="Nombre del remitente"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded border space-y-2">
            <div className="text-sm font-medium">Conversiones</div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">COP:</span>
              <span className="font-semibold">${amountCop}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">USD:</span>
              <span className="font-semibold">${amountUsd}</span>
            </div>
          </div>

          {!loadingBalance && minoristaBalance !== null && (
            <BalanceInfo
              minoristaBalance={minoristaBalance}
              minoristaBalanceInFavor={minoristaBalanceInFavor}
              amountInput={amountCop}
              getEarnedProfit={getEarnedProfit}
              getRemainingBalance={getRemainingBalance}
              hasInsufficientBalance={hasInsufficientBalance}
            />
          )}

          <div className="mt-6 pb-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || hasInsufficientBalance()} className="flex-1">
              {loading ? 'Procesando...' : 'Registrar Recarga'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
