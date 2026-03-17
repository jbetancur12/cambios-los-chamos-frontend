import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCustomerInvoiceData } from '@/hooks/queries/useGiroQueries'
import type { Giro } from '@/types/api'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FacturarGiroDialogProps {
  giro: Giro
  isOpen: boolean
  onClose: () => void
  onFacturar: (giro: Giro, cedula: string) => void
  isPending: boolean
}

export function FacturarGiroDialog({
  giro,
  isOpen,
  onClose,
  onFacturar,
  isPending,
}: FacturarGiroDialogProps) {
  const [cedula, setCedula] = useState('')
  const [debouncedCedula, setDebouncedCedula] = useState('')

  // Debounce the cedula input so we don't spam the API while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCedula(cedula)
    }, 500)
    return () => clearTimeout(timer)
  }, [cedula])

  const {
    data: customerData,
    isLoading: isCheckingCustomer,
  } = useCustomerInvoiceData(debouncedCedula)

  // Reset state when opened with a new giro
  useEffect(() => {
    if (isOpen) {
      setCedula('')
      setDebouncedCedula('')
    }
  }, [isOpen, giro.id])

  if (!isOpen) return null

  const showCustomerInfo = !!customerData
  // Only show "not found" if they've typed a reasonable length cedula and we got a 404 (or null result)
  const showCustomerNotFound =
    debouncedCedula.length >= 5 && !isCheckingCustomer && !customerData

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">
            Generar Factura Electrónica
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Giro por{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
              }).format(giro.amountInput)}
            </span>
          </p>
        </div>

        <div className="space-y-3 relative">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Cédula o NIT del Cliente (Opcional)
          </label>
          <div className="relative">
            <Input
              placeholder="Ej: 1010202030"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="pl-9"
              autoFocus
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            {isCheckingCustomer && (
              <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            )}
          </div>

          {!cedula && (
            <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-md border text-center">
              Si dejas este campo vacío, la factura se emitirá a nombre de{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                "Consumidor Final"
              </strong>
              .
            </p>
          )}

          {showCustomerInfo && (
            <Alert className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <AlertTitle className="text-green-800 dark:text-green-400 text-sm">
                Cliente Verificado
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-500/80 text-xs mt-1">
                <div className="font-medium">{customerData.names}</div>
                <div>{customerData.email}</div>
                <div>{customerData.address}</div>
              </AlertDescription>
            </Alert>
          )}

          {showCustomerNotFound && (
            <Alert
              variant="destructive"
              className="bg-red-50/50 dark:bg-red-900/10"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">Cliente no registrado</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                La cédula <strong>{debouncedCedula}</strong> no se encuentra en
                nuestra base de datos.
                <br />
                Si continúas, la factura se emitirá a nombre de "Consumidor
                Final".
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={() => onFacturar(giro, debouncedCedula)}
            disabled={isPending}
          >
            {isPending ? 'Generando...' : 'Confirmar Factura'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
