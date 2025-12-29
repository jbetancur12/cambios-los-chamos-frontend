
import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetBody
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Select, SelectItem, SelectValue } from '@/components/ui/select'
import { useAllUsers } from '@/hooks/queries/useUserQueries'
import { Loader2 } from 'lucide-react'
import type { Giro } from '@/types/api'
// import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface ReassignGiroModalProps {
    giro: Giro | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ReassignGiroModal({ giro, open, onOpenChange, onSuccess }: ReassignGiroModalProps) {
    // const { user } = useAuth()
    const [selectedTransferencistaId, setSelectedTransferencistaId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch only transferencistas
    const { data: transferencistas = [], isLoading } = useAllUsers('TRANSFERENCISTA')

    // Filter out the current transferencista and ensure valid ID
    // Filter out the current transferencista and ensure valid ID
    const availableTransferencistas = transferencistas.filter(
        (t) => t.transferencistaId && t.transferencistaId !== giro?.transferencista?.id
    )

    const hasAvailable = availableTransferencistas.length > 0

    const handleReassign = async () => {
        if (!giro || !selectedTransferencistaId) return

        setIsSubmitting(true)
        try {
            await api.post(`/giro/${giro.id}/reassign`, {
                newTransferencistaId: selectedTransferencistaId,
            })
            toast.success('Giro reasignado exitosamente')
            onSuccess()
            onOpenChange(false)
            setSelectedTransferencistaId('')
        } catch (error) {
            console.error(error)
            toast.error('Error al reasignar el giro')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!giro) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader onClose={() => onOpenChange(false)}>
                    <SheetTitle>Reasignar Giro</SheetTitle>
                </SheetHeader>

                <SheetBody>
                    <p className="text-sm text-muted-foreground mb-4">
                        Selecciona un nuevo transferencista para procesar este giro de {giro.amountBs.toFixed(2)} Bs.
                    </p>

                    <div className="py-2 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Nuevo Transferencista</label>
                            {isLoading ? (
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando transferencistas...
                                </div>
                            ) : !hasAvailable ? (
                                <p className="text-sm text-red-600">
                                    No hay otros transferencistas disponibles.
                                </p>
                            ) : (
                                <Select
                                    value={selectedTransferencistaId}
                                    onValueChange={setSelectedTransferencistaId}
                                    disabled={isLoading || isSubmitting || !hasAvailable}
                                >
                                    <SelectValue placeholder="Seleccionar transferencista" />
                                    {availableTransferencistas.map((t) => (
                                        <SelectItem key={t.transferencistaId} value={t.transferencistaId || ''}>
                                            {t.fullName}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t mt-6">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleReassign} disabled={!selectedTransferencistaId || isSubmitting || !hasAvailable} className="flex-1">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reasignar
                        </Button>
                    </div>
                </SheetBody>
            </SheetContent>
        </Sheet>
    )
}
