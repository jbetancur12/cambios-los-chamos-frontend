import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function CalculadoraVesCompraPage() {
  const [vesAmount, setVesAmount] = useState('')
  const [purchaseRate, setPurchaseRate] = useState('')
  const [result, setResult] = useState<number | null>(null)

  // Cálculo en tiempo real
  useEffect(() => {
    const vesNum = parseFloat(vesAmount)
    const rateNum = parseFloat(purchaseRate)

    if (isNaN(vesNum) || vesNum <= 0 || isNaN(rateNum) || rateNum <= 0) {
      setResult(null)
      return
    }

    const cop = vesNum * rateNum
    setResult(cop)
  }, [vesAmount, purchaseRate])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">💱 Calculadora de Compra VES</h1>

        <Card>
          <CardHeader>
            <CardTitle>Calcular COP a pagar por VES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bolivares (VES) a comprar</label>
              <Input
                type="number"
                placeholder="Ej: 5000000"
                value={vesAmount}
                onChange={(e) => setVesAmount(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tasa de compra (COP por VES)</label>
              <Input
                type="number"
                placeholder="Ej: 0.0004"
                value={purchaseRate}
                onChange={(e) => setPurchaseRate(e.target.value)}
                step="0.0001"
                className="w-full"
              />
            </div>

            {result !== null && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">COP a pagar</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(result)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
