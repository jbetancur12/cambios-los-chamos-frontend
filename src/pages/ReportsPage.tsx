import type { ReactNode } from 'react'
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  useSystemProfitReport,
  useSystemProfitTrendReport,
  useMinoristaProfitReport,
  useBankTransactionReport,
  useMinoristaTransactionReport,
} from '@/hooks/queries/useReportQueries'
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
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { getTodayString, getStartOfDayISO, getEndOfDayISO } from '@/lib/dateUtils'

type TabType = 'system' | 'minoristas' | 'bank' | 'minoristaTransactions'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('system')

  // Standardized Date Filter State
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [filterType, setFilterType] = useState<'SINGLE' | 'CUSTOM'>('SINGLE')
  const [singleDate, setSingleDate] = useState(getTodayString())

  const todayStr = getTodayString()
  const startOfDay = getStartOfDayISO(todayStr)
  const endOfDay = getEndOfDayISO(todayStr)

  const [dateFrom, setDateFrom] = useState<string>(startOfDay)
  const [dateTo, setDateTo] = useState<string>(endOfDay)
  const [filterOpen, setFilterOpen] = useState(false)

  // React Query hooks for each report type
  const systemReportQuery = useSystemProfitReport(dateFrom || null, dateTo || null)
  const systemTrendReportQuery = useSystemProfitTrendReport(dateFrom || null, dateTo || null)
  const minoristaReportQuery = useMinoristaProfitReport(dateFrom || null, dateTo || null)
  const bankReportQuery = useBankTransactionReport(dateFrom || null, dateTo || null)
  const minoristaTransactionReportQuery = useMinoristaTransactionReport(dateFrom || null, dateTo || null)

  // Determine which query to use based on active tab
  const getActiveQueryState = () => {
    switch (activeTab) {
      case 'system':
        return { isLoading: systemReportQuery.isLoading, error: systemReportQuery.error }
      case 'minoristas':
        return { isLoading: minoristaReportQuery.isLoading, error: minoristaReportQuery.error }
      case 'bank':
        return { isLoading: bankReportQuery.isLoading, error: bankReportQuery.error }
      case 'minoristaTransactions':
        return { isLoading: minoristaTransactionReportQuery.isLoading, error: minoristaTransactionReportQuery.error }
      default:
        return { isLoading: false, error: null }
    }
  }

  const { isLoading } = getActiveQueryState()

  const handleSingleDateChange = (date: string) => {
    setSingleDate(date)
    setFilterType('SINGLE')

    setDateFrom(getStartOfDayISO(date))
    setDateTo(getEndOfDayISO(date))
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Reportes</h1>

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
                  <Button
                    variant={filterType === 'SINGLE' ? 'default' : 'outline'}
                    size="sm"
                    className={`relative overflow-hidden ${filterType === 'SINGLE' ? 'text-white' : ''}`}
                    style={filterType === 'SINGLE' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                    onClick={() => dateInputRef.current?.showPicker()}
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    <Calendar className="mr-2 h-3 w-3" />
                    {singleDate === getTodayString() ? 'Ver día (Hoy)' : `Ver día: ${singleDate}`}
                  </Button>

                  <input
                    ref={dateInputRef}
                    type="date"
                    value={singleDate}
                    onChange={(e) => {
                      if (e.target.value) handleSingleDateChange(e.target.value)
                    }}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                  />

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

                {filterType === 'CUSTOM' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Desde</label>
                      <Input
                        type="date"
                        value={dateFrom.split('T')[0]}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val) {
                            setDateFrom(getStartOfDayISO(val))
                          } else {
                            setDateFrom('')
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Hasta</label>
                      <Input
                        type="date"
                        value={dateTo.split('T')[0]}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val) {
                            setDateTo(getEndOfDayISO(val))
                          } else {
                            setDateTo('')
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => handleTabChange('system')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'system' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
            }`}
            style={activeTab === 'system' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Ganancias del Sistema
          </button>
          <button
            onClick={() => handleTabChange('minoristas')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'minoristas' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
            }`}
            style={activeTab === 'minoristas' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Top Minoristas
          </button>
          <button
            onClick={() => handleTabChange('bank')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'bank' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
            }`}
            style={activeTab === 'bank' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Transacciones Bancarias
          </button>
          <button
            onClick={() => handleTabChange('minoristaTransactions')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
              activeTab === 'minoristaTransactions' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
            }`}
            style={
              activeTab === 'minoristaTransactions' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}
            }
          >
            Transacciones Minoristas
          </button>
        </div>

        {/* System Profit Report */}
        {activeTab === 'system' && systemReportQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Ganancia Total"
              value={`$${systemReportQuery.data.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-green-100 dark:bg-green-900/20"
            />
            <StatCard
              label="Giros Totales"
              value={systemReportQuery.data.totalGiros.toString()}
              color="bg-blue-100 dark:bg-blue-900/20"
            />
            <StatCard
              label="Giros Completados"
              value={systemReportQuery.data.completedGiros.toString()}
              color="bg-purple-100 dark:bg-purple-900/20"
            />
            <StatCard
              label="Ganancia Promedio"
              value={`$${systemReportQuery.data.averageProfitPerGiro.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-orange-100 dark:bg-orange-900/20"
            />
          </div>
        )}

        {activeTab === 'system' && systemTrendReportQuery.data && systemTrendReportQuery.data.trendData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tendencia de Ganancias del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemTrendReportQuery.data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
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

        {activeTab === 'system' && systemReportQuery.data && (
          <Card>
            <CardHeader>
              <CardTitle>Ganancias por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold text-foreground">Estado</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">Cantidad</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">Ganancia Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemReportQuery.data.profitByStatus.map((status) => (
                      <tr key={status.status} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <Badge variant="default">{status.status}</Badge>
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">{status.count}</td>
                        <td className="text-right py-3 px-4 font-medium text-foreground">
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
        {activeTab === 'minoristas' && minoristaReportQuery.data && (
          <>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Total de minoristas registrados:{' '}
                  <span className="font-bold text-foreground">{minoristaReportQuery.data.totalMinoristas}</span>
                </p>
              </CardContent>
            </Card>

            {/* Minoristas Bar Chart */}
            {minoristaReportQuery.data.minoristas.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Ganancias por Minorista</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={minoristaReportQuery.data.minoristas}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="minoristaName" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `$${value.toLocaleString()}`}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)',
                        }}
                      />
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
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Nombre</th>
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Email</th>
                        <th className="text-right py-2 px-4 font-semibold text-foreground">Giros</th>
                        <th className="text-right py-2 px-4 font-semibold text-foreground">Ganancia</th>
                        <th className="text-right py-2 px-4 font-semibold text-foreground">Crédito Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minoristaReportQuery.data.minoristas.map((m) => (
                        <tr key={m.minoristaId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground">{m.minoristaName}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{m.email}</td>
                          <td className="text-right py-3 px-4 text-foreground">{m.giroCount}</td>
                          <td className="text-right py-3 px-4 font-medium text-green-600 dark:text-green-400">
                            ${m.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right py-3 px-4 text-foreground">
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
        {activeTab === 'bank' && bankReportQuery.data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Depósitos"
                value={`$${bankReportQuery.data.depositAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-green-100 dark:bg-green-900/20"
              />
              <StatCard
                label="Retiros"
                value={`$${bankReportQuery.data.withdrawalAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-red-100 dark:bg-red-900/20"
              />
              <StatCard
                label="Ajustes"
                value={`$${bankReportQuery.data.adjustmentAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-yellow-100 dark:bg-yellow-900/20"
              />
              <StatCard
                label="Neto"
                value={`$${bankReportQuery.data.netAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color={
                  bankReportQuery.data.netAmount >= 0
                    ? 'bg-blue-100 dark:bg-blue-900/20'
                    : 'bg-orange-100 dark:bg-orange-900/20'
                }
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
                        { name: 'Depósitos', value: bankReportQuery.data.totalDeposits, fill: CHART_COLORS[0] },
                        { name: 'Retiros', value: bankReportQuery.data.totalWithdrawals, fill: CHART_COLORS[1] },
                        { name: 'Ajustes', value: bankReportQuery.data.totalAdjustments, fill: CHART_COLORS[2] },
                      ]}
                      dataKey="value"
                      label
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
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
                  <StatRow label="Total de Transacciones" value={bankReportQuery.data.totalTransactions.toString()} />
                  <StatRow label="Total de Depósitos" value={bankReportQuery.data.totalDeposits.toString()} />
                  <StatRow label="Total de Retiros" value={bankReportQuery.data.totalWithdrawals.toString()} />
                  <StatRow label="Total de Ajustes" value={bankReportQuery.data.totalAdjustments.toString()} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Minorista Transaction Report */}
        {activeTab === 'minoristaTransactions' && minoristaTransactionReportQuery.data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Recargas"
                value={`$${minoristaTransactionReportQuery.data.totalRechargeAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-blue-100 dark:bg-blue-900/20"
              />
              <StatCard
                label="Descuentos"
                value={`$${minoristaTransactionReportQuery.data.totalDiscountAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-red-100 dark:bg-red-900/20"
              />
              <StatCard
                label="Ganancias"
                value={`$${minoristaTransactionReportQuery.data.totalProfitAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-green-100 dark:bg-green-900/20"
              />
              <StatCard
                label="Ajustes"
                value={`$${minoristaTransactionReportQuery.data.totalAdjustmentAmount.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-yellow-100 dark:bg-yellow-900/20"
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
                        {
                          name: 'Recargas',
                          value: minoristaTransactionReportQuery.data?.recharges || 0,
                          fill: CHART_COLORS[0],
                        },
                        {
                          name: 'Descuentos',
                          value: minoristaTransactionReportQuery.data?.discounts || 0,
                          fill: CHART_COLORS[1],
                        },
                        {
                          name: 'Ajustes',
                          value: minoristaTransactionReportQuery.data?.adjustments || 0,
                          fill: CHART_COLORS[3],
                        },
                      ]}
                      dataKey="value"
                      label
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
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
                    value={(minoristaTransactionReportQuery.data?.totalTransactions || 0).toString()}
                  />
                  <StatRow label="Recargas" value={(minoristaTransactionReportQuery.data?.recharges || 0).toString()} />
                  <StatRow
                    label="Descuentos"
                    value={(minoristaTransactionReportQuery.data?.discounts || 0).toString()}
                  />
                  <StatRow
                    label="Ajustes"
                    value={(minoristaTransactionReportQuery.data?.adjustments || 0).toString()}
                  />
                  <StatRow
                    label="Ganancias Total"
                    value={(minoristaTransactionReportQuery.data?.totalProfitAmount || 0).toFixed(2)}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!systemReportQuery.data &&
          !minoristaReportQuery.data &&
          !bankReportQuery.data &&
          !minoristaTransactionReportQuery.data &&
          !isLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Selecciona un rango de fechas y haz clic en "Cargar Reporte"</p>
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
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
