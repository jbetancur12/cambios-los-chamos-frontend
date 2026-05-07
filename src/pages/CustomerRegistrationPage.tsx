import { useState, useEffect, useRef } from 'react'
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useFactusMunicipalities, useCustomerInvoiceData } from '@/hooks/queries/useGiroQueries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function CustomerRegistrationPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    identification: '',
    dv: '',
    names: '',
    email: '',
    phone: '',
    address: '',
    municipality_id: '',
  })
  
  const [municipalitySearch, setMunicipalitySearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedIdentification, setDebouncedIdentification] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isUpdateMode, setIsUpdateMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce municipality search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(municipalitySearch), 500)
    return () => clearTimeout(timer)
  }, [municipalitySearch])

  // Debounce cedula lookup
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedIdentification(formData.identification), 800)
    return () => clearTimeout(timer)
  }, [formData.identification])

  // Click outside to close municipality dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const { data: municipalities, isLoading: loadingMunicipalities } = useFactusMunicipalities(debouncedSearch)
  const { data: existingCustomer, isLoading: loadingExistingCustomer } = useCustomerInvoiceData(debouncedIdentification)

  // Auto-fill form if an existing customer is found by cedula
  useEffect(() => {
    if (existingCustomer) {
      setIsUpdateMode(true)
      setFormData({
        identification: existingCustomer.identification,
        dv: existingCustomer.dv ?? '',
        names: existingCustomer.names,
        email: existingCustomer.email,
        phone: existingCustomer.phone,
        address: existingCustomer.address,
        municipality_id: existingCustomer.municipality_id ? existingCustomer.municipality_id.toString() : '',
      })
      // Pre-fill the municipality display text if available
      setMunicipalitySearch(existingCustomer.municipality_name ?? '')
    } else {
      setIsUpdateMode(false)
    }
  }, [existingCustomer])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.municipality_id) {
      toast.error('Debe buscar y seleccionar un municipio de la lista.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        municipality_id: formData.municipality_id ? parseInt(formData.municipality_id) : undefined,
        municipality_name: municipalitySearch || undefined,
      }
      await api.post('/invoice-clientes/register', payload)
      setSuccess(true)
      toast.success(isUpdateMode ? 'Datos actualizados exitosamente.' : 'Datos registrados exitosamente.')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar los datos. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg shadow-xl text-center py-10">
          <CardContent className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isUpdateMode ? '¡Datos Actualizados!' : '¡Registro Exitoso!'}
            </h2>
            <p className="text-gray-500">
              {isUpdateMode
                ? 'Tu información de facturación ha sido actualizada correctamente.'
                : 'Tus datos de facturación han sido guardados. Ya puedes cerrar esta ventana.'}
            </p>
            <Button className="mt-4" onClick={() => { setSuccess(false); setIsUpdateMode(false) }} variant="outline">
              Registrar otra persona
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Registro de Facturación</CardTitle>
          <CardDescription className="text-base">
            Ingresa tus datos para recibir facturación electrónica en futuros giros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Update mode warning banner */}
            {isUpdateMode && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Cédula ya registrada</p>
                  <p className="text-amber-700">Se han cargado tus datos actuales. Los cambios que realices actualizarán tu información existente.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label htmlFor="identification">Cédula / NIT <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="identification"
                    name="identification"
                    required
                    placeholder="Ej: 1010202030"
                    value={formData.identification}
                    onChange={handleChange}
                  />
                  {loadingExistingCustomer && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor="dv">DV</Label>
                <Input
                  id="dv"
                  name="dv"
                  placeholder="Ej: 1"
                  value={formData.dv}
                  onChange={handleChange}
                  maxLength={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="names">Nombre Completo o Razón Social <span className="text-destructive">*</span></Label>
              <Input
                id="names"
                name="names"
                required
                placeholder="Ej: Juan Pérez"
                value={formData.names}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono <span className="text-destructive">*</span></Label>
                <Input
                  id="phone"
                  name="phone"
                  required
                  placeholder="Ej: 3001234567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección <span className="text-destructive">*</span></Label>
                <Input
                  id="address"
                  name="address"
                  required
                  placeholder="Ej: Calle 1A #2-3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2 relative" ref={dropdownRef}>
              <Label htmlFor="municipalitySearch">Municipio <span className="text-destructive">*</span></Label>
              <Input
                id="municipalitySearch"
                placeholder="Escribe para buscar... Ej: Bogotá"
                value={municipalitySearch}
                onChange={(e) => {
                  setMunicipalitySearch(e.target.value)
                  setIsDropdownOpen(true)
                  if (!e.target.value) handleSelectChange('municipality_id', '')
                }}
                onFocus={() => setIsDropdownOpen(true)}
                autoComplete="off"
              />
              
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {loadingMunicipalities ? (
                    <div className="p-4 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                    </div>
                  ) : municipalities && municipalities.length > 0 ? (
                    <ul className="py-1">
                      {municipalities.map((m) => (
                        <li
                          key={m.id}
                          className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                          onClick={() => {
                            handleSelectChange('municipality_id', m.id.toString())
                            setMunicipalitySearch(`${m.name} - ${m.department}`)
                            setIsDropdownOpen(false)
                          }}
                        >
                          {m.name} - {m.department}
                        </li>
                      ))}
                    </ul>
                  ) : debouncedSearch.length >= 3 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No se encontraron resultados para "{debouncedSearch}"
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Escribe al menos 3 letras para iniciar la búsqueda...
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 mb-2">Los campos marcados con (*) son obligatorios.</p>

            <Button type="submit" className="w-full font-semibold" disabled={loading} size="lg">
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Registrando...' : 'Registrar Datos'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
