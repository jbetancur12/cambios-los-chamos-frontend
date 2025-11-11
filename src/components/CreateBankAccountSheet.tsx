import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Bank, AccountType } from '@/types/api'

interface CreateBankAccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferencistaId: string
  transferencistaName: string
  onAccountCreated: () => void
}

export function CreateBankAccountSheet({
  open,
  onOpenChange,
  transferencistaId,
  transferencistaName,
  onAccountCreated,
}: CreateBankAccountSheetProps) {
  const [loading, setLoading] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [formData, setFormData] = useState({
    bankId: '',
    accountNumber: '',
    accountHolder: '',
    accountType: 'AHORROS' as AccountType,
  })

  useEffect(() => {
    if (open) {
      fetchBanks()
    }
  }, [open])

  const fetchBanks = async () => {
    try {
      const response = await api.get<{ banks: Bank[] }>('/api/bank/all')
      setBanks(response.banks || [])
    } catch (error) {
      toast.error('Error al cargar bancos')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bankId || !formData.accountNumber || !formData.accountHolder) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      setLoading(true)
      await api.post('/api/bank-account/create', {
        transferencistaId,
        ...formData,
      })

      // Reset form
      setFormData({
        bankId: '',
        accountNumber: '',
        accountHolder: '',
        accountType: 'AHORROS',
      })

      onAccountCreated()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear cuenta bancaria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Agregar Cuenta Bancaria</SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">{transferencistaName}</p>
        </SheetHeader>

        <SheetBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bank */}
            <div className="space-y-2">
              <Label htmlFor="bankId">Banco</Label>
              <select
                id="bankId"
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Seleccionar banco</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="0000000000000000000000"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                required
              />
            </div>

            {/* Account Holder */}
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Titular de la Cuenta</Label>
              <Input
                id="accountHolder"
                type="text"
                placeholder="Nombre completo del titular"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                required
              />
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="accountType">Tipo de Cuenta</Label>
              <select
                id="accountType"
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as AccountType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="AHORROS">Ahorros</option>
                <option value="CORRIENTE">Corriente</option>
              </select>
            </div>

            {/* Info */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Esta cuenta será asignada al transferencista <span className="font-semibold">{transferencistaName}</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Cuenta'}
              </Button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
