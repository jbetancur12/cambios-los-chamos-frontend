import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, CheckCircle, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { useMinoristaGiroReport, useMinoristaGiroTrendReport } from '@/hooks/queries/useReportQueries'

// Helper function to format a Date as YYYY-MM-DD in local timezone (not UTC)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDateRange = (range: 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year') => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let dateFrom = new Date(today)
  let dateTo = new Date(today)
  dateTo.setHours(23, 59, 59, 999)

  switch (range) {
    case 'today':
      break
    case 'yesterday':
      dateFrom.setDate(dateFrom.getDate() - 1)
      dateTo.setDate(dateTo.getDate() - 1)
      break
    case 'week':
      dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay())
      break
    case 'lastWeek':
      // Semana pasada: desde hace 14 días hasta hace 8 días (7 días completos)
      dateFrom.setDate(dateFrom.getDate() - 14)
      dateTo.setDate(dateTo.getDate() - 8)
      break
    case 'month':
      dateFrom.setDate(1)
      break
    case 'lastMonth':
      // Mes pasado: primer día del mes anterior hasta último día
      dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      dateTo = new Date(today.getFullYear(), today.getMonth(), 0)
      dateTo.setHours(23, 59, 59, 999)
      break
    case 'year':
      dateFrom = new Date(today.getFullYear(), 0, 1)
      break
  }

  return {
    from: formatLocalDate(dateFrom),
    to: formatLocalDate(dateTo),
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function MinoristaReportsPage() {
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterOpen, setFilterOpen] = useState(false)

  // React Query hooks
  const reportQuery = useMinoristaGiroReport(dateFrom, dateTo)
  const trendReportQuery = useMinoristaGiroTrendReport(dateFrom, dateTo)

  const report = reportQuery.data
  const trendReport = trendReportQuery.data
  const isLoading = reportQuery.isLoading || trendReportQuery.isLoading

  // Handle errors
  if (reportQuery.error) {
    toast.error('Error al cargar reporte de giros')
  }
  if (trendReportQuery.error) {
    toast.error('Error al cargar tendencia de giros')
  }

  const handleQuickDateRange = (
    range: 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year'
  ) => {
    const dates = getDateRange(range)
    setDateFrom(dates.from)
    setDateTo(dates.to)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mis Reportes</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Visualiza el dinero girado y tus ganancias en un período de tiempo
        </p>
      </div>

      {/* Date Range Filters */}
      <Card className="mb-6">
        <CardHeader
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Filtrar por Rango de Fechas</CardTitle>
            {filterOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        {filterOpen && (
          <CardContent className="space-y-4">
            {/* Quick Date Range Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('today')}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('yesterday')}>
                Ayer
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('week')}>
                Esta Semana
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('lastWeek')}>
                Semana Pasada
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('month')}>
                Este Mes
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('lastMonth')}>
                Mes Pasado
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('year')}>
                Este Año
              </Button>
            </div>

            {/* Manual Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Desde</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hasta</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full" />
              </div>
              <Button
                disabled={isLoading || !dateFrom || !dateTo}
                className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]"
              >
                {isLoading ? 'Cargando...' : 'Cargar Reporte'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stats Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={DollarSign}
            label="Dinero Girado"
            value={formatCurrency(report.totalMoneyTransferred)}
            color="bg-blue-100"
          />
          <StatCard
            icon={TrendingUp}
            label="Ganancia Total"
            value={formatCurrency(report.totalProfit)}
            color="bg-green-100"
          />
          <StatCard icon={Activity} label="Total de Giros" value={report.totalGiros.toString()} color="bg-purple-100" />
          <StatCard
            icon={CheckCircle}
            label="Giros Completados"
            value={report.completedGiros.toString()}
            color="bg-emerald-100"
          />
        </div>
      )}

      {/* Trend Chart */}
      {trendReport && trendReport.trendData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tendencia de Dinero Girado y Ganancias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendReport.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="moneyTransferred"
                  stroke="#3b82f6"
                  name="Dinero Girado"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  name="Ganancia"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary by Status */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Estado de Giro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.moneyTransferredByStatus.map((status) => (
                <div key={status.status} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground capitalize">{status.status}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {status.count} giros
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dinero Girado</span>
                      <span className="font-medium">{formatCurrency(status.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ganancia</span>
                      <span className="font-medium text-green-600">{formatCurrency(status.totalProfit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!report && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Selecciona un rango de fechas y haz clic en "Cargar Reporte"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: any
  label: string
  value: string
  color: string
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className={color}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-6 w-6 text-gray-400 opacity-50" />
        </div>
      </CardContent>
    </Card>
  )
}
