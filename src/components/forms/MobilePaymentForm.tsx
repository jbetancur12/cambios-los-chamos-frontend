import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
  // Persistence
  const [cedula, setCedula] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [phone, setPhone] = useState('')
  const [senderName, setSenderName] = useState('Sistema')
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
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.role === 'ADMIN'
  const filteredSuggestions = getSuggestions(phone, 'PAGO_MOVIL')

  // Custom rate override
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [customBuyRate, setCustomBuyRate] = useState('')
  const [customSellRate, setCustomSellRate] = useState('')
  const [customUsd, setCustomUsd] = useState('')
  const [customBcv, setCustomBcv] = useState('')

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
      setCustomBuyRate(response.rate.buyRate.toString())
      setCustomSellRate(response.rate.sellRate.toString())
      setCustomUsd(response.rate.usd.toString())
      setCustomBcv(response.rate.bcv.toString())
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

  const effectiveRate =
    useCustomRate && (isSuperAdmin || isAdmin)
      ? {
        buyRate: parseFloat(customBuyRate) || exchangeRate?.buyRate || 0,
        sellRate: parseFloat(customSellRate) || exchangeRate?.sellRate || 0,
        bcv: parseFloat(customBcv) || exchangeRate?.bcv || 0,
        usd: parseFloat(customUsd) || exchangeRate?.usd || 0,
      }
      : exchangeRate

  const amountBs = effectiveRate && amountCop ? (Number(amountCop) / effectiveRate.sellRate).toFixed(2) : '0.00'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cedula?.trim() || !selectedBank || !phone?.trim() || !amountCop) {
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
      const payload: {
        cedula: string
        bankId: string
        phone: string
        contactoEnvia: string
        amountCop: number
        customRate?: {
          buyRate: number
          sellRate: number
          usd: number
          bcv: number
        }
      } = {
        cedula,
        bankId: selectedBank,
        phone,
        contactoEnvia: senderName || '', // Send empty if not used
        amountCop: Number(amountCop),
      }

      if ((isSuperAdmin || isAdmin) && useCustomRate) {
        const buyRate = parseFloat(customBuyRate)
        const sellRate = parseFloat(customSellRate)
        const usd = parseFloat(customUsd)
        const bcv = parseFloat(customBcv)

        if (isNaN(buyRate) || isNaN(sellRate) || isNaN(usd) || isNaN(bcv)) {
          toast.error('Valores de tasa personalizada inválidos')
          setLoading(false)
          return
        }

        payload.customRate = { buyRate, sellRate, usd, bcv }
      }

      await api.post('/giro/mobile-payment/create', payload)
      toast.success('Pago móvil registrado exitosamente')
      resetForm()
      if (isMinorista) {
        fetchMinoristaBalance()
      }
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar el pago móvil'
      toast.error(message)
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
    setUseCustomRate(false)
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
    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-2" autoComplete="off">
      {/* Información del Beneficiario */}
      <div className="bg-blue-50 p-3 rounded mb-2 md:mb-4 border border-blue-200">
        {/* <p className="text-sm font-semibold text-blue-900 mb-2 md:mb-3">Datos del Beneficiario</p> */}

        <div className="space-y-1 md:space-y-2 mt-1 md:mt-3">
          <Label htmlFor="cedula" className="hidden md:block text-md">
            Cédula del Beneficiario
          </Label>
          <Input
            id="cedula"
            placeholder="Cédula del Beneficiario"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            className="font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
            autoComplete="off"
          />
        </div>

        <div className="space-y-1 md:space-y-2">
          <Label htmlFor="bank" className="hidden md:block text-md">
            Banco
          </Label>
          <select
            id="bank"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium ${selectedBank === '' ? 'md:text-transparent' : ''}`}
            required
          >
            <option value="" className="text-muted-foreground">
              Banco Origen
            </option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id} className="font-medium text-foreground">
                {`0${bank.code} - ${bank.name}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="phone" className="hidden md:block text-md">
            Teléfono del Beneficiario
          </Label>
          <div className="relative py-1 md:py-3">
            <Input
              id="phone"
              placeholder="Teléfono del Beneficiario"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={() => phone && setShowSuggestions(true)}
              className="font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
              autoComplete="off"
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

        <div className="space-y-1 md:space-y-2 hidden">
          <Label htmlFor="senderName" className="hidden md:block text-md">
            Contacto que Envía (Opcional)
          </Label>

          <Input
            id="senderName"
            placeholder="Contacto que Envía (Opcional)"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Bank and Amount Info */}

      <div className="space-y-1 md:space-y-2">
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
          className="font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
        />
      </div>

      {/* Exchange Rate Info - Moved here for visibility */}
      {effectiveRate && (
        <div className="p-1 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bolivares</p>
              <p className="text-base md:text-lg font-bold text-green-700 dark:text-green-400">
                {new Intl.NumberFormat('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(amountBs))}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">BCV</p>
              <p className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-400">
                {new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(amountBs) / effectiveRate.bcv)}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Submit */}
      {effectiveRate ? (
        <div className="bg-gray-100 rounded-lg p-1 mb-5">
          {isMinorista || isAdmin ? (
            <div className="grid grid-cols-1 gap-3 text-xs md:text-sm">
              <div>
                <span className="text-gray-600 text-sm">Tasa: </span>
                <span className="font-bold text-blue-700 text-sm">{effectiveRate.sellRate.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
              <div>
                <span className="text-gray-600">Compra: </span>
                <span className="font-bold text-blue-700">{effectiveRate.buyRate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Venta: </span>
                <span className="font-bold text-blue-700">{effectiveRate.sellRate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">USD: </span>
                <span className="font-bold text-blue-700">{effectiveRate.usd.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">BCV: </span>
                <span className="font-bold text-blue-700">{effectiveRate.bcv.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Custom Rate Override (SUPER_ADMIN or ADMIN) */}
      {(isSuperAdmin || isAdmin) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomRate"
              checked={useCustomRate}
              onChange={(e) => setUseCustomRate(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
            <Label htmlFor="useCustomRate" className="cursor-pointer text-sm md:text-base">
              Usar tasa personalizada
            </Label>
          </div>

          {useCustomRate && (
            <div className="grid grid-cols-2 gap-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="customBuyRate" className="text-xs md:text-sm">
                  Compra
                </Label>
                <Input
                  id="customBuyRate"
                  type="number"
                  step="0.01"
                  value={customBuyRate}
                  onChange={(e) => setCustomBuyRate(e.target.value)}
                  className="text-sm md:text-base h-8 md:h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customSellRate" className="text-xs md:text-sm">
                  Venta
                </Label>
                <Input
                  id="customSellRate"
                  type="number"
                  step="0.01"
                  value={customSellRate}
                  onChange={(e) => setCustomSellRate(e.target.value)}
                  className="text-sm md:text-base h-8 md:h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customUsd" className="text-xs md:text-sm">
                  USD
                </Label>
                <Input
                  id="customUsd"
                  type="number"
                  step="0.01"
                  value={customUsd}
                  onChange={(e) => setCustomUsd(e.target.value)}
                  className="text-sm md:text-base h-8 md:h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customBcv" className="text-xs md:text-sm">
                  BCV
                </Label>
                <Input
                  id="customBcv"
                  type="number"
                  step="0.01"
                  value={customBcv}
                  onChange={(e) => setCustomBcv(e.target.value)}
                  className="text-sm md:text-base h-8 md:h-10"
                />
              </div>
            </div>
          )}
        </div>
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
            'Enviar Pago'
          )}
        </Button>
      </div>
    </form>
  )
}
