import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Building,
  CreditCard,
  Phone,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import type { Giro, BankAccount, ExecutionType, GiroStatus } from '@/types/api'

interface GiroDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  giroId: string | null
  onUpdate: () => void
}

export function GiroDetailSheet({ open, onOpenChange, giroId, onUpdate }: GiroDetailSheetProps) {
  const { user } = useAuth()
  const [giro, setGiro] = useState<Giro | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  // Execute form fields
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('')
  const [executionType, setExecutionType] = useState<ExecutionType>('TRANSFERENCIA')
  const [proofUrl, setProofUrl] = useState('')

  const isTransferencista = user?.role === 'TRANSFERENCISTA'
  const isMinorista = user?.role === 'MINORISTA'

  useEffect(() => {
    if (open && giroId) {
      fetchGiroDetails()
      if (isTransferencista) {
        fetchBankAccounts()
      }
    }
  }, [open, giroId, isTransferencista])

  const fetchGiroDetails = async () => {
    if (!giroId) return

    try {
      setLoading(true)
      const response = await api.get<{ giro: Giro }>(`/api/giro/${giroId}`)
      setGiro(response.giro)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar detalles del giro')
    } finally {
      setLoading(false)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get<{ bankAccounts: BankAccount[] }>('/api/bank-account/my-accounts')
      setBankAccounts(response.bankAccounts)
      if (response.bankAccounts.length > 0) {
        setSelectedBankAccountId(response.bankAccounts[0].id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar cuentas bancarias')
    }
  }

  const handleMarkAsProcessing = async () => {
    if (!giro) return

    try {
      setProcessing(true)
      await api.post(`/api/giro/${giro.id}/mark-processing`)
      toast.success('Giro marcado como procesando')
      fetchGiroDetails()
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar giro como procesando')
    } finally {
      setProcessing(false)
    }
  }

  const handleExecuteGiro = async () => {
    if (!giro || !selectedBankAccountId || !executionType) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setProcessing(true)
      await api.post(`/api/giro/${giro.id}/execute`, {
        bankAccountId: selectedBankAccountId,
        executionType,
        proofUrl: proofUrl || undefined,
      })
      toast.success('Giro ejecutado exitosamente')
      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar giro')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: GiroStatus) => {
    const statusMap = {
      PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ASIGNADO: { label: 'Asignado', className: 'bg-blue-100 text-blue-800', icon: ArrowRight },
      PROCESANDO: { label: 'Procesando', className: 'bg-purple-100 text-purple-800', icon: Clock },
      COMPLETADO: { label: 'Completado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: XCircle },
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Clock }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount)
    } else if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    } else {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
      }).format(amount)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  if (!giro && !loading) {
    return null
  }

  const statusBadge = giro ? getStatusBadge(giro.status) : null
  const StatusIcon = statusBadge?.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Detalles del Giro</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : giro ? (
            <div className="space-y-4">
              {/* Status Badge */}
              {statusBadge && StatusIcon && (
                <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${statusBadge.className}`}>
                  <StatusIcon className="h-5 w-5" />
                  <span className="font-semibold">{statusBadge.label}</span>
                </div>
              )}

              {/* Beneficiary Info */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Beneficiario
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre</p>
                    <p className="font-medium">{giro.beneficiaryName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">C�dula</p>
                    <p className="font-medium">{giro.beneficiaryId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium">{giro.phone}</p>
                  </div>
                </div>
              </div>

              {/* Bank Info */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Banco Destino
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Banco</p>
                    <p className="font-medium">{giro.bankName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium">{giro.accountNumber}</p>
                  </div>
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Montos
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monto Enviado</p>
                    <p className="text-lg font-semibold">{formatCurrency(giro.amountInput, giro.currencyInput)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto en Bs</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(giro.amountBs, 'VES')}</p>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Applied */}
              {/* Exchange Rate Applied */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tasa Aplicada
                </h3>

                {isTransferencista || isMinorista ? (
                  // Solo tasa de venta para transferencista y minorista
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Venta</p>
                      <p className="font-medium text-lg">{giro.rateApplied.sellRate.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  // Todas las tasas para admin y super_admin
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Compra</p>
                      <p className="font-medium">{giro.rateApplied.buyRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Venta</p>
                      <p className="font-medium">{giro.rateApplied.sellRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">USD</p>
                      <p className="font-medium">{giro.rateApplied.usd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">BCV</p>
                      <p className="font-medium">{giro.rateApplied.bcv.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Transferencista Info */}
              {giro.transferencista && (
                <div className="space-y-2 p-4 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">Transferencista Asignado</p>
                  <p className="font-medium">{giro.transferencista.user.fullName}</p>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Creado: {formatDate(giro.createdAt)}</span>
                </div>
                {giro.updatedAt !== giro.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Actualizado: {formatDate(giro.updatedAt)}</span>
                  </div>
                )}
              </div>

              {/* Actions for Transferencista */}
              {isTransferencista && giro.status === 'ASIGNADO' && (
                <div className="pt-4">
                  <Button onClick={handleMarkAsProcessing} disabled={processing} className="w-full">
                    {processing ? 'Procesando...' : 'Marcar como Procesando'}
                  </Button>
                </div>
              )}

              {/* Execute Form for Transferencista */}
              {isTransferencista && giro.status === 'PROCESANDO' && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Ejecutar Giro</h3>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Cuenta Bancaria</Label>
                    <select
                      id="bankAccount"
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Selecciona una cuenta</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bank.name} - {account.accountNumber} ({formatCurrency(account.balance, 'VES')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="executionType">Tipo de Ejecuci�n</Label>
                    <select
                      id="executionType"
                      value={executionType}
                      onChange={(e) => setExecutionType(e.target.value as ExecutionType)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="PAGO_MOVIL">Pago M�vil</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="ZELLE">Zelle</option>
                      <option value="OTROS">Otros</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proofUrl">URL del Comprobante (Opcional)</Label>
                    <Input
                      id="proofUrl"
                      type="url"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://ejemplo.com/comprobante.jpg"
                    />
                  </div>

                  <Button
                    onClick={handleExecuteGiro}
                    disabled={processing || !selectedBankAccountId}
                    className="w-full"
                  >
                    {processing ? 'Ejecutando...' : 'Ejecutar Giro'}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
