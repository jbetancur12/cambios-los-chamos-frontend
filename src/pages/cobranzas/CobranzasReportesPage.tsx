import { useModuleQuery } from '@/hooks/useModuleQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, PiggyBank, Banknote, TrendingDown } from 'lucide-react'
import { getPortfolioReport } from '@/services/cobranzasApi'
import { formatMoney, CREDIT_STATUS_LABELS, FREQUENCY_LABELS, SEVERITY_LABELS } from '@/lib/cobranzasUtils'

export function CobranzasReportesPage() {
  const { data: report, isLoading } = useModuleQuery({
    queryKey: ['cobranzas-portfolio-report'],
    queryFn: getPortfolioReport,
  })

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const morososCount = report.morosos.length

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cartera y Morosidad</h1>
        <p className="text-sm text-muted-foreground">Estado de la cartera de créditos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<PiggyBank className="h-5 w-5" />}
          label="Total financiado"
          value={formatMoney(report.totalFinanced)}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5" />}
          label="Cartera pendiente"
          value={formatMoney(report.outstanding)}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="En mora"
          value={formatMoney(report.overdueAmount)}
          sub={`${morososCount} crédito(s)`}
        />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Créditos morosos" value={`${morososCount}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Créditos por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.counts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="px-3 py-1.5 text-sm">
                {CREDIT_STATUS_LABELS[status as keyof typeof CREDIT_STATUS_LABELS] ?? status}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cartera por frecuencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.byFrequency.map((f) => (
                <div
                  key={f.frequency}
                  className="flex items-center justify-between text-sm border-b last:border-0 pb-2"
                >
                  <span className="font-medium">{FREQUENCY_LABELS[f.frequency] ?? f.frequency}</span>
                  <span className="text-muted-foreground">
                    {f.count} crédito(s) · {formatMoney(f.outstanding)}
                  </span>
                </div>
              ))}
              {report.byFrequency.length === 0 && <p className="text-sm text-muted-foreground">Sin créditos</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Morosidad por severidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(['light', 'moderate', 'critical'] as const).map((sev) => {
                const list = report.morosos.filter((m) => m.severity === sev)
                if (list.length === 0) return null
                return (
                  <div key={sev} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                    <Badge
                      variant="outline"
                      className={
                        sev === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : sev === 'moderate'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {sev === 'light'
                        ? 'Leve (≤3 días)'
                        : sev === 'moderate'
                          ? 'Moderada (≤7 días)'
                          : 'Crítica (>7 días)'}
                    </Badge>
                    <span className="text-muted-foreground">
                      {list.length} · {formatMoney(list.reduce((s, m) => s + m.overdueAmount, 0))}
                    </span>
                  </div>
                )
              })}
              {morososCount === 0 && <p className="text-sm text-muted-foreground">Sin créditos en mora 🎉</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Créditos en mora ({morososCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Cédula</th>
                  <th className="py-2 pr-3">Frecuencia</th>
                  <th className="py-2 pr-3">Monto</th>
                  <th className="py-2 pr-3">Saldo</th>
                  <th className="py-2 pr-3">Días atraso</th>
                  <th className="py-2 pr-3">Severidad</th>
                  <th className="py-2 pr-3">En mora</th>
                </tr>
              </thead>
              <tbody>
                {report.morosos.map((m) => (
                  <tr key={m.creditId} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-medium">{m.client}</td>
                    <td className="py-2 pr-3">{m.identification}</td>
                    <td className="py-2 pr-3">{FREQUENCY_LABELS[m.frequency] ?? m.frequency}</td>
                    <td className="py-2 pr-3">{formatMoney(m.amount)}</td>
                    <td className="py-2 pr-3">{formatMoney(m.balance)}</td>
                    <td className="py-2 pr-3 font-semibold">{m.daysOverdue}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant="outline"
                        className={
                          m.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : m.severity === 'moderate'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {SEVERITY_LABELS[m.severity] ?? m.severity}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 font-semibold text-red-600">{formatMoney(m.overdueAmount)}</td>
                  </tr>
                ))}
                {morososCount === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      Sin créditos en mora
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
