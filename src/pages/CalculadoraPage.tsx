import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function CalculadoraPage() {
  const [fromCurrency, setFromCurrency] = useState<'COP' | 'VES' | 'USD'>('COP')
  const [toCurrency, setToCurrency] = useState<'COP' | 'VES' | 'USD'>('VES')
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [rate, setRate] = useState<{ buyRate: number; sellRate: number; usd: number } | null>(null)

  // === Fetch de tasa real ===
  const fetchRates = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ success: boolean; rate: { buyRate: number; sellRate: number; usd: number } }>(
        '/api/exchange-rate/current'
      )

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

  // === Lógica de conversión ===
  const handleConvert = () => {
    if (!rate) {
      toast.error('No hay tasa disponible')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) {
      toast.error('Ingrese un valor válido')
      return
    }

    let resultValue = amountNum

    if (fromCurrency === 'COP' && toCurrency === 'VES') {
      resultValue = amountNum / rate.sellRate
    } else if (fromCurrency === 'VES' && toCurrency === 'COP') {
      resultValue = amountNum * rate.buyRate
    } else if (fromCurrency === 'USD' && toCurrency === 'VES') {
      resultValue = amountNum * rate.usd
    } else if (fromCurrency === 'VES' && toCurrency === 'USD') {
      resultValue = amountNum / rate.usd
    } else {
      resultValue = amountNum
    }

    setResult(resultValue)
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setResult(null)
  }

  return (
    <div className="min-h-screen flex justify-center items-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-6">💱 Calculadora de Giros</h1>

        {/* Monto */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Monto</label>
          <input
            type="number"
            className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            placeholder="Ingresa el monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Monedas */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">De</label>
            <select
              className="w-full border rounded-lg p-2"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as any)}
            >
              <option value="COP">COP (Colombia)</option>
              <option value="VES">VES (Venezuela)</option>
              <option value="USD">USD (Dólar)</option>
            </select>
          </div>

          <button
            onClick={swapCurrencies}
            className="mt-5 p-2 border rounded-lg hover:bg-gray-100 transition"
            title="Intercambiar monedas"
          >
            ⇅
          </button>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">A</label>
            <select
              className="w-full border rounded-lg p-2"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as any)}
            >
              <option value="COP">COP (Colombia)</option>
              <option value="VES">VES (Venezuela)</option>
              <option value="USD">USD (Dólar)</option>
            </select>
          </div>
        </div>

        {/* Botón convertir */}
        <button
          onClick={handleConvert}
          disabled={loading}
          className={`w-full text-white py-2 rounded-lg transition ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Cargando tasas...' : 'Convertir'}
        </button>

        {/* Resultado */}
        {result !== null && (
          <div className="text-center mt-6 border-t pt-4">
            <p className="text-gray-500 text-sm mb-1">Resultado</p>
            <p className="text-xl font-bold">
              {result.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {toCurrency}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
