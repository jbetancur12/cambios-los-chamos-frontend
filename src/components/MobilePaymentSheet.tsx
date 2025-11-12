import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { ExchangeRate, Minorista } from '@/types/api'
import { BalanceInfo } from './BalanceInfo'
import { useAuth } from '@/contexts/AuthContext'

interface Bank {
  id: string
  name: string
}



interface MobilePaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobilePaymentSheet({ open, onOpenChange }: MobilePaymentSheetProps) {
  const { user } = useAuth()
  const [cedula, setCedula] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [phone, setPhone] = useState('')
  const [senderName, setSenderName] = useState('')
  const [amountCop, setAmountCop] = useState('')
  const [banks, setBanks] = useState<Bank[]>([])
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [minoristaBalance, setMinoristaBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const isMinorista = user?.role === 'MINORISTA'

  useEffect(() => {
    if (open) {
      loadBanks()
      loadExchangeRate()
      if (isMinorista) {
        fetchMinoristaBalance()
      }
    }
  }, [open])

  const loadBanks = async () => {
    try {
      const data = await api.get<{ banks: Bank[] }>('/api/bank/all')
      setBanks(data.banks || [])
    } catch (error) {
      console.error('Error loading banks:', error)
      toast.error('Error al cargar los bancos')
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
      setMinoristaBalance(response.minorista.balance)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const amountBs = exchangeRate && amountCop ? (Number(amountCop) / Number(exchangeRate.sellRate)).toFixed(2) : '0.00'
  const amountBCV = exchangeRate && (Number(amountBs) / exchangeRate.usd).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cedula || !selectedBank || !phone || !senderName || !amountCop) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    try {
      // TODO: Create API endpoint for mobile payment
      toast.success('Pago móvil registrado exitosamente')
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago móvil')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCedula('')
    setSelectedBank('')
    setPhone('')
    setSenderName('')
    setAmountCop('')
  }

  const getRemainingBalance = () => {
    if (minoristaBalance === null) return null
    return minoristaBalance - parseFloat(amountCop) + getEarnedProfit()!
  }

  const getEarnedProfit = () => {
    if (!exchangeRate || minoristaBalance === null || !amountCop) return null

    const amount = parseFloat(amountCop)
    if (isNaN(amount)) return null

    return amount * 0.05 // Suponiendo que la ganancia total es el 5% del monto

  }

  const hasInsufficientBalance = () => {
    if (!isMinorista || minoristaBalance === null) return false
    const remaining = getRemainingBalance()
    return remaining !== null && remaining < 0
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Pago Móvil</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 px-6">
          <div>
            <Label htmlFor="cedula">Cédula del Beneficiario</Label>
            <Input
              id="cedula"
              placeholder="V-12345678"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bank">Banco</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger id="bank">
                <SelectValue placeholder="Selecciona un banco" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="04141234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
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

          <div>
            <Label htmlFor="amountCop">Monto en COP</Label>
            <Input
              id="amountCop"
              type="number"
              placeholder="0"
              value={amountCop}
              onChange={(e) => setAmountCop(e.target.value)}
            />
          </div>

          {isMinorista && !loadingBalance && minoristaBalance !== null && (
            <BalanceInfo
              minoristaBalance={minoristaBalance}
              amountInput={amountCop}
              getEarnedProfit={getEarnedProfit}
              getRemainingBalance={getRemainingBalance}
              hasInsufficientBalance={hasInsufficientBalance}
            />
          )}

          <div className="bg-gray-50 p-3 rounded border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Conversión a Bolívares</div>
                <div className="text-2xl font-bold text-green-600">{amountBs} Bs</div>
              </div>
              <div>
                <div className="text-sm font-medium">Conversión a BCV</div>
                <div className="text-2xl font-bold text-green-600">{amountBCV} USD</div>
              </div>
            </div>
            {exchangeRate && (
              <div className="flex justify-left mt-4">
                <div className="text-xs text-gray-500 mr-10">
                  Tasa: {exchangeRate.sellRate}
                </div>
                <div className="text-xs text-gray-500">
                  Tasa BCV: {exchangeRate.bcv}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pb-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Registrar Pago Móvil'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
