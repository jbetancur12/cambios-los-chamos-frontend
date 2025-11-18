import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Trash2, Plus, Edit2 } from 'lucide-react'

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
  const [amounts, setAmounts] = useState<RechargeAmount[]>([])
  const [operatorAmounts, setOperatorAmounts] = useState<OperatorAmount[]>([])
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [selectedAmountId, setSelectedAmountId] = useState('')
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
      const [operatorsData, amountsData] = await Promise.all([
        api.get<RechargeOperator[]>('/api/recharge-operators/all'),
        api.get<RechargeAmount[]>('/api/recharge-amounts/all'),
      ])
      setOperators(operatorsData)
      setAmounts(amountsData)
      if (operatorsData.length > 0 && !selectedOperatorId) {
        setSelectedOperatorId(operatorsData[0].id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar operadores y montos')
    } finally {
      setLoading(false)
    }
  }

  const loadOperatorAmounts = async (operatorId: string) => {
    try {
      const data = await api.get<OperatorAmount[]>(`/api/operator-amounts/${operatorId}/all`)
      setOperatorAmounts(data)
    } catch (error) {
      console.error('Error loading operator amounts:', error)
      toast.error('Error al cargar relaciones de operador-monto')
      setOperatorAmounts([])
    }
  }

  const handleAddExistingAmount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedOperatorId || !selectedAmountId) {
      toast.error('Por favor selecciona operador y monto')
      return
    }

    // Check if relation already exists
    const alreadyExists = operatorAmounts.some((oa) => oa.amount.id === selectedAmountId && oa.isActive)
    if (alreadyExists) {
      toast.error('Este monto ya está asignado a este operador')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/api/operator-amounts', {
        operatorId: selectedOperatorId,
        amountId: selectedAmountId,
      })
      await loadOperatorAmounts(selectedOperatorId)
      setSelectedAmountId('')
      toast.success('Monto agregado al operador exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar monto')
    } finally {
      setSubmitting(false)
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
      const newAmount = await api.post<RechargeAmount>('/api/recharge-amounts', {
        amountBs: Number(newAmountValue),
      })

      // Assign it to the operator
      await api.post('/api/operator-amounts', {
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

      await api.put<RechargeAmount>(`/api/recharge-amounts/${operatorAmount.amount.id}`, {
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
      await api.delete(`/api/operator-amounts/${operatorAmountId}`)
      await loadOperatorAmounts(selectedOperatorId)
      toast.success('Monto removido del operador')
    } catch (error: any) {
      toast.error(error.message || 'Error al remover monto')
    }
  }

  const currentOperator = operators.find((op) => op.id === selectedOperatorId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Montos por Operador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Operator Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecciona un Operador</label>
          <select
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <form onSubmit={handleCreateNewAmount} className="space-y-4 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-semibold text-sm">Crear Nuevo Monto para {currentOperator.name}</h3>

              <div>
                <Label htmlFor="newAmount">Nuevo Monto en Bs</Label>
                <Input
                  id="newAmount"
                  type="number"
                  placeholder="Ej: 50000"
                  step="1"
                  value={newAmountValue}
                  onChange={(e) => setNewAmountValue(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={submitting} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear y Asignar Monto
              </Button>
            </form>

            {/* Add Existing Amount Form */}
            <form onSubmit={handleAddExistingAmount} className="space-y-4 p-4 bg-green-50 rounded border border-green-200">
              <h3 className="font-semibold text-sm">Agregar Monto Existente a {currentOperator.name}</h3>

              <div className="space-y-2">
                <label htmlFor="amountSelect" className="text-sm font-medium">
                  Selecciona un Monto Disponible
                </label>
                <select
                  id="amountSelect"
                  value={selectedAmountId}
                  onChange={(e) => setSelectedAmountId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccionar monto</option>
                  {amounts
                    .filter((amount) => !operatorAmounts.some((oa) => oa.amount.id === amount.id && oa.isActive))
                    .map((amount) => (
                      <option key={amount.id} value={amount.id}>
                        {amount.amountBs.toLocaleString('es-VE')} Bs {!amount.isActive && '(Inactivo)'}
                      </option>
                    ))}
                </select>
              </div>

              <Button type="submit" disabled={submitting} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Monto Existente
              </Button>
            </form>

            {/* Operator Amounts List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Montos Asignados a {currentOperator.name}</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : operatorAmounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay montos asignados a este operador</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {operatorAmounts.map((oa) => (
                    <div
                      key={oa.id}
                      className={`flex items-center justify-between p-4 rounded border ${
                        oa.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'
                      }`}
                    >
                      {editingAmountId === oa.id ? (
                        <div className="flex-1 space-y-2">
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
                            >
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingAmountId(null)
                                setEditingAmountValue('')
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="font-bold text-lg">{oa.amount.amountBs.toLocaleString('es-VE')} Bs</p>
                            {!oa.isActive && <p className="text-xs text-gray-500">Inactivo</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingAmountId(oa.id)
                                setEditingAmountValue(oa.amount.amountBs.toString())
                              }}
                              className="p-2 hover:bg-blue-100 rounded transition-colors"
                              title="Editar monto"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteAmount(oa.id)}
                              className="p-2 hover:bg-red-100 rounded transition-colors"
                              title="Remover monto"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
