import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Trash2, Plus, Edit2, Phone, Check, X } from 'lucide-react'

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
      const data = await api.get<RechargeOperator[]>('/recharge-operators/all')
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
      const newOperator = await api.post<RechargeOperator>('/recharge-operators', {
        name: newOperatorName,
        type: newOperatorType,
      })
      setOperators([...operators, newOperator])
      setNewOperatorName('')
      setNewOperatorType('')
      toast.success('Operador creado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear operador'
      toast.error(message)
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
      const updated = await api.put<RechargeOperator>(`/recharge-operators/${id}`, {
        name: editingName,
        type: editingType,
      })
      setOperators(operators.map((op) => (op.id === id ? updated : op)))
      setEditingId(null)
      setEditingName('')
      setEditingType('')
      toast.success('Operador actualizado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar operador'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este operador?')) {
      return
    }

    try {
      await api.delete(`/recharge-operators/${id}`)
      setOperators(operators.filter((op) => op.id !== id))
      toast.success('Operador eliminado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar operador'
      toast.error(message)
    }
  }

  const startEdit = (operator: RechargeOperator) => {
    setEditingId(operator.id)
    setEditingName(operator.name)
    setEditingType(operator.type)
  }

  return (
    <Card>
      <CardHeader className="border-b text-white" style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5" />
          Gestionar Operadores de Recarga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Form */}
        <form
          onSubmit={handleAdd}
          className={`space-y-4 p-6 rounded-lg border-2 transition-all ${
            editingId ? 'border-blue-200' : 'border-blue-200'
          }`}
          style={{ backgroundColor: editingId ? 'rgba(19, 107, 188, 0.05)' : 'rgba(19, 107, 188, 0.05)' }}
        >
          <div className="flex items-center gap-2">
            {editingId ? (
              <Edit2 className="h-5 w-5" style={{ color: '#136BBC' }} />
            ) : (
              <Plus className="h-5 w-5" style={{ color: '#136BBC' }} />
            )}
            <h3 className="font-bold text-sm">{editingId ? 'Editar Operador' : 'Nuevo Operador'}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operatorName" className="text-xs font-semibold">
                Nombre
              </Label>
              <Input
                id="operatorName"
                placeholder="Ej: Movistar"
                value={editingId ? editingName : newOperatorName}
                onChange={(e) => (editingId ? setEditingName(e.target.value) : setNewOperatorName(e.target.value))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="operatorType" className="text-xs font-semibold">
                Tipo
              </Label>
              <Input
                id="operatorType"
                placeholder="Ej: MOVISTAR"
                value={editingId ? editingType : newOperatorType}
                onChange={(e) => (editingId ? setEditingType(e.target.value) : setNewOperatorType(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {editingId ? (
              <>
                <Button
                  type="button"
                  onClick={() => handleUpdate(editingId)}
                  disabled={submitting}
                  className="flex items-center gap-2 text-white"
                  style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}
                >
                  <Check className="h-4 w-4" />
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
                  className="flex items-center gap-2"
                  style={{ borderColor: '#136BBC', color: '#136BBC' }}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 text-white"
                style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}
              >
                <Plus className="h-4 w-4" />
                Agregar Operador
              </Button>
            )}
          </div>
        </form>

        {/* List */}
        <div>
          <h3 className="font-bold text-sm mb-4 text-gray-800">Operadores Registrados ({operators.length})</h3>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-pulse">Cargando...</div>
            </div>
          ) : operators.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <Phone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay operadores registrados</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {operators.map((operator) => (
                <div
                  key={operator.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    operator.isActive
                      ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{operator.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{operator.type}</p>
                    {!operator.isActive && (
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(operator)}
                      className="p-2.5 hover:bg-blue-100 rounded-lg transition-colors"
                      style={{ color: '#136BBC' }}
                      title="Editar operador"
                      aria-label="Editar operador"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(operator.id)}
                      className="p-2.5 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-800"
                      title="Eliminar operador"
                      aria-label="Eliminar operador"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
