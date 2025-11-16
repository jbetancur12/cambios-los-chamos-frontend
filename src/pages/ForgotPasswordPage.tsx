import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!email) {
      toast.error('Ingresa tu email')
      return
    }

    // Simple email validation
    if (!email.includes('@')) {
      toast.error('Ingresa un email válido')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/user/send-reset-password', { email })

      toast.success('✅ Email enviado correctamente')
      toast.info('Revisa tu correo para restablecer tu contraseña')
      setSent(true)

      // Redirigir a login después de 3 segundos
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      console.error('Error enviando email de reset:', error)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al enviar el email')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src="/icons/icon-192x192.png" alt="Cambios los Chamos" className="h-16 w-16 rounded-lg shadow-md" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-gray-600">
            Ingresa tu email para recibir un enlace de recuperación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="border-gray-300"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm mt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a iniciar sesión
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold mb-2">✅ Email Enviado</p>
                <p className="text-sm text-gray-700">Hemos enviado un enlace de recuperación a:</p>
                <p className="font-semibold text-gray-900 mt-2">{email}</p>
              </div>

              <p className="text-sm text-gray-600">
                Revisa tu correo (incluyendo la carpeta de spam) para encontrar el enlace de recuperación.
              </p>

              <div className="text-xs text-gray-500">Redirigiendo a inicio de sesión en 3 segundos...</div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Ir a inicio de sesión ahora
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
