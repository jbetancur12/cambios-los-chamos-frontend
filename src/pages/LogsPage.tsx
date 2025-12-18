import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LogEntry {
  level: number | string
  time: number
  pid: number
  hostname: string
  msg: string
  [key: string]: unknown
}

const getLevelLabel = (level: number | string) => {
  if (typeof level === 'string') return level
  if (level >= 50) return 'ERROR'
  if (level >= 40) return 'WARN'
  if (level >= 30) return 'INFO'
  if (level >= 20) return 'DEBUG'
  return 'TRACE'
}

export function LogsPage() {
  const [limit, setLimit] = useState('100')
  const [filterLevel, setFilterLevel] = useState<string>('ALL')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-logs', limit],
    queryFn: async () => {
      const res = await api.get<{ logs: LogEntry[] }>(`/logs?limit=${limit}`)
      return res.logs
    },
    refetchInterval: 10000, // Auto refresh every 10s
  })

  // Ensure logs is always an array
  const logs = Array.isArray(data) ? data : []

  const filteredLogs = logs.filter((log: LogEntry) => {
    if (filterLevel === 'ALL') return true
    const label = getLevelLabel(log.level)
    return label === filterLevel
  })

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs del Sistema</h1>
        <div className="flex items-center gap-2">
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARN">Warn</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="h-[calc(100vh-150px)] flex flex-col">
        <CardHeader className="py-3 border-b">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Mostrando {filteredLogs.length} eventos</span>
            <span>Auto-refresco: 10s</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          {isError ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" /> Error al cargar logs
            </div>
          ) : isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-full w-full overflow-auto">
              <div className="divide-y text-sm font-mono">
                {filteredLogs.map((log: LogEntry, i: number) => {
                  const label = getLevelLabel(log.level)
                  const date = new Date(log.time).toLocaleString()

                  return (
                    <div key={i} className="p-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={label === 'ERROR' ? 'destructive' : label === 'WARN' ? 'secondary' : 'outline'}
                          className="w-16 justify-center shrink-0"
                        >
                          {label}
                        </Badge>
                        <span className="text-muted-foreground text-xs whitespace-nowrap pt-1">{date}</span>
                        <div className="break-all flex-1 text-xs sm:text-sm">
                          <p className={`font-medium ${label === 'ERROR' ? 'text-red-500' : ''}`}>{log.msg}</p>
                          {/* Render extra fields if any, excluding standard ones */}
                          {Object.entries(log).map(([key, val]) => {
                            if (['level', 'time', 'pid', 'hostname', 'msg', 'v'].includes(key)) return null
                            return (
                              <div key={key} className="pl-4 mt-1 text-xs text-muted-foreground/80">
                                <span className="font-semibold">{key}:</span>{' '}
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredLogs.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay logs para mostrar con el filtro actual.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
