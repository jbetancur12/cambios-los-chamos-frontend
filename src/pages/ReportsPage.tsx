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
  useInventoryProfitReport,
  useFacturacionReport,
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
import { ChevronDown, Calendar, Download } from 'lucide-react'
import { getTodayString, getStartOfDayISO, getEndOfDayISO } from '@/lib/dateUtils'

type TabType = 'system' | 'minoristas' | 'bank' | 'minoristaTransactions' | 'inventory' | 'facturacion'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('system')

  // Date Filter State
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [filterType, setFilterType] = useState<'SINGLE' | 'CUSTOM'>('SINGLE')
  const [singleDate, setSingleDate] = useState(getTodayString())
  const [customDateRange, setCustomDateRange] = useState({ from: getTodayString(), to: getTodayString() })
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false)
  const [dateFiltersExpanded, setDateFiltersExpanded] = useState(false)

  // Derive dateFrom / dateTo from the active filter
  const dateFrom = filterType === 'CUSTOM'
    ? getStartOfDayISO(customDateRange.from)
    : getStartOfDayISO(singleDate)
  const dateTo = filterType === 'CUSTOM'
    ? getEndOfDayISO(customDateRange.to)
    : getEndOfDayISO(singleDate)

  // React Query hooks for each report type
  const systemReportQuery = useSystemProfitReport(dateFrom || null, dateTo || null)
  const systemTrendReportQuery = useSystemProfitTrendReport(dateFrom || null, dateTo || null)
  const minoristaReportQuery = useMinoristaProfitReport(dateFrom || null, dateTo || null)
  const bankReportQuery = useBankTransactionReport(dateFrom || null, dateTo || null)
  const minoristaTransactionReportQuery = useMinoristaTransactionReport(dateFrom || null, dateTo || null)
  const inventoryReportQuery = useInventoryProfitReport(dateFrom || null, dateTo || null)
  const facturacionReportQuery = useFacturacionReport(dateFrom || null, dateTo || null)

  const downloadFacturacionCSV = () => {
    if (!facturacionReportQuery.data?.items || facturacionReportQuery.data.items.length === 0) return

    // Create CSV header
    const headers = ['Factura ID', 'Fecha', 'Tipo', 'Cliente', 'Tercero (Mandante)', 'Mi Plata', 'Tercero']
    const csvRows = [headers.join(',')]

    // Format rows
    facturacionReportQuery.data.items.forEach((item) => {
      const row = [
        `"${item.facturaId}"`,
        `"${new Date(item.facturaFecha).toLocaleString()}"`,
        `"${item.facturaType}"`,
        `"${item.customerIdentification || 'N/A'}"`,
        `"${item.mandanteIdentification || 'N/A'}"`,
        item.plataMia,
        item.montoTercero
      ]
      csvRows.push(row.join(','))
    })

    // Create Blob and download
    const csvContent = csvRows.join('\n')
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Reporte_Facturacion_${dateFrom?.slice(0, 10)}_al_${dateTo?.slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
      case 'inventory':
        return { isLoading: inventoryReportQuery.isLoading, error: inventoryReportQuery.error }
      case 'facturacion':
        return { isLoading: facturacionReportQuery.isLoading, error: facturacionReportQuery.error }
      default:
        return { isLoading: false, error: null }
    }
  }

  const { isLoading } = getActiveQueryState()

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Reportes</h1>

        {/* Date Range Filters */}
        <div className="mb-6 border rounded-lg bg-card">
          <button
            onClick={() => setDateFiltersExpanded(!dateFiltersExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <p className="text-base font-semibold">Fecha</p>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${dateFiltersExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {dateFiltersExpanded && (
            <div className="border-t p-3">
              <div className="flex gap-2 flex-wrap">
                {/* Single day picker */}
                <Button
                  variant={filterType === 'SINGLE' ? 'default' : 'outline'}
                  size="sm"
                  className={`relative overflow-hidden ${filterType === 'SINGLE' ? 'text-white' : ''}`}
                  style={filterType === 'SINGLE' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <Calendar className="mr-2 h-3 w-3" />
                  {singleDate === getTodayString() ? 'Ver día (Hoy)' : `Ver día: ${singleDate}`}
                </Button>

                <input
                  ref={dateInputRef}
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSingleDate(e.target.value)
                      setFilterType('SINGLE')
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  tabIndex={-1}
                  title="Seleccionar día"
                />

                {/* Custom date range */}
                <Button
                  variant={filterType === 'CUSTOM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomDateModalOpen(true)}
                  className={filterType === 'CUSTOM' ? 'text-white' : ''}
                  style={filterType === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {filterType === 'CUSTOM'
                    ? `${customDateRange.from} → ${customDateRange.to}`
                    : 'Personalizado'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Date Range Modal */}
        {customDateModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setCustomDateModalOpen(false) }}
          >
            <Card className="w-full max-w-sm">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Rango de Fechas Personalizado</h2>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Desde</label>
                  <Input
                    type="date"
                    value={customDateRange.from}
                    onChange={(e) => setCustomDateRange((r) => ({ ...r, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Hasta</label>
                  <Input
                    type="date"
                    value={customDateRange.to}
                    onChange={(e) => setCustomDateRange((r) => ({ ...r, to: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => { setFilterType('CUSTOM'); setCustomDateModalOpen(false) }}
                    className="flex-1"
                    size="sm"
                    style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}
                  >
                    Aplicar
                  </Button>
                  <Button onClick={() => setCustomDateModalOpen(false)} variant="outline" className="flex-1" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => handleTabChange('system')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${activeTab === 'system' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
              }`}
            style={activeTab === 'system' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Ganancias del Sistema
          </button>
          <button
            onClick={() => handleTabChange('minoristas')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${activeTab === 'minoristas' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
              }`}
            style={activeTab === 'minoristas' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Top Minoristas
          </button>
          <button
            onClick={() => handleTabChange('bank')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${activeTab === 'bank' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
              }`}
            style={activeTab === 'bank' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
          >
            Transacciones Bancarias
          </button>
          <button
            onClick={() => handleTabChange('minoristaTransactions')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${activeTab === 'minoristaTransactions' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
              }`}
            style={
              activeTab === 'minoristaTransactions' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}
            }
          >
            Transacciones Minoristas
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${activeTab === 'inventory' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
              }`}
            style={
              activeTab === 'inventory' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}
            }
          >
            Inventario
          </button>
          <button
            onClick={() => handleTabChange('facturacion')}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${activeTab === 'facturacion' ? 'text-white' : 'bg-card text-foreground hover:bg-accent border'
              }`}
            style={
              activeTab === 'facturacion' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}
            }
          >
            Facturación
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
              label="Ganancia Minoristas"
              value={`$${(systemReportQuery.data.totalMinoristaProfit || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-emerald-100 dark:bg-emerald-900/20"
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
              label="Monto Total (Entrada)"
              value={`$${(systemReportQuery.data.totalAmountCOP || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-indigo-100 dark:bg-indigo-900/20"
            />
            <StatCard
              label="Monto Total (Salida VES)"
              value={`Bs ${(systemReportQuery.data.totalAmountVES || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
              color="bg-cyan-100 dark:bg-cyan-900/20"
            />
            <StatCard
              label="Comisiones Bancarias"
              value={`$${(systemReportQuery.data.totalBankFees || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-red-100 dark:bg-red-900/20"
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
                label="Abonos"
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
                          name: 'Abonos',
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
                  <StatRow label="Abonos" value={(minoristaTransactionReportQuery.data?.recharges || 0).toString()} />
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

        {/* Inventory Profit Report */}
        {activeTab === 'inventory' && inventoryReportQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Ventas Totales"
              value={`$${inventoryReportQuery.data.totalSales.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-blue-100 dark:bg-blue-900/20"
            />
            <StatCard
              label="Costo Total"
              value={`$${inventoryReportQuery.data.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-orange-100 dark:bg-orange-900/20"
            />
            <StatCard
              label="Ganancia Neta"
              value={`$${inventoryReportQuery.data.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
              color="bg-green-100 dark:bg-green-900/20"
            />
            <StatCard
              label="Items Vendidos"
              value={inventoryReportQuery.data.totalItemsSold.toString()}
              color="bg-purple-100 dark:bg-purple-900/20"
            />
            <StatCard
              label="Transacciones"
              value={inventoryReportQuery.data.transactionCount.toString()}
              color="bg-indigo-100 dark:bg-indigo-900/20"
            />
          </div>
        )}

        {/* Facturacion Report */}
        {activeTab === 'facturacion' && facturacionReportQuery.data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Mi Plata (Ingresos Propios)"
                value={`$${facturacionReportQuery.data.totalPlataMia.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
              />
              <StatCard
                label="Ingreso a Terceros (Mandatos)"
                value={`$${facturacionReportQuery.data.totalIngresoTerceros.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300"
              />
              <StatCard
                label="Total General Facturado"
                value={`$${facturacionReportQuery.data.totalFacturadoGeneral.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                color="bg-blue-100 dark:bg-blue-900/20"
              />
              <StatCard
                label="Total de Facturas"
                value={facturacionReportQuery.data.totalGirosFacturados.toString()}
                color="bg-orange-100 dark:bg-orange-900/20"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Historial de Facturas Emitidas</CardTitle>
                <Button variant="outline" size="sm" onClick={downloadFacturacionCSV} disabled={facturacionReportQuery.data.items.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Excel/CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Factura</th>
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Fecha</th>
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Tipo</th>
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Cliente</th>
                        <th className="text-left py-2 px-4 font-semibold text-foreground">Tercero (Mandante)</th>
                        <th className="text-right py-2 px-4 font-semibold text-foreground">Mi Plata</th>
                        <th className="text-right py-2 px-4 font-semibold text-foreground">Tercero</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturacionReportQuery.data.items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted-foreground">
                            No se emitieron facturas en este periodo
                          </td>
                        </tr>
                      ) : (
                        facturacionReportQuery.data.items.map((f) => (
                          <tr key={f.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-foreground font-medium">{f.facturaId}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {new Date(f.facturaFecha).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={f.facturaType === 'MANDATO' ? 'secondary' : 'default'}>
                                {f.facturaType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-foreground">{f.customerIdentification}</td>
                            <td className="py-3 px-4 text-muted-foreground">{f.mandanteIdentification}</td>
                            <td className="text-right py-3 px-4 font-bold text-green-600 dark:text-green-400">
                              ${f.plataMia.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 text-muted-foreground">
                              ${f.montoTercero.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!systemReportQuery.data &&
          !minoristaReportQuery.data &&
          !bankReportQuery.data &&
          !minoristaTransactionReportQuery.data &&
          !inventoryReportQuery.data &&
          !facturacionReportQuery.data &&
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
