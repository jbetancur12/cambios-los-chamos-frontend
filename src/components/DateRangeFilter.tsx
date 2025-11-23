import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown } from 'lucide-react'

export interface DateRange {
  from?: string | null
  to?: string | null
  startDate?: string | null
  endDate?: string | null
}

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void
  onClear?: () => void
}

type DateFilterType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM' | 'ALL'

export function DateRangeFilter({ onDateRangeChange, onClear }: DateRangeFilterProps) {
  const [filterDate, setFilterDate] = useState<DateFilterType>('ALL')
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate date range based on filter - returns ISO strings with full hours
  const getDateRange = (filterType: DateFilterType) => {
    const today = new Date()
    let dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    let dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    switch (filterType) {
      case 'TODAY':
        break
      case 'YESTERDAY':
        dateFrom.setDate(dateFrom.getDate() - 1)
        dateTo.setDate(dateTo.getDate() - 1)
        break
      case 'THIS_WEEK':
        dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay())
        break
      case 'LAST_WEEK':
        const dayOfWeekLast = today.getDay()
        const endOfLastWeek = new Date(today)
        endOfLastWeek.setDate(today.getDate() - dayOfWeekLast - 1)
        endOfLastWeek.setHours(23, 59, 59, 999)
        const startOfLastWeek = new Date(endOfLastWeek)
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6)
        startOfLastWeek.setHours(0, 0, 0, 0)
        dateFrom = startOfLastWeek
        dateTo = endOfLastWeek
        break
      case 'THIS_MONTH':
        dateFrom.setDate(1)
        break
      case 'LAST_MONTH':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0)
        dateTo.setHours(23, 59, 59, 999)
        break
      default:
        return undefined
    }

    return { from: dateFrom.toISOString(), to: dateTo.toISOString() }
  }

  const handleDateRangeChange = (range: DateFilterType) => {
    setFilterDate(range)
    if (range === 'ALL') {
      onDateRangeChange({ from: null, to: null, startDate: null, endDate: null })
      onClear?.()
    } else {
      const calculated = getDateRange(range)
      if (calculated) {
        // Return both old and new format for compatibility
        onDateRangeChange({
          from: calculated.from,
          to: calculated.to,
          startDate: calculated.from.split('T')[0],
          endDate: calculated.to.split('T')[0],
        })
      }
    }
  }

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    const newRange = { ...customDateRange, [field]: value }
    setCustomDateRange(newRange)

    if (newRange.from && newRange.to) {
      const [fromYear, fromMonth, fromDay] = newRange.from.split('-').map(Number)
      const [toYear, toMonth, toDay] = newRange.to.split('-').map(Number)
      const dateFrom = new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0)
      const dateTo = new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999)
      const fromISO = dateFrom.toISOString()
      const toISO = dateTo.toISOString()
      onDateRangeChange({
        from: fromISO,
        to: toISO,
        startDate: newRange.from,
        endDate: newRange.to,
      })
    }
  }

  const handleClearFilter = () => {
    setFilterDate('ALL')
    setCustomDateRange({
      from: new Date().toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    })
    onDateRangeChange({ from: null, to: null, startDate: null, endDate: null })
    onClear?.()
  }

  return (
    <div className="mb-6 border rounded-lg bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <p className="text-xs font-semibold text-muted-foreground">Fecha</p>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
            <Button
              variant={filterDate === 'TODAY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('TODAY')}
              className={filterDate === 'TODAY' ? 'text-white' : ''}
              style={filterDate === 'TODAY' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Hoy
            </Button>
            <Button
              variant={filterDate === 'YESTERDAY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('YESTERDAY')}
              className={filterDate === 'YESTERDAY' ? 'text-white' : ''}
              style={filterDate === 'YESTERDAY' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Ayer
            </Button>
            <Button
              variant={filterDate === 'THIS_WEEK' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('THIS_WEEK')}
              className={filterDate === 'THIS_WEEK' ? 'text-white' : ''}
              style={filterDate === 'THIS_WEEK' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Esta Semana
            </Button>
            <Button
              variant={filterDate === 'LAST_WEEK' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('LAST_WEEK')}
              className={filterDate === 'LAST_WEEK' ? 'text-white' : ''}
              style={filterDate === 'LAST_WEEK' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Semana Pasada
            </Button>
            <Button
              variant={filterDate === 'THIS_MONTH' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('THIS_MONTH')}
              className={filterDate === 'THIS_MONTH' ? 'text-white' : ''}
              style={filterDate === 'THIS_MONTH' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Este Mes
            </Button>
            <Button
              variant={filterDate === 'LAST_MONTH' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange('LAST_MONTH')}
              className={filterDate === 'LAST_MONTH' ? 'text-white' : ''}
              style={filterDate === 'LAST_MONTH' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Mes Pasado
            </Button>
            <Button
              variant={filterDate === 'CUSTOM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDate('CUSTOM')}
              className={filterDate === 'CUSTOM' ? 'text-white' : ''}
              style={filterDate === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Personalizado
            </Button>
            <Button
              variant={filterDate === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleClearFilter()}
              className={filterDate === 'ALL' ? 'text-white' : ''}
              style={filterDate === 'ALL' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
            >
              Todos
            </Button>
          </div>

          {filterDate === 'CUSTOM' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2 border-t">
              <div>
                <label className="block text-sm font-medium mb-2">Desde</label>
                <Input
                  type="date"
                  value={customDateRange.from}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hasta</label>
                <Input
                  type="date"
                  value={customDateRange.to}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={() => setFilterDate('CUSTOM')}
                className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]"
                size="sm"
              >
                Aplicar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
