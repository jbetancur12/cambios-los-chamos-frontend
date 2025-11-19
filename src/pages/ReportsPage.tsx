import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SystemProfitReport {
  totalProfit: number
  totalGiros: number
  completedGiros: number
  averageProfitPerGiro: number
  profitByStatus: Array<{
    status: string
    count: number
    totalProfit: number
  }>
}

interface ProfitTrendData {
  date: string
  profit: number
}

interface SystemProfitTrendReport {
  trendData: ProfitTrendData[]
  totalProfit: number
  totalGiros: number
  completedGiros: number
  averageProfitPerGiro: number
}

interface MinoristaProfit {
  minoristaId: string
  minoristaName: string
  email: string
  totalProfit: number
  giroCount: number
  availableCredit: number
}

interface TopMinoristaReport {
  minoristas: MinoristaProfit[]
  totalMinoristas: number
}

interface BankTransactionReport {
  totalTransactions: number
  totalDeposits: number
  totalWithdrawals: number
  totalAdjustments: number
  depositAmount: number
  withdrawalAmount: number
  adjustmentAmount: number
  netAmount: number
}

interface MinoristaTransactionReport {
  totalTransactions: number
  recharges: number
  discounts: number
  adjustments: number
  profits: number
  totalRechargeAmount: number
  totalDiscountAmount: number
  totalAdjustmentAmount: number
  totalProfitAmount: number
}

type TabType = 'system' | 'minoristas' | 'bank' | 'minoristaTransactions'

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
    from: dateFrom.toISOString().split('T')[0],
    to: dateTo.toISOString().split('T')[0],
  }
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type DateRangeFilter = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year' | null

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('system')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeFilter>('today')
  const [loading, setLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [systemReport, setSystemReport] = useState<SystemProfitReport | null>(null)
  const [systemTrendReport, setSystemTrendReport] = useState<SystemProfitTrendReport | null>(null)
  const [minoristaReport, setMinoristaReport] = useState<TopMinoristaReport | null>(null)
  const [bankReport, setBankReport] = useState<BankTransactionReport | null>(null)
  const [minoristaTransactionReport, setMinoristaTransactionReport] = useState<MinoristaTransactionReport | null>(null)

  const loadReports = async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) {
      return
    }

    setLoading(true)

    try {
      const dateFromISO = new Date(fromDate).toISOString()
      const dateToISO = new Date(toDate).toISOString()

      if (activeTab === 'system') {
        const data = await api.get<SystemProfitReport>(
          `/api/reports/system-profit?dateFrom=${dateFromISO}&dateTo=${dateToISO}`
        )
        const trendData = await api.get<SystemProfitTrendReport>(
          `/api/reports/system-profit-trend?dateFrom=${dateFromISO}&dateTo=${dateToISO}`
        )
        setSystemReport(data)
        setSystemTrendReport(trendData)
      } else if (activeTab === 'minoristas') {
        const data = await api.get<TopMinoristaReport>(
          `/api/reports/minorista-profit?dateFrom=${dateFromISO}&dateTo=${dateToISO}`
        )
        setMinoristaReport(data)
      } else if (activeTab === 'bank') {
        const data = await api.get<BankTransactionReport>(
          `/api/reports/bank-transactions?dateFrom=${dateFromISO}&dateTo=${dateToISO}`
        )
        setBankReport(data)
      } else if (activeTab === 'minoristaTransactions') {
        const data = await api.get<MinoristaTransactionReport>(
          `/api/reports/minorista-transactions?dateFrom=${dateFromISO}&dateTo=${dateToISO}`
        )
        setMinoristaTransactionReport(data)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar reporte')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load today's data on component mount
  useEffect(() => {
    const dates = getDateRange('today')
    setDateFrom(dates.from)
    setDateTo(dates.to)
  }, [])

  // Auto-load reports when dates change
  useEffect(() => {
    if (dateFrom && dateTo) {
      loadReports(dateFrom, dateTo)
    }
  }, [dateFrom, dateTo, activeTab])

  const handleQuickDateRange = (range: 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year') => {
    const dates = getDateRange(range)
    setDateFrom(dates.from)
    setDateTo(dates.to)
    setSelectedDateRange(range)
  }

  const handleLoadReports = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Por favor selecciona un rango de fechas')
      return
    }
    await loadReports(dateFrom, dateTo)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSystemReport(null)
    setSystemTrendReport(null)
    setMinoristaReport(null)
    setBankReport(null)
    setMinoristaTransactionReport(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Reportes</h1>

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
          {filterOpen && <CardContent className="space-y-4">
            {/* Quick Date Range Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('today')}
                className={selectedDateRange === 'today' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'today' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Hoy
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('yesterday')}
                variant={selectedDateRange === 'yesterday' ? undefined : 'outline'}
                className={selectedDateRange === 'yesterday' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'yesterday' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Ayer
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('week')}
                variant={selectedDateRange === 'week' ? undefined : 'outline'}
                className={selectedDateRange === 'week' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'week' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Esta Semana
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('lastWeek')}
                variant={selectedDateRange === 'lastWeek' ? undefined : 'outline'}
                className={selectedDateRange === 'lastWeek' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'lastWeek' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Semana Pasada
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('month')}
                variant={selectedDateRange === 'month' ? undefined : 'outline'}
                className={selectedDateRange === 'month' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'month' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Este Mes
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('lastMonth')}
                variant={selectedDateRange === 'lastMonth' ? undefined : 'outline'}
                className={selectedDateRange === 'lastMonth' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'lastMonth' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Mes Pasado
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickDateRange('year')}
                variant={selectedDateRange === 'year' ? undefined : 'outline'}
                className={selectedDateRange === 'year' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                style={selectedDateRange === 'year' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
              >
                Este Año
              </Button>
            </div>

            {/* Manual Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setSelectedDateRange(null)
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setSelectedDateRange(null)
                  }}
                  className="w-full"
                />
              </div>
              <Button onClick={handleLoadReports} disabled={loading} className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]">
                {loading ? 'Cargando...' : 'Cargar Reporte'}
              </Button>
            </div>
          </CardContent>
          }
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => handleTabChange('system')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'system' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={activeTab === 'system' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Ganancias del Sistema
          </button>
          <button
            onClick={() => handleTabChange('minoristas')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'minoristas' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={activeTab === 'minoristas' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Top Minoristas
          </button>
          <button
            onClick={() => handleTabChange('bank')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'bank' ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={activeTab === 'bank' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Transacciones Bancarias
          </button>
          <button
            onClick={() => handleTabChange('minoristaTransactions')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'minoristaTransactions'
                ? 'text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={activeTab === 'minoristaTransactions' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Transacciones Minoristas
          </button>
        </div>

        {/* System Profit Report */}
        {activeTab === 'system' && systemReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Ganancia Total"
              value={`$${systemReport.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-green-100"
            />
            <StatCard label="Giros Totales" value={systemReport.totalGiros.toString()} color="bg-blue-100" />
            <StatCard label="Giros Completados" value={systemReport.completedGiros.toString()} color="bg-purple-100" />
            <StatCard
              label="Ganancia Promedio"
              value={`$${systemReport.averageProfitPerGiro.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-orange-100"
            />
          </div>
        )}

        {activeTab === 'system' && systemTrendReport && systemTrendReport.trendData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tendencia de Ganancias del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemTrendReport.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line
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

        {activeTab === 'system' && systemReport && (
          <Card>
            <CardHeader>
              <CardTitle>Ganancias por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Estado</th>
                      <th className="text-right py-2 px-4 font-semibold">Cantidad</th>
                      <th className="text-right py-2 px-4 font-semibold">Ganancia Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemReport.profitByStatus.map((status) => (
                      <tr key={status.status} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Badge variant="default">{status.status}</Badge>
                        </td>
                        <td className="text-right py-3 px-4">{status.count}</td>
                        <td className="text-right py-3 px-4 font-medium">
                          ${status.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Minorista Profit Report */}
        {activeTab === 'minoristas' && minoristaReport && (
          <>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  Total de minoristas registrados: <span className="font-bold">{minoristaReport.totalMinoristas}</span>
                </p>
              </CardContent>
            </Card>

            {/* Minoristas Bar Chart */}
            {minoristaReport.minoristas.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Ganancias por Minorista</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={minoristaReport.minoristas}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="minoristaName" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="totalProfit" fill="#10b981" name="Ganancia" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Top Minoristas por Ganancia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-semibold">Nombre</th>
                        <th className="text-left py-2 px-4 font-semibold">Email</th>
                        <th className="text-right py-2 px-4 font-semibold">Giros</th>
                        <th className="text-right py-2 px-4 font-semibold">Ganancia</th>
                        <th className="text-right py-2 px-4 font-semibold">Crédito Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minoristaReport.minoristas.map((m) => (
                        <tr key={m.minoristaId} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{m.minoristaName}</td>
                          <td className="py-3 px-4 text-xs text-gray-600">{m.email}</td>
                          <td className="text-right py-3 px-4">{m.giroCount}</td>
                          <td className="text-right py-3 px-4 font-medium text-green-600">
                            ${m.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right py-3 px-4">
                            ${m.availableCredit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Bank Transaction Report */}
        {activeTab === 'bank' && bankReport && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Depósitos"
                value={`$${bankReport.depositAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-green-100"
              />
              <StatCard
                label="Retiros"
                value={`$${bankReport.withdrawalAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-red-100"
              />
              <StatCard
                label="Ajustes"
                value={`$${bankReport.adjustmentAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-yellow-100"
              />
              <StatCard
                label="Neto"
                value={`$${bankReport.netAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color={bankReport.netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}
              />
            </div>

            {/* Bank Transaction Pie Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Distribución de Transacciones Bancarias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Depósitos', value: bankReport.totalDeposits, fill: CHART_COLORS[0] },
                        { name: 'Retiros', value: bankReport.totalWithdrawals, fill: CHART_COLORS[1] },
                        { name: 'Ajustes', value: bankReport.totalAdjustments, fill: CHART_COLORS[2] },
                      ]}
                      dataKey="value"
                      label
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de Transacciones Bancarias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatRow label="Total de Transacciones" value={bankReport.totalTransactions.toString()} />
                  <StatRow label="Total de Depósitos" value={bankReport.totalDeposits.toString()} />
                  <StatRow label="Total de Retiros" value={bankReport.totalWithdrawals.toString()} />
                  <StatRow label="Total de Ajustes" value={bankReport.totalAdjustments.toString()} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Minorista Transaction Report */}
        {activeTab === 'minoristaTransactions' && minoristaTransactionReport && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Recargas"
                value={`$${minoristaTransactionReport.totalRechargeAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-blue-100"
              />
              <StatCard
                label="Descuentos"
                value={`$${minoristaTransactionReport.totalDiscountAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-red-100"
              />
              <StatCard
                label="Ganancias"
                value={`$${minoristaTransactionReport.totalProfitAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-green-100"
              />
              <StatCard
                label="Ajustes"
                value={`$${minoristaTransactionReport.totalAdjustmentAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-yellow-100"
              />
            </div>

            {/* Minorista Transaction Pie Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Distribución de Transacciones de Minoristas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Recargas', value: minoristaTransactionReport.recharges, fill: CHART_COLORS[0] },
                        { name: 'Descuentos', value: minoristaTransactionReport.discounts, fill: CHART_COLORS[1] },
                        { name: 'Ganancias', value: minoristaTransactionReport.profits, fill: CHART_COLORS[2] },
                        { name: 'Ajustes', value: minoristaTransactionReport.adjustments, fill: CHART_COLORS[3] },
                      ]}
                      dataKey="value"
                      label
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de Transacciones de Minoristas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatRow
                    label="Total de Transacciones"
                    value={minoristaTransactionReport.totalTransactions.toString()}
                  />
                  <StatRow label="Recargas" value={minoristaTransactionReport.recharges.toString()} />
                  <StatRow label="Descuentos" value={minoristaTransactionReport.discounts.toString()} />
                  <StatRow label="Ajustes" value={minoristaTransactionReport.adjustments.toString()} />
                  <StatRow label="Ganancias" value={minoristaTransactionReport.profits.toString()} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!systemReport && !minoristaReport && !bankReport && !minoristaTransactionReport && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Selecciona un rango de fechas y haz clic en "Cargar Reporte"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }): ReactNode {
  return (
    <Card className={color}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
