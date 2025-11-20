import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useGiroWebSocket } from '@/hooks/useGiroWebSocket'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { PaymentProofUpload } from './PaymentProofUpload'
import { PrintTicketModal } from './PrintTicketModal'
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Building,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  CornerDownLeft, // Nuevo ícono para devolver
  Printer,
  Copy,
} from 'lucide-react'
import type { Giro, BankAccount, GiroStatus, Bank, MinoristaTransaction } from '@/types/api'

interface GiroDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  giroId: string | null
  onUpdate: () => void
}

const RETURN_REASON_OPTIONS = [
  'Número de cuenta incorrecto',
  'Número de teléfono incorrecto',
  'Banco incorrecto',
  'Otro motivo',
]

export function GiroDetailSheet({ open, onOpenChange, giroId, onUpdate }: GiroDetailSheetProps) {
  const { user } = useAuth()
  const { subscribe } = useGiroWebSocket()
  const isDesktop = useIsDesktop()
  const [giro, setGiro] = useState<Giro | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [editableBeneficiaryName, setEditableBeneficiaryName] = useState('')
  const [editableBeneficiaryId, setEditableBeneficiaryId] = useState('')
  const [editablePhone, setEditablePhone] = useState('')
  const [editableBankName, setEditableBankName] = useState('')
  const [editableBankId, setEditableBankId] = useState('')
  const [editableAccountNumber, setEditableAccountNumber] = useState('')

  // Execute form fields
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [fee, setFee] = useState(0)
  const [banks, setBanks] = useState<Bank[]>([])

  // NUEVOS ESTADOS PARA DEVOLUCIÓN
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnReason, setReturnReason] = useState('')

  // NUEVOS ESTADOS PARA EDICIÓN DE TASA
  const [isEditingRate, setIsEditingRate] = useState(false)
  const [editableRate, setEditableRate] = useState({
    buyRate: 0,
    sellRate: 0,
    usd: 0,
    bcv: 0,
  })

  // ESTADO PARA PAYMENT PROOF
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)

  // ESTADO PARA DETALLES DE TRANSACCIÓN DEL MINORISTA
  const [minoristaTransaction, setMinoristaTransaction] = useState<MinoristaTransaction | null>(null)

  // ESTADO PARA MODAL DE IMPRESIÓN
  const [showPrintModal, setShowPrintModal] = useState(false)

  const isTransferencista = user?.role === 'TRANSFERENCISTA'
  const isMinorista = user?.role === 'MINORISTA'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const isNotEditableStatus =
    giro?.status === 'PROCESANDO' || giro?.status === 'COMPLETADO' || giro?.status === 'CANCELADO'
  const canEdit = isMinorista && giro && !isNotEditableStatus //

  useEffect(() => {
    if (open && giroId) {
      // Resetear estados al abrir
      setShowReturnForm(false)
      setReturnReason('')
      setFee(0)
      setProofUrl('')

      fetchGiroDetails()
      fetchPaymentProof()
      if (isTransferencista) {
        fetchBankAccounts()
      }
      if (isMinorista) {
        fetchMinoristaTransactionDetails()
      }
    }
  }, [open, giroId, isTransferencista, isMinorista])

  // WebSocket listener para actualizaciones en tiempo real
  useEffect(() => {
    if (!giroId) return

    // Escuchar cuando se crea un nuevo giro
    const unsubscribeCreated = subscribe('giro:created', (event) => {
      if (event.giro.id === giroId) {
        console.log('[DetailSheet] Giro creado:', event.giro.id)
        setGiro(event.giro as unknown as Giro)
        setEditableRate({
          buyRate: event.giro.rateApplied?.buyRate || 0,
          sellRate: event.giro.rateApplied?.sellRate || 0,
          usd: event.giro.rateApplied?.usd || 0,
          bcv: event.giro.rateApplied?.bcv || 0,
        })
      }
    })

    // Escuchar actualizaciones del giro específico
    const unsubscribeUpdated = subscribe('giro:updated', (event) => {
      if (event.giro.id === giroId) {
        console.log('[DetailSheet] Giro actualizado:', event.giro.id, 'Tipo:', event.changeType)
        setGiro(event.giro as unknown as Giro)
        // Actualizar también los campos editables
        setEditableRate({
          buyRate: event.giro.rateApplied?.buyRate || 0,
          sellRate: event.giro.rateApplied?.sellRate || 0,
          usd: event.giro.rateApplied?.usd || 0,
          bcv: event.giro.rateApplied?.bcv || 0,
        })
      }
    })

    const unsubscribeProcessing = subscribe('giro:processing', (event) => {
      if (event.giro.id === giroId) {
        console.log('[DetailSheet] Giro procesando:', event.giro.id)
        setGiro(event.giro as unknown as Giro)
        setProcessing(false)
      }
    })

    const unsubscribeExecuted = subscribe('giro:executed', (event) => {
      if (event.giro.id === giroId) {
        console.log('[DetailSheet] Giro ejecutado:', event.giro.id)
        setGiro(event.giro as unknown as Giro)
        setProcessing(false)
      }
    })

    const unsubscribeReturned = subscribe('giro:returned', (event) => {
      if (event.giro.id === giroId) {
        console.log('[DetailSheet] Giro devuelto:', event.giro.id)
        setGiro(event.giro as unknown as Giro)
        setProcessing(false)
      }
    })

    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeProcessing()
      unsubscribeExecuted()
      unsubscribeReturned()
    }
  }, [giroId, subscribe])

  const fetchGiroDetails = async () => {
    if (!giroId) return

    try {
      setLoading(true)
      const response = await api.get<{ giro: Giro }>(`/giro/${giroId}`)
      setGiro(response.giro)

      if (response.giro) {
        setEditableBeneficiaryName(response.giro.beneficiaryName)
        setEditableBeneficiaryId(response.giro.beneficiaryId)
        setEditablePhone(response.giro.phone)
        setEditableBankName(response.giro.bankName)
        setEditableAccountNumber(response.giro.accountNumber)
        // Inicializar tasa editable
        setEditableRate({
          buyRate: response.giro.rateApplied.buyRate,
          sellRate: response.giro.rateApplied.sellRate,
          usd: response.giro.rateApplied.usd,
          bcv: response.giro.rateApplied.bcv,
        })
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar detalles del giro')
    } finally {
      setLoading(false)
    }
  }

  const fetchMinoristaTransactionDetails = async () => {
    if (!giroId || !isMinorista) return

    try {
      const response = await api.get<{ transaction: MinoristaTransaction }>(`/giro/${giroId}/minorista-transaction`)
      setMinoristaTransaction(response.transaction)
    } catch (error: any) {
      // Silently fail if no transaction details available
      setMinoristaTransaction(null)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get<{ bankAccounts: BankAccount[] }>('/bank-account/my-accounts')
      setBankAccounts(response.bankAccounts)
      if (response.bankAccounts.length > 0) {
        setSelectedBankAccountId(response.bankAccounts[0].id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar cuentas bancarias')
    }
  }

  const fetchPaymentProof = async () => {
    if (!giroId) return

    try {
      const response = await api.get<{ paymentProofUrl: string; filename: string }>(
        `/giro/${giroId}/payment-proof/download`
      )
      setPaymentProofUrl(response.paymentProofUrl)
    } catch (error: any) {
      // Silently fail if no payment proof exists
      setPaymentProofUrl(null)
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await api.get<{ banks: Bank[] }>('/bank/all')
      setBanks(response.banks)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar bancos')
    }
  }

  const handleMarkAsProcessing = async () => {
    if (!giro) return

    try {
      setProcessing(true)
      await api.post(`/giro/${giro.id}/mark-processing`)
      toast.success('Giro marcado como procesando')
      // El WebSocket emitirá giro:processing y actualizará el estado automáticamente
      // No llamamos a fetchGiroDetails ni onUpdate porque el WebSocket lo hará
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar giro como procesando')
      setProcessing(false)
    }
  }

  const handleStartEdit = () => {
    // Solo cargamos los bancos si la lista está vacía
    if (banks.length === 0) {
      fetchBanks()
    }
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!giro) return

    // Validación básica de campos
    if (
      !editableBeneficiaryName ||
      !editableBeneficiaryId ||
      !editablePhone ||
      !editableBankId ||
      !editableAccountNumber
    ) {
      toast.error('Todos los campos del beneficiario son obligatorios.')
      return
    }

    try {
      setProcessing(true)
      // Endpoint que debe crearse en el backend para editar los datos
      await api.patch(`/giro/${giro.id}`, {
        beneficiaryName: editableBeneficiaryName,
        beneficiaryId: editableBeneficiaryId,
        phone: editablePhone,
        bankId: editableBankId,
        accountNumber: editableAccountNumber,
      })

      toast.success('Giro actualizado exitosamente.')
      setIsEditing(false) // Sale del modo edición
      fetchGiroDetails() // Refresca los datos
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el giro.')
    } finally {
      setProcessing(false)
    }
  }

  const handleExecuteGiro = async () => {
    if (!giro || !selectedBankAccountId || !giro.executionType) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setProcessing(true)
      await api.post(`/giro/${giro.id}/execute`, {
        bankAccountId: selectedBankAccountId,
        executionType: giro.executionType,
        fee,
        proofUrl: proofUrl || undefined,
      })
      toast.success('Giro ejecutado exitosamente')
      // Mostrar modal de impresión solo en desktop
      if (isDesktop) {
        setShowPrintModal(true)
      }
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar giro')
    } finally {
      setProcessing(false)
    }
  }

  // NUEVA FUNCIÓN PARA DEVOLVER EL GIRO
  const handleReturnGiro = async () => {
    if (!giro || !returnReason.trim()) {
      toast.error('Debes especificar un motivo para la devolución.')
      return
    }

    try {
      setProcessing(true)
      // Endpoint para la devolución del giro (el backend manejará el cambio de estado)
      await api.post(`/giro/${giro.id}/return`, {
        reason: returnReason,
      })

      toast.success('Giro devuelto exitosamente.')

      // Resetear estados locales y refrescar datos
      setReturnReason('')
      setShowReturnForm(false)
      fetchGiroDetails()
      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al devolver el giro')
    } finally {
      setProcessing(false)
    }
  }

  // NUEVA FUNCIÓN PARA ELIMINAR EL GIRO
  const handleDeleteGiro = async () => {
    if (!giro) return

    if (!confirm('¿Estás seguro de que deseas eliminar este giro? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setProcessing(true)
      await api.delete(`/giro/${giro.id}`)

      toast.success('Giro eliminado exitosamente.')
      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el giro')
    } finally {
      setProcessing(false)
    }
  }

  // NUEVA FUNCIÓN PARA GUARDAR CAMBIOS DE TASA
  const handleSaveRateEdit = async () => {
    if (!giro) return

    // Validación básica
    if (!editableRate.buyRate || !editableRate.sellRate || !editableRate.usd || !editableRate.bcv) {
      toast.error('Todos los campos de la tasa son obligatorios.')
      return
    }

    try {
      setProcessing(true)
      await api.patch(`/giro/${giro.id}/rate`, {
        buyRate: editableRate.buyRate,
        sellRate: editableRate.sellRate,
        usd: editableRate.usd,
        bcv: editableRate.bcv,
      })

      toast.success('Tasa del giro actualizada exitosamente. Se recalcularon los montos y ganancias.')
      setIsEditingRate(false)
      fetchGiroDetails()
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la tasa del giro.')
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
      DEVUELTO: { label: 'Devuelto', className: 'bg-orange-100 text-orange-800', icon: CornerDownLeft }, // Nuevo estado
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
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
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">Cargando...</p>
            </div>
          ) : giro ? (
            <div className="space-y-2">
              {/* Status Badge */}
              {statusBadge && StatusIcon && (
                <div className={`flex items-center justify-center gap-1 py-1 px-3 rounded text-xs font-semibold ${statusBadge.className}`}>
                  <StatusIcon className="h-3 w-3" />
                  <span>{statusBadge.label}</span>
                </div>
              )}

              {giro.status === 'DEVUELTO' && giro.returnReason && (
                <div className="p-2 rounded bg-orange-50 border border-orange-300 text-xs">
                  <p className="font-semibold text-orange-800 flex items-center gap-1 mb-0.5">
                    <CornerDownLeft className="h-3 w-3" />
                    Devolución:
                  </p>
                  <p className="text-orange-900 font-medium">{giro.returnReason}</p>
                </div>
              )}

              {/* Beneficiary Info */}
              <div className="p-2 bg-muted rounded text-xs space-y-1">
                <h3 className="font-semibold flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Beneficiario
                </h3>
                <div className="space-y-1">
                  {isEditing ? (
                    // Formulario de edición
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="editName">Nombre</Label>
                        <Input
                          id="editName"
                          value={editableBeneficiaryName}
                          onChange={(e) => setEditableBeneficiaryName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editId">Cédula</Label>
                        <Input
                          id="editId"
                          value={editableBeneficiaryId}
                          onChange={(e) => setEditableBeneficiaryId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editPhone">Teléfono</Label>
                        <Input
                          id="editPhone"
                          value={editablePhone}
                          onChange={(e) => setEditablePhone(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    // Vista estática
                    <div className="space-y-1">
                      {giro.executionType === 'PAGO_MOVIL' ? (
                        // Para pago móvil, mostrar el celular como identificador principal
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-muted-foreground">Celular:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{giro.phone}</span>
                            <button
                              onClick={() => copyToClipboard(giro.phone, 'Celular')}
                              className="p-0.5 hover:bg-muted rounded text-xs"
                              title="Copiar celular"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Para otras modalidades, mostrar nombre normalmente
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium">{giro.beneficiaryName}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-muted-foreground">Cédula:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{giro.beneficiaryId}</span>
                          <button
                            onClick={() => copyToClipboard(giro.beneficiaryId, 'Cédula')}
                            className="p-0.5 hover:bg-muted rounded text-xs"
                            title="Copiar cédula"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {giro.executionType !== 'PAGO_MOVIL' && (
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-muted-foreground">Teléfono:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{giro.phone || '—'}</span>
                            {giro.phone && (
                              <button
                                onClick={() => copyToClipboard(giro.phone, 'Teléfono')}
                                className="p-0.5 hover:bg-muted rounded text-xs"
                                title="Copiar teléfono"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Info */}
              <div className="p-2 bg-muted rounded text-xs space-y-1">
                <h3 className="font-semibold flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Banco
                </h3>
                <div className="space-y-0.5">
                  {isEditing ? (
                    // Formulario de edición
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="editBankName">Banco</Label>
                        <select
                          id="editBankName"
                          value={editableBankName}
                          onChange={(e) => setEditableBankId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          <option value="" disabled>
                            Selecciona un banco
                          </option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editAccountNumber">Número de Cuenta</Label>
                        <Input
                          id="editAccountNumber"
                          value={editableAccountNumber}
                          onChange={(e) => setEditableAccountNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    // Vista estática
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Banco:</span>
                        <span className="font-medium">{giro.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-muted-foreground">Cuenta:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium font-mono text-xs">{giro.accountNumber}</span>
                          <button
                            onClick={() => copyToClipboard(giro.accountNumber, 'Cuenta')}
                            className="p-0.5 hover:bg-muted rounded text-xs"
                            title="Copiar cuenta"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amounts */}
              <div className="p-2 bg-muted rounded text-xs space-y-1">
                <h3 className="font-semibold flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Montos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Enviado</p>
                    <p className="font-semibold">{formatCurrency(giro.amountInput, giro.currencyInput)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Bs</p>
                    <p className="font-semibold text-green-600">{formatCurrency(giro.amountBs, 'VES')}</p>
                  </div>
                </div>
              </div>

              {/* Consumption Breakdown for Minorista - Only shown when viewing their giro */}
              {isMinorista && minoristaTransaction && (
                <div className="space-y-3 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <h3 className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CreditCard className="h-4 w-4" />
                    Desglose del Consumo
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                    Cómo se descontó el cupo de este giro
                  </p>
                  <div className="space-y-2 text-sm">
                    {minoristaTransaction.balanceInFavorUsed !== undefined &&
                      minoristaTransaction.balanceInFavorUsed > 0 && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
                          <p className="text-xs text-muted-foreground mb-1">Saldo a Favor Utilizado</p>
                          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(minoristaTransaction.balanceInFavorUsed, 'COP')}
                          </p>
                        </div>
                      )}
                    {minoristaTransaction.creditUsed !== undefined && minoristaTransaction.creditUsed > 0 && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-muted-foreground mb-1">Crédito Disponible Utilizado</p>
                        <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          {formatCurrency(minoristaTransaction.creditUsed, 'COP')}
                        </p>
                      </div>
                    )}
                    {minoristaTransaction.remainingBalance !== undefined &&
                      minoristaTransaction.remainingBalance > 0 && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-700">
                          <p className="text-xs text-muted-foreground mb-1">Saldo a Favor Restante</p>
                          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(minoristaTransaction.remainingBalance, 'COP')}
                          </p>
                        </div>
                      )}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                    <p>💡 El saldo a favor se consume primero antes de usar el crédito disponible</p>
                  </div>
                </div>
              )}

              {/* Exchange Rate Applied - Only shown to Admins */}
              {isAdmin && (
              <div className="p-2 bg-muted rounded text-xs space-y-1">
                <h3 className="font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Tasa
                </h3>

                {isEditingRate ? (
                  // MODO EDICIÓN PARA ADMIN/SUPER_ADMIN
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="editBuyRate" className="text-xs">
                          Compra
                        </Label>
                        <Input
                          id="editBuyRate"
                          type="number"
                          step="0.01"
                          value={editableRate.buyRate}
                          onChange={(e) =>
                            setEditableRate({ ...editableRate, buyRate: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editSellRate" className="text-xs">
                          Venta
                        </Label>
                        <Input
                          id="editSellRate"
                          type="number"
                          step="0.01"
                          value={editableRate.sellRate}
                          onChange={(e) =>
                            setEditableRate({ ...editableRate, sellRate: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editUsd" className="text-xs">
                          USD
                        </Label>
                        <Input
                          id="editUsd"
                          type="number"
                          step="0.01"
                          value={editableRate.usd}
                          onChange={(e) => setEditableRate({ ...editableRate, usd: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editBcv" className="text-xs">
                          BCV
                        </Label>
                        <Input
                          id="editBcv"
                          type="number"
                          step="0.01"
                          value={editableRate.bcv}
                          onChange={(e) => setEditableRate({ ...editableRate, bcv: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveRateEdit} disabled={processing} size="sm" className="flex-1">
                        {processing ? 'Guardando...' : 'Guardar Tasa'}
                      </Button>
                      <Button
                        onClick={() => setIsEditingRate(false)}
                        disabled={processing}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // VISTA ESTÁTICA PARA ADMIN/SUPER_ADMIN
                  <>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Compra:</span>
                        <span className="font-medium">{giro.rateApplied?.buyRate?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Venta:</span>
                        <span className="font-medium">{giro.rateApplied?.sellRate?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD:</span>
                        <span className="font-medium">{giro.rateApplied?.usd?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BCV:</span>
                        <span className="font-medium">{giro.rateApplied?.bcv?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    {!isNotEditableStatus && (
                      <Button
                        onClick={() => setIsEditingRate(true)}
                        disabled={processing}
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                      >
                        Editar
                      </Button>
                    )}
                  </>
                )}
              </div>
              )}

              {canEdit && (
                <div className="flex gap-2 text-xs">
                  {!isEditing ? (
                    <Button onClick={handleStartEdit} disabled={processing} variant="outline" className="w-full" size="sm">
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSaveEdit} disabled={processing} className="flex-1" size="sm">
                        {processing ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        disabled={processing}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              )}


              {/* Payment Proof Display */}
              {paymentProofUrl && (
                <div className="p-2 rounded border border-green-200 bg-green-50 dark:bg-green-950 space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <p className="font-semibold text-green-900 dark:text-green-100">Comprobante</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(paymentProofUrl, '_blank')}
                    className="w-full"
                  >
                    Descargar
                  </Button>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-0.5 text-xs text-muted-foreground p-2 bg-muted rounded">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Creado: {formatDate(giro.createdAt)}</span>
                </div>
                {giro.updatedAt !== giro.createdAt && giro.status !== 'COMPLETADO' && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Actualizado: {formatDate(giro.updatedAt)}</span>
                  </div>
                )}
                {giro.completedAt && giro.status === 'COMPLETADO' && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Completado: {formatDate(giro.completedAt)}</span>
                  </div>
                )}
              </div>

              {/* Botón de impresión para giros completados (solo desktop) */}
              {giro.status === 'COMPLETADO' && isDesktop && (
                <Button
                  onClick={() => setShowPrintModal(true)}
                  disabled={processing}
                  variant="outline"
                  className="w-full gap-1 text-xs"
                  size="sm"
                >
                  <Printer className="h-3 w-3" />
                  Imprimir
                </Button>
              )}

              {/* Actions for Transferencista */}
              {isTransferencista && giro.status === 'ASIGNADO' && (
                <Button onClick={handleMarkAsProcessing} disabled={processing} className="w-full text-xs" size="sm">
                  {processing ? 'Procesando...' : 'Marcar Procesando'}
                </Button>
              )}

              {/* Execute/Return Form for Transferencista */}
              {isTransferencista && giro.status === 'PROCESANDO' && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Acciones de Procesamiento</h3>

                  {/* Botones para alternar entre Ejecutar y Devolver */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={!showReturnForm ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setShowReturnForm(false)}
                    >
                      Ejecutar
                    </Button>
                    <Button
                      type="button"
                      variant={showReturnForm ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setShowReturnForm(true)}
                    >
                      Devolver
                    </Button>
                  </div>

                  {/* Formulario de Ejecución */}
                  {!showReturnForm ? (
                    <div className="space-y-4">
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
                              {account.bank.name} - ...{account.accountNumber.slice(-4)} ({formatCurrency(account.balance, 'VES')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Ejecución</Label>
                        <div className="p-2 bg-muted rounded text-sm font-medium">
                          {giro.executionType ? giro.executionType.replace(/_/g, ' ') : 'No definido'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fee">Comisión</Label>
                        <Input
                          id="fee"
                          type="number"
                          value={fee}
                          onChange={(e) => setFee(Number(e.target.value))}
                          placeholder="Comisión"
                        />
                      </div>

                      <PaymentProofUpload
                        giroId={giro.id}
                        onProofUploaded={(url) => {
                          setProofUrl(url)
                          toast.success('Comprobante de pago actualizado')
                        }}
                        disabled={processing}
                      />

                      <Button
                        onClick={handleExecuteGiro}
                        disabled={processing || !selectedBankAccountId || !proofUrl}
                        className="w-full"
                        title={!proofUrl ? 'Debes cargar un comprobante de pago antes de ejecutar' : ''}
                      >
                        {processing ? 'Ejecutando...' : 'Ejecutar Giro'}
                      </Button>
                    </div>
                  ) : (
                    /* NUEVO Formulario de Devolución */
                    <div className="space-y-4 pt-2">
                      <h4 className="font-semibold text-red-600">Motivo de Devolución</h4>
                      <div className="space-y-2">
                        <Label htmlFor="returnReason">Motivo</Label>
                        {/* INICIO DE CAMBIO: SELECT EN LUGAR DE TEXTAREA */}
                        <select
                          id="returnReason"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          <option value="" disabled>
                            Selecciona un motivo
                          </option>
                          {RETURN_REASON_OPTIONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                        {/* FIN DE CAMBIO */}
                        <p className="text-xs text-muted-foreground text-red-600">
                          Al confirmar, el giro volverá a estado "Asignado" para el transferencista y "Devuelto" para el
                          minorista.
                        </p>
                      </div>

                      <Button
                        onClick={handleReturnGiro}
                        disabled={processing || !returnReason.trim()}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {processing ? 'Devolviendo...' : 'Confirmar Devolución'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Delete Button for Minorista - Only for PENDIENTE, ASIGNADO or DEVUELTO */}
              {isMinorista &&
                giro &&
                (giro.status === 'PENDIENTE' || giro.status === 'ASIGNADO' || giro.status === 'DEVUELTO') && (
                  <Button onClick={handleDeleteGiro} disabled={processing} variant="destructive" className="w-full text-xs" size="sm">
                    {processing ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                )}
            </div>
          ) : null}
        </SheetBody>
      </SheetContent>

      {/* Modal de impresión de tiquete */}
      {giro && (
        <PrintTicketModal
          giroId={giro.id}
          open={showPrintModal}
          onOpenChange={(open) => {
            setShowPrintModal(open)
            // Cerrar el sheet principal después de cerrar el modal de impresión
            if (!open) {
              onOpenChange(false)
            }
          }}
        />
      )}
    </Sheet>
  )
}
