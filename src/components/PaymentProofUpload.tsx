import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Upload, Download, Trash2, FileIcon } from 'lucide-react'

interface PaymentProofUploadProps {
  giroId: string
  onProofUploaded?: (proofUrl: string) => void
  existingProof?: {
    key: string
    url: string
    thumbnailUrl?: string
  }
  disabled?: boolean
}

export function PaymentProofUpload({
  giroId,
  onProofUploaded,
  existingProof,
  disabled = false,
}: PaymentProofUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [proof, setProof] = useState<{ key: string; url: string; thumbnailUrl?: string } | null>(
    existingProof || null
  )
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPG, PNG, GIF) y PDFs')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<{
        giro: any
        paymentProofUrl: string
        thumbnailUrl?: string
        message: string
      }>(`/api/giro/${giroId}/payment-proof/upload`, formData)

      const newProof = {
        key: response.giro.paymentProofKey,
        url: response.paymentProofUrl,
        thumbnailUrl: response.thumbnailUrl,
      }

      setProof(newProof)
      onProofUploaded?.(response.paymentProofUrl)
      toast.success('Comprobante de pago subido exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al subir el comprobante')
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
    } catch (error: any) {
      toast.error('Error al descargar el comprobante')
    }
  }

  const handleDelete = async () => {
    if (!proof) return

    try {
      setUploading(true)
      // Note: We could implement a delete endpoint, but for now we'll just clear the local state
      // and let the user upload a new file which will replace the old one
      setProof(null)
      toast.success('Comprobante removido. Puedes subir uno nuevo.')
    } catch (error: any) {
      toast.error('Error al eliminar el comprobante')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Comprobante de Pago</Label>

      {proof ? (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 space-y-3">
          {proof.thumbnailUrl ? (
            <div className="relative w-full h-48 rounded-md overflow-hidden bg-gray-100">
              <img
                src={proof.thumbnailUrl}
                alt="Payment proof thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end p-2">
                <p className="text-xs text-white font-medium truncate">{proof.key}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Comprobante cargado</p>
                <p className="text-xs text-green-700 dark:text-green-300 truncate">{proof.key}</p>
              </div>
            </div>
          )}

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
              onClick={handleDelete}
              disabled={uploading || disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cambiar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,application/pdf"
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
              <p className="text-xs text-blue-700 dark:text-blue-300">JPG, PNG, GIF o PDF (máx 10MB)</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
