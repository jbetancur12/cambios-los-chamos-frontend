import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Wallet, Users, AlertTriangle, PiggyBank } from 'lucide-react'
import { getCobranzasStats, getRecentActivity, getFinancialSummary } from '@/services/cobranzasApi'
import { formatMoney, formatDateTime, CREDIT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/cobranzasUtils'

export function CobranzasDashboardPage() {
  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['cobranzas-stats'],
    queryFn: getCobranzasStats,
  })

  const { data: activity } = useQuery({
    queryKey: ['cobranzas-activity'],
    queryFn: getRecentActivity,
  })

  const { data: financial } = useQuery({
    queryKey: ['cobranzas-financial'],
    queryFn: getFinancialSummary,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel Cobranzas</h1>
          <p className="text-sm text-muted-foreground">Módulo exclusivo de Super Admin</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Recaudado hoy"
          value={formatMoney(stats?.totalCollectedToday)}
          sub={`${stats?.paymentsToday ?? 0} pagos`}
        />
        <StatCard
          icon={<PiggyBank className="h-5 w-5" />}
          label="Cartera activa"
          value={formatMoney(stats?.totalPortfolio)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes"
          value={`${stats?.totalClients ?? 0}`}
          sub={`${stats?.activeClients ?? 0} activos`}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Requieren atención"
          value={`${stats?.requiringAttention ?? 0}`}
          sub={`Morosidad: ${formatMoney(stats?.overdueAmount)}`}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Cajas"
          value={`${stats?.openCashBalance ?? 0} abiertas`}
          sub={`${stats?.pendingClosures ?? 0} por cerrar`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Créditos por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats?.credits ?? {}).map(([status, count]) => (
                <Badge key={status} variant="outline" className="px-3 py-1.5 text-sm">
                  {CREDIT_STATUS_LABELS[status as keyof typeof CREDIT_STATUS_LABELS] ?? status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen financiero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total financiado" value={formatMoney(financial?.totalFinanced)} />
            <Row label="Total recaudado" value={formatMoney(financial?.totalCollected)} />
            <Row label="Por cobrar" value={formatMoney(financial?.outstanding)} />
            <Row label="En mora" value={formatMoney(financial?.defaultedAmount)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.payments.length === 0 && <p className="text-sm text-muted-foreground">Sin pagos recientes</p>}
            {activity?.payments.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                <div>
                  <p className="font-medium">{p.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? p.paymentMethod} ·{' '}
                    {formatDateTime(p.paymentDate)}
                  </p>
                </div>
                <span className="font-semibold text-green-600">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevos créditos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.newCredits.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin créditos recientes</p>
            )}
            {activity?.newCredits.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                <div>
                  <p className="font-medium">{c.clientName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(c.amount)}</p>
                  <Badge variant="outline" className="text-xs">
                    {CREDIT_STATUS_LABELS[c.status as keyof typeof CREDIT_STATUS_LABELS] ?? c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-xl font-bold mt-2">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
