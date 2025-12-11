import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { API_BASE_URL, api } from '@/lib/api'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useGiroDetail } from '@/hooks/queries/useGiroQueries'
import { useBankAccountsList, useBanksList } from '@/hooks/queries/useBankQueries'
import {
  useExecuteGiro,
  useMarkGiroAsProcessing,
  useReturnGiro,
  useDeleteGiro,
  useUpdateGiro,
  useUpdateGiroRate,
} from '@/hooks/mutations/useGiroMutations'
import { useQueryClient } from '@tanstack/react-query'
import { PaymentProofUpload } from './PaymentProofUpload'
import { PrintTicketModal } from './PrintTicketModal'
import { XCircle, Copy, Share2, CreditCard, Download } from 'lucide-react'
import { GiroDetailSkeleton } from './skeletons/GiroDetailSkeleton'
import type { GiroStatus } from '@/types/api'

interface GiroDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  giroId: string | null
  initialStatus?: GiroStatus
  onUpdate: () => void
}

const RETURN_REASON_OPTIONS = [
  'Número de cuenta incorrecto',
  'Número de teléfono incorrecto',
  'Banco incorrecto',
  'Otro motivo',
]

export function GiroDetailSheet({ open, onOpenChange, giroId, initialStatus, onUpdate }: GiroDetailSheetProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const isTransferencista = user?.role === 'TRANSFERENCISTA'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Invalidate cache when giroId changes to force a fresh fetch
  useEffect(() => {
    if (giroId) {
      queryClient.invalidateQueries({ queryKey: ['giro', giroId] })
    }
  }, [giroId, queryClient])

  // React Query hooks
  const { data: giro, isLoading } = useGiroDetail(open ? giroId : null)
  const { data: bankAccounts = [] } = useBankAccountsList(user?.role, true)
  const { data: banks = [] } = useBanksList()

  console.log(giro)

  const isOwner = giro?.createdBy?.id === user?.id

  // Mutations
  const executeGiroMutation = useExecuteGiro()
  const markProcessingMutation = useMarkGiroAsProcessing()
  const returnGiroMutation = useReturnGiro()
  const deleteGiroMutation = useDeleteGiro()
  const updateGiroMutation = useUpdateGiro()
  const updateGiroRateMutation = useUpdateGiroRate()

  // Local state for UI
  const [isEditing, setIsEditing] = useState(false)
  const [editableBeneficiaryName, setEditableBeneficiaryName] = useState('')
  const [editableBeneficiaryId, setEditableBeneficiaryId] = useState('')
  const [editablePhone, setEditablePhone] = useState('')
  const [editableBankId, setEditableBankId] = useState('')
  const [editableAccountNumber, setEditableAccountNumber] = useState('')
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [fee, setFee] = useState(0)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [isEditingRate, setIsEditingRate] = useState(false)
  const [editableRate, setEditableRate] = useState({
    buyRate: 0,
    sellRate: 0,
    usd: 0,
    bcv: 0,
  })
  const [showProofPreview, setShowProofPreview] = useState(false)

  const [isEditingCompletedProof, setIsEditingCompletedProof] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [proofBlobUrl, setProofBlobUrl] = useState<string | null>(null)

  const remoteProofUrl = giro?.proofUrl || (giro?.paymentProofKey ? `/giro/${giro.id}/payment-proof/download` : '')

  const fullProofUrl = remoteProofUrl
    ? remoteProofUrl.startsWith('http')
      ? remoteProofUrl
      : `${API_BASE_URL.replace(/\/api\/?$/, '')}${remoteProofUrl}`
    : ''

  // Initialize editable fields when giro data loads
  useEffect(() => {
    if (giro) {
      setEditableBeneficiaryName(giro.beneficiaryName)
      setEditableBeneficiaryId(giro.beneficiaryId)
      setEditablePhone(giro.phone)
      setEditableAccountNumber(giro.accountNumber)
      if (giro.bankCode) {
        // Optionally try to find the bank by code, but we don't have the list here conveniently mapped.
        // We'll skip auto-setting bank ID for now unless we do a lookup.
        // Leaving it empty enforces user to select if they want to edit.
      }
      setEditableRate({
        buyRate: giro.rateApplied?.buyRate || 0,
        sellRate: giro.rateApplied?.sellRate || 0,
        usd: giro.rateApplied?.usd || 0,
        bcv: giro.rateApplied?.bcv || 0,
      })
    }
  }, [giro?.id])

  // Fetch proof image securely (with auth headers)
  useEffect(() => {
    let active = true
    const fetchProof = async () => {
      // Fetch only if we have a valid URL and no blob yet
      if (remoteProofUrl && giro?.status === 'COMPLETADO') {
        try {
          // Use api.downloadFile to get blob with auth headers
          const { blob } = await api.downloadFile(remoteProofUrl)
          const url = URL.createObjectURL(blob)
          if (active) setProofBlobUrl(url)
        } catch (error) {
          console.error('Error fetching proof image:', error)
        }
      }
    }

    // Only fetch if we don't have a blob URL yet
    if (remoteProofUrl && !proofBlobUrl) {
      fetchProof()
    }

    return () => {
      active = false
    }
  }, [remoteProofUrl, giro?.status, proofBlobUrl])

  // Cleanup blob url
  useEffect(() => {
    return () => {
      if (proofBlobUrl) URL.revokeObjectURL(proofBlobUrl)
    }
  }, [proofBlobUrl])

  // Reset form when opening
  useEffect(() => {
    if (open && !giro) {
      setShowReturnForm(false)
      setReturnReason('')
      setFee(0)
      setProofUrl('')
    }
  }, [open, giro])

  // Invalidate bank accounts when opening a processing giro to ensure fresh data
  useEffect(() => {
    if (giro?.status === 'PROCESANDO' && open) {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false, refetchType: 'active' })
    }
  }, [giro?.status, open, queryClient])

  const handleMarkAsProcessing = () => {
    if (!giro) return
    markProcessingMutation.mutate(giro.id, {
      onSuccess: () => {
        toast.success('Giro marcado como procesando')
        onUpdate()
      },
      onError: (error: any) => {
        toast.error(error.message || 'Error al marcar giro como procesando')
      },
    })
  }

  const handleSaveEdit = () => {
    if (!giro) return

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

    updateGiroMutation.mutate(
      {
        giroId: giro.id,
        data: {
          beneficiaryName: editableBeneficiaryName,
          beneficiaryId: editableBeneficiaryId,
          phone: editablePhone,
          bankId: editableBankId,
          accountNumber: editableAccountNumber,
        },
      },
      {
        onSuccess: () => {
          toast.success('Giro actualizado exitosamente.')
          setIsEditing(false)
          onUpdate()
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error al actualizar el giro.')
        },
      }
    )
  }

  const handleExecuteGiro = () => {
    if (!giro || !selectedBankAccountId || !giro.executionType) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    executeGiroMutation.mutate(
      {
        giroId: giro.id,
        data: {
          bankAccountId: selectedBankAccountId,
          executionType: giro.executionType,
          fee,
          proofUrl: proofUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Giro ejecutado exitosamente')
          onUpdate()
          // Abrir modal de impresión para transferencistas y admins (solo en desktop)
          if ((isTransferencista || isAdmin) && window.innerWidth >= 1024) {
            setShowPrintModal(true)
          }
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error al ejecutar giro')
        },
      }
    )
  }

  const handleReturnGiro = () => {
    if (!giro || !returnReason.trim()) {
      toast.error('Debes especificar un motivo para la devolución.')
      return
    }

    returnGiroMutation.mutate(
      { giroId: giro.id, reason: returnReason },
      {
        onSuccess: () => {
          toast.success('Giro devuelto exitosamente.')
          setReturnReason('')
          setShowReturnForm(false)
          onUpdate()
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error al devolver el giro')
        },
      }
    )
  }

  const handleResendGiro = () => {
    if (!giro) return
    if (!confirm('¿Estás seguro de que deseas reenviar este giro?')) {
      return
    }
    // Update status to ASIGNADO (or PENDIENTE if we want to release it, but ASIGNADO keeps it)
    // Assuming updateGiro accepts status override or we use a separate mutation?
    // Using updateGiro with partial data.
    updateGiroMutation.mutate(
      {
        giroId: giro.id,
        data: { status: 'ASIGNADO' } as any,
      },
      {
        onSuccess: () => {
          toast.success('Giro reenviado exitosamente.')
          onUpdate()
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error al reenviar el giro')
        },
      }
    )
  }

  const handleDeleteGiro = () => {
    if (!giro) return
    if (!confirm('¿Estás seguro de que deseas eliminar este giro? Esta acción no se puede deshacer.')) {
      return
    }
    deleteGiroMutation.mutate(giro.id, {
      onSuccess: () => {
        toast.success('Giro eliminado exitosamente.')
        onUpdate()
        onOpenChange(false)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Error al eliminar el giro')
      },
    })
  }

  const handleSaveRateEdit = () => {
    if (!giro) return
    if (!editableRate.buyRate || !editableRate.sellRate || !editableRate.usd || !editableRate.bcv) {
      toast.error('Todos los campos de la tasa son obligatorios.')
      return
    }
    updateGiroRateMutation.mutate(
      {
        giroId: giro.id,
        data: {
          buyRate: editableRate.buyRate,
          sellRate: editableRate.sellRate,
          usd: editableRate.usd,
          bcv: editableRate.bcv,
        },
      },
      {
        onSuccess: () => {
          toast.success('Tasa del giro actualizada exitosamente.')
          setIsEditingRate(false)
          onUpdate()
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error al actualizar la tasa del giro.')
        },
      }
    )
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '—'
      return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date)
    } catch {
      return '—'
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  }

  const getProofBlob = async () => {
    if (!remoteProofUrl) return null

    try {
      let blob: Blob
      let filename = `comprobante-${giro?.id || 'doc'}.jpg`

      if (proofBlobUrl) {
        const response = await fetch(proofBlobUrl)
        blob = await response.blob()
      } else {
        const result = await api.downloadFile(remoteProofUrl)
        blob = result.blob
        if (result.filename) filename = result.filename
      }
      return { blob, filename }
    } catch (error: any) {
      console.error('Error fetching proof:', error)
      toast.error(`Error al obtener comprobante: ${error.message}`)
      return null
    }
  }

  const handleShareProof = async () => {
    const result = await getProofBlob()
    if (!result) return

    const { blob, filename } = result

    // Check if sharing is supported
    if (!navigator.canShare || !navigator.share) {
      toast.error('Tu dispositivo no soporta la función de compartir nativa.')
      return
    }

    try {
      // Detectar tipo MIME
      let mimeType = 'image/jpeg'
      const lowerFilename = filename.toLowerCase()
      if (lowerFilename.endsWith('.png')) mimeType = 'image/png'
      else if (lowerFilename.endsWith('.pdf')) mimeType = 'application/pdf'
      else if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) mimeType = 'image/jpeg'

      const file = new File([blob], filename, { type: mimeType })

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Comprobante de Pago',
          text: 'Compartir comprobante de pago',
        })
        toast.success('Compartido exitosamente')
      } else {
        toast.error('Tu dispositivo no permite compartir este tipo de archivo.')
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error)
        toast.error(`Error al compartir: ${error.message}`)
      }
    }
  }

  const handleDownloadProof = async () => {
    const result = await getProofBlob()
    if (!result) return

    const { blob, filename } = result

    try {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Descarga iniciada')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(`Error al descargar: ${error.message}`)
    }
  }

  const isProcessing =
    executeGiroMutation.isPending ||
    markProcessingMutation.isPending ||
    returnGiroMutation.isPending ||
    deleteGiroMutation.isPending ||
    updateGiroMutation.isPending ||
    updateGiroRateMutation.isPending

  if (!giro && !isLoading) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 gap-0 border-l overflow-hidden flex flex-col h-full bg-white dark:bg-slate-950">
        <SheetHeader
          className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0"
          onClose={() => onOpenChange(false)}
        >
          <SheetTitle className="text-lg font-bold">
            {giro?.executionType === 'TRANSFERENCIA' && 'Giro a banco'}
            {giro?.executionType === 'PAGO_MOVIL' && 'Pago móvil'}
            {giro?.executionType === 'EFECTIVO' && 'Pago en efectivo'}
            {giro?.executionType === 'ZELLE' && 'Pago por Zelle'}
            {giro?.executionType === 'RECARGA' && 'Recarga'}
            {giro?.executionType === 'OTROS' && 'Otro tipo de pago'}
            {!giro?.executionType && 'Detalle del giro'}
          </SheetTitle>
        </SheetHeader>

        {/* Status Alarm Banner */}
        {giro?.status === 'DEVUELTO' && (
          <div className="bg-red-700 text-white text-sm font-semibold py-2 px-6 text-center">
            {giro.returnReason || 'Giro devuelto'}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isLoading ? (
            <GiroDetailSkeleton status={initialStatus} />
          ) : giro ? (
            <>
              {/* Minimalist Key-Value Pairs */}
              <div className="space-y-4 text-sm">
                {/* Cliente / Beneficiario Name */}
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium text-right">{giro.beneficiaryName}</span>
                </div>

                {/* Cédula */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cédula:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{giro.beneficiaryId}</span>
                    <button
                      onClick={() => copyToClipboard(giro.beneficiaryId, 'Cédula')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Cuenta */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cuenta:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono text-xs md:text-sm">{giro.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(giro.accountNumber, 'Cuenta')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Banco */}
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Banco:</span>
                  <span className="font-medium text-right uppercase">{`0${giro.bankCode} - ${giro.bankName}`}</span>
                </div>

                {/* CELULAR - SOLO PAGO MOVIL */}
                {giro.executionType === 'PAGO_MOVIL' && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Celular:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{giro.phone}</span>
                      <button
                        onClick={() => copyToClipboard(giro.phone, 'Celular')}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Monto USD/COP */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Monto {giro.currencyInput}:</span>
                  <span className="font-medium">{formatCurrency(giro.amountInput, giro.currencyInput)}</span>
                </div>

                {/* Bolívares */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bolívares:</span>
                  <span className="font-medium text-lg">
                    {giro.amountBs.toLocaleString('es-VE', {
                      style: 'currency',
                      currency: 'VES',
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-4" />

              {/* Editing Form */}
              {isEditing && (
                <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                  <h3 className="font-semibold text-sm">Editar Datos</h3>
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="editName" className="text-xs">
                        Nombre
                      </Label>
                      <Input
                        id="editName"
                        value={editableBeneficiaryName}
                        onChange={(e) => setEditableBeneficiaryName(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="editId" className="text-xs">
                        Cédula
                      </Label>
                      <Input
                        id="editId"
                        value={editableBeneficiaryId}
                        onChange={(e) => setEditableBeneficiaryId(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="editPhone" className="text-xs">
                        Teléfono
                      </Label>
                      <Input
                        id="editPhone"
                        value={editablePhone}
                        onChange={(e) => setEditablePhone(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="editBankId" className="text-xs">
                        Banco
                      </Label>
                      <select
                        id="editBankId"
                        value={editableBankId}
                        onChange={(e) => setEditableBankId(e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
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
                    <div className="grid gap-1">
                      <Label htmlFor="editAccountNumber" className="text-xs">
                        Cuenta
                      </Label>
                      <Input
                        id="editAccountNumber"
                        value={editableAccountNumber}
                        onChange={(e) => setEditableAccountNumber(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={isProcessing}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Admin Exchange Rate Section - Minimalist */}
              {isAdmin && (
                <div className="py-2 border-t border-b border-dashed my-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Tasa Aplicada:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{giro.rateApplied?.sellRate?.toFixed(2)}</span>
                      {!isEditingRate && giro.status === 'ASIGNADO' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingRate(true)}>
                          <CreditCard className="h-3 w-3" /> {/* Using CreditCard as generic edit icon or just text */}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditingRate && (
                    <div className="mt-2 space-y-2 bg-muted/30 p-2 rounded">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <Label className="text-[10px]">Compra</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7"
                            value={editableRate.buyRate}
                            onChange={(e) =>
                              setEditableRate({ ...editableRate, buyRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Venta</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7"
                            value={editableRate.sellRate}
                            onChange={(e) =>
                              setEditableRate({ ...editableRate, sellRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveRateEdit}
                          disabled={isProcessing}
                          className="h-7 text-xs w-full"
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingRate(false)}
                          className="h-7 text-xs w-full"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIONS SECTION (Transferencista/Admin Processing) */}
              {(isTransferencista || isAdmin) && giro.status === 'PROCESANDO' && (
                <div className="space-y-6 pt-2">
                  {/* "De que cuenta sale el dinero?" */}
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount" className="text-sm font-normal text-muted-foreground">
                      De que cuenta sale el dinero?
                    </Label>
                    <select
                      id="bankAccount"
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Seleccionar cuenta:</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bank.name} - {account.accountHolder}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fee" className="text-sm font-normal text-muted-foreground">
                      Comisión pago movil
                    </Label>
                    <Input
                      id="fee"
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value))}
                      placeholder="0,00"
                      className="text-right"
                    />
                  </div>

                  {/* Upload Capture Box - Minimalist */}
                  <div className="flex justify-end">
                    <PaymentProofUpload
                      giroId={giro.id}
                      onProofUploaded={(url) => setProofUrl(url)}
                      minimalist={true}
                    />
                  </div>

                  {/* Action Buttons Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowReturnForm(true)}
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Devolver
                    </Button>
                    <Button
                      onClick={handleExecuteGiro}
                      disabled={!selectedBankAccountId || !proofUrl || isProcessing}
                      className="w-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 font-bold"
                    >
                      Enviar
                    </Button>
                  </div>

                  {/* Secondary Actions Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={handleDeleteGiro}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Corregir
                    </Button>
                  </div>
                </div>
              )}

              {/* Asignado state: Start Processing */}
              {(isTransferencista || isAdmin) && giro.status === 'ASIGNADO' && (
                <div className="pt-4">
                  <Button onClick={handleMarkAsProcessing} disabled={isProcessing} className="w-full">
                    Marcar como Procesando
                  </Button>
                </div>
              )}

              {/* Owner Actions for ASIGNADO (Delete) */}
              {giro.status === 'ASIGNADO' && isOwner && (
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    El giro está asignado y en espera de ser procesado.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleDeleteGiro}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    disabled={isProcessing}
                  >
                    Eliminar Giro
                  </Button>
                </div>
              )}

              {/* Actions for DEVUELTO (Delete, Edit, Resend) */}
              {giro.status === 'DEVUELTO' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Delete: Owner or Admin */}
                    {(isOwner || isAdmin) && (
                      <Button
                        variant="outline"
                        onClick={handleDeleteGiro}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        disabled={isProcessing}
                      >
                        Eliminar
                      </Button>
                    )}

                    {/* Owner specific: Edit/Resend */}
                    {isOwner && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                          disabled={isProcessing}
                        >
                          Corregir
                        </Button>
                        <Button
                          onClick={handleResendGiro}
                          className="w-full col-span-2 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold"
                          disabled={isProcessing}
                        >
                          Reenviar Giro
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Show Return Form Overlay or Inline if clicked "Devolver" */}
              {showReturnForm && (
                <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl max-w-sm w-full space-y-4">
                    <h3 className="font-bold text-lg">Devolver Giro</h3>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full h-10 px-3 py-2 border rounded-md"
                    >
                      <option value="" disabled>
                        Motivo
                      </option>
                      {RETURN_REASON_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowReturnForm(false)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleReturnGiro}
                        disabled={!returnReason}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Proof for Completed */}
              {giro.status === 'COMPLETADO' && (
                <div className="flex flex-col items-center justify-center pt-8 pb-4">
                  {/* Thumbnail of proof */}
                  <div className="relative group cursor-pointer" onClick={() => setShowProofPreview(true)}>
                    <img
                      src={proofBlobUrl || fullProofUrl || '/OIP.webp'}
                      alt="Comprobante"
                      className="h-32 w-auto object-contain border rounded shadow-sm hover:opacity-90 transition-opacity bg-gray-50 dark:bg-gray-800"
                    />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 p-2 rounded-full text-white">
                        <Share2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  {((isTransferencista && giro.transferencista?.user?.id === user?.id) || isAdmin) && (
                    <Button
                      variant="link"
                      className="text-xs h-6 p-0 mt-2 text-muted-foreground"
                      onClick={() => setIsEditingCompletedProof(true)}
                    >
                      Cambiar captura
                    </Button>
                  )}

                  {/* Edit Proof Form (Minimalist Overlay) */}
                  {isEditingCompletedProof && (
                    <div className="mt-2 w-full max-w-xs">
                      <PaymentProofUpload
                        giroId={giro.id}
                        onProofUploaded={() => {
                          setIsEditingCompletedProof(false)
                          setProofBlobUrl(null) // Force refresh of the proof image
                          onUpdate()
                          toast.success('Comprobante actualizado exitosamente')
                        }}
                        minimalist={true}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-1 h-6 text-xs"
                        onClick={() => setIsEditingCompletedProof(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Text */}
        {giro && (
          <div className="px-6 py-4 text-right text-xs text-muted-foreground italic bg-slate-50 dark:bg-slate-900 border-t">
            <p>Enviado: {formatDate(giro.createdAt)}</p>
            {giro.completedAt && <p>Transferencia: {formatDate(giro.completedAt)}</p>}
          </div>
        )}
      </SheetContent>

      {/* Modal de preview del comprobante */}
      {showProofPreview && giro?.paymentProofKey && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-transparent max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="relative w-full text-center">
              <img
                src={proofBlobUrl || fullProofUrl}
                alt="Comprobante de pago"
                className="max-w-full max-h-[80vh] w-auto h-auto rounded shadow-2xl mx-auto"
              />
              <button
                onClick={() => setShowProofPreview(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <XCircle className="h-8 w-8" />
              </button>
            </div>
            <div className="mt-4 flex gap-4">
              {/* Force download button - visible on all devices */}
              <Button className="bg-white text-black hover:bg-gray-100" onClick={handleDownloadProof}>
                <Download className="mr-2 h-4 w-4" /> Bajar
              </Button>

              {/* Share button - visible if sharing is supported (mostly mobile) */}
              {!!navigator.share && (
                <Button className="bg-white text-black hover:bg-gray-100" onClick={handleShareProof}>
                  <Share2 className="mr-2 h-4 w-4" /> Compartir
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keep PrintTicketModal */}
      {giro && <PrintTicketModal giroId={giro.id} open={showPrintModal} onOpenChange={setShowPrintModal} />}
    </Sheet>
  )
}
