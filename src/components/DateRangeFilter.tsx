import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, X, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface DateRange {
  startDate: string | null
  endDate: string | null
}

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void
  onClear: () => void
}

type PredefinedRange = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | null

export function DateRangeFilter({ onDateRangeChange, onClear }: DateRangeFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [activePredefined, setActivePredefined] = useState<PredefinedRange>(null)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const today = new Date()

  const getPredefinedRange = (type: PredefinedRange): DateRange => {
    const start = new Date()
    const end = new Date()

    switch (type) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 59, 59, 999)
        break
      case 'thisWeek':
        const firstDay = new Date(start)
        firstDay.setDate(start.getDate() - start.getDay())
        firstDay.setHours(0, 0, 0, 0)
        start.setTime(firstDay.getTime())
        end.setHours(23, 59, 59, 999)
        break
      case 'lastWeek':
        const lastWeekStart = new Date(start)
        lastWeekStart.setDate(start.getDate() - start.getDay() - 7)
        lastWeekStart.setHours(0, 0, 0, 0)
        start.setTime(lastWeekStart.getTime())
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        lastWeekEnd.setHours(23, 59, 59, 999)
        end.setTime(lastWeekEnd.getTime())
        break
      case 'thisMonth':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'lastMonth':
        start.setMonth(start.getMonth() - 1)
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        const lastDay = new Date(end.getFullYear(), end.getMonth(), 0)
        lastDay.setHours(23, 59, 59, 999)
        end.setTime(lastDay.getTime())
        break
      case 'thisYear':
        start.setMonth(0)
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(11)
        end.setDate(31)
        end.setHours(23, 59, 59, 999)
        break
      default:
        return { startDate: null, endDate: null }
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }

  const handlePredefined = (type: PredefinedRange) => {
    if (activePredefined === type) {
      setActivePredefined(null)
      setDateRange({ startDate: null, endDate: null })
      onDateRangeChange({ startDate: null, endDate: null })
      setShowCustomRange(false)
    } else {
      const range = getPredefinedRange(type)
      setDateRange(range)
      setActivePredefined(type)
      onDateRangeChange(range)
      setShowCustomRange(false)
    }
  }

  const handleCustomRange = () => {
    setShowCustomRange(!showCustomRange)
    if (!showCustomRange) {
      setActivePredefined(null)
    }
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newRange = { ...dateRange, [field]: value || null }
    setDateRange(newRange)

    if (newRange.startDate && newRange.endDate) {
      onDateRangeChange(newRange)
    }
  }

  const handleClearFilter = () => {
    setDateRange({ startDate: null, endDate: null })
    setActivePredefined(null)
    setShowCustomRange(false)
    onClear()
  }

  const isFilterActive = activePredefined !== null || dateRange.startDate !== null || dateRange.endDate !== null

  return (
    <Card className="p-4 bg-muted/40 border-dashed">
      <div className="space-y-4">
        {/* Mobile Collapse Toggle */}
        <div className="md:hidden flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Filtros</p>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filter Content - Collapsible on Mobile */}
        <div
          className={`space-y-4 overflow-hidden transition-all duration-200 ${
            isExpanded ? 'md:block' : 'hidden md:block'
          }`}
        >
          {/* Predefined Buttons */}
          <div>
            <p className="hidden md:block text-sm font-medium mb-3 text-foreground">Rango Rápido</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              <Button
                variant={activePredefined === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('today')}
                className="text-xs"
              >
                Hoy
              </Button>
              <Button
                variant={activePredefined === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('yesterday')}
                className="text-xs"
              >
                Ayer
              </Button>
              <Button
                variant={activePredefined === 'thisWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('thisWeek')}
                className="text-xs"
              >
                Esta Semana
              </Button>
              <Button
                variant={activePredefined === 'lastWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('lastWeek')}
                className="text-xs"
              >
                Sem. Pasada
              </Button>
              <Button
                variant={activePredefined === 'thisMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('thisMonth')}
                className="text-xs"
              >
                Este Mes
              </Button>
              <Button
                variant={activePredefined === 'lastMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('lastMonth')}
                className="text-xs"
              >
                Mes Pasado
              </Button>
              <Button
                variant={activePredefined === 'thisYear' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePredefined('thisYear')}
                className="text-xs"
              >
                Este Año
              </Button>
              <Button
                variant={showCustomRange ? 'default' : 'outline'}
                size="sm"
                onClick={handleCustomRange}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Personalizado
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {showCustomRange && (
            <div className="space-y-3 pt-3 border-t">
              <p className="text-sm font-medium text-foreground">Rango Personalizado</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Desde</label>
                  <Input
                    type="date"
                    value={dateRange.startDate || ''}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    max={dateRange.endDate || today.toISOString().split('T')[0]}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Hasta</label>
                  <Input
                    type="date"
                    value={dateRange.endDate || ''}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                    min={dateRange.startDate || ''}
                    max={today.toISOString().split('T')[0]}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Info */}
          {isFilterActive && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                {activePredefined ? (
                  <span>
                    {activePredefined === 'today' && '📅 Mostrando: Hoy'}
                    {activePredefined === 'yesterday' && '📅 Mostrando: Ayer'}
                    {activePredefined === 'thisWeek' && '📅 Mostrando: Esta Semana'}
                    {activePredefined === 'lastWeek' && '📅 Mostrando: Semana Pasada'}
                    {activePredefined === 'thisMonth' && '📅 Mostrando: Este Mes'}
                    {activePredefined === 'lastMonth' && '📅 Mostrando: Mes Pasado'}
                    {activePredefined === 'thisYear' && '📅 Mostrando: Este Año'}
                  </span>
                ) : (
                  <span>
                    📅 {dateRange.startDate} a {dateRange.endDate}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
