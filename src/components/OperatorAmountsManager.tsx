import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Trash2, Plus, Edit2, Check, X, DollarSign } from 'lucide-react'

interface RechargeOperator {
  id: string
  name: string
  type: string
  isActive: boolean
}

interface RechargeAmount {
  id: string
  amountBs: number
  isActive: boolean
}

interface OperatorAmount {
  id: string
  operator: RechargeOperator
  amount: RechargeAmount
  isActive: boolean
}

export function OperatorAmountsManager() {
  const [operators, setOperators] = useState<RechargeOperator[]>([])
  const [operatorAmounts, setOperatorAmounts] = useState<OperatorAmount[]>([])
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [newAmountValue, setNewAmountValue] = useState('')
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null)
  const [editingAmountValue, setEditingAmountValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadOperatorsAndAmounts()
  }, [])

  useEffect(() => {
    if (selectedOperatorId) {
      loadOperatorAmounts(selectedOperatorId)
    }
  }, [selectedOperatorId])

  const loadOperatorsAndAmounts = async () => {
    try {
      setLoading(true)
      const operatorsData = await api.get<RechargeOperator[]>('/recharge-operators/all')
      setOperators(operatorsData)
      if (operatorsData.length > 0 && !selectedOperatorId) {
        setSelectedOperatorId(operatorsData[0].id)
      }
    } catch (error) {
      console.error('Error loading operators:', error)
      toast.error('Error al cargar operadores')
    } finally {
      setLoading(false)
    }
  }

  const loadOperatorAmounts = async (operatorId: string) => {
    try {
      const data = await api.get<OperatorAmount[]>(`/operator-amounts/${operatorId}/all`)
      setOperatorAmounts(data)
    } catch (error) {
      console.error('Error loading operator amounts:', error)
      toast.error('Error al cargar relaciones de operador-monto')
      setOperatorAmounts([])
    }
  }


  const handleCreateNewAmount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAmountValue || Number(newAmountValue) <= 0) {
      toast.error('Por favor ingresa un monto válido')
      return
    }

    if (!selectedOperatorId) {
      toast.error('Por favor selecciona un operador primero')
      return
    }

    setSubmitting(true)
    try {
      // Create the amount
      const newAmount = await api.post<RechargeAmount>('/recharge-amounts', {
        amountBs: Number(newAmountValue),
      })

      // Assign it to the operator
      await api.post('/operator-amounts', {
        operatorId: selectedOperatorId,
        amountId: newAmount.id,
      })

      await loadOperatorAmounts(selectedOperatorId)
      setNewAmountValue('')
      toast.success('Monto creado y asignado al operador exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear monto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAmount = async (operatorAmountId: string) => {
    if (!editingAmountValue || Number(editingAmountValue) <= 0) {
      toast.error('Por favor ingresa un monto válido')
      return
    }

    setSubmitting(true)
    try {
      const operatorAmount = operatorAmounts.find((oa) => oa.id === operatorAmountId)
      if (!operatorAmount) return

      await api.put<RechargeAmount>(`/recharge-amounts/${operatorAmount.amount.id}`, {
        amountBs: Number(editingAmountValue),
      })

      await loadOperatorAmounts(selectedOperatorId)
      setEditingAmountId(null)
      setEditingAmountValue('')
      toast.success('Monto actualizado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar monto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAmount = async (operatorAmountId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este monto del operador?')) {
      return
    }

    try {
      await api.delete(`/operator-amounts/${operatorAmountId}`)
      await loadOperatorAmounts(selectedOperatorId)
      toast.success('Monto removido del operador')
    } catch (error: any) {
      toast.error(error.message || 'Error al remover monto')
    }
  }

  const currentOperator = operators.find((op) => op.id === selectedOperatorId)

  return (
    <Card>
      <CardHeader className="border-b text-white" style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Gestionar Montos por Operador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Operator Selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Selecciona un Operador</label>
          <select
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ '--tw-ring-color': '#136BBC' } as React.CSSProperties}
          >
            <option value="">Seleccionar operador</option>
            {operators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.name} {!operator.isActive && '(Inactivo)'}
              </option>
            ))}
          </select>
        </div>

        {selectedOperatorId && currentOperator && (
          <>
            {/* Create New Amount Form */}
            <form onSubmit={handleCreateNewAmount} className="space-y-4 p-6 rounded-lg border-2 border-blue-200" style={{ backgroundColor: 'rgba(19, 107, 188, 0.05)' }}>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5" style={{ color: '#136BBC' }} />
                <h3 className="font-bold text-sm">Crear Nuevo Monto para {currentOperator.name}</h3>
              </div>

              <div>
                <Label htmlFor="newAmount" className="text-xs font-semibold">
                  Nuevo Monto en Bs
                </Label>
                <Input
                  id="newAmount"
                  type="number"
                  placeholder="Ej: 50000"
                  step="1"
                  value={newAmountValue}
                  onChange={(e) => setNewAmountValue(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button type="submit" disabled={submitting} className="flex items-center gap-2 text-white w-full" style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}>
                <Plus className="h-4 w-4" />
                Crear y Asignar Monto
              </Button>
            </form>


            {/* Operator Amounts List */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-800">
                Montos Asignados a {currentOperator.name} ({operatorAmounts.length})
              </h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="inline-block animate-pulse">Cargando...</div>
                </div>
              ) : operatorAmounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <Plus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay montos asignados a este operador</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {operatorAmounts.map((oa) => (
                    <div
                      key={oa.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        oa.isActive
                          ? 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      {editingAmountId === oa.id ? (
                        <div className="flex-1 space-y-3">
                          <Input
                            type="number"
                            placeholder="Nuevo monto"
                            value={editingAmountValue}
                            onChange={(e) => setEditingAmountValue(e.target.value)}
                            step="1"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleEditAmount(oa.id)}
                              disabled={submitting}
                              className="flex-1 flex items-center justify-center gap-2 text-white"
                              style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}
                            >
                              <Check className="h-4 w-4" />
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex-1 flex items-center justify-center gap-2"
                              style={{ borderColor: '#136BBC', color: '#136BBC' }}
                              onClick={() => {
                                setEditingAmountId(null)
                                setEditingAmountValue('')
                              }}
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-bold text-lg text-gray-900">{oa.amount.amountBs.toLocaleString('es-VE')} Bs</p>
                            {!oa.isActive && (
                              <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingAmountId(oa.id)
                                setEditingAmountValue(oa.amount.amountBs.toString())
                              }}
                              className="p-2.5 hover:bg-blue-100 rounded-lg transition-colors"
                              style={{ color: '#136BBC' }}
                              title="Editar monto"
                              aria-label="Editar monto"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAmount(oa.id)}
                              className="p-2.5 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-800"
                              title="Remover monto"
                              aria-label="Remover monto"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
