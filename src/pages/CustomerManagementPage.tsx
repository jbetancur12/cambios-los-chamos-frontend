import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useAllCustomerInvoiceData,
  useFactusMunicipalities,
  type CustomerInvoiceDataResponse,
} from '@/hooks/queries/useGiroQueries'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, Edit, Plus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

const TRIBUTE_OPTIONS = [
  { id: 18, label: 'Responsable de IVA' },
  { id: 21, label: 'No aplica' },
]

const DOCUMENT_OPTIONS = [
  { id: '3', label: 'Cédula de Ciudadanía', legalOrg: '2' },
  { id: '4', label: 'Tarjeta de Extranjería', legalOrg: '2' },
  { id: '5', label: 'Cédula de Extranjería', legalOrg: '2' },
  { id: '6', label: 'NIT', legalOrg: '1' },
]

interface CustomerFormState {
  id?: string
  names: string
  identification: string
  dv: string
  email: string
  phone: string
  address: string
  municipality_id: number
  tribute_id: number
  identification_document_id: string
  legal_organization_id: string
}

const EMPTY_FORM: CustomerFormState = {
  names: '',
  identification: '',
  dv: '',
  email: '',
  phone: '',
  address: '',
  municipality_id: 980,
  tribute_id: 21,
  identification_document_id: '3',
  legal_organization_id: '2',
}

export function CustomerManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM)

  const queryClient = useQueryClient()
  const { data: customers, isLoading } = useAllCustomerInvoiceData()
  const { data: municipalities = [] } = useFactusMunicipalities('')

  const filteredCustomers =
    customers?.filter((customer) => {
      const term = searchTerm.toLowerCase()
      return (
        customer.identification.toLowerCase().includes(term) ||
        customer.names.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      )
    }) || []

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (customer: CustomerInvoiceDataResponse) => {
    const legalOrg = customer.legal_organization_id || '2'
    const validTributes = [18, 21]
    setForm({
      id: customer.id,
      names: customer.names,
      identification: customer.identification,
      dv: customer.dv || '',
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      municipality_id: customer.municipality_id || 980,
      tribute_id: validTributes.includes(customer.tribute_id) ? customer.tribute_id : 21,
      identification_document_id: customer.identification_document_id || '3',
      legal_organization_id: legalOrg,
    })
    setModalOpen(true)
  }

  const setField = (field: keyof CustomerFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value
    if (field === 'identification_document_id') {
      const doc = DOCUMENT_OPTIONS.find((d) => d.id === value)
      setForm((prev) => ({
        ...prev,
        identification_document_id: value,
        legal_organization_id: doc ? doc.legalOrg : prev.legal_organization_id,
        // Si cambia el tipo de documento, ajustar tribute a uno válido para ese tipo
        tribute_id: doc && doc.legalOrg === '1' ? prev.tribute_id : 21,
        dv: doc && doc.legalOrg === '1' ? prev.dv : '',
      }))
      return
    }
    setForm((prev) => ({
      ...prev,
      [field]: field === 'municipality_id' || field === 'tribute_id' ? Number(value) : value,
    }))
  }

  const isCompany = form.legal_organization_id === '1'

  const handleSave = async () => {
    if (
      !form.names.trim() ||
      !form.identification.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Correo electrónico inválido')
      return
    }
    if (isCompany && !form.dv.trim()) {
      toast.error('El DV es obligatorio para NIT')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        names: form.names.trim(),
        identification: form.identification.trim(),
        dv: form.dv.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        municipality_id: form.municipality_id,
        tribute_id: form.tribute_id,
        identification_document_id: form.identification_document_id,
        legal_organization_id: form.legal_organization_id,
      }
      await api.post('/invoice-clientes/admin/save', payload)
      await queryClient.invalidateQueries({ queryKey: ['allCustomerInvoiceData'] })
      toast.success(form.id ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente')
      setModalOpen(false)
      setForm(EMPTY_FORM)
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || 'Error al guardar el cliente')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes Registrados (Facturación)</h2>
          <p className="text-muted-foreground mt-2">
            Administra la base de datos de usuarios registrados para recibir facturación electrónica POS.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[linear-gradient(to_right,#136BBC,#274565)] hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Crear Cliente
        </Button>
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
                        <Button variant="ghost" size="sm" onClick={() => openEdit(customer)}>
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-background rounded-lg shadow-xl w-full max-w-lg overflow-hidden max-h-[90dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{form.id ? 'Editar Cliente' : 'Crear Cliente'}</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <Label htmlFor="cNames">Nombre / Razón Social</Label>
                <Input
                  id="cNames"
                  value={form.names}
                  onChange={setField('names')}
                  placeholder="Nombre completo o razón social"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cDocument">Tipo de Documento</Label>
                  <select
                    id="cDocument"
                    value={form.identification_document_id}
                    onChange={setField('identification_document_id')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {DOCUMENT_OPTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cIdentification">Identificación</Label>
                  <Input
                    id="cIdentification"
                    value={form.identification}
                    onChange={setField('identification')}
                    placeholder={isCompany ? 'NIT' : 'Número de cédula'}
                  />
                </div>
              </div>
              {isCompany && (
                <div className="space-y-1">
                  <Label htmlFor="cDv">
                    DV <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cDv" value={form.dv} onChange={setField('dv')} placeholder="Obligatorio para NIT" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cEmail">Correo Electrónico</Label>
                  <Input
                    id="cEmail"
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cPhone">Teléfono</Label>
                  <Input
                    id="cPhone"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="Teléfono de contacto"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cAddress">Dirección</Label>
                <Input
                  id="cAddress"
                  value={form.address}
                  onChange={setField('address')}
                  placeholder="Dirección de facturación"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cTribute">Régimen Tributario</Label>
                  <select
                    id="cTribute"
                    value={form.tribute_id}
                    onChange={setField('tribute_id')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TRIBUTE_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cMunicipality">Municipio</Label>
                  <select
                    id="cMunicipality"
                    value={form.municipality_id}
                    onChange={setField('municipality_id')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {municipalities.length === 0 && <option value={980}>Bogotá D.C.</option>}
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[linear-gradient(to_right,#136BBC,#274565)] hover:opacity-90 transition-opacity"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
