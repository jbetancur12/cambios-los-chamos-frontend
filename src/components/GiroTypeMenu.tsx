import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface GiroTypeMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferencia: () => void
  onPagoMovil: () => void
  onRecarga: () => void
}

export function GiroTypeMenu({
  open,
  onOpenChange,
  onTransferencia,
  onPagoMovil,
  onRecarga,
}: GiroTypeMenuProps) {
  const handleOptionClick = (callback: () => void) => {
    callback()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tipo de Giro</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-6">
          <Button
            onClick={() => handleOptionClick(onTransferencia)}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">Transferencia</p>
              <p className="text-xs text-gray-500">Transferencia bancaria</p>
            </div>
          </Button>

          <Button
            onClick={() => handleOptionClick(onPagoMovil)}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">Pago Móvil</p>
              <p className="text-xs text-gray-500">Transferencia por teléfono</p>
            </div>
          </Button>

          <Button
            onClick={() => handleOptionClick(onRecarga)}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">Recarga</p>
              <p className="text-xs text-gray-500">Recarga de saldo telefónico</p>
            </div>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
