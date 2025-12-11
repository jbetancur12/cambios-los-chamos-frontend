import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { UserRole } from '@/types/api'

interface CreateUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
  role: UserRole
}

export function CreateUserSheet({ open, onOpenChange, onUserCreated, role }: CreateUserSheetProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  })

  const getRoleLabel = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      TRANSFERENCISTA: 'Transferencista',
      MINORISTA: 'Minorista',
    }
    return roleMap[role]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      setLoading(true)
      await api.post('/user/register', { ...formData, role })

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
      })

      onUserCreated()
      onUserCreated()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear usuario'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader onClose={() => onOpenChange(false)}>
          <SheetTitle>Crear {getRoleLabel(role)}</SheetTitle>
        </SheetHeader>

        <SheetBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {/* Role Info */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Este usuario será creado con el rol de{' '}
                <span className="font-semibold text-foreground">{getRoleLabel(role)}</span>
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
              <Button
                type="submit"
                className="flex-1 bg-[linear-gradient(to_right,#136BBC,#274565)]"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
