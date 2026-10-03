import { Button } from '@/components/ui/button'

interface PaginationBarProps {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

// Barra de paginación compartida (mismo look que /giros)
export function PaginationBar({ page, pages, total, onPageChange, disabled }: PaginationBarProps) {
  const totalPages = Math.max(1, pages)
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Página {page} de {totalPages} • Total: {total}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || disabled}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || disabled}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
