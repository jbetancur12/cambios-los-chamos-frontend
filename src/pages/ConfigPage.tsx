import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { usePrinterConfig, useSetPrinterConfig, useClearPrinterConfig } from '@/hooks/queries/usePrinterConfigQueries'
import { PrinterDetectionDialog } from '@/components/PrinterDetectionDialog'
import { RechargeOperatorsManager } from '@/components/RechargeOperatorsManager'
import { OperatorAmountsManager } from '@/components/OperatorAmountsManager'
import { cn } from '@/lib/utils'

export function ConfigPage() {
  const { user } = useAuth()
  const canAccessOperatorTab = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const [activeTab, setActiveTab] = useState<'operador' | 'impresora'>(canAccessOperatorTab ? 'operador' : 'impresora')
  const [printerName, setPrinterName] = useState('')
  const [printerType, setPrinterType] = useState<'thermal' | 'injection'>('thermal')
  const [detectionDialogOpen, setDetectionDialogOpen] = useState(false)

  // React Query hooks
  const printerConfigQuery = usePrinterConfig()
  const setPrinterConfigMutation = useSetPrinterConfig()
  const clearPrinterConfigMutation = useClearPrinterConfig()

  const printerConfig = printerConfigQuery.data
  const isLoading = setPrinterConfigMutation.isPending || clearPrinterConfigMutation.isPending

  // Update form when config loads
  if (printerConfig && (!printerName || !printerType)) {
    if (!printerName) setPrinterName(printerConfig.name)
    if (printerType === 'thermal') setPrinterType(printerConfig.type)
  }

  const handleSavePrinterConfig = async () => {
    if (!printerName.trim()) {
      toast.error('Por favor ingresa el nombre de la impresora')
      return
    }

    try {
      await setPrinterConfigMutation.mutateAsync({
        name: printerName,
        type: printerType,
      })
      toast.success('Configuración de impresora guardada')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    }
  }

  const handleClearPrinterConfig = async () => {
    try {
      await clearPrinterConfigMutation.mutateAsync()
      setPrinterName('')
      toast.success('Configuración de impresora eliminada')
    } catch (error) {
      toast.error('Error al eliminar la configuración')
    }
  }

  const handleSelectPrinter = (printerName: string) => {
    setPrinterName(printerName)
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">Gestiona la configuración del sistema</p>
      </div>

      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          {canAccessOperatorTab && (
            <button
              onClick={() => setActiveTab('operador')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-all border-b-2',
                activeTab === 'operador'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Operador
            </button>
          )}
          <button
            onClick={() => setActiveTab('impresora')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-all border-b-2',
              activeTab === 'impresora'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Impresora
          </button>
        </div>

        {/* Operator Configuration Tab */}
        {activeTab === 'operador' && (
          <div className="space-y-6">
            {/* Recharge Operators Manager */}
            <div>
              <RechargeOperatorsManager />
            </div>

            {/* Operator Amounts Manager */}
            <div>
              <OperatorAmountsManager />
            </div>
          </div>
        )}

        {/* Printer Configuration Tab */}
        {activeTab === 'impresora' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurar Impresora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status */}
              {printerConfig && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Impresora configurada:</strong> {printerConfig.name} ({printerConfig.type === 'thermal' ? 'Térmica 80mm' : 'Inyección Media Carta'})
                  </p>
                </div>
              )}

              {/* Printer Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="printerName" className="font-medium">Nombre de la impresora</Label>
                  <button
                    onClick={() => setDetectionDialogOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    Detectar
                  </button>
                </div>
                <Input
                  id="printerName"
                  type="text"
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  placeholder="Ej: Printer-Office-1, HP LaserJet, etc."
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Nombre o modelo de la impresora que deseas configurar como predeterminada</p>
              </div>

              {/* Printer Type Selection */}
              <div className="space-y-2">
                <Label className="font-medium">Tipo de impresora</Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrinterType('thermal')}
                    className={`flex-1 py-3 px-4 rounded border text-sm font-medium transition-all ${
                      printerType === 'thermal'
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Térmica (80mm)
                  </button>
                  <button
                    onClick={() => setPrinterType('injection')}
                    className={`flex-1 py-3 px-4 rounded border text-sm font-medium transition-all ${
                      printerType === 'injection'
                        ? 'bg-green-100 border-green-500 text-green-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Inyección (Media Carta)
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Selecciona el tipo de impresora que utilizarás para imprimir los tiquetes</p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Una vez configurada, la impresora será utilizada automáticamente al imprimir tiquetes de giro. Si la impresora no está disponible, podrás seleccionar otra desde el diálogo de impresión.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSavePrinterConfig} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
                {printerConfig && (
                  <Button onClick={handleClearPrinterConfig} disabled={isLoading} variant="outline" className="flex-1">
                    {isLoading ? 'Eliminando...' : 'Limpiar Configuración'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Printer Detection Dialog */}
      <PrinterDetectionDialog
        open={detectionDialogOpen}
        onOpenChange={setDetectionDialogOpen}
        onSelectPrinter={handleSelectPrinter}
      />
    </div>
  )
}
