import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Trash2, Plus, Edit2 } from 'lucide-react'

interface RechargeAmount {
  id: string
  amountBs: number
  isActive: boolean
}

export function RechargeAmountsManager() {
  const [amounts, setAmounts] = useState<RechargeAmount[]>([])
  const [loading, setLoading] = useState(true)
  const [newAmount, setNewAmount] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAmounts()
  }, [])

  const loadAmounts = async () => {
    try {
      setLoading(true)
      const data = await api.get<RechargeAmount[]>('/recharge-amounts/all')
      setAmounts(data)
    } catch (error) {
      console.error('Error loading amounts:', error)
      toast.error('Error al cargar montos')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAmount || Number(newAmount) <= 0) {
      toast.error('Por favor ingresa un monto válido')
      return
    }

    setSubmitting(true)
    try {
      const newAmountData = await api.post<RechargeAmount>('/recharge-amounts', {
        amountBs: Number(newAmount),
      })
      setAmounts([...amounts, newAmountData].sort((a, b) => a.amountBs - b.amountBs))
      setNewAmount('')
      toast.success('Monto creado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear monto'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingAmount || Number(editingAmount) <= 0) {
      toast.error('Por favor ingresa un monto válido')
      return
    }

    setSubmitting(true)
    try {
      const updated = await api.put<RechargeAmount>(`/recharge-amounts/${id}`, {
        amountBs: Number(editingAmount),
      })
      setAmounts(amounts.map((amt) => (amt.id === id ? updated : amt)).sort((a, b) => a.amountBs - b.amountBs))
      setEditingId(null)
      setEditingAmount('')
      toast.success('Monto actualizado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar monto'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este monto?')) {
      return
    }

    try {
      await api.delete(`/recharge-amounts/${id}`)
      setAmounts(amounts.filter((amt) => amt.id !== id))
      toast.success('Monto eliminado exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar monto'
      toast.error(message)
    }
  }

  const startEdit = (amount: RechargeAmount) => {
    setEditingId(amount.id)
    setEditingAmount(amount.amountBs.toString())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Montos de Recarga</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        <form onSubmit={handleAdd} className="space-y-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-sm">{editingId ? 'Editar Monto' : 'Nuevo Monto en Bolívares'}</h3>

          <div>
            <Label htmlFor="amountBs">Monto (Bs)</Label>
            <Input
              id="amountBs"
              type="number"
              placeholder="Ej: 50000"
              step="1"
              value={editingId ? editingAmount : newAmount}
              onChange={(e) => (editingId ? setEditingAmount(e.target.value) : setNewAmount(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            {editingId ? (
              <>
                <Button type="button" onClick={() => handleUpdate(editingId)} disabled={submitting} size="sm">
                  Guardar Cambios
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setEditingAmount('')
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
                Agregar Monto
              </Button>
            )}
          </div>
        </form>

        {/* List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : amounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay montos registrados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {amounts.map((amount) => (
              <div
                key={amount.id}
                className={`flex items-center justify-between p-4 rounded border ${
                  amount.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'
                }`}
              >
                <div>
                  <p className="font-bold text-lg">{amount.amountBs.toLocaleString('es-VE')} Bs</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(amount)}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(amount.id)}
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
