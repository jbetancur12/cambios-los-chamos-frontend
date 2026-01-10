import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Plus, TrendingUp, Calendar, Eye, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSiaRateImage } from '@/hooks/useSiaRateImage'
import { useCurrentExchangeRate, useExchangeRateHistory } from '@/hooks/queries/useExchangeRateQueries'
import { useCreateExchangeRate, useUpdateExchangeRate } from '@/hooks/mutations/useExchangeRateMutations'
import { getTodayString } from '@/lib/dateUtils'

export function ExchangeRatePage() {
  const { user } = useAuth()

  // React Query hooks
  const { data: currentRate } = useCurrentExchangeRate()
  const { data: rates = [], isLoading, error } = useExchangeRateHistory(5)
  const createExchangeRateMutation = useCreateExchangeRate()

  // UI state
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [imagePreviewBlob, setImagePreviewBlob] = useState<Blob | null>(null)
  const [imagePreviewFilename, setImagePreviewFilename] = useState('')

  // Form fields
  const [buyRate, setBuyRate] = useState('')
  const [sellRate, setSellRate] = useState('')
  const [usd, setUsd] = useState('')
  const [bcv, setBcv] = useState('')

  const canCreateRate = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const { generatePreviewImage } = useSiaRateImage()

  // Pre-fill form from current rate if available
  const handleOpenCreateSheet = () => {
    if (currentRate) {
      setBuyRate(currentRate.buyRate.toString())
      setSellRate(currentRate.sellRate.toString())
      setUsd(currentRate.usd.toString())
      setBcv(currentRate.bcv.toString())
    }
    setCreateSheetOpen(true)
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

    createExchangeRateMutation.mutate(
      {
        buyRate: buyRateNum,
        sellRate: sellRateNum,
        usd: usdNum,
        bcv: bcvNum,
      },
      {
        onSuccess: (data) => {
          toast.success(data.message || 'Tasa de cambio creada exitosamente')
          resetForm()
          setCreateSheetOpen(false)
          setEditSheetOpen(false)
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Error al crear tasa de cambio'
          toast.error(message)
        },
      }
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  // Edit state (Modified to behave as "Create New based on Old")
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  // const [editRateId, setEditRateId] = useState('') // Unused now

  // We keep the old update mutation unused or remove it, but for safety in case I missed a usage, I'll leave hook but not use it here
  const updateExchangeRateMutation = useUpdateExchangeRate()

  const handleEdit = (rate: { id: string; buyRate: number; sellRate: number; usd: number; bcv: number }) => {
    // setEditRateId(rate.id)
    setBuyRate(rate.buyRate.toString())
    setSellRate(rate.sellRate.toString())
    setUsd(rate.usd.toString())
    setBcv(rate.bcv.toString())
    setEditSheetOpen(true)
  }

  // Re-use handleSubmit to CREATE NEW instead of updating
  const handleUpdate = handleSubmit

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tasas de Cambio</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona las tasas de cambio del sistema</p>
      </div>

      {/* Current Rate Card */}
      {currentRate && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tasa Actual
              </CardTitle>
              {canCreateRate && (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(currentRate)}>
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid grid - cols - 2 ${user?.role !== 'MINORISTA' ? 'md:grid-cols-4' : ''} gap - 4`}>
              {user?.role !== 'MINORISTA' && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasa de Compra</p>
                  <p className="text-2xl font-bold text-green-600">{currentRate.buyRate.toFixed(2)}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tasa de Venta</p>
                <p className="text-2xl font-bold text-blue-600">{currentRate.sellRate.toFixed(2)}</p>
              </div>
              {user?.role !== 'MINORISTA' && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">USD</p>
                  <p className="text-2xl font-bold text-purple-600">{currentRate.usd.toFixed(2)}</p>
                </div>
              )}
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
                onClick={async () => {
                  try {
                    // Generar imagen como URL
                    const imageUrl = await generatePreviewImage(currentRate)
                    if (imageUrl) {
                      // Convertir URL a blob
                      const response = await fetch(imageUrl)
                      const blob = await response.blob()
                      setImagePreviewBlob(blob)

                      setImagePreviewFilename(`tasa - ${getTodayString()}.png`)
                      setShowImagePreview(true)
                    }
                  } catch {
                    toast.error('Error al generar la vista previa')
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Button */}
      {canCreateRate && (
        <div className="mb-6">
          <Button onClick={handleOpenCreateSheet} className="bg-[linear-gradient(to_right,#136BBC,#274565)]">
            <Plus className="h-4 w-4 mr-2" />
            Crear Nueva Tasa
          </Button>
        </div>
      )}

      {/* Rates History */}
      {canCreateRate && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Historial de Tasas</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando tasas...</p>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : 'Error al cargar tasas de cambio'}
                </p>
              </CardContent>
            </Card>
          ) : rates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No hay tasas de cambio registradas</p>
                {canCreateRate && (
                  <Button
                    onClick={() => setCreateSheetOpen(true)}
                    className="bg-[linear-gradient(to_right,#136BBC,#274565)] mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera tasa
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rates.map((rate) => (
                <Card key={rate.id} className={rate.id === currentRate?.id ? 'border-primary' : ''}>
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground bg-[linear-gradient(to_right,#136BBC,#274565)]">
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
      )}

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="usd">Dólar (USD)</Label>
                <Input
                  id="usd"
                  type="number"
                  step="0.01"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value)}
                  placeholder="Ej: 45.50"
                  required
                />
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
                <Button
                  type="submit"
                  disabled={createExchangeRateMutation.isPending}
                  className="flex-1 bg-[linear-gradient(to_right,#136BBC,#274565)]"
                >
                  {createExchangeRateMutation.isPending ? 'Creando...' : 'Crear Tasa'}
                </Button>
              </div>
            </form>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Edit Rate Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent>
          <SheetHeader onClose={() => setEditSheetOpen(false)}>
            <SheetTitle>Editar Tasa de Cambio</SheetTitle>
          </SheetHeader>

          <SheetBody>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editBuyRate">Tasa de Compra</Label>
                <Input
                  id="editBuyRate"
                  type="number"
                  step="0.01"
                  value={buyRate}
                  onChange={(e) => setBuyRate(e.target.value)}
                  placeholder="Ej: 1.05"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editSellRate">Tasa de Venta</Label>
                <Input
                  id="editSellRate"
                  type="number"
                  step="0.01"
                  value={sellRate}
                  onChange={(e) => setSellRate(e.target.value)}
                  placeholder="Ej: 0.95"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editUsd">Dólar (USD)</Label>
                <Input
                  id="editUsd"
                  type="number"
                  step="0.01"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value)}
                  placeholder="Ej: 45.50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editBcv">Dólar BCV (Oficial)</Label>
                <Input
                  id="editBcv"
                  type="number"
                  step="0.01"
                  value={bcv}
                  onChange={(e) => setBcv(e.target.value)}
                  placeholder="Ej: 36.50"
                  required
                />
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
                <Button type="button" variant="outline" onClick={() => setEditSheetOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateExchangeRateMutation.isPending}
                  className="flex-1 bg-[linear-gradient(to_right,#136BBC,#274565)]"
                >
                  {updateExchangeRateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Modal de preview de imagen (Desktop) */}
      {showImagePreview && imagePreviewBlob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h2 className="text-lg font-semibold">Tasa de Cambio</h2>
              <button
                onClick={() => setShowImagePreview(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <img
                src={URL.createObjectURL(imagePreviewBlob)}
                alt="Tasa de cambio"
                className="w-full h-auto rounded border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <Button variant="outline" onClick={() => setShowImagePreview(false)} className="flex-1">
                Cerrar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                      navigator.userAgent
                    )

                    if (isMobileOrTablet && navigator.share) {
                      // Mobile: Use Web Share API
                      const file = new File([imagePreviewBlob], imagePreviewFilename, { type: 'image/png' })
                      await navigator.share({
                        files: [file],
                        title: 'Tasa de Cambio',
                        text: 'Compartir tasa de cambio',
                      })
                    } else {
                      // Desktop: Download normally
                      const url = URL.createObjectURL(imagePreviewBlob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = imagePreviewFilename
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                    setShowImagePreview(false)
                  } catch (error) {
                    const isAbort = error instanceof Error && error.name === 'AbortError'
                    if (!isAbort) {
                      toast.error('Error al procesar la imagen')
                    }
                  }
                }}
                className="flex-1 gap-1"
              >
                <Share2 className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
