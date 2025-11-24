import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { NumericFormat } from 'react-number-format'
import type { Currency } from '@/types/api'
import { BalanceInfo } from './BalanceInfo'
import { BeneficiaryAutocomplete } from './BeneficiaryAutocomplete'
import { useBeneficiarySuggestions } from '@/hooks/useBeneficiarySuggestions'
import { useBanksList } from '@/hooks/queries/useBankQueries'
import { useCurrentExchangeRate } from '@/hooks/queries/useExchangeRateQueries'
import { useMinoristaBalance } from '@/hooks/queries/useDashboardQueries'
import { useCreateGiro } from '@/hooks/mutations/useGiroMutations'

interface CreateGiroSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateGiroSheet({ open, onOpenChange, onSuccess }: CreateGiroSheetProps) {
  const { user } = useAuth()
  const { getSuggestionsByName, getSuggestionsByPhone, addSuggestion } = useBeneficiarySuggestions()

  // React Query hooks
  const { data: banks = [] } = useBanksList()
  const { data: currentRate } = useCurrentExchangeRate()
  const { data: minoristaBalanceData } = useMinoristaBalance(user?.role)
  const createGiroMutation = useCreateGiro()

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
  const [phoneSuggestions, setPhoneSuggestions] = useState<any[]>([])

  // Custom rate override (solo SUPER_ADMIN)
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [customBuyRate, setCustomBuyRate] = useState(currentRate?.buyRate.toString() || '')
  const [customSellRate, setCustomSellRate] = useState(currentRate?.sellRate.toString() || '')
  const [customUsd, setCustomUsd] = useState(currentRate?.usd.toString() || '')
  const [customBcv, setCustomBcv] = useState(currentRate?.bcv.toString() || '')

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isMinorista = user?.role === 'MINORISTA'

  // Update custom rate fields when currentRate changes
  if (currentRate && !useCustomRate) {
    if (customBuyRate === '') setCustomBuyRate(currentRate.buyRate.toString())
    if (customSellRate === '') setCustomSellRate(currentRate.sellRate.toString())
    if (customUsd === '') setCustomUsd(currentRate.usd.toString())
    if (customBcv === '') setCustomBcv(currentRate.bcv.toString())
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
    setPhoneSuggestions([])
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

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    if (value.trim()) {
      const suggestions = getSuggestionsByPhone(value)
      setPhoneSuggestions(suggestions)
    } else {
      setPhoneSuggestions([])
    }
  }

  const handleSelectBeneficiaryFromName = (suggestion: any) => {
    setBeneficiaryName(suggestion.name)
    setBeneficiaryId(suggestion.id)
    setPhone(suggestion.phone)
    setBankId(suggestion.bankId)
    setAccountNumber(suggestion.accountNumber)
    setNameSuggestions([])
  }

  const handleSelectBeneficiaryFromPhone = (suggestion: any) => {
    setBeneficiaryName(suggestion.name)
    setBeneficiaryId(suggestion.id)
    setPhone(suggestion.phone)
    setBankId(suggestion.bankId)
    setAccountNumber(suggestion.accountNumber)
    setPhoneSuggestions([])
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

    // Validate custom rate if SUPER_ADMIN enabled it
    if (isSuperAdmin && useCustomRate) {
      const buyRate = parseFloat(customBuyRate)
      const sellRate = parseFloat(customSellRate)
      const usd = parseFloat(customUsd)
      const bcv = parseFloat(customBcv)

      if (isNaN(buyRate) || isNaN(sellRate) || isNaN(usd) || isNaN(bcv)) {
        toast.error('Valores de tasa personalizada inválidos')
        return
      }
    }

    const payload: any = {
      beneficiaryName,
      beneficiaryId,
      phone,
      bankId,
      accountNumber,
      amountInput: amount,
      currencyInput,
    }

    // Add custom rate if SUPER_ADMIN enabled it
    if (isSuperAdmin && useCustomRate) {
      payload.customRate = {
        buyRate: parseFloat(customBuyRate),
        sellRate: parseFloat(customSellRate),
        usd: parseFloat(customUsd),
        bcv: parseFloat(customBcv),
      }
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
        onOpenChange(false)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Error al crear giro')
      },
    })
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
    if (!minoristaBalanceData?.balance || !minoristaBalanceData?.credit) return null

    const amount = parseFloat(amountInput) || 0
    const profit = getEarnedProfit() || 0

    // Total balance = crédito + saldo a favor
    const totalBalance = minoristaBalanceData.balance + minoristaBalanceData.credit

    // Balance after transaction = total balance - amount + profit
    return totalBalance - amount + profit
  }

  const getEarnedProfit = () => {
    if (!currentRate || !minoristaBalanceData?.balance || !amountInput) return null

    const amount = parseFloat(amountInput)
    if (isNaN(amount)) return null

    return amount * 0.05 // Suponiendo que la ganancia total es el 5% del monto
  }

  const hasInsufficientBalance = () => {
    if (!isMinorista || !minoristaBalanceData?.balance || !minoristaBalanceData?.credit) return false

    const amount = parseFloat(amountInput) || 0
    const balanceInFavor = minoristaBalanceData.credit
    const availableCredit = minoristaBalanceData.balance

    // Apply processTransfer logic to calculate final balances
    const profit = amount * 0.05

    let userBalance = balanceInFavor
    let remainingAmount = amount
    let externalDebt = 0

    // Step 1: Deduct from balance
    if (remainingAmount <= userBalance) {
      userBalance -= remainingAmount
      remainingAmount = 0
    } else {
      remainingAmount -= userBalance
      userBalance = 0
    }

    // Step 2: Deduct from credit
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

    // Step 3: Apply profit
    let finalBalance = userBalance
    let finalCredit = availableCredit - creditUsed

    if (creditUsed === 0 && externalDebt === 0) {
      // Only balance was used → profit goes to balance
      finalBalance += profit
    } else {
      // Profit first covers external debt
      const paidExternalDebt = Math.min(profit, externalDebt)
      let remainingProfit = profit - paidExternalDebt

      // Then restores used credit
      const restoreCredit = Math.min(remainingProfit, creditUsed)
      finalCredit += restoreCredit
      remainingProfit -= restoreCredit

      // Anything extra goes to balance
      if (remainingProfit > 0) {
        finalBalance += remainingProfit
      }
    }

    // Check:
    // 1. All external debt must be covered by profit (no unpaid debt)
    // 2. Total balance cannot be negative
    const unpaidDebt = Math.max(0, externalDebt - profit)
    const totalFinalBalance = finalBalance + finalCredit

    return unpaidDebt > 0 || totalFinalBalance < 0
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Crear Nuevo Giro</SheetTitle>
        </SheetHeader>

        <SheetBody>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="beneficiaryId">Cédula del Beneficiario</Label>
              <Input
                id="beneficiaryId"
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value)}
                placeholder="V-12345678"
                required
              />
            </div>

            <div className="space-y-2">
              <BeneficiaryAutocomplete
                value={phone}
                onChange={handlePhoneChange}
                onSelectSuggestion={handleSelectBeneficiaryFromPhone}
                suggestions={phoneSuggestions}
                label="Teléfono (Opcional)"
                placeholder="+58 424 1234567"
                displayField="phone"
              />
            </div>

            {/* Bank Info */}
            <div className="space-y-2">
              <Label htmlFor="bank">Banco Destino</Label>
              <select
                id="bank"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Seleccione un banco</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="01020123456789012345"
                required
              />
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
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
                  placeholder="1.500.000,00"
                  allowNegative={false}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value as Currency)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecciona moneda</option>
                  <option value="COP">COP</option>
                  {isSuperAdmin && <option value="USD">USD</option>}
                </select>
              </div>
            </div>

            {/* Minorista Balance Info */}
            {/* {isMinorista && !loadingBalance && minoristaBalance !== null && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Tu Balance</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance Actual</p>
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 2,
                      }).format(minoristaBalance)}
                    </p>
                  </div>
                  {amountInput && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Ganancia</p>
                        <p
                          className={`text-lg font-semibold text-green-600 dark:text-green-400`}
                        >
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 2,
                          }).format(getEarnedProfit() || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance Después</p>
                        <p
                          className={`text-lg font-semibold ${hasInsufficientBalance()
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                            }`}
                        >
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 2,
                          }).format(getRemainingBalance() || 0)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {hasInsufficientBalance() && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Balance insuficiente. Necesitas recargar tu balance para crear este giro.
                    </p>
                  </div>
                )}
              </div>
            )} */}

            {isMinorista && minoristaBalanceData && (
              <BalanceInfo
                minoristaBalance={minoristaBalanceData.balance}
                minoristaBalanceInFavor={minoristaBalanceData.credit || 0}
                amountInput={amountInput}
                getEarnedProfit={getEarnedProfit}
                getRemainingBalance={getRemainingBalance}
                hasInsufficientBalance={hasInsufficientBalance}
              />
            )}

            {/* Exchange Rate Info */}
            {currentRate && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Tasa de Cambio Actual</p>

                {isMinorista ? (
                  // Mostrar solo tasa de venta para minoristas
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Tasa de Venta: </span>
                      <span className="font-semibold text-lg">{currentRate.sellRate.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  // Mostrar todas las tasas para SUPER_ADMIN y ADMIN
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Compra: </span>
                      <span className="font-semibold">{currentRate.buyRate.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venta: </span>
                      <span className="font-semibold">{currentRate.sellRate.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">USD: </span>
                      <span className="font-semibold">{currentRate.usd.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">BCV: </span>
                      <span className="font-semibold">{currentRate.bcv.toFixed(2)}</span>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createGiroMutation.isPending || hasInsufficientBalance()}
                className="flex-1 bg-[linear-gradient(to_right,#136BBC,#274565)]"
              >
                {createGiroMutation.isPending ? 'Creando...' : 'Crear Giro'}
              </Button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
