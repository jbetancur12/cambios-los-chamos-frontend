import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCurrentExchangeRate } from '@/hooks/queries/useExchangeRateQueries'
import { NumericFormat } from 'react-number-format'

export function CalculadoraPage() {
  const [activeTab, setActiveTab] = useState<'bcv' | 'manual' | 'ves'>('bcv')

  // React Query hook
  const rateQuery = useCurrentExchangeRate()
  const rate = rateQuery.data

  // Handle errors
  if (rateQuery.error) {
    toast.error('Error al obtener tasas de cambio')
  }

  // Tab 1: BCV (Tasa oficial)
  const [usdBCV, setUsdBCV] = useState('')
  const [resultBCV, setResultBCV] = useState<{ ves: number; cop: number } | null>(null)

  // Tab 2: Precio manual
  const [usdManual, setUsdManual] = useState('')
  const [priceVES, setPriceVES] = useState('')
  const [resultManual, setResultManual] = useState<{ ves: number; cop: number } | null>(null)

  // Tab 3: VES a COP
  const [vesAmount, setVesAmount] = useState('')
  const [resultVES, setResultVES] = useState<number | null>(null)

  // Cálculo BCV en tiempo real
  useEffect(() => {
    if (!rate) return

    const usdNum = parseFloat(usdBCV)
    if (isNaN(usdNum) || usdNum <= 0) {
      setResultBCV(null)
      return
    }

    const ves = usdNum * rate.usd
    const cop = ves * rate.sellRate
    setResultBCV({ ves, cop })
  }, [usdBCV, rate])

  // Cálculo Manual en tiempo real
  useEffect(() => {
    if (!rate) return

    const usdNum = parseFloat(usdManual)
    const priceNum = parseFloat(priceVES)

    if (isNaN(usdNum) || usdNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
      setResultManual(null)
      return
    }

    const ves = usdNum * priceNum
    const cop = ves * rate.sellRate
    setResultManual({ ves, cop })
  }, [usdManual, priceVES, rate])

  // Cálculo VES a COP en tiempo real
  useEffect(() => {
    if (!rate) return

    const vesNum = parseFloat(vesAmount)
    if (isNaN(vesNum) || vesNum <= 0) {
      setResultVES(null)
      return
    }

    const cop = vesNum * rate.sellRate
    setResultVES(cop)
  }, [vesAmount, rate])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">💱 Calculadora de Giros</h1>

        {/* Tasas actuales */}
        {rate && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">BCV (Compra)</p>
                  <p className="text-xl font-bold" style={{ color: '#136BBC' }}>
                    {formatCurrency(rate.usd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasa Venta</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(rate.sellRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bcv')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'bcv' ? 'text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
            style={activeTab === 'bcv' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Tasa BCV
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'manual' ? 'text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
            style={activeTab === 'manual' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Precio Manual
          </button>
          <button
            onClick={() => setActiveTab('ves')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ves' ? 'text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
            style={activeTab === 'ves' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            VES a COP
          </button>
        </div>

        {/* Tab 1: BCV */}
        {activeTab === 'bcv' && (
          <Card>
            <CardHeader>
              <CardTitle>Cálculo con Tasa BCV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">USD a enviar</label>
                <Input
                  type="number"
                  placeholder="Ej: 100"
                  value={usdBCV}
                  onChange={(e) => setUsdBCV(e.target.value)}
                  className="w-full"
                />
              </div>

              {resultBCV && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <p className="text-gray-600">VES</p>
                    <p className="text-xl font-bold" style={{ color: '#136BBC' }}>
                      {formatCurrency(resultBCV.ves)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t pt-3">
                    <p className="text-gray-600">COP a recibir</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(resultBCV.cop)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Precio Manual */}
        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Cálculo con Precio Manual en VES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">USD a enviar</label>

                <NumericFormat
                  id="amount"
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale={false}
                  prefix=""
                  value={usdManual}
                  onValueChange={(values) => {
                    setUsdManual(values.floatValue ? values.floatValue.toString() : '')
                  }}
                  placeholder="Ej: 100"
                  allowNegative={false}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Precio en VES por USD (manual)</label>

                <NumericFormat
                  id="amount"
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale={false}
                  prefix=""
                  value={priceVES}
                  onValueChange={(values) => {
                    setPriceVES(values.floatValue ? values.floatValue.toString() : '')
                  }}
                  placeholder="Monto"
                  allowNegative={false}
                  required
                />
              </div>

              {resultManual && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <p className="text-gray-600">VES</p>
                    <p className="text-xl font-bold" style={{ color: '#136BBC' }}>
                      {formatCurrency(resultManual.ves)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t pt-3">
                    <p className="text-gray-600">COP a recibir</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(resultManual.cop)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: VES a COP */}
        {activeTab === 'ves' && (
          <Card>
            <CardHeader>
              <CardTitle>Convertir VES a COP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bolivares (VES)</label>
                <NumericFormat
                  id="amount"
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale={false}
                  prefix=""
                  value={vesAmount}
                  onValueChange={(values) => {
                    setVesAmount(values.floatValue ? values.floatValue.toString() : '')
                  }}
                  placeholder="Monto"
                  allowNegative={false}
                  required
                />
              </div>

              {resultVES !== null && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">COP</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(resultVES)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
