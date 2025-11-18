import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Plus, TrendingUp, Calendar, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useSiaRateImage } from '@/hooks/useSiaRateImage'
import type { ExchangeRate } from '@/types/api'

export function ExchangeRatePage() {
  const { user } = useAuth()
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  // Form fields
  const [buyRate, setBuyRate] = useState('')
  const [sellRate, setSellRate] = useState('')
  const [usd, setUsd] = useState('')
  const [bcv, setBcv] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canCreateRate = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const { generateAndDownloadImage } = useSiaRateImage()

  useEffect(() => {
    fetchRates()
    fetchCurrentRate()
  }, [])

  const fetchCurrentRate = async () => {
    try {
      const response = await api.get<{ rate: ExchangeRate }>('/api/exchange-rate/current')
      setCurrentRate(response.rate)
    } catch (error: any) {
      console.error('Error fetching current rate:', error)
    }
  }

  const fetchRates = async () => {
    try {
      setLoading(true)
      const response = await api.get<{
        rates: ExchangeRate[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>('/api/exchange-rate/list?limit=20')

      setRates(response.rates)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar tasas de cambio')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setBuyRate('')
    setSellRate('')
    setUsd('')
    setBcv('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const buyRateNum = parseFloat(buyRate)
    const sellRateNum = parseFloat(sellRate)
    const usdNum = parseFloat(usd)
    const bcvNum = parseFloat(bcv)

    if (isNaN(buyRateNum) || isNaN(sellRateNum) || isNaN(usdNum) || isNaN(bcvNum)) {
      toast.error('Todos los campos deben ser números válidos')
      return
    }

    if (buyRateNum <= 0 || sellRateNum <= 0 || usdNum <= 0 || bcvNum <= 0) {
      toast.error('Todos los valores deben ser mayores a 0')
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post<{ data: ExchangeRate; message: string }>('/api/exchange-rate/create', {
        buyRate: buyRateNum,
        sellRate: sellRateNum,
        usd: usdNum,
        bcv: bcvNum,
      })

      toast.success(response.message || 'Tasa de cambio creada exitosamente')
      resetForm()
      fetchRates()
      fetchCurrentRate()
      setCreateSheetOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al crear tasa de cambio')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{
      backgroundImage: 'url(/rates-background.avif)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tasas de Cambio</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona las tasas de cambio del sistema</p>
        </div>

        {/* Current Rate Card */}
        {currentRate && (
          <Card className="mb-6 border-primary backdrop-blur-sm bg-white/95 dark:bg-slate-950/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" style={{ color: '#136BBC' }} />
                Tasa Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasa de Compra</p>
                  <p className="text-2xl font-bold text-green-600">{currentRate.buyRate.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasa de Venta</p>
                  <p className="text-2xl font-bold text-blue-600">{currentRate.sellRate.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">USD</p>
                  <p className="text-2xl font-bold text-purple-600">{currentRate.usd.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">BCV</p>
                  <p className="text-2xl font-bold text-orange-600">{currentRate.bcv.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Actualizado: {formatDate(currentRate.createdAt)}</span>
                </div>
                <Button
                  onClick={() => {
                    generateAndDownloadImage(currentRate)
                    toast.success('Tasa descargada como imagen')
                  }}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Create Button */}
      {canCreateRate && (
        <div className="mb-6">
          <Button onClick={() => setCreateSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Nueva Tasa
          </Button>
        </div>
      )}

      {/* Rates History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historial de Tasas</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando tasas...</p>
          </div>
        ) : rates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No hay tasas de cambio registradas</p>
              {canCreateRate && (
                <Button onClick={() => setCreateSheetOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera tasa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rates.map((rate) => (
              <Card key={rate.id} className={`backdrop-blur-sm bg-white/95 dark:bg-slate-950/95 ${rate.id === currentRate?.id ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Compra</p>
                      <p className="text-lg font-semibold text-green-600">{rate.buyRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Venta</p>
                      <p className="text-lg font-semibold text-blue-600">{rate.sellRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">USD</p>
                      <p className="text-lg font-semibold text-purple-600">{rate.usd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">BCV</p>
                      <p className="text-lg font-semibold text-orange-600">{rate.bcv.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(rate.createdAt)}</span>
                    </div>
                    {rate.id === currentRate?.id && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        Actual
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Create Rate Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent>
          <SheetHeader onClose={() => setCreateSheetOpen(false)}>
            <SheetTitle>Crear Nueva Tasa de Cambio</SheetTitle>
          </SheetHeader>

          <SheetBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyRate">Tasa de Compra</Label>
                <Input
                  id="buyRate"
                  type="number"
                  step="0.01"
                  value={buyRate}
                  onChange={(e) => setBuyRate(e.target.value)}
                  placeholder="Ej: 1.05"
                  required
                />
                <p className="text-xs text-muted-foreground">Cuántos bolívares se dan por cada peso colombiano</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellRate">Tasa de Venta</Label>
                <Input
                  id="sellRate"
                  type="number"
                  step="0.01"
                  value={sellRate}
                  onChange={(e) => setSellRate(e.target.value)}
                  placeholder="Ej: 0.95"
                  required
                />
                <p className="text-xs text-muted-foreground">Cuántos pesos colombianos se dan por cada bolívar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usd">Dólar Paralelo (USD)</Label>
                <Input
                  id="usd"
                  type="number"
                  step="0.01"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value)}
                  placeholder="Ej: 45.50"
                  required
                />
                <p className="text-xs text-muted-foreground">Precio del dólar en el mercado paralelo (Bs)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bcv">Dólar BCV (Oficial)</Label>
                <Input
                  id="bcv"
                  type="number"
                  step="0.01"
                  value={bcv}
                  onChange={(e) => setBcv(e.target.value)}
                  placeholder="Ej: 36.50"
                  required
                />
                <p className="text-xs text-muted-foreground">Precio oficial del dólar según BCV (Bs)</p>
              </div>

              {/* Preview */}
              {buyRate && sellRate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Vista Previa</p>
                  <div className="space-y-1 text-xs">
                    <p>1.000 COP = {(1000 / parseFloat(sellRate || '1')).toFixed(2)} VES</p>
                    <p>1.000 VES = {(1000 * parseFloat(buyRate || '1')).toFixed(2)} COP</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateSheetOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Creando...' : 'Crear Tasa'}
                </Button>
              </div>
            </form>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}
