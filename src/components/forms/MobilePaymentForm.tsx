import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useBeneficiarySuggestions, type BeneficiaryData } from '@/hooks/useBeneficiarySuggestions'
import type { ExchangeRate, Minorista } from '@/types/api'
import { BalanceInfo } from '@/components/BalanceInfo'
import { NumericFormat } from 'react-number-format'
import { formatDecimal } from '@/lib/formatCurrency'

interface Bank {
  id: string
  name: string
  code: string
}

interface MobilePaymentFormProps {
  onSuccess: () => void
}

export function MobilePaymentForm({ onSuccess }: MobilePaymentFormProps) {
  const { user } = useAuth()
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

  const isMinorista = user?.role === 'MINORISTA'
  const filteredSuggestions = getSuggestions(phone, 'PAGO_MOVIL')

  useEffect(() => {
    loadBanks()
    loadExchangeRate()
    if (isMinorista) {
      fetchMinoristaBalance()
    }
  }, [isMinorista])

  const loadBanks = async () => {
    try {
      const data = await api.get<{ banks: Bank[] }>('/bank/all')
      setBanks(data.banks || [])
    } catch (error) {
      console.error('Error loading banks:', error)
      toast.error('Error al cargar los bancos')
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
    } catch (error: any) {
      console.error('Error loading balance:', error)
      toast.error(error.message || 'Error al cargar balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const getEarnedProfit = () => {
    const amount = parseFloat(amountCop) || 0
    if (amount <= 0) return 0
    return amount * 0.05
  }

  const getRemainingBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return null

    const amount = parseFloat(amountCop) || 0
    const profit = getEarnedProfit() || 0
    const totalBalance = minoristaBalance + minoristaBalanceInFavor

    return totalBalance - amount + profit
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
      await api.post('/giro/mobile-payment/create', {
        cedula,
        bankId: selectedBank,
        phone,
        contactoEnvia: senderName,
        amountCop: Number(amountCop),
      })
      toast.success('Pago móvil registrado exitosamente')
      resetForm()
      onSuccess()
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
    setSenderName(beneficiary.phone)
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
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Información del Beneficiario */}
      <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-3">Datos del Beneficiario</p>

        <div>
          <Label htmlFor="phone" className="hidden md:block">
            Teléfono del Beneficiario
          </Label>
          <div className="relative">
            <Input
              id="phone"
              placeholder="Teléfono del Beneficiario"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={() => phone && setShowSuggestions(true)}
            />
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

        <div className="space-y-2 mt-3">
          <Label htmlFor="cedula" className="hidden md:block">
            Cédula del Beneficiario
          </Label>
          <Input
            id="cedula"
            placeholder="Cédula del Beneficiario"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 mt-3">
          <Label htmlFor="senderName" className="hidden md:block">
            Contacto que Envía
          </Label>
          <Input
            id="senderName"
            placeholder="Contacto que Envía"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Bank and Amount Info */}
      <div className="space-y-2">
        <Label htmlFor="bank" className="hidden md:block">
          Banco Origen
        </Label>
        <select
          id="bank"
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="">Banco Origen</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {`${bank.code} - ${bank.name}`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="hidden md:block">
          Monto (COP)
        </Label>

        <NumericFormat
          id="amount"
          customInput={Input}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          fixedDecimalScale={false}
          prefix=""
          value={amountCop}
          onValueChange={(values) => {
            setAmountCop(values.floatValue ? values.floatValue.toString() : '')
          }}
          placeholder="Monto"
          allowNegative={false}
          required
        />
      </div>

      {/* Balance Info */}
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

      {/* Exchange Rate Info */}
      {exchangeRate && amountCop && (
        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <p className="text-sm font-medium mb-2">Monto a Recibir en Venezuela</p>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="text-muted-foreground">En VES: </span>
              <span className="font-semibold text-lg">{formatDecimal(Number(amountBs), 'VES')}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">En BCV: </span>
              <span className="font-semibold">{formatDecimal(Number(amountBCV), 'USD')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || hasInsufficientBalance()}
          className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]"
        >
          {loading ? 'Procesando...' : 'Enviar Pago'}
        </Button>
      </div>
    </form>
  )
}
