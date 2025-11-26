import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2, Wallet, ArrowUpCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CreateBankAccountSheet } from '@/components/CreateBankAccountSheet'
import { RechargeBalanceSheet } from '@/components/RechargeBalanceSheet'
import type { BankAccount } from '@/types/api'

interface TransferencistaAccountsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferencistaId: string | null
  transferencistaName: string
}

export function TransferencistaAccountsSheet({
  open,
  onOpenChange,
  transferencistaId,
  transferencistaName,
}: TransferencistaAccountsSheetProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [rechargeSheetOpen, setRechargeSheetOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  const fetchAccounts = async () => {
    if (!transferencistaId) return

    try {
      setLoading(true)
      const response = await api.get<{ bankAccounts: BankAccount[] }>(
        `/bank-account/transferencista/${transferencistaId}`
      )
      setAccounts(response.bankAccounts || [])
    } catch (error: any) {
      toast.error('Error al cargar cuentas bancarias')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && transferencistaId) {
      fetchAccounts()
    }
  }, [open, transferencistaId])

  const handleAccountCreated = () => {
    setCreateSheetOpen(false)
    fetchAccounts()
    toast.success('Cuenta bancaria creada exitosamente')
  }

  const handleRecharge = (account: BankAccount) => {
    setSelectedAccount(account)
    setRechargeSheetOpen(true)
  }

  const handleBalanceUpdated = () => {
    setRechargeSheetOpen(false)
    setSelectedAccount(null)
    fetchAccounts()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader onClose={() => onOpenChange(false)}>
            <SheetTitle>Cuentas Bancarias</SheetTitle>
            <p className="text-sm text-muted-foreground mt-1">{transferencistaName}</p>
          </SheetHeader>

          <SheetBody>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando cuentas...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No hay cuentas bancarias registradas</p>
                <Button onClick={() => setCreateSheetOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primera cuenta
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-20">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        {/* Bank Name */}
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <p className="font-semibold text-lg">{account.bank.name}</p>
                        </div>

                        {/* Account Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Titular:</span>
                            <span className="font-medium">{account.accountHolder}</span>
                          </div>

                          {/* Balance */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-green-600" />
                              <span className="text-muted-foreground">Saldo:</span>
                              <span className="font-bold text-lg text-green-600">
                                {formatCurrency(account.balance)}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecharge(account)}
                              className="gap-2"
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                              Recargar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Account Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                  <Button className="w-full" onClick={() => setCreateSheetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar cuenta bancaria
                  </Button>
                </div>
              </>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Create Bank Account Sheet */}
      {transferencistaId && (
        <CreateBankAccountSheet
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          transferencistaId={transferencistaId}
          transferencistaName={transferencistaName}
          onAccountCreated={handleAccountCreated}
        />
      )}

      {/* Recharge Balance Sheet */}
      <RechargeBalanceSheet
        open={rechargeSheetOpen}
        onOpenChange={setRechargeSheetOpen}
        account={selectedAccount}
        onBalanceUpdated={handleBalanceUpdated}
      />
    </>
  )
}
