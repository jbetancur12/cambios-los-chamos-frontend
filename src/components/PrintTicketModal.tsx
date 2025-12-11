import { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, X, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { usePrinterConfig } from '@/hooks/usePrinterConfig'

interface ThermalTicketData {
  companyName: string
  companyPhone: string
  companyAddress: string
  companyCity: string
  divider: string
  giroId: string
  createdAt: string
  completedAt?: string
  beneficiaryName: string
  beneficiaryId: string
  bankName: string
  accountNumber: string
  phone: string
  amountInput: string
  currencyInput: string
  amountBs: string
  commission?: string
  bcvApplied: string
  systemProfit: string
  minoristaProfit: string
  executionType: string
  bankAccountUsed?: string
  createdByName: string
  executedByName?: string
  timestamp: string
}

interface PrintTicketModalProps {
  giroId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Componente para imprimir tiquete térmico (80mm) desde navegador
 * Optimizado para impresoras térmicas de rollo
 */
export function PrintTicketModal({ giroId, open, onOpenChange }: PrintTicketModalProps) {
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<ThermalTicketData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [printerName, setPrinterName] = useState('')
  const [autoSavePrinter, setAutoSavePrinter] = useState(false)
  const printFrameRef = useRef<HTMLIFrameElement>(null)
  const { getPrinterConfig } = usePrinterConfig()

  // Cargar datos del tiquete y configuración cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (!ticketData) {
        fetchTicketData()
      }
      const config = getPrinterConfig()
      if (config) {
        setPrinterName(config.name)
        setAutoSavePrinter(true)
      }
    }
  }, [open])

  const fetchTicketData = async () => {
    setLoading(true)
    setError(null)
    try {
      const ticketData = await api.get<ThermalTicketData>(`/giro/${giroId}/thermal-ticket`)
      setTicketData(ticketData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar los datos del tiquete'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Genera el HTML del tiquete optimizado para 80mm (térmica)
   * Ancho estándar de impresoras térmicas: 80mm = ~384px @ 96dpi
   */
  const generateThermalHTML = (data: ThermalTicketData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiquete Giro #${data.giroId}</title>
    <style>
            * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            @top-left { content: none; }
            @top-center { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-center { content: none; }
            @bottom-right { content: none; }
        }

        body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0;
            padding: 0;
            background: white;
            font-weight: bold;
            color: #000000;
        }

        .ticket {
            width: 100%;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
        }

        .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }

        .company-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 1px;
        }

        .company-phone {
            font-size: 11px;
            margin-bottom: 5px;
        }

        .divider {
            font-size: 11px;
            text-align: center;
            margin: 10px 0;
            letter-spacing: 1px;
        }

        .section {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
        }

        .section-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            line-height: 1.5;
        }

        .label {
            flex: 1;
            font-weight: bold;
        }

        .value {
            flex: 2;
            text-align: right;
            word-wrap: break-word;
        }

        
        .label {
            flex: 1;
            font-weight: bold;
        }

        .value-1 {
            flex: 1;
            text-align: right;
            word-wrap: break-word;
        }


        .full-row {
            width: 100%;
            font-size: 12px;
            margin-bottom: 5px;
            word-wrap: break-word;
        }

        .amount-highlight {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            padding: 5px;
            border: 1px solid #000;
        }

        .footer {
            text-align: center;
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
            font-size: 11px;
        }

        .status-completed {
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            padding: 5px;
            border: 1px solid #000;
            text-transform: uppercase;
            font-size: 11px;
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
                width: 80mm;
            }
            .ticket {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- ENCABEZADO -->
        <div class="header">
            <div class="company-name">${data.companyName}</div>
            <div class="company-address">${data.companyAddress}</div>
            <div class="company-city">${data.companyCity}</div>
            <div class="company-phone">${data.companyPhone}</div>
        </div>

        <!-- INFORMACIÓN DEL GIRO -->
        <div class="section"> 
            <div class="row">
                <span class="label">Creado:</span>
                <span class="value">${data.createdAt}</span>
            </div>
            ${
              data.completedAt
                ? `
            <div class="row">
                <span class="label">Ejecutado:</span>
                <span class="value">${data.completedAt}</span>
            </div>
            `
                : ''
            }
        </div>

        <!-- DATOS DEL BENEFICIARIO -->
        <div class="section">
            <div class="section-title">Beneficiario</div>
            <div class="full-row"><strong>${data.beneficiaryName}</strong></div>
            <div class="row">
                <span class="label">Cédula:</span>
                <span class="value">${data.beneficiaryId}</span>
            </div>
            <div class="row">
                <span class="label">Banco:</span>
                <span class="value">${data.bankName}</span>
            </div>
            <div class="row">
                <span class="label">Cuenta:</span>
                <span class="value">${data.accountNumber}</span>
            </div>
            <div class="row">
                <span class="label">Teléfono:</span>
                <span class="value">${data.phone}</span>
            </div>
        </div>

        <!-- MONTOS -->
        <div class="section">
            <div class="section-title">Montos</div>
            <div class="row">
                <span class="label">Entrada:</span>
                <span class="value">${data.amountInput}</span>
            </div>
            <div class="row">
                <span class="label">TRM/BCV:</span>
                <span class="value">${data.bcvApplied}</span>
            </div>
            <div class="amount-highlight">
                Bs. ${data.amountBs}
            </div>

        </div>

        <!-- EJECUCIÓN -->
        <div class="section">
            <div class="row">
                <span class="label">Tipo:</span>
                <span class="value">${data.executionType}</span>
            </div>
            ${
              data.executedByName
                ? `
            <div class="row">
                <span class="label">Ejecutado por:</span>
                <span class="value-1">${data.executedByName}</span>
            </div>
            `
                : ''
            }
        </div>

        <div class="status-completed">✓ GIRO COMPLETADO</div>

        <!-- FOOTER -->
        <div class="footer">
            <div style="margin-bottom: 5px;">Impreso: ${data.timestamp}</div>
            <div style="margin-bottom: 10px;">Gracias por su confianza</div>
            <div style="font-size: 10px; letter-spacing: 2px;">${data.giroId.toUpperCase()}</div>
        </div>
    </div>
</body>
</html>
    `
  }

  const handlePrint = () => {
    if (!ticketData) return

    const html = generateThermalHTML(ticketData)

    // Crear iframe para impresión
    const iframe = printFrameRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    // Esperar a que el contenido se cargue antes de imprimir
    setTimeout(() => {
      if (autoSavePrinter && printerName) {
        // Intentar imprimir con la impresora preconfigurada
        try {
          iframe.contentWindow?.print()
          toast.success(`Imprimiendo con ${printerName}...`)
        } catch {
          toast.error(`Error: No se encontró la impresora "${printerName}". Se abrirá el diálogo de impresión.`)
          iframe.contentWindow?.print()
        }
      } else {
        // Sin impresora configurada, abrir diálogo normal
        iframe.contentWindow?.print()
        toast.success('Se abrió la ventana de impresión. Selecciona tu impresora térmica de 80mm.')
      }
    }, 500)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[360px]">
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Imprimir Tiquete</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Printer Configuration Status */}
          {!loading && ticketData && autoSavePrinter && printerName && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <Settings className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Impresora configurada</p>
                <p className="text-xs text-green-700">{printerName} (Térmica 80mm)</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ticketData ? (
            <div className="space-y-4">
              {/* Preview del tiquete */}
              <div className="border rounded-lg bg-white p-4 max-h-96 overflow-y-auto">
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '11px',
                    width: '240px',
                    margin: '0 auto',
                    lineHeight: '1.3',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  }}
                >
                  <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>
                    {ticketData.companyName}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '10px' }}>
                    {ticketData.companyPhone}
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>================================</div>

                  <div style={{ marginBottom: '10px' }}>
                    <strong>GIRO #{ticketData.giroId}</strong>
                  </div>

                  <div style={{ marginBottom: '10px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                    <div>Beneficiario:</div>
                    <div style={{ fontWeight: 'bold' }}>{ticketData.beneficiaryName}</div>
                    <div>Cédula: {ticketData.beneficiaryId}</div>
                    <div>Banco: {ticketData.bankName}</div>
                    <div>Cuenta: {ticketData.accountNumber}</div>
                  </div>

                  <div style={{ marginBottom: '10px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                    <div>Entrada: {ticketData.amountInput}</div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '5px 0' }}>
                      Bs. {ticketData.amountBs}
                    </div>
                    <div>TRM: {ticketData.bcvApplied}</div>
                  </div>

                  <div style={{ marginBottom: '10px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                    <div>Tipo: {ticketData.executionType}</div>
                    {ticketData.executedByName && <div>Ejecutado por: {ticketData.executedByName}</div>}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
                    Impreso: {ticketData.timestamp}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
                {autoSavePrinter && printerName
                  ? `Imprimirá directamente en: ${printerName}`
                  : 'Selecciona tu impresora térmica de 80mm cuando se abra la ventana de impresión.'}
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handlePrint} disabled={loading || !ticketData} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </SheetBody>

        {/* iframe invisible para impresión */}
        <iframe ref={printFrameRef} style={{ display: 'none' }} title="print-frame" />
      </SheetContent>
    </Sheet>
  )
}
