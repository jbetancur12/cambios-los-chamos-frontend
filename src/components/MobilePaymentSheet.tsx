import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useBeneficiarySuggestions, type BeneficiaryData } from '@/hooks/useBeneficiarySuggestions'
import type { ExchangeRate, Minorista } from '@/types/api'
import { BalanceInfo } from './BalanceInfo'

interface Bank {
  id: string
  name: string
}

interface MobilePaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobilePaymentSheet({ open, onOpenChange }: MobilePaymentSheetProps) {
  const [cedula, setCedula] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [phone, setPhone] = useState('')
  const [senderName, setSenderName] = useState('')
  const [amountCop, setAmountCop] = useState('')
  const [banks, setBanks] = useState<Bank[]>([])
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [minoristaBalance, setMinoristaBalance] = useState<number | null>(null)
  const [minoristaBalanceInFavor, setMinoristaBalanceInFavor] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const { getSuggestions } = useBeneficiarySuggestions()

  const filteredSuggestions = getSuggestions(phone, 'PAGO_MOVIL')

  useEffect(() => {
    if (open) {
      loadBanks()
      loadExchangeRate()
      fetchMinoristaBalance()
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
      setMinoristaBalance(response.minorista.availableCredit)
      setMinoristaBalanceInFavor(response.minorista.creditBalance || 0)
    } catch (error: any) {
      console.error('Error loading balance:', error)
      toast.error(error.message || 'Error al cargar balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const getEarnedProfit = () => {
    return 0 // No profit for mobile payments
  }

  const getRemainingBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return null

    const amount = parseFloat(amountCop) || 0
    const totalBalance = minoristaBalance + minoristaBalanceInFavor

    return totalBalance - amount
  }

  const hasInsufficientBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return false

    const amount = parseFloat(amountCop) || 0
    const totalBalance = minoristaBalance + minoristaBalanceInFavor

    return totalBalance < amount
  }

  const amountBs = exchangeRate && amountCop ? (Number(amountCop) / Number(exchangeRate.sellRate)).toFixed(2) : '0.00'
  const amountBCV = exchangeRate && (Number(amountBs) / exchangeRate.usd).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log({ cedula, selectedBank, phone, senderName, amountCop })
    if (!cedula?.trim() || !selectedBank || !phone?.trim() || !senderName?.trim() || !amountCop) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const amount = parseFloat(amountCop as string)
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número positivo')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/giro/mobile-payment/create', {
        cedula,
        bankId: selectedBank,
        phone,
        contactoEnvia: senderName,
        amountCop: Number(amountCop),
      })
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
    setShowSuggestions(false)
  }

  const handleSelectBeneficiary = (beneficiary: BeneficiaryData) => {
    setPhone(beneficiary.phone)
    setCedula(beneficiary.id)
    setSenderName(beneficiary.phone) // Use phone as name for mobile payments
    // Try to find bank if it's stored
    if (beneficiary.bankId && banks.length > 0) {
      setSelectedBank(beneficiary.bankId)
    }
    setShowSuggestions(false)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)
    setShowSuggestions(true)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Pago Móvil</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 px-6">
          {/* Información del Beneficiario */}
          <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-3">Datos del Beneficiario</p>

            <div>
              <Label htmlFor="phone">Teléfono del Beneficiario</Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="04141234567"
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => phone && setShowSuggestions(true)}
                />
                {/* Sugerencias inline */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.phone}-${suggestion.id}-${index}`}
                        type="button"
                        onClick={() => handleSelectBeneficiary(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors text-sm border-b last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.phone}</div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.name} • {suggestion.id}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <Label htmlFor="cedula">Cédula del Beneficiario</Label>
              <Input id="cedula" placeholder="V-12345678" value={cedula} onChange={(e) => setCedula(e.target.value)} />
            </div>

            <div className="mt-3">
              <Label htmlFor="bank">Banco del Beneficiario</Label>
              <select
                id="bank"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Seleccionar banco</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Información del Remitente */}
          <div className="bg-green-50 p-3 rounded mb-4 border border-green-200">
            <p className="text-xs font-semibold text-green-900 mb-3">Datos del Remitente</p>

            <div>
              <Label htmlFor="senderName">Nombre del Remitente</Label>
              <Input
                id="senderName"
                placeholder="Tu nombre"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
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
                <div className="text-xs text-gray-500 mr-10">Tasa: {exchangeRate.sellRate}</div>
                <div className="text-xs text-gray-500">Tasa BCV: {exchangeRate.bcv}</div>
              </div>
            )}
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
            <Button type="submit" disabled={loading || hasInsufficientBalance()} className="flex-1 bg-[linear-gradient(to_right,#136BBC,#274565)]">
              {loading ? 'Procesando...' : 'Registrar Pago Móvil'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
