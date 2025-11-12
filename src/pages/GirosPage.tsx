import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CreateGiroSheet } from '@/components/CreateGiroSheet'
import { GiroDetailSheet } from '@/components/GiroDetailSheet'
import type { Giro, GiroStatus, Currency } from '@/types/api'

export function GirosPage() {
  const { user } = useAuth()
  const [giros, setGiros] = useState<Giro[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<GiroStatus | 'ALL'>('ALL')
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedGiroId, setSelectedGiroId] = useState<string | null>(null)

  const canCreateGiro = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MINORISTA'

  useEffect(() => {
    fetchGiros()
  }, [filterStatus])

  const fetchGiros = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus)
      }

      const response = await api.get<{
        giros: Giro[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(`/api/giro/list?${params.toString()}`)

      setGiros(response.giros)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar giros')
      console.error(error)
    } finally {
      setLoading(false)
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

  const formatCurrency = (amount: number, currency: Currency) => {
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

  const handleGiroClick = (giroId: string) => {
    setSelectedGiroId(giroId)
    setDetailSheetOpen(true)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Giros</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Gestiona tus giros y transferencias</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filterStatus === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('ALL')}
        >
          Todos
        </Button>
        <Button
          variant={filterStatus === 'ASIGNADO' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('ASIGNADO')}
        >
          Asignados
        </Button>
        <Button
          variant={filterStatus === 'PROCESANDO' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('PROCESANDO')}
        >
          En Proceso
        </Button>
        <Button
          variant={filterStatus === 'COMPLETADO' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('COMPLETADO')}
        >
          Completados
        </Button>
      </div>

      {/* Giros List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando giros...</p>
        </div>
      ) : giros.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ArrowRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No hay giros registrados</p>
            {canCreateGiro && (
              <Button onClick={() => setCreateSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer giro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {giros.map((giro) => {
            const statusBadge = getStatusBadge(giro.status)
            const StatusIcon = statusBadge.icon

            return (
              <Card
                key={giro.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleGiroClick(giro.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{giro.beneficiaryName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">ID: {giro.beneficiaryId}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(giro.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className} flex items-center gap-1`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Amount */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Monto Enviado</p>
                      <p className="font-semibold">{formatCurrency(giro.amountInput, giro.currencyInput)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monto en Bs</p>
                      <p className="font-semibold">{formatCurrency(giro.amountBs, 'VES')}</p>
                    </div>
                  </div>

                  {/* Bank Info */}
                  <div className="text-sm">
                    <p className="text-muted-foreground">Banco Destino</p>
                    <p className="font-medium">{giro.bankName}</p>
                    <p className="text-xs text-muted-foreground">Cuenta: {giro.accountNumber}</p>
                  </div>

                  {/* Transferencista Info */}
                  {giro.transferencista && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Transferencista Asignado</p>
                      <p className="font-medium">{giro.transferencista.user.fullName}</p>
                    </div>
                  )}

                  {/* Profit for Admin/SuperAdmin */}
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Ganancia Sistema</p>
                          <p className="font-semibold text-green-600">{formatCurrency(giro.systemProfit, 'COP')}</p>
                        </div>
                        {giro.minoristaProfit > 0 && (
                          <div>
                            <p className="text-muted-foreground">Ganancia Minorista</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(giro.minoristaProfit, 'COP')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Minorista Profit */}
                  {user?.role === 'MINORISTA' && giro.minoristaProfit > 0 && (
                    <div className="pt-2 border-t text-sm">
                      <p className="text-muted-foreground">Tu Ganancia</p>
                      <p className="font-semibold text-green-600">{formatCurrency(giro.minoristaProfit, 'COP')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* FAB - Create Giro */}
      {canCreateGiro && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
          <button
            onClick={() => setCreateSheetOpen(true)}
            className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Create Giro Sheet */}
      <CreateGiroSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} onSuccess={fetchGiros} />

      {/* Giro Detail Sheet */}
      <GiroDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        giroId={selectedGiroId}
        onUpdate={fetchGiros}
      />
    </div>
  )
}
