import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { NumericFormat } from 'react-number-format'
import type { Bank, ExchangeRate, Currency, Minorista } from '@/types/api'
import { BalanceInfo } from '@/components/BalanceInfo'
import { BeneficiaryAutocomplete } from '@/components/BeneficiaryAutocomplete'
import { useBeneficiarySuggestions } from '@/hooks/useBeneficiarySuggestions'
import { useCreateGiro } from '@/hooks/mutations/useGiroMutations'

interface TransferFormProps {
  onSuccess: () => void
}

export function TransferForm({ onSuccess }: TransferFormProps) {
  const { user } = useAuth()
  const { getSuggestionsByName, addSuggestion } = useBeneficiarySuggestions()
  const createGiroMutation = useCreateGiro()

  const [loading, setLoading] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null)
  const [loadingRate, setLoadingRate] = useState(true)
  const [minoristaBalance, setMinoristaBalance] = useState<number | null>(null)
  const [minoristaBalanceInFavor, setMinoristaBalanceInFavor] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [creditLimit, setCreditLimit] = useState<number | null>(null)

  // Form fields
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [phone, setPhone] = useState('')
  const [bankId, setBankId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [currencyInput, setCurrencyInput] = useState<Currency>('COP')

  // Suggestions
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([])

  // Custom rate override (solo SUPER_ADMIN)
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [customBuyRate, setCustomBuyRate] = useState('')
  const [customSellRate, setCustomSellRate] = useState('')
  const [customUsd, setCustomUsd] = useState('')
  const [customBcv, setCustomBcv] = useState('')

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isMinorista = user?.role === 'MINORISTA'

  useEffect(() => {
    fetchBanks()
    fetchCurrentRate()
    if (isMinorista) {
      fetchMinoristaBalance()
    }
  }, [isMinorista])

  const fetchBanks = async () => {
    try {
      const response = await api.get<{ banks: Bank[] }>('/bank/all')
      setBanks(response.banks)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar bancos')
    }
  }

  const fetchCurrentRate = async () => {
    try {
      setLoadingRate(true)
      const response = await api.get<{ rate: ExchangeRate }>('/exchange-rate/current')
      setCurrentRate(response.rate)
      setCustomBuyRate(response.rate.buyRate.toString())
      setCustomSellRate(response.rate.sellRate.toString())
      setCustomUsd(response.rate.usd.toString())
      setCustomBcv(response.rate.bcv.toString())
    } catch (error: any) {
      toast.error('No hay tasa de cambio configurada. Contacte al administrador.')
    } finally {
      setLoadingRate(false)
    }
  }

  const fetchMinoristaBalance = async () => {
    try {
      setLoadingBalance(true)
      const response = await api.get<{ minorista: Minorista }>('/minorista/me')
      setMinoristaBalance(response.minorista.availableCredit)
      setMinoristaBalanceInFavor(response.minorista.creditBalance || 0)
      setCreditLimit(response.minorista.creditLimit)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const resetForm = () => {
    setBeneficiaryName('')
    setBeneficiaryId('')
    setPhone('')
    setBankId('')
    setAccountNumber('')
    setAmountInput('')
    setCurrencyInput('COP')
    setUseCustomRate(false)
    setNameSuggestions([])
  }

  const handleNameChange = (value: string) => {
    setBeneficiaryName(value)
    if (value.trim()) {
      const suggestions = getSuggestionsByName(value)
      setNameSuggestions(suggestions)
    } else {
      setNameSuggestions([])
    }
  }

  const handleSelectBeneficiaryFromName = (suggestion: any) => {
    setBeneficiaryName(suggestion.name)
    setBeneficiaryId(suggestion.id)
    setBankId(suggestion.bankId)
    setAccountNumber(suggestion.accountNumber)
    setNameSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!beneficiaryName || !beneficiaryId || !bankId || !accountNumber || !amountInput) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }

    const amount = parseFloat(amountInput)
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número positivo')
      return
    }

    try {
      setLoading(true)

      const payload: any = {
        beneficiaryName,
        beneficiaryId,
        phone,
        bankId,
        accountNumber,
        amountInput: amount,
        currencyInput,
      }

      if (isSuperAdmin && useCustomRate) {
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

      createGiroMutation.mutate(payload, {
        onSuccess: () => {
          // Save beneficiary suggestion for future use
          addSuggestion({
            name: beneficiaryName,
            id: beneficiaryId,
            phone,
            bankId,
            accountNumber,
            executionType: 'TRANSFERENCIA',
          })

          toast.success('Giro creado exitosamente')
          resetForm()
          onSuccess()
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error al crear giro')
        },
      })
    } catch (error: any) {
      toast.error(error.message || 'Error al crear giro')
    } finally {
      setLoading(false)
    }
  }

  const calculateAmountBs = () => {
    if (!currentRate || !amountInput) return 0

    const amount = parseFloat(amountInput)
    if (isNaN(amount)) return 0

    const rate =
      useCustomRate && isSuperAdmin
        ? {
            buyRate: parseFloat(customBuyRate) || currentRate.buyRate,
            sellRate: parseFloat(customSellRate) || currentRate.sellRate,
            bcv: parseFloat(customBcv) || currentRate.bcv,
          }
        : currentRate

    if (currencyInput === 'USD') {
      return amount * rate.bcv
    } else if (currencyInput === 'COP') {
      return amount / rate.sellRate
    } else {
      return amount
    }
  }

  const getRemainingBalance = () => {
    if (minoristaBalance === null || minoristaBalanceInFavor === null) return null

    const amount = parseFloat(amountInput) || 0
    const profit = getEarnedProfit() || 0

    const totalBalance = minoristaBalance + minoristaBalanceInFavor

    return totalBalance - amount + profit
  }

  const getEarnedProfit = () => {
    if (!currentRate || minoristaBalance === null || !amountInput) return null

    const amount = parseFloat(amountInput)
    if (isNaN(amount)) return null

    return amount * 0.05
  }

  const hasInsufficientBalance = () => {
    if (!isMinorista || minoristaBalance === null || minoristaBalanceInFavor === null || creditLimit === null)
      return false

    const amount = parseFloat(amountInput) || 0
    const balanceInFavor = minoristaBalanceInFavor
    const availableCredit = minoristaBalance

    const profit = amount * 0.05

    let userBalance = balanceInFavor
    let remainingAmount = amount
    let externalDebt = 0

    if (remainingAmount <= userBalance) {
      userBalance -= remainingAmount
      remainingAmount = 0
    } else {
      remainingAmount -= userBalance
      userBalance = 0
    }

    let creditUsed = 0
    if (remainingAmount > 0) {
      if (remainingAmount <= availableCredit) {
        creditUsed = remainingAmount
        remainingAmount = 0
      } else {
        creditUsed = availableCredit
        externalDebt = remainingAmount - availableCredit
        remainingAmount = 0
      }
    }

    let finalBalance = userBalance
    let finalCredit = availableCredit - creditUsed

    if (creditUsed === 0 && externalDebt === 0) {
      finalBalance += profit
    } else {
      const paidExternalDebt = Math.min(profit, externalDebt)
      let remainingProfit = profit - paidExternalDebt

      const restoreCredit = Math.min(remainingProfit, creditUsed)
      finalCredit += restoreCredit
      remainingProfit -= restoreCredit

      if (remainingProfit > 0) {
        finalBalance += remainingProfit
      }
    }

    const unpaidDebt = Math.max(0, externalDebt - profit)
    const totalFinalBalance = finalBalance + finalCredit

    return unpaidDebt > 0 || totalFinalBalance < 0
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Beneficiary Info */}
      <div className="space-y-2">
        <BeneficiaryAutocomplete
          value={beneficiaryName}
          onChange={handleNameChange}
          onSelectSuggestion={handleSelectBeneficiaryFromName}
          suggestions={nameSuggestions}
          label="Nombre del Beneficiario"
          placeholder="Nombre completo"
          displayField="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="beneficiaryId" className="hidden md:block">
          Cédula del Beneficiario
        </Label>
        <Input
          id="beneficiaryId"
          value={beneficiaryId}
          onChange={(e) => setBeneficiaryId(e.target.value)}
          placeholder="Cédula del Beneficiario"
          required
        />
      </div>

      {/* Bank Info */}
      <div className="space-y-2">
        <Label htmlFor="bank" className="hidden md:block">
          Banco Destino
        </Label>
        <select
          id="bank"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Banco Destino</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {`${bank.code} - ${bank.name}`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber" className="hidden md:block">
          Número de Cuenta
        </Label>
        <Input
          id="accountNumber"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Número de Cuenta"
          required
        />
      </div>

      {/* Amount & Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount" className="hidden md:block">
            Monto
          </Label>
          <NumericFormat
            id="amount"
            customInput={Input}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            fixedDecimalScale={false}
            prefix=""
            value={amountInput}
            onValueChange={(values) => {
              setAmountInput(values.floatValue ? values.floatValue.toString() : '')
            }}
            placeholder="Monto"
            allowNegative={false}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency" className="hidden md:block">
            Moneda
          </Label>
          <select
            id="currency"
            value={currencyInput}
            onChange={(e) => setCurrencyInput(e.target.value as Currency)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Moneda</option>
            <option value="COP">COP</option>
            {isSuperAdmin && <option value="USD">USD</option>}
          </select>
        </div>
      </div>

      {/* Minorista Balance Info */}
      {isMinorista && !loadingBalance && minoristaBalance !== null && (
        <BalanceInfo
          minoristaBalance={minoristaBalance}
          minoristaBalanceInFavor={minoristaBalanceInFavor}
          amountInput={amountInput}
          getEarnedProfit={getEarnedProfit}
          getRemainingBalance={getRemainingBalance}
          hasInsufficientBalance={hasInsufficientBalance}
        />
      )}

      {/* Exchange Rate Info */}
      {!loadingRate && currentRate && (
        <div className="bg-gray-100 rounded-lg p-4 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Tasa de Cambio Actual</p>

          {isMinorista ? (
            <div className="grid grid-cols-1 gap-3 text-base">
              <div>
                <span className="text-gray-600">Tasa de Venta: </span>
                <span className="font-bold text-blue-700">{currentRate.sellRate.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-base">
              <div>
                <span className="text-gray-600">Compra: </span>
                <span className="font-bold text-blue-700">{currentRate.buyRate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Venta: </span>
                <span className="font-bold text-blue-700">{currentRate.sellRate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">USD: </span>
                <span className="font-bold text-blue-700">{currentRate.usd.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">BCV: </span>
                <span className="font-bold text-blue-700">{currentRate.bcv.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Rate Override (SUPER_ADMIN only) */}
      {isSuperAdmin && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomRate"
              checked={useCustomRate}
              onChange={(e) => setUseCustomRate(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="useCustomRate" className="cursor-pointer">
              Usar tasa personalizada
            </Label>
          </div>

          {useCustomRate && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="customBuyRate" className="text-xs">
                  Compra
                </Label>
                <Input
                  id="customBuyRate"
                  type="number"
                  step="0.01"
                  value={customBuyRate}
                  onChange={(e) => setCustomBuyRate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customSellRate" className="text-xs">
                  Venta
                </Label>
                <Input
                  id="customSellRate"
                  type="number"
                  step="0.01"
                  value={customSellRate}
                  onChange={(e) => setCustomSellRate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customUsd" className="text-xs">
                  USD
                </Label>
                <Input
                  id="customUsd"
                  type="number"
                  step="0.01"
                  value={customUsd}
                  onChange={(e) => setCustomUsd(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customBcv" className="text-xs">
                  BCV
                </Label>
                <Input
                  id="customBcv"
                  type="number"
                  step="0.01"
                  value={customBcv}
                  onChange={(e) => setCustomBcv(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculated Amount in Bs */}
      {amountInput && (
        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <p className="text-sm text-muted-foreground">Monto a Recibir en Venezuela</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {new Intl.NumberFormat('es-VE', {
              style: 'currency',
              currency: 'VES',
              minimumFractionDigits: 2,
            }).format(calculateAmountBs())}
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || hasInsufficientBalance()}
          className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]"
        >
          {loading ? 'Creando...' : 'Enviar Giro'}
        </Button>
      </div>
    </form>
  )
}
