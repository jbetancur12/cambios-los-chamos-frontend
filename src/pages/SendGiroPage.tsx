import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
// import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { TransferForm } from '@/components/forms/TransferForm'
import { MobilePaymentForm } from '@/components/forms/MobilePaymentForm'
import { RechargeForm } from '@/components/forms/RechargeForm'

type GiroType = 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'RECARGA'

interface GiroTypeOption {
  value: GiroType
  label: string
  description: string
}

const giroTypes: GiroTypeOption[] = [
  {
    value: 'TRANSFERENCIA',
    label: 'Giro a banco',
    description: 'Transferencia a cuenta bancaria',
  },
  {
    value: 'PAGO_MOVIL',
    label: 'Giro a pago móvil',
    description: 'Pago a teléfono celular',
  },
  {
    value: 'RECARGA',
    label: 'Recarga a celular',
    description: 'Recarga de saldo celular',
  },
]

export function SendGiroPage() {
  // const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<GiroType>('TRANSFERENCIA')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSuccess = () => {
    // No navegar - permitir crear múltiples giros seguidos
    toast.success('✓ Giro creado. Puedes enviar otro giro si lo deseas.')
  }

  const currentTypeLabel = giroTypes.find((t) => t.value === selectedType)?.label || ''

  return (
    <div className="container mx-auto max-w-5xl px-4 py-4">
      {/* Header - Removed empty headers and spacing */}

      {/* Type Selector Dropdown */}
      <Card className="mb-2 overflow-hidden border border-gray-200">
        <div className="relative">
          <Button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full justify-between rounded-none border-0 bg-card px-4 py-3 text-left font-semibold text-foreground hover:bg-accent h-auto"
          >
            <span className="text-lg md:text-lg">{currentTypeLabel}</span>
            <ChevronDown className={`h-6 w-6 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </Button>

          {dropdownOpen && (
            <div className="border-t border-border bg-card">
              {giroTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSelectedType(type.value)
                    setDropdownOpen(false)
                  }}
                  className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors last:border-0 ${selectedType === type.value ? 'bg-accent/50' : 'hover:bg-accent'
                    }`}
                >
                  <span className={`font-medium text-base md:text-lg ${selectedType === type.value ? 'text-primary' : 'text-foreground'}`}>
                    {type.label}
                  </span>
                  {/* <span className="text-sm text-gray-500">{type.description}</span> */}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Forms - Rendered inline based on selection */}
      <Card className="border border-gray-200">
        {selectedType === 'TRANSFERENCIA' && <TransferForm onSuccess={handleSuccess} />}
        {selectedType === 'PAGO_MOVIL' && <MobilePaymentForm onSuccess={handleSuccess} />}
        {selectedType === 'RECARGA' && <RechargeForm onSuccess={handleSuccess} />}
      </Card>

      {/* Back Button */}
      {/* <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          onClick={() => navigate('/giros')}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Volver a Solicitudes
        </Button>
      </div> */}
    </div>
  )
}
