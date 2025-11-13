import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { ExchangeRate } from '@/types/api'

interface RechargeOperator {
  id: string
  name: string
  type: string
}

interface RechargeAmount {
  id: string
  amountBs: number
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

  useEffect(() => {
    if (open) {
      loadOperators()
      loadAmounts()
      loadExchangeRate()
    }
  }, [open])

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

  const loadAmounts = async () => {
    try {
      const data = await api.get<RechargeAmount[]>('/api/recharge-amounts')
      setAmounts(data)
      if (data.length > 0 && !selectedAmount) {
        setSelectedAmount(data[0].id)
      }
    } catch (error) {
      console.error('Error loading amounts:', error)
      toast.error('Error al cargar los montos')
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

  const selectedAmountBs = amounts.find((a) => a.id === selectedAmount)?.amountBs || 0

  const amountCop = exchangeRate ? (selectedAmountBs * Number(exchangeRate.sellRate)).toFixed(2) : '0.00'

  const amountUsd = exchangeRate ? (selectedAmountBs / Number(exchangeRate.bcv)).toFixed(2) : '0.00'

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

          <div className="mt-6 pb-6">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Procesando...' : 'Registrar Recarga'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
