import { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, X, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { usePrinterConfig } from '@/hooks/usePrinterConfig'

interface FacturaTicketData {
  companyName: string
  companyNit: string
  companyPhone: string
  companyAddress: string
  companyCity: string
  divider: string
  
  facturaNumber: string
  createdAt: string
  giroId: string

  clientName: string
  clientNit: string
  clientAddress: string
  clientPhone: string

  items: {
    name: string
    quantity: number
    price: string
    total: string
  }[]

  grossValue: string
  taxAmount: string
  total: string

  cufe: string
  qr: string

  createdByName: string
  timestamp: string
  resolutionPrefix: string
  resolutionNumber: string
  resolutionFrom: string
  resolutionTo: string
  resolutionStartDate: string
  resolutionEndDate: string
}

interface PrintFacturaModalProps {
  giroId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Componente para imprimir tiquete térmico (80mm) de Factura POS
 */
export function PrintFacturaModal({ giroId, open, onOpenChange }: PrintFacturaModalProps) {
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<FacturaTicketData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [printerName, setPrinterName] = useState('')
  const [autoSavePrinter, setAutoSavePrinter] = useState(false)
  const printFrameRef = useRef<HTMLIFrameElement>(null)
  const { getPrinterConfig } = usePrinterConfig()

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
      const data = await api.get<FacturaTicketData>(`/giro/${giroId}/factura-ticket`)
      setTicketData(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar los datos de la factura POS'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const generateThermalHTML = (data: FacturaTicketData): string => {
    const itemsHtml = data.items.map(item => `
      <div class="row">
        <span class="value-left">${item.quantity} x ${item.name}</span>
      </div>
      <div class="row">
        <span class="value-left">${item.price}</span>
        <span class="value">${item.total}</span>
      </div>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura POS #${data.facturaNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; }
        body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 0; background: white; font-weight: bold; color: #000; }
        .ticket { width: 100%; padding: 10px; font-size: 12px; line-height: 1.4; color: #000; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .company-name { font-weight: bold; font-size: 14px; margin-bottom: 3px; }
        .company-details { font-size: 11px; margin-bottom: 2px; }
        .divider { font-size: 11px; text-align: center; margin: 10px 0; letter-spacing: 1px; }
        .section { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
        .section-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; text-align: center; }
        .row { display: flex; justify-content: space-between; font-size: 11px; line-height: 1.5; }
        .label { flex: 1; font-weight: bold; }
        .value { flex: 2; text-align: right; word-wrap: break-word; }
        .value-left { flex: 2; text-align: left; word-wrap: break-word; }
        .full-row { width: 100%; font-size: 11px; margin-bottom: 5px; word-wrap: break-word; }
        .totals-section { margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
        .amount-highlight { font-size: 14px; font-weight: bold; text-align: right; margin: 5px 0; }
        .qr-container { display: flex; justify-content: center; margin: 15px 0; }
        .qr-container img { width: 150px; height: 150px; }
        .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
        @media print { body { width: 80mm; } .ticket { padding: 5px; } }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- HEADER -->
        <div class="header">
            <div class="company-name">${data.companyName}</div>
            <div class="company-details">${data.companyNit}</div>
            <div class="company-details">${data.companyAddress}</div>
            <div class="company-details">${data.companyCity}</div>
            <div class="company-details">Tel: ${data.companyPhone}</div>
        </div>



        <!-- INVOICE INFO -->
        <div class="section"> 
            <div class="row"><span class="label">Factura No:</span><span class="value">${data.facturaNumber}</span></div>
            <div class="row"><span class="label">Fecha:</span><span class="value">${data.createdAt}</span></div>
            <div class="row"><span class="label">Ref Giro:</span><span class="value">${data.giroId.toUpperCase()}</span></div>
        </div>

        <!-- CUSTOMER INFO -->
        <div class="section">
            <div class="section-title">Cliente</div>
            <div class="full-row"><strong>${data.clientName}</strong></div>
            ${data.clientNit ? `<div class="row"><span class="label">NIT/CC:</span><span class="value">${data.clientNit}</span></div>` : ''}
            ${data.clientAddress ? `<div class="row"><span class="label">Dir:</span><span class="value">${data.clientAddress}</span></div>` : ''}
            ${data.clientPhone ? `<div class="row"><span class="label">Tel:</span><span class="value">${data.clientPhone}</span></div>` : ''}
        </div>

        <!-- ITEMS -->
        <div class="section">
            <div class="section-title">Detalle</div>
            ${itemsHtml}
        </div>

        <!-- TOTALS -->
        <div class="totals-section">
            <div class="row"><span class="label">Subtotal:</span><span class="value">${data.grossValue}</span></div>
            <div class="row"><span class="label">Total Impuestos:</span><span class="value">${data.taxAmount}</span></div>
            <div class="amount-highlight">TOTAL: ${data.total}</div>
        </div>

        <!-- CUFE & QR -->
        <div class="section" style="word-break: break-all; font-size: 9px; text-align: center;">
            <div style="margin-bottom: 5px;"><strong>CUFE:</strong></div>
            <div>${data.cufe}</div>
        </div>
        ${data.qr ? `
        <div class="qr-container">
            <img src="${data.qr}" alt="QR Factura" />
        </div>` : ''}

        <!-- FOOTER -->
        <div class="footer">
            <!-- RESOLUTION (IF ANY) -->
            ${data.resolutionNumber ? `
            <div style="line-height: 1.2;">
                <div>Resolución DIAN: ${data.resolutionNumber}</div>
                <div>Prefijo ${data.resolutionPrefix} Rango desde ${data.resolutionFrom} hasta ${data.resolutionTo}</div>
                <div>Vigencia Desde: ${data.resolutionStartDate} Hasta: ${data.resolutionEndDate}</div>
            </div>
            ` : ''}
            
            <div style="line-height: 1.2;">Atendido por: ${data.createdByName}</div>
            <div style="line-height: 1.2;">Impreso: ${data.timestamp}</div>
            <div>*** Gracias por su compra ***</div>
            <div style="margin-top: 5px; font-size: 9px;">Software Facturación Electrónica por Factus</div>
        </div>
    </div>
</body>
</html>`
  }

  const handlePrint = () => {
    if (!ticketData) return

    const html = generateThermalHTML(ticketData)
    const iframe = printFrameRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    setTimeout(() => {
      if (autoSavePrinter && printerName) {
        try {
          iframe.contentWindow?.print()
          toast.success(`Imprimiendo con ${printerName}...`)
        } catch {
          toast.error(`Error al imprimir en "${printerName}". Se abrirá el diálogo.`)
          iframe.contentWindow?.print()
        }
      } else {
        iframe.contentWindow?.print()
        toast.success('Selecciona tu impresora térmica de 80mm.')
      }
    }, 500)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[360px]">
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Imprimir Factura POS</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
                  <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{ticketData.companyName}</div>
                  <div style={{ textAlign: 'center', fontSize: '10px' }}>{ticketData.companyNit}</div>
                  <div style={{ textAlign: 'center', margin: '5px 0' }}>================================</div>
                  <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Factura No: {ticketData.facturaNumber}</div>
                  <div style={{ margin: '10px 0', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                    <strong>Cliente:</strong><br />
                    {ticketData.clientName}<br />
                    {ticketData.clientNit}
                  </div>
                  <div style={{ margin: '10px 0', borderTop: '1px dashed #000', paddingTop: '5px', textAlign: 'right' }}>
                    <strong>TOTAL:</strong><br />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{ticketData.total}</span>
                  </div>
                  {ticketData.qr && (
                    <div style={{ textAlign: 'center', margin: '10px 0' }}>
                      <img src={ticketData.qr} alt="QR" style={{ width: '100px', height: '100px' }} />
                    </div>
                  )}
                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
                    Impreso: {ticketData.timestamp}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
                {autoSavePrinter && printerName
                  ? `Imprimirá directamente en: ${printerName}`
                  : 'Selecciona tu impresora térmica de 80mm al abrir la ventana.'}
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

        <iframe ref={printFrameRef} style={{ display: 'none' }} title="print-frame-factura" />
      </SheetContent>
    </Sheet>
  )
}
