import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Eye, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { BankAccount } from '@/types/api'

export function BankAccountsPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    // Filtrar cuentas por búsqueda
    if (searchTerm.trim() === '') {
      setFilteredAccounts(accounts)
    } else {
      const filtered = accounts.filter(
        (account) =>
          account.bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.accountNumber.includes(searchTerm) ||
          account.accountHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.transferencista?.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAccounts(filtered)
    }
  }, [searchTerm, accounts])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ bankAccounts: BankAccount[] }>('/api/bank-account/all')
      setAccounts(response.bankAccounts)
      setFilteredAccounts(response.bankAccounts)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar cuentas bancarias')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleViewTransactions = (accountId: string) => {
    navigate(`/bank-account/${accountId}/transactions`)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Cuentas Bancarias</h1>
          <p className="text-muted-foreground">Gestiona todas las cuentas bancarias del sistema</p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por banco, número de cuenta, titular o transferencista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Cuentas Bancarias ({filteredAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando cuentas...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron cuentas con ese criterio de búsqueda' : 'No hay cuentas bancarias registradas'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Banco</th>
                        <th className="pb-3 font-medium">Número de Cuenta</th>
                        <th className="pb-3 font-medium">Titular</th>
                        <th className="pb-3 font-medium">Transferencista</th>
                        <th className="pb-3 font-medium text-right">Saldo</th>
                        <th className="pb-3 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr key={account.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{account.bank.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm">{account.accountNumber}</td>
                          <td className="py-4 text-sm">{account.accountHolder}</td>
                          <td className="py-4 text-sm">{account.transferencista?.user.fullName}</td>
                          <td className="py-4 text-right font-semibold text-green-600">{formatCurrency(account.balance)}</td>
                          <td className="py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTransactions(account.id)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Transacciones
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredAccounts.map((account) => (
                    <Card key={account.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{account.bank.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Saldo</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(account.balance)}</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Titular</span>
                            <span>{account.accountHolder}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Transferencista</span>
                            <span>{account.transferencista?.user.fullName}</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTransactions(account.id)}
                          className="w-full gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Transacciones
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
