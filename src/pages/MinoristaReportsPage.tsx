import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, CheckCircle, Activity, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { useMinoristaGiroReport, useMinoristaGiroTrendReport } from '@/hooks/queries/useReportQueries'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function MinoristaReportsPage() {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [filterType, setFilterType] = useState<'SINGLE' | 'CUSTOM'>('SINGLE')
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0])

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()

  const [dateFrom, setDateFrom] = useState<string>(startOfDay)
  const [dateTo, setDateTo] = useState<string>(endOfDay)
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

  const handleSingleDateChange = (date: string) => {
    setSingleDate(date)
    setFilterType('SINGLE')

    const [year, month, day] = date.split('-').map(Number)
    const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    const toDate = new Date(year, month - 1, day, 23, 59, 59, 999)

    setDateFrom(fromDate.toISOString())
    setDateTo(toDate.toISOString())
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
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                {/* Ver día Button */}
                <Button
                  variant={filterType === 'SINGLE' ? 'default' : 'outline'}
                  size="sm"
                  className={`relative overflow-hidden ${filterType === 'SINGLE' ? 'text-white' : ''}`}
                  style={filterType === 'SINGLE' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <Calendar className="mr-2 h-3 w-3" />
                  {singleDate === new Date().toISOString().split('T')[0] ? 'Ver día (Hoy)' : `Ver día: ${singleDate}`}
                </Button>

                {/* Hidden Date Input */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSingleDateChange(e.target.value)
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  tabIndex={-1}
                  title="Seleccionar día"
                />

                {/* Personalizado Button */}
                <Button
                  variant={filterType === 'CUSTOM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('CUSTOM')}
                  className={filterType === 'CUSTOM' ? 'text-white' : ''}
                  style={filterType === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Personalizado
                </Button>
              </div>

              {/* Manual Date Range Inputs - Only visible if CUSTOM */}
              {filterType === 'CUSTOM' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-medium mb-2">Desde</label>
                    <Input
                      type="date"
                      value={dateFrom.split('T')[0]}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          const [y, m, d] = val.split('-').map(Number)
                          setDateFrom(new Date(y, m - 1, d, 0, 0, 0, 0).toISOString())
                        } else {
                          setDateFrom('')
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hasta</label>
                    <Input
                      type="date"
                      value={dateTo.split('T')[0]}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          const [y, m, d] = val.split('-').map(Number)
                          setDateTo(new Date(y, m - 1, d, 23, 59, 59, 999).toISOString())
                        } else {
                          setDateTo('')
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <Button
                    disabled={isLoading || !dateFrom || !dateTo}
                    className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]"
                  >
                    {isLoading ? 'Cargando...' : 'Cargar Reporte'}
                  </Button>
                </div>
              )}
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
