import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface DeleteConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    loading?: boolean
}

export function DeleteConfirmationModal({
    open,
    onOpenChange,
    onConfirm,
    title = '¿Estás seguro?',
    description = 'Esta acción no se puede deshacer.',
    loading = false,
}: DeleteConfirmationModalProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (open) {
            setVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            const timer = setTimeout(() => setVisible(false), 200)
            document.body.style.overflow = 'unset'
            return () => clearTimeout(timer)
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [open])

    if (!visible && !open) return null

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200',
                open ? 'opacity-100' : 'opacity-0'
            )}
            onClick={() => onOpenChange(false)}
        >
            <div
                className={cn(
                    'bg-background rounded-lg shadow-xl w-full max-w-sm overflow-hidden transition-all duration-200 transform',
                    open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-6 text-sm text-balance text-muted-foreground">
                    {description}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            'Eliminar'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
