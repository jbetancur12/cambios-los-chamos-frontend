import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Loader2, Lock, LockOpen, Eye, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { CurrencyInput } from '@/components/CurrencyInput'
import { PromptDialog } from '@/components/ui/PromptDialog'
import {
  getCurrentCashBalance,
  listCashBalances,
  openCashBalance,
  closeCashBalance,
  autoCalculateCashBalance,
  getCashBalanceDetail,
  getPendingClosures,
} from '@/services/cobranzasApi'
import { formatMoney, formatDate, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/cobranzasUtils'

export function CobranzasCajaPage() {
  const queryClient = useQueryClient()
  const [openForm, setOpenForm] = useState(false)
  const [initialAmount, setInitialAmount] = useState<number | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)

  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ['cobranza-current-balance'],
    queryFn: getCurrentCashBalance,
  })

  const { data: balances, isLoading } = useQuery({
    queryKey: ['cobranza-cash-balances'],
    queryFn: () => listCashBalances({ limit: 100 }),
  })

  const { data: pendingClosures } = useQuery({
    queryKey: ['cobranza-pending-closures'],
    queryFn: getPendingClosures,
  })

  const { data: detail } = useQuery({
    queryKey: ['cobranza-balance', detailId],
    queryFn: () => (detailId ? getCashBalanceDetail(detailId) : null),
    enabled: !!detailId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cobranza-current-balance'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-cash-balances'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-pending-closures'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-balance'] })
    queryClient.invalidateQueries({ queryKey: ['cobranza-stats'] })
  }

  const openMutation = useMutation({
    mutationFn: openCashBalance,
    onSuccess: () => {
      toast.success('Caja abierta')
      setOpenForm(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const closeMutation = useMutation({
    mutationFn: ({ id, lentAmount }: { id: string; lentAmount?: number }) => closeCashBalance(id, { lentAmount }),
    onSuccess: () => {
      toast.success('Caja cerrada')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const autoCalcMutation = useMutation({
    mutationFn: autoCalculateCashBalance,
    onSuccess: () => {
      toast.success('Recaudo actualizado')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caja / Arqueo</h1>
          <p className="text-sm text-muted-foreground">Balances de efectivo del cobrador</p>
        </div>
        {!current && (
          <Button onClick={() => setOpenForm(true)}>
            <LockOpen className="h-4 w-4 mr-1" /> Abrir caja
          </Button>
        )}
      </div>

      {(pendingClosures?.length ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-red-800">Tienes {pendingClosures?.length} caja(s) de días anteriores sin cerrar.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Estado</p>
            {loadingCurrent ? (
              <Loader2 className="h-4 w-4 animate-spin mt-1" />
            ) : current ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 mt-1">
                <LockOpen className="h-3 w-3 mr-1" /> Abierta
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 mt-1">
                <Lock className="h-3 w-3 mr-1" /> Cerrada
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Fondo inicial</p>
            <p className="text-xl font-bold">{formatMoney(current?.initialAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Recaudo</p>
            <p className="text-xl font-bold text-green-600">{formatMoney(current?.collectedAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total caja</p>
            <p className="text-xl font-bold">{formatMoney(current?.finalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {current && current.status === 'open' && (
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => autoCalcMutation.mutate(current.id)}
              disabled={autoCalcMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Recalcular recaudo
            </Button>
            <Button onClick={() => setCloseOpen(true)} disabled={closeMutation.isPending}>
              <Lock className="h-4 w-4 mr-1" /> Cerrar caja
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de cajas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Inicial</th>
                    <th className="py-2 pr-3">Recaudo</th>
                    <th className="py-2 pr-3">Prestado</th>
                    <th className="py-2 pr-3">Final</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {balances?.items.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{formatDate(b.date)}</td>
                      <td className="py-2 pr-3">{formatMoney(b.initialAmount)}</td>
                      <td className="py-2 pr-3">{formatMoney(b.collectedAmount)}</td>
                      <td className="py-2 pr-3">{formatMoney(b.lentAmount)}</td>
                      <td className="py-2 pr-3 font-semibold">{formatMoney(b.finalAmount)}</td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant="outline"
                          className={b.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                        >
                          {b.status === 'open' ? 'Abierta' : 'Cerrada'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <Button variant="ghost" size="icon" onClick={() => setDetailId(b.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {balances?.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        Sin cajas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={openForm} onOpenChange={setOpenForm}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Abrir caja</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                openMutation.mutate({ initialAmount: initialAmount ?? 0 })
              }}
              id="open-form"
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Fondo inicial</Label>
                <CurrencyInput value={initialAmount} onValueChange={setInitialAmount} autoFocus />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="open-form" disabled={openMutation.isPending}>
              {openMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abrir'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Caja del {formatDate(detail?.balance.date)}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Inicial" value={formatMoney(detail?.balance.initialAmount)} />
              <InfoRow label="Recaudo" value={formatMoney(detail?.balance.collectedAmount)} />
              <InfoRow label="Prestado" value={formatMoney(detail?.balance.lentAmount)} />
              <InfoRow label="Final" value={formatMoney(detail?.balance.finalAmount)} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Pagos del día ({detail?.payments.length ?? 0})</h3>
              <div className="space-y-2">
                {detail?.payments.map((p) => (
                  <div key={p.id} className="border rounded-md p-3 text-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium">{p.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ??
                          p.paymentMethod}{' '}
                        · {formatDateTime(p.paymentDate)}
                      </p>
                    </div>
                    <span className="font-semibold text-green-600">{formatMoney(p.amount)}</span>
                  </div>
                ))}
                {detail?.payments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin pagos asociados a esta caja</p>
                )}
              </div>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <PromptDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Cerrar caja"
        description="Monto prestado o retirado de la caja"
        placeholder="0"
        defaultValue="0"
        confirmText="Cerrar caja"
        onConfirm={(value) => {
          if (current) closeMutation.mutate({ id: current.id, lentAmount: Number(value) || 0 })
          setCloseOpen(false)
        }}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
