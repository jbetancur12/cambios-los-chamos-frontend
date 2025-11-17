import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ExchangeRate {
  buyRate: number
  sellRate: number
  usd: number
}

export function CalculadoraPage() {
  const [activeTab, setActiveTab] = useState<'bcv' | 'manual'>('bcv')
  const [loading, setLoading] = useState(false)
  const [rate, setRate] = useState<ExchangeRate | null>(null)

  // Tab 1: BCV (Tasa oficial)
  const [usdBCV, setUsdBCV] = useState('')
  const [resultBCV, setResultBCV] = useState<{ ves: number; cop: number } | null>(null)

  // Tab 2: Precio manual
  const [usdManual, setUsdManual] = useState('')
  const [priceVES, setPriceVES] = useState('')
  const [resultManual, setResultManual] = useState<{ ves: number; cop: number } | null>(null)

  // Fetch tasas al cargar
  const fetchRates = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ rate: ExchangeRate }>('/api/exchange-rate/current')
      if (response?.rate) {
        setRate(response.rate)
      } else {
        toast.error('No se encontró tasa de cambio.')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al obtener tasas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  // Cálculo BCV: USD × BCV (compra) = VES, luego VES × Tasa venta = COP
  const handleCalculateBCV = () => {
    if (!rate) {
      toast.error('No hay tasa disponible')
      return
    }

    const usdNum = parseFloat(usdBCV)
    if (isNaN(usdNum) || usdNum <= 0) {
      toast.error('Ingrese un valor válido en USD')
      return
    }

    const ves = usdNum * rate.usd
    const cop = ves * rate.sellRate

    setResultBCV({ ves, cop })
  }

  // Cálculo Manual: USD × Precio VES manual = VES, luego VES × Tasa venta = COP
  const handleCalculateManual = () => {
    if (!rate) {
      toast.error('No hay tasa disponible')
      return
    }

    const usdNum = parseFloat(usdManual)
    const priceNum = parseFloat(priceVES)

    if (isNaN(usdNum) || usdNum <= 0) {
      toast.error('Ingrese un valor válido en USD')
      return
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Ingrese un precio válido en VES')
      return
    }

    const ves = usdNum * priceNum
    const cop = ves * rate.sellRate

    setResultManual({ ves, cop })
  }

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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">BCV (Compra)</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(rate.usd)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasa Venta</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(rate.sellRate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasa Compra</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(rate.buyRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('bcv')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'bcv'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Tasa BCV
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Precio Manual
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

              <Button onClick={handleCalculateBCV} disabled={loading} className="w-full">
                {loading ? 'Cargando...' : 'Calcular'}
              </Button>

              {resultBCV && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600">Paso 1: USD × BCV</p>
                    <p className="font-semibold">
                      {formatCurrency(parseFloat(usdBCV))} USD × {formatCurrency(rate?.usd || 0)} = <span className="text-blue-600">{formatCurrency(resultBCV.ves)} VES</span>
                    </p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600">Paso 2: VES × Tasa Venta</p>
                    <p className="font-semibold">
                      {formatCurrency(resultBCV.ves)} VES × {formatCurrency(rate?.sellRate || 0)} = <span className="text-green-600">{formatCurrency(resultBCV.cop)} COP</span>
                    </p>
                  </div>
                  <div className="pt-3 bg-white p-3 rounded border-2 border-green-600">
                    <p className="text-sm text-gray-600 mb-1">Total a recibir</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(resultBCV.cop)} COP</p>
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
                <Input
                  type="number"
                  placeholder="Ej: 100"
                  value={usdManual}
                  onChange={(e) => setUsdManual(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Precio en VES por USD (manual)</label>
                <Input
                  type="number"
                  placeholder="Ej: 2500000"
                  value={priceVES}
                  onChange={(e) => setPriceVES(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button onClick={handleCalculateManual} disabled={loading} className="w-full">
                {loading ? 'Cargando...' : 'Calcular'}
              </Button>

              {resultManual && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600">Paso 1: USD × Precio manual VES</p>
                    <p className="font-semibold">
                      {formatCurrency(parseFloat(usdManual))} USD × {formatCurrency(parseFloat(priceVES))} VES = <span className="text-blue-600">{formatCurrency(resultManual.ves)} VES</span>
                    </p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600">Paso 2: VES × Tasa Venta</p>
                    <p className="font-semibold">
                      {formatCurrency(resultManual.ves)} VES × {formatCurrency(rate?.sellRate || 0)} = <span className="text-green-600">{formatCurrency(resultManual.cop)} COP</span>
                    </p>
                  </div>
                  <div className="pt-3 bg-white p-3 rounded border-2 border-green-600">
                    <p className="text-sm text-gray-600 mb-1">Total a recibir</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(resultManual.cop)} COP</p>
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
