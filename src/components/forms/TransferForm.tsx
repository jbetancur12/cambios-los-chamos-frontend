import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { NumericFormat } from 'react-number-format'
import type { Bank, ExchangeRate, Currency, Minorista } from '@/types/api'
import { BalanceInfo } from '@/components/BalanceInfo'
import { BeneficiaryAutocomplete } from '@/components/BeneficiaryAutocomplete'
import { useBeneficiarySuggestions, type BeneficiaryData } from '@/hooks/useBeneficiarySuggestions'
import { useCreateGiro, type CreateGiroInput } from '@/hooks/mutations/useGiroMutations'

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

  // Form fields with persistence
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [phone, setPhone] = useState('')
  const [bankId, setBankId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [currencyInput, setCurrencyInput] = useState<Currency>('COP')


  // Save state on change
  useEffect(() => {
    const data = {
      beneficiaryName,
      beneficiaryId,
      phone,
      bankId,
      accountNumber,
      amountInput,
      currencyInput,
    }
    localStorage.setItem('transfer_form_data', JSON.stringify(data))
  }, [beneficiaryName, beneficiaryId, phone, bankId, accountNumber, amountInput, currencyInput])

  // Suggestions
  const [nameSuggestions, setNameSuggestions] = useState<BeneficiaryData[]>([])

  // Custom rate override (solo SUPER_ADMIN)
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [customBuyRate, setCustomBuyRate] = useState('')
  const [customSellRate, setCustomSellRate] = useState('')
  const [customUsd, setCustomUsd] = useState('')
  const [customBcv, setCustomBcv] = useState('')

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.role === 'ADMIN'
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar bancos'
      toast.error(message)
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
    } catch (error) {
      console.error(error)
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar balance'
      toast.error(message)
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

  const handleSelectBeneficiaryFromName = (suggestion: BeneficiaryData) => {
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

      const payload: CreateGiroInput = {
        beneficiaryName,
        beneficiaryId,
        phone,
        bankId,
        accountNumber,
        amountInput: amount,
        currencyInput,
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

      await createGiroMutation.mutateAsync(payload)

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
      if (isMinorista) {
        fetchMinoristaBalance()
      }
      onSuccess()
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear giro'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const effectiveRate =
    useCustomRate && (isSuperAdmin || isAdmin)
      ? {
        buyRate: parseFloat(customBuyRate) || currentRate?.buyRate || 0,
        sellRate: parseFloat(customSellRate) || currentRate?.sellRate || 0,
        bcv: parseFloat(customBcv) || currentRate?.bcv || 0,
        usd: parseFloat(customUsd) || currentRate?.usd || 0,
      }
      : currentRate

  const calculateAmountBs = () => {
    if (!effectiveRate || !amountInput) return 0

    const amount = parseFloat(amountInput)
    if (isNaN(amount)) return 0

    if (currencyInput === 'USD') {
      return amount * effectiveRate.bcv
    } else if (currencyInput === 'COP') {
      return amount / effectiveRate.sellRate
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

  const amountBs = calculateAmountBs()
  const amountBcv = effectiveRate && effectiveRate.bcv > 0 ? amountBs / effectiveRate.bcv : 0

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-2 w-full" autoComplete="off">
      {/* Beneficiary Info */}
      <div className="space-y-2">
        <BeneficiaryAutocomplete
          value={beneficiaryName}
          onChange={handleNameChange}
          onSelectSuggestion={handleSelectBeneficiaryFromName}
          suggestions={nameSuggestions}
          label="Nombre del Beneficiario"
          placeholder="Nombre del Beneficiario"
          displayField="name"
          required
          className="text-lg md:text-lg h-10 md:h-12 font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="beneficiaryId" className="hidden md:block text-md md:text-md">
          Cédula del Beneficiario
        </Label>
        <Input
          id="beneficiaryId"
          value={beneficiaryId}
          onChange={(e) => setBeneficiaryId(e.target.value)}
          placeholder="Cédula del Beneficiario"
          required
          className="text-base md:text-md h-10 md:h-12 font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
          autoComplete="off"
        />
      </div>

      {/* Bank Info */}
      <div className="space-y-2">
        <Label htmlFor="bank" className="hidden md:block text-md md:text-md">
          Banco
        </Label>
        <select
          id="bank"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
          className={`flex h-10 md:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium ${bankId === '' ? 'md:text-transparent' : ''}`}
          required
        >
          <option value="" className="text-muted-foreground">
            Banco
          </option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id} className="font-medium text-foreground">
              {`0${bank.code} - ${bank.name}`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber" className="hidden md:block text-md md:text-md">
          Número de Cuenta
        </Label>
        <Input
          id="accountNumber"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Número de Cuenta"
          required
          className="text-sm md:text-lg h-10 md:h-12 font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
          autoComplete="off"
        />
      </div>

      {/* Amount & Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount" className="hidden md:block text-md md:text-md">
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
            className="text-sm md:text-lg h-10 md:h-12 font-medium placeholder:text-muted-foreground md:placeholder:text-transparent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency" className="hidden md:block text-sm md:text-base">
            Moneda
          </Label>
          <select
            id="currency"
            value={currencyInput}
            onChange={(e) => setCurrencyInput(e.target.value as Currency)}
            className="flex h-10 md:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Moneda</option>
            <option value="COP">COP</option>
            {isSuperAdmin && <option value="USD">USD</option>}
          </select>
        </div>
      </div>

      {/* Calculated Amount in Bs & BCV - Moved here for visibility */}
      <div className="p-1 bg-green-50 dark:bg-green-950 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bolivares</p>
            <p className="text-base md:text-lg font-bold text-green-700 dark:text-green-400">
              {new Intl.NumberFormat('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(amountBs)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">BCV</p>
            <p className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-400">
              {new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(amountBcv)}
            </p>
          </div>
        </div>
      </div>

      {/* Minorista Balance Info */}
      {isMinorista && !loadingBalance && minoristaBalance !== null && (
        <BalanceInfo
          minoristaBalance={minoristaBalance}
          minoristaBalanceInFavor={minoristaBalanceInFavor}
          creditLimit={creditLimit ?? undefined}
          amountInput={amountInput}
          getEarnedProfit={getEarnedProfit}
          getRemainingBalance={getRemainingBalance}
          hasInsufficientBalance={hasInsufficientBalance}
        />
      )}

      {/* Exchange Rate Info */}
      {loadingRate ? (
        <div className="bg-gray-100 rounded-lg p-4 mb-5">
          <Skeleton className="h-4 w-40 mb-3" />
          {isMinorista ? (
            <div className="grid grid-cols-1 gap-3">
              <Skeleton className="h-6 w-32" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          )}
        </div>
      ) : effectiveRate ? (
        <div className="bg-gray-100 rounded-lg p-1 mb-5">
          {/* <p className="text-sm md:text-base font-semibold text-gray-700 mb-3">Tasa de Cambio Actual</p> */}

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

      {/* Custom Rate Override (SUPER_ADMIN only) */}
      {isSuperAdmin ||
        (isAdmin && (
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
        ))}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || hasInsufficientBalance()}
          className="w-full h-10 md:h-12 text-base md:text-lg bg-[linear-gradient(to_right,#136BBC,#274565)] hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Enviar Giro'
          )}
        </Button>
      </div>
    </form>
  )
}
