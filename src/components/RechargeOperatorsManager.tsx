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

export function RechargeOperatorsManager() {
  const [operators, setOperators] = useState<RechargeOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [newOperatorName, setNewOperatorName] = useState('')
  const [newOperatorType, setNewOperatorType] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingType, setEditingType] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadOperators()
  }, [])

  const loadOperators = async () => {
    try {
      setLoading(true)
      const data = await api.get<RechargeOperator[]>('/api/recharge-operators/all')
      setOperators(data)
    } catch (error) {
      console.error('Error loading operators:', error)
      toast.error('Error al cargar operadores')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newOperatorName || !newOperatorType) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setSubmitting(true)
    try {
      const newOperator = await api.post<RechargeOperator>('/api/recharge-operators', {
        name: newOperatorName,
        type: newOperatorType,
      })
      setOperators([...operators, newOperator])
      setNewOperatorName('')
      setNewOperatorType('')
      toast.success('Operador creado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear operador')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName || !editingType) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setSubmitting(true)
    try {
      const updated = await api.put<RechargeOperator>(`/api/recharge-operators/${id}`, {
        name: editingName,
        type: editingType,
      })
      setOperators(operators.map((op) => (op.id === id ? updated : op)))
      setEditingId(null)
      setEditingName('')
      setEditingType('')
      toast.success('Operador actualizado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar operador')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este operador?')) {
      return
    }

    try {
      await api.delete(`/api/recharge-operators/${id}`)
      setOperators(operators.filter((op) => op.id !== id))
      toast.success('Operador eliminado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar operador')
    }
  }

  const startEdit = (operator: RechargeOperator) => {
    setEditingId(operator.id)
    setEditingName(operator.name)
    setEditingType(operator.type)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Operadores de Recarga</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        <form onSubmit={handleAdd} className="space-y-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-sm">
            {editingId ? 'Editar Operador' : 'Nuevo Operador'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operatorName">Nombre</Label>
              <Input
                id="operatorName"
                placeholder="Ej: Movistar"
                value={editingId ? editingName : newOperatorName}
                onChange={(e) =>
                  editingId
                    ? setEditingName(e.target.value)
                    : setNewOperatorName(e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="operatorType">Tipo</Label>
              <Input
                id="operatorType"
                placeholder="Ej: MOVISTAR"
                value={editingId ? editingType : newOperatorType}
                onChange={(e) =>
                  editingId
                    ? setEditingType(e.target.value)
                    : setNewOperatorType(e.target.value)
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editingId ? (
              <>
                <Button
                  type="button"
                  onClick={() => handleUpdate(editingId)}
                  disabled={submitting}
                  size="sm"
                >
                  Guardar Cambios
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setEditingName('')
                    setEditingType('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={submitting} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Operador
              </Button>
            )}
          </div>
        </form>

        {/* List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : operators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay operadores registrados</div>
        ) : (
          <div className="space-y-2">
            {operators.map((operator) => (
              <div
                key={operator.id}
                className={`flex items-center justify-between p-3 rounded border ${
                  operator.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'
                }`}
              >
                <div>
                  <p className="font-medium">{operator.name}</p>
                  <p className="text-xs text-gray-500">{operator.type}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(operator)}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(operator.id)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
