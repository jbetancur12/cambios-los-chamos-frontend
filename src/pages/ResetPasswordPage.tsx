import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido o no proporcionado')
      setTimeout(() => navigate('/login'), 2000)
    }
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!password || !passwordConfirm) {
      toast.error('Ingresa la contraseña en ambos campos')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== passwordConfirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/user/reset-password', {
        token,
        newPassword: password,
        newPasswordConfirm: passwordConfirm,
      })

      toast.success('✅ Contraseña restablecida correctamente')
      toast.success('Ya puedes iniciar sesión con tu nueva contraseña')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      console.error('Error restableciendo contraseña:', error)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al restablecer la contraseña')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña para recuperar tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nueva Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="Confirma tu nueva contraseña"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Botón */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>

            {/* Información */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-700">
                ✅ Tu contraseña será restablecida y podrás iniciar sesión inmediatamente después.
              </p>
            </div>

            {/* Link a login */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Volver a iniciar sesión
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
