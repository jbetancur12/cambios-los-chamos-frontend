import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useGiroWebSocket } from '@/hooks/useGiroWebSocket'
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
  CornerDownLeft, // Nuevo ícono para devolver
} from 'lucide-react'
import type { Giro, BankAccount, ExecutionType, GiroStatus, Bank } from '@/types/api'

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
  const [executionType, setExecutionType] = useState<ExecutionType>('TRANSFERENCIA')
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
      if (isTransferencista) {
        fetchBankAccounts()
      }
    }
  }, [open, giroId, isTransferencista])

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
      const response = await api.get<{ giro: Giro }>(`/api/giro/${giroId}`)
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

  const fetchBanks = async () => {
    try {
      const response = await api.get<{ banks: Bank[] }>('/api/bank/all')
      setBanks(response.banks)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar bancos')
    }
  }

  const handleMarkAsProcessing = async () => {
    if (!giro) return

    try {
      setProcessing(true)
      await api.post(`/api/giro/${giro.id}/mark-processing`)
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
      await api.patch(`/api/giro/${giro.id}`, {
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
    if (!giro || !selectedBankAccountId || !executionType) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setProcessing(true)
      await api.post(`/api/giro/${giro.id}/execute`, {
        bankAccountId: selectedBankAccountId,
        executionType,
        fee,
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

  // NUEVA FUNCIÓN PARA DEVOLVER EL GIRO
  const handleReturnGiro = async () => {
    if (!giro || !returnReason.trim()) {
      toast.error('Debes especificar un motivo para la devolución.')
      return
    }

    try {
      setProcessing(true)
      // Endpoint para la devolución del giro (el backend manejará el cambio de estado)
      await api.post(`/api/giro/${giro.id}/return`, {
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
      await api.delete(`/api/giro/${giro.id}`)

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
      await api.patch(`/api/giro/${giro.id}/rate`, {
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

              {giro.status === 'DEVUELTO' && giro.returnReason && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-300">
                  <p className="font-semibold text-orange-800 flex items-center gap-2 mb-1">
                    <CornerDownLeft className="h-4 w-4" />
                    Motivo de Devolución:
                  </p>
                  {/* Mostramos el motivo */}
                  <p className="mt-1 text-sm text-orange-900 font-medium">{giro.returnReason}</p>
                </div>
              )}

              {/* Beneficiary Info */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Beneficiario
                </h3>
                <div className="space-y-2 text-sm">
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
                    <div className="space-y-2">
                      <div>
                        <p className="text-muted-foreground">Nombre</p>
                        <p className="font-medium">{giro.beneficiaryName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cédula</p>
                        <p className="font-medium">{giro.beneficiaryId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="font-medium">{giro.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Info */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Banco Destino
                </h3>
                <div className="space-y-2 text-sm">
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
                    <div className="space-y-2">
                      <div>
                        <p className="text-muted-foreground">Banco</p>
                        <p className="font-medium">{giro.bankName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <p className="font-medium">{giro.accountNumber}</p>
                      </div>
                    </div>
                  )}
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
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tasa Aplicada
                </h3>

                {!isAdmin ? (
                  // Solo tasa de venta para transferencista y minorista
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Venta</p>
                      <p className="font-medium text-lg">{giro.rateApplied?.sellRate?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ) : isEditingRate ? (
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Compra</p>
                        <p className="font-medium">{giro.rateApplied?.buyRate?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Venta</p>
                        <p className="font-medium">{giro.rateApplied?.sellRate?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">USD</p>
                        <p className="font-medium">{giro.rateApplied?.usd?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">BCV</p>
                        <p className="font-medium">{giro.rateApplied?.bcv?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    {!isNotEditableStatus && (
                      <Button
                        onClick={() => setIsEditingRate(true)}
                        disabled={processing}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                      >
                        Editar Tasa
                      </Button>
                    )}
                  </>
                )}
              </div>

              {canEdit && (
                <div className="pt-2 flex gap-3">
                  {!isEditing ? (
                    <Button onClick={handleStartEdit} disabled={processing} variant="outline" className="w-full">
                      Editar Giro
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSaveEdit} disabled={processing} className="flex-1">
                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        disabled={processing}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar Edición
                      </Button>
                    </>
                  )}
                </div>
              )}

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
                {giro.completedAt && giro.status === 'COMPLETADO' && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Completado: {formatDate(giro.completedAt)}</span>
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
                              {account.bank.name} - {account.accountNumber} ({formatCurrency(account.balance, 'VES')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="executionType">Tipo de Ejecución</Label>
                        <select
                          id="executionType"
                          value={executionType}
                          onChange={(e) => setExecutionType(e.target.value as ExecutionType)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="PAGO_MOVIL">Pago Móvil</option>
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="ZELLE">Zelle</option>
                          <option value="OTROS">Otros</option>
                        </select>
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
              {isMinorista && giro && (giro.status === 'PENDIENTE' || giro.status === 'ASIGNADO' || giro.status === 'DEVUELTO') && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleDeleteGiro}
                    disabled={processing}
                    variant="destructive"
                    className="w-full"
                  >
                    {processing ? 'Eliminando...' : 'Eliminar Giro'}
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
