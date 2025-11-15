import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'

export function VerifyEmailPage() {
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
      await api.post('/api/email_verification/confirm?token=' + token, {
        password,
        passwordConfirm,
      })

      toast.success('✅ Correo verificado correctamente')
      toast.success('Ya puedes iniciar sesión')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      console.error('Error verificando email:', error)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al verificar el correo')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verificar Correo</CardTitle>
          <CardDescription>Establece tu contraseña para activar tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
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

            {/* Confirmar Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? 'Verificando...' : 'Verificar y Continuar'}
            </Button>

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-700">
                ✅ Tu correo será verificado y podrás iniciar sesión inmediatamente después.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
