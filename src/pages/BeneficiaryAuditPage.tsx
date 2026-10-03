import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { useBanksList } from '@/hooks/queries/useBankQueries'
import { toast } from 'sonner'

type Action = 'CREADA' | 'ACTUALIZADA' | 'ELIMINADA'

interface AuditEntry {
  id: string
  action: Action
  userId: string
  userName?: string | null
  userEmail?: string
  userRole?: string
  suggestionId: string
  giroId?: string
  executionType: string
  beneficiaryId: string
  beneficiaryName?: string
  phone?: string
  changes?: Record<string, { old: string | null; new: string | null }>
  snapshot?: Record<string, string | null>
  createdAt: string
}

interface AuditResponse {
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}

const PAGE_SIZE = 50

const FIELD_LABELS: Record<string, string> = {
  beneficiaryName: 'Nombre',
  beneficiaryId: 'Cédula',
  phone: 'Teléfono',
  senderPhone: 'Tel. remitente',
  bankId: 'Banco',
  accountNumber: 'Cuenta',
  executionType: 'Tipo',
}

const ACTION_STYLES: Record<Action, string> = {
  CREADA: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  ACTUALIZADA: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  ELIMINADA: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function BeneficiaryAuditPage() {
  const { data: banks = [] } = useBanksList()
  const [user, setUser] = useState('')
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [action, setAction] = useState('')
  const [executionType, setExecutionType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResponse | null>(null)

  const bankName = useCallback(
    (bankId: string | null) => (bankId ? banks.find((b) => b.id === bankId)?.name || bankId : '—'),
    [banks]
  )

  const formatValue = useCallback(
    (field: string, value: string | null) => (field === 'bankId' ? bankName(value) : value || '—'),
    [bankName]
  )

  const search = useCallback(
    async (nextOffset: number) => {
      setLoading(true)
      try {
        const response = await api.get<AuditResponse>('/beneficiary-suggestion/audit', {
          params: {
            user: user.trim() || undefined,
            beneficiaryId: beneficiaryId.trim() || undefined,
            beneficiary: beneficiary.trim() || undefined,
            action: action || undefined,
            executionType: executionType || undefined,
            from: from || undefined,
            to: to || undefined,
            limit: PAGE_SIZE,
            offset: nextOffset,
          },
        })
        setResult(response)
        setOffset(nextOffset)
      } catch (error) {
        console.error(error)
        toast.error('Error al consultar el registro de sugerencias')
      } finally {
        setLoading(false)
      }
    },
    [user, beneficiaryId, beneficiary, action, executionType, from, to]
  )

  // Initial load: latest events
  useEffect(() => {
    void search(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPages = useMemo(() => (result ? Math.max(Math.ceil(result.total / PAGE_SIZE), 1) : 1), [result])
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const clearFilters = () => {
    setUser('')
    setBeneficiaryId('')
    setBeneficiary('')
    setAction('')
    setExecutionType('')
    setFrom('')
    setTo('')
  }

  const renderDetail = (entry: AuditEntry) => {
    const changes = entry.changes ? Object.entries(entry.changes) : []
    if (changes.length > 0) {
      return (
        <div className="space-y-1">
          {changes.map(([field, c]) => (
            <div key={field} className="text-xs">
              <span className="font-medium text-muted-foreground">{FIELD_LABELS[field] || field}: </span>
              <span className="line-through text-muted-foreground">{formatValue(field, c.old)}</span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="font-semibold">{formatValue(field, c.new)}</span>
            </div>
          ))}
        </div>
      )
    }
    const s = entry.snapshot
    if (!s) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div className="text-xs text-muted-foreground space-y-0.5">
        <div>
          <span className="font-medium">Nombre: </span>
          {s.beneficiaryName || '—'}
        </div>
        {s.phone && (
          <div>
            <span className="font-medium">Teléfono: </span>
            {s.phone}
          </div>
        )}
        {s.accountNumber && (
          <div>
            <span className="font-medium">Cuenta: </span>
            {s.accountNumber}
          </div>
        )}
        <div>
          <span className="font-medium">Banco: </span>
          {bankName(s.bankId)}
        </div>
      </div>
    )
  }

  const renderOwner = (entry: AuditEntry) => (
    <>
      <div className="text-xs font-medium">{entry.userName || entry.userEmail || entry.userId}</div>
      {entry.userName && <div className="text-xs text-muted-foreground break-all">{entry.userEmail}</div>}
      <div className="text-xs text-muted-foreground">{entry.userRole}</div>
    </>
  )

  const renderBeneficiary = (entry: AuditEntry) => (
    <>
      <div className="font-mono text-xs">{entry.beneficiaryId}</div>
      <div className="text-xs text-muted-foreground">
        {entry.executionType === 'PAGO_MOVIL' ? 'Contacto: ' : ''}
        {entry.beneficiaryName || entry.snapshot?.beneficiaryName || '—'}
      </div>
      {entry.executionType === 'PAGO_MOVIL' && (entry.phone || entry.snapshot?.phone) && (
        <div className="text-xs text-muted-foreground">Tel: {entry.phone || entry.snapshot?.phone}</div>
      )}
    </>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría de beneficiarios</h1>
        <p className="text-sm text-muted-foreground">
          Quién creó, cambió o eliminó sugerencias de beneficiarios, y qué datos cambió.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault()
              void search(0)
            }}
          >
            <Input
              placeholder="Usuario que creó el giro (email)"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
            <Input
              placeholder="Beneficiario / contacto / celular"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
            />
            <Input
              placeholder="Cédula del beneficiario"
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
            />
            <select className={selectClass} value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">Todas las acciones</option>
              <option value="CREADA">Creada</option>
              <option value="ACTUALIZADA">Actualizada</option>
              <option value="ELIMINADA">Eliminada</option>
            </select>
            <select className={selectClass} value={executionType} onChange={(e) => setExecutionType(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="PAGO_MOVIL">Pago móvil</option>
            </select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Desde" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Hasta" />
            <div className="flex gap-2 md:col-span-3 lg:col-span-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  clearFilters()
                  // State updates are async, so query with empty filters explicitly
                  setLoading(true)
                  api
                    .get<AuditResponse>('/beneficiary-suggestion/audit', { params: { limit: PAGE_SIZE, offset: 0 } })
                    .then((response) => {
                      setResult(response)
                      setOffset(0)
                    })
                    .catch(() => toast.error('Error al consultar el registro de sugerencias'))
                    .finally(() => setLoading(false))
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {result ? `${result.total} evento${result.total === 1 ? '' : 's'}` : 'Eventos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: one card per event, no horizontal scrolling */}
          <div className="space-y-3 md:hidden">
            {result && result.entries.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin eventos para estos filtros</p>
            )}
            {result?.entries.map((entry) => (
              <div key={entry.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge className={ACTION_STYLES[entry.action]} variant="secondary">
                    {entry.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString('es-CO')}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">Dueño</div>
                  {renderOwner(entry)}
                </div>
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    {entry.executionType === 'PAGO_MOVIL' ? 'Pago móvil' : 'Transferencia'}
                  </div>
                  {renderBeneficiary(entry)}
                </div>
                <div className="border-t pt-2">{renderDetail(entry)}</div>
                {entry.giroId && (
                  <div className="font-mono text-[11px] text-muted-foreground">Giro {entry.giroId.slice(0, 8)}</div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: full table */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Dueño (quien creó el giro)</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Giro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result && result.entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Sin eventos para estos filtros
                  </TableCell>
                </TableRow>
              )}
              {result?.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(entry.createdAt).toLocaleString('es-CO')}
                  </TableCell>
                  <TableCell>
                    <Badge className={ACTION_STYLES[entry.action]} variant="secondary">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderOwner(entry)}</TableCell>
                  <TableCell className="text-xs">
                    {entry.executionType === 'PAGO_MOVIL' ? 'Pago móvil' : 'Transf.'}
                  </TableCell>
                  <TableCell>{renderBeneficiary(entry)}</TableCell>
                  <TableCell>{renderDetail(entry)}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.giroId ? entry.giroId.slice(0, 8) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || offset === 0}
                onClick={() => void search(Math.max(offset - PAGE_SIZE, 0))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || currentPage >= totalPages}
                onClick={() => void search(offset + PAGE_SIZE)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
