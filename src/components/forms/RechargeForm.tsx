import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import type { ExchangeRate, Minorista } from '@/types/api'
import { BalanceInfo } from '@/components/BalanceInfo'
import { formatCurrency } from '@/lib/formatCurrency'

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

interface RechargeFormProps {
  onSuccess: () => void
}

export function RechargeForm({ onSuccess }: RechargeFormProps) {
  const { user } = useAuth()
  const [selectedOperator, setSelectedOperator] = useState('')
  const [selectedAmount, setSelectedAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [senderName, setSenderName] = useState('Pepito')
  const [operators, setOperators] = useState<RechargeOperator[]>([])
  const [amounts, setAmounts] = useState<RechargeAmount[]>([])
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [minoristaBalance, setMinoristaBalance] = useState<number | null>(null)
  const [minoristaBalanceInFavor, setMinoristaBalanceInFavor] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const isMinorista = user?.role === 'MINORISTA'

  useEffect(() => {
    loadOperators()
    loadExchangeRate()
    if (isMinorista) {
      fetchMinoristaBalance()
    }
  }, [isMinorista])

  useEffect(() => {
    if (selectedOperator) {
      loadAmountsByOperator(selectedOperator)
    }
  }, [selectedOperator])

  const loadOperators = async () => {
    try {
      const data = await api.get<RechargeOperator[]>('/recharge-operators')
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
      const data = await api.get<OperatorAmount[]>(`/operator-amounts/${operatorId}`)
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
      const response = await api.get<{ rate: ExchangeRate }>('/exchange-rate/current')
      setExchangeRate(response.rate)
    } catch (error) {
      console.error('Error loading exchange rate:', error)
      toast.error('Error al cargar la tasa BCV')
    }
  }

  const fetchMinoristaBalance = async () => {
    try {
      setLoadingBalance(true)
      const response = await api.get<{ minorista: Minorista }>('/minorista/me')
      setMinoristaBalance(response.minorista.availableCredit)
      setMinoristaBalanceInFavor(response.minorista.creditBalance || 0)
    } catch (error) {
      console.error('Error loading balance:', error)
      const message = error instanceof Error ? error.message : 'Error al cargar balance'
      toast.error(message)
    } finally {
      setLoadingBalance(false)
    }
  }

  const selectedAmountBs = amounts.find((a) => a.id === selectedAmount)?.amountBs || 0

  const amountCop = exchangeRate ? (selectedAmountBs * Number(exchangeRate.sellRate)).toFixed(2) : '0.00'

  const amountUsd = exchangeRate ? (selectedAmountBs / Number(exchangeRate.bcv)).toFixed(2) : '0.00'

  const getEarnedProfit = () => {
    const amount = parseFloat(amountCop) || 0
    if (amount <= 0) return 0
    return amount * 0.05
  }

  const getRemainingBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return null

    const totalBalance = minoristaBalance + minoristaBalanceInFavor
    const amountCopNum = parseFloat(amountCop) || 0
    const profit = getEarnedProfit() || 0

    return totalBalance - amountCopNum + profit
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
      await api.post('/giro/recharge/create', {
        operatorId: selectedOperator,
        amountBsId: selectedAmount,
        phone,
        contactoEnvia: senderName,
      })
      toast.success('Recarga registrada exitosamente')
      resetForm()
      if (isMinorista) {
        fetchMinoristaBalance()
      }
      onSuccess()
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar la recarga'
      toast.error(message)
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
    <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
      <div>
        <Label htmlFor="operator" className="hidden md:block">
          Operador
        </Label>
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
        <Label htmlFor="amount" className="hidden md:block">
          Monto en Bs
        </Label>
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
        <Label htmlFor="phone" className="hidden md:block">
          Teléfono
        </Label>
        <Input id="phone" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="off" />
      </div>

      {/* <div>
        <Label htmlFor="senderName" className="hidden md:block">
          Contacto que Envía
        </Label>
        <Input
          id="senderName"
          placeholder="Nombre del remitente"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          required
        />
      </div> */}

      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border space-y-2">
        <div className="text-sm font-medium">Conversiones</div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">COP:</span>
          <span className="font-semibold">{formatCurrency(Number(amountCop), 'COP')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">BCV:</span>
          <span className="font-semibold">{formatCurrency(Number(amountUsd), 'BCV')}</span>
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

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || hasInsufficientBalance()}
          className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)] hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            'Enviar Recarga'
          )}
        </Button>
      </div>
    </form>
  )
}
