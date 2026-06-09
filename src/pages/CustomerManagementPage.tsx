import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAllCustomerInvoiceData } from '@/hooks/queries/useGiroQueries'
import { Search, Edit } from 'lucide-react'

export function CustomerManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: customers, isLoading } = useAllCustomerInvoiceData()

  const filteredCustomers =
    customers?.filter((customer) => {
      const term = searchTerm.toLowerCase()
      return (
        customer.identification.toLowerCase().includes(term) ||
        customer.names.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      )
    }) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes Registrados (Facturación)</h2>
          <p className="text-muted-foreground mt-2">
            Administra la base de datos de usuarios registrados para recibir facturación electrónica POS.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
            <div>
              <CardTitle>Directorio de Clientes</CardTitle>
              <CardDescription>
                Se listan todos los clientes que han completado el formulario de registro público.
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cédula, nombre..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Identificación (C.C/NIT)</TableHead>
                  <TableHead>Nombre / Razón Social</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead align="right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Cargando clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.identification}
                        {customer.dv && `-${customer.dv}`}
                      </TableCell>
                      <TableCell>{customer.names}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="ghost"
                          size="sm"
                          // In the future this could open a Dialog to edit manually, for now we just show it's possible
                          onClick={() =>
                            alert(
                              'La edición manual desde este panel estará disponible pronto. Puedes editar re-enviando el formulario público.'
                            )
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
