import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface PrinterDetectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPrinter: (printerName: string) => void
}

export function PrinterDetectionDialog({ open, onOpenChange, onSelectPrinter }: PrinterDetectionDialogProps) {
  const [printers, setPrinters] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      detectPrinters()
    }
  }, [open])

  const detectPrinters = async () => {
    setLoading(true)
    try {
      // Usar la Web Print API si está disponible
      if ('getPrinters' in navigator) {
        // @ts-expect-error - Web Print API no está en los tipos de TypeScript
        const detectedPrinters = await navigator.getPrinters?.()
        if (detectedPrinters && detectedPrinters.length > 0) {
          const printerNames = detectedPrinters.map(
            (p: { name?: string; displayName?: string }) => p.name || p.displayName || 'Impresora desconocida'
          )
          setPrinters(printerNames)
          if (printerNames.length === 0) {
            toast.info('No se detectaron impresoras disponibles')
          }
        } else {
          // Si no hay impresoras detectadas, mostrar instrucciones
          toast.info('No se detectaron impresoras. Por favor ingresa el nombre manualmente.')
          setPrinters([])
        }
      } else {
        // Alternativa: usar window.print() para detectar impresoras disponibles
        // Esto abrirá el diálogo de impresión del navegador que permite ver impresoras
        toast.info(
          'Tu navegador no soporta detección automática de impresoras. Se abrirá el diálogo de impresión del navegador para que veas las disponibles.'
        )

        // Crear un iframe invisible para abrir el diálogo de impresión
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.setAttribute('srcdoc', '<html><body>Detectando impresoras...</body></html>')
        document.body.appendChild(iframe)

        setTimeout(() => {
          iframe.contentWindow?.print()
          // Limpiar el iframe después de que se abra el diálogo
          document.body.removeChild(iframe)
          toast.info('Por favor, verifica las impresoras disponibles en el diálogo que se abrió')
        }, 500)
      }
    } catch (error) {
      console.error('Error detecting printers:', error)
      toast.error('Error al detectar impresoras')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Detectar Impresoras Disponibles</SheetTitle>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : printers.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Selecciona una impresora de la lista:</p>
                <div className="space-y-2">
                  {printers.map((printer) => (
                    <button
                      key={printer}
                      onClick={() => {
                        onSelectPrinter(printer)
                        onOpenChange(false)
                      }}
                      className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 text-left"
                    >
                      <Printer className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{printer}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={detectPrinters} variant="outline" className="w-full">
                  Detectar nuevamente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> No se detectaron impresoras automáticamente. Por favor:
                  </p>
                  <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                    <li>Asegúrate de que tu impresora esté conectada y encendida</li>
                    <li>Ingresa el nombre de tu impresora manualmente en el campo superior</li>
                    <li>O abre el diálogo de impresión del navegador (Ctrl+P) para ver impresoras disponibles</li>
                  </ol>
                </div>
                <Button
                  onClick={() => {
                    // Abrir el diálogo de impresión para que el usuario vea las impresoras disponibles
                    window.print()
                    onOpenChange(false)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Abrir Diálogo de Impresión
                </Button>
              </div>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
