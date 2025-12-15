import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface AuditResult {
  userId: string
  email: string
  fullName: string
  status: 'OK' | 'INCONSISTENT' | 'ERROR'
  details: {
    storedAvailable: number
    storedSurplus: number
    calculatedAvailable: number
    calculatedSurplus: number
    difference: number
    accumulatedDebt: number
    firstTransaction?: { amount: number; date: string; type: string }
    lastTransaction?: {
      storedAvailable: number
      storedSurplus: number
      date: string
      type: string
    }
  }
  trace: string[]
}

export function AuditPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | AuditResult[] | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleAudit = async () => {
    setLoading(true)
    setResult(null)
    try {
      let url = '/audit-transactions'
      const params = new URLSearchParams()
      if (email.trim()) params.append('email', email)
      if (date) params.append('date', date)

      const queryString = params.toString()
      if (queryString) url += `?${queryString}`

      const response = await api.get<AuditResult | AuditResult[]>(url)
      setResult(response)

      if (Array.isArray(response)) {
        toast.success(`Auditoría masiva completada: ${response.length} usuarios analizados`)
      } else {
        if (response.status === 'OK') toast.success('Usuario auditado: Todo correcto')
        else toast.error('Usuario auditado: INCONSISTENCIAS DETECTADAS')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al realizar auditoría')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const renderSingleResult = (res: AuditResult) => (
    <div key={res.userId} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Card */}
      <Card className={`border-l-4 ${res.status === 'OK' ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{res.fullName}</CardTitle>
              <p className="text-sm text-muted-foreground">{res.email}</p>
            </div>
            <Badge variant={res.status === 'OK' ? 'default' : 'destructive'} className="text-lg py-1 px-4">
              {res.status === 'OK' && (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> CONSISTENTE
                </span>
              )}
              {res.status === 'INCONSISTENT' && (
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> INCONSISTENTE
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Saldo Almacenado (DB)</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Disponible:</span>
                  <span className="font-mono font-bold">{formatCurrency(res.details.storedAvailable)}</span>
                </div>
                <div className="flex justify-between">
                  <span>A Favor:</span>
                  <span className="font-mono font-bold">{formatCurrency(res.details.storedSurplus)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">Saldo Calculado (Auditoría)</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Disponible:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatCurrency(res.details.calculatedAvailable)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>A Favor:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatCurrency(res.details.calculatedSurplus)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Diferencia Total</p>
              <p className={`text-3xl font-bold ${res.details.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {res.details.difference === 0 ? 'Exacto' : formatCurrency(res.details.difference)}
              </p>
            </div>

            {/* Analysis Column */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {res.details.firstTransaction && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                  <p className="text-sm font-semibold text-orange-800 mb-2">Primera Transacción (Inicio)</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-700">{res.details.firstTransaction.type}</span>
                    <span className="font-mono font-bold">{formatCurrency(res.details.firstTransaction.amount)}</span>
                  </div>
                  <p className="text-xs text-orange-600/70 mt-1">
                    {new Date(res.details.firstTransaction.date).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-sm font-semibold text-purple-800 mb-2">Estado Final (Última Tx)</p>
                {res.details.lastTransaction ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Disponible (Tx):</span>
                      <span className="font-mono font-bold text-purple-700">
                        {formatCurrency(res.details.lastTransaction.storedAvailable)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deuda Acumulada Calc:</span>
                      <span className="font-mono font-bold text-red-600">
                        {formatCurrency(res.details.accumulatedDebt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin transacciones</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trace Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Traza de Transacciones (Replay)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/90 p-4 rounded-lg overflow-x-auto font-mono text-xs md:text-sm text-green-400 max-h-[500px] overflow-y-auto">
            {res.trace.map((line, i) => (
              <div
                key={i}
                className="whitespace-nowrap pb-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2"
              >
                {line}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          Auditoría de Saldos (Oculta)
        </h1>
        <p className="text-muted-foreground mt-2">
          Esta herramienta recalcula el historial completo de transacciones para verificar la integridad matemática de
          los saldos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email del minorista (dejar vacío para auditar TODOS)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-[180px]">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={!date ? 'text-muted-foreground' : ''}
                />
                {date && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDate('')}
                    title="Ver Todas (Histórico Completo)"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button onClick={handleAudit} disabled={loading} size="lg">
              {loading ? 'Calculando...' : 'Ejecutar Auditoría'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && !Array.isArray(result) && renderSingleResult(result)}

      {result && Array.isArray(result) && (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Resultados Globales ({result.length})</h2>
          {result.filter((r) => r.status !== 'OK').length === 0 && (
            <div className="p-8 text-center text-green-600 bg-green-50 rounded-lg">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="text-xl font-bold">¡Felicidades! No se encontraron inconsistencias.</p>
            </div>
          )}
          {result
            .filter((r) => r.status !== 'OK')
            .map((r) => (
              <div
                key={r.userId}
                className="border border-red-200 bg-red-50 p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-red-800">
                    {r.fullName} ({r.email})
                  </p>
                  <p className="text-sm text-red-600">Diferencia: {formatCurrency(r.details.difference)}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setEmail(r.email)
                    setResult(r) // Switch to detail view
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Ver Detalles
                </Button>
              </div>
            ))}
          {result
            .filter((r) => r.status === 'OK')
            .map((r) => (
              <div
                key={r.userId}
                className="border border-green-200 bg-green-50/50 p-4 rounded-lg flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <div>
                  <p className="font-medium text-green-800">{r.fullName}</p>
                  <p className="text-xs text-green-600">{r.email}</p>
                </div>
                <Badge variant="outline" className="bg-white text-green-600 border-green-200">
                  OK
                </Badge>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
