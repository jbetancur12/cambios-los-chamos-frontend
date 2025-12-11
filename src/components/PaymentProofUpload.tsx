import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Upload, Download, FileIcon, CheckCircle } from 'lucide-react'
import type { Giro } from '@/types/api'

interface PaymentProofUploadProps {
  giroId: string
  onProofUploaded?: (proofUrl: string) => void
  existingProof?: {
    key: string
    url: string
  }
  disabled?: boolean
  minimalist?: boolean
}

export function PaymentProofUpload({
  giroId,
  onProofUploaded,
  existingProof,
  disabled = false,
  minimalist = false,
}: PaymentProofUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [proof, setProof] = useState<{ key: string; url: string } | null>(existingProof || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar 10MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPG, PNG, GIF)')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<{
        giro: Giro
        paymentProofUrl: string
        message: string
      }>(`/giro/${giroId}/payment-proof/upload`, formData)

      const newProof = {
        key: response.giro.paymentProofKey,
        url: response.paymentProofUrl,
      }

      setProof(newProof)
      onProofUploaded?.(response.paymentProofUrl)
      toast.success('Comprobante de pago subido exitosamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir el comprobante'
      toast.error(message)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async () => {
    if (!proof) return

    try {
      window.open(proof.url, '_blank')
    } catch {
      toast.error('Error al descargar el comprobante')
    }
  }

  const handleChangeProof = () => {
    setProof(null)
    onProofUploaded?.('')
    // El usuario podrá seleccionar uno nuevo que reemplazará automáticamente el anterior
  }

  const truncateFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename

    const ext = filename.substring(filename.lastIndexOf('.'))
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
    const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 3)

    return `${truncatedName}...${ext}`
  }

  if (minimalist) {
    return (
      <div className="w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileSelect}
          disabled={uploading || disabled}
          className="hidden"
        />
        {proof ? (
          <div className="w-full flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-1.5 rounded-full">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-emerald-800">¡Captura Subida!</span>
                <span className="text-xs text-emerald-600">Lista para enviar</span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleChangeProof}
              disabled={uploading || disabled}
              className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 h-8 px-2 text-xs"
            >
              Cambiar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-full h-12 gap-2 bg-white border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Subiendo...' : 'Subir captura de pantalla'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label>Comprobante de Pago</Label>

      {proof ? (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 space-y-3">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Comprobante cargado</p>
              <p className="text-xs text-green-700 dark:text-green-300">{truncateFilename(proof.key)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={uploading || disabled}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleChangeProof}
              disabled={uploading || disabled}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              Cambiar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {uploading ? 'Subiendo...' : 'Selecciona o arrastra el comprobante'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">JPG, PNG o GIF (máx 10MB)</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
