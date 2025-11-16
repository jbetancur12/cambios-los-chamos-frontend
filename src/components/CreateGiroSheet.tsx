import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import type { Bank, ExchangeRate, Currency, Minorista } from '@/types/api'
import { BalanceInfo } from './BalanceInfo'

interface CreateGiroSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateGiroSheet({ open, onOpenChange, onSuccess }: CreateGiroSheetProps) {
  const { user } = useAuth()
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

  // Custom rate override (solo SUPER_ADMIN)
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [customBuyRate, setCustomBuyRate] = useState('')
  const [customSellRate, setCustomSellRate] = useState('')
  const [customUsd, setCustomUsd] = useState('')
  const [customBcv, setCustomBcv] = useState('')

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isMinorista = user?.role === 'MINORISTA'

  useEffect(() => {
    if (open) {
      fetchBanks()
      fetchCurrentRate()
      if (isMinorista) {
        fetchMinoristaBalance()
      }
    }
  }, [open, isMinorista])

  const fetchBanks = async () => {
    try {
      const response = await api.get<{ banks: Bank[] }>('/api/bank/all')
      setBanks(response.banks)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar bancos')
    }
  }

  const fetchCurrentRate = async () => {
    try {
      setLoadingRate(true)
      const response = await api.get<{ rate: ExchangeRate }>('/api/exchange-rate/current')
      setCurrentRate(response.rate)
      // Pre-fill custom rate with current values
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
      const response = await api.get<{ minorista: Minorista }>('/api/minorista/me')
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!beneficiaryName || !beneficiaryId || !phone || !bankId || !accountNumber || !amountInput) {
      toast.error('Por favor complete todos los campos')
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

      // Add custom rate if SUPER_ADMIN enabled it
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

      const response = await api.post<{ giro: any; message: string }>('/api/giro/create', payload)

      toast.success(response.message || 'Giro creado exitosamente')
      resetForm()
      onSuccess()
      onOpenChange(false)
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

    // Total balance = crédito + saldo a favor
    const totalBalance = minoristaBalance + minoristaBalanceInFavor

    // Balance after transaction = total balance - amount + profit
    return totalBalance - amount + profit
  }

  const getEarnedProfit = () => {
    if (!currentRate || minoristaBalance === null || !amountInput) return null

    const amount = parseFloat(amountInput)
    if (isNaN(amount)) return null

    return amount * 0.05 // Suponiendo que la ganancia total es el 5% del monto
  }

  const hasInsufficientBalance = () => {
    if (!isMinorista || minoristaBalance === null || minoristaBalanceInFavor === null || creditLimit === null) return false

    const amount = parseFloat(amountInput) || 0
    const balanceInFavor = minoristaBalanceInFavor
    const availableCredit = minoristaBalance
    const limit = creditLimit

    // Calculate if transaction would exceed credit limit
    // Deduct from balance first, then credit, then check if remainder (external debt) exceeds limit
    let remainingAmount = amount

    // Step 1: Deduct from balance
    if (remainingAmount <= balanceInFavor) {
      remainingAmount = 0
    } else {
      remainingAmount -= balanceInFavor
    }

    // Step 2: Deduct from credit
    if (remainingAmount > 0) {
      if (remainingAmount <= availableCredit) {
        remainingAmount = 0
      } else {
        remainingAmount -= availableCredit
      }
    }

    // Step 3: Check if external debt exceeds credit limit
    // externalDebt must NOT exceed creditLimit
    const externalDebt = remainingAmount
    return externalDebt > limit
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
              <Label htmlFor="beneficiaryName">Nombre del Beneficiario</Label>
              <Input
                id="beneficiaryName"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Nombre completo"
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
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+58 424 1234567"
                required
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
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="1000"
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
                  <option value="COP">COP</option>
                  <option value="VES">VES</option>
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
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">
                  {' '}
                  {!loadingRate && currentRate && (
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
                </p>
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
              <Button type="submit" disabled={loading || hasInsufficientBalance()} className="flex-1">
                {loading ? 'Creando...' : 'Crear Giro'}
              </Button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
