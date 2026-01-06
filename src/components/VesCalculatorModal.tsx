import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NumericFormat } from 'react-number-format'
import { RotateCcw } from 'lucide-react'

const STORAGE_KEY = 'ves_purchase_rate'

interface VesCalculatorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function VesCalculatorModal({ open, onOpenChange }: VesCalculatorModalProps) {
    const [vesAmount, setVesAmount] = useState('')
    const [purchaseRate, setPurchaseRate] = useState('')
    const [result, setResult] = useState<number | null>(null)
    const [savedRate, setSavedRate] = useState<string | null>(null)

    // Cargar tasa guardada del localStorage al montar
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            setSavedRate(stored)
            setPurchaseRate(stored)
        }
    }, [])

    // Guardar tasa en localStorage cuando cambia
    useEffect(() => {
        if (purchaseRate && parseFloat(purchaseRate) > 0) {
            localStorage.setItem(STORAGE_KEY, purchaseRate)
            setSavedRate(purchaseRate)
        }
    }, [purchaseRate])

    // Cálculo en tiempo real
    useEffect(() => {
        const vesNum = parseFloat(vesAmount)
        const rateNum = parseFloat(purchaseRate)

        if (isNaN(vesNum) || vesNum <= 0 || isNaN(rateNum) || rateNum <= 0) {
            setResult(null)
            return
        }

        const cop = vesNum * rateNum
        setResult(cop)
    }, [vesAmount, purchaseRate])

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const formatNumber = (value: string) => {
        const num = parseFloat(value)
        if (isNaN(num)) return value
        return num.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 6 })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-center">💱 Calculadora de Compra VES</SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Calcular COP a pagar por VES</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">Bolivares (VES) a comprar</label>
                                <NumericFormat
                                    id="amount"
                                    customInput={Input}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={2}
                                    fixedDecimalScale={false}
                                    prefix=""
                                    value={vesAmount}
                                    onValueChange={(values) => {
                                        setVesAmount(values.floatValue ? values.floatValue.toString() : '')
                                    }}
                                    placeholder="Ej: 5.000.000"
                                    allowNegative={false}
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-foreground">Tasa de compra (COP por VES)</label>
                                    {savedRate && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Guardada: {formatNumber(savedRate)}</span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    localStorage.removeItem(STORAGE_KEY)
                                                    setPurchaseRate('')
                                                    setSavedRate(null)
                                                }}
                                                title="Limpiar tasa guardada"
                                                className="h-8 w-8 p-0"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <NumericFormat
                                    id="rate"
                                    customInput={Input}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={6}
                                    fixedDecimalScale={false}
                                    prefix=""
                                    value={purchaseRate}
                                    onValueChange={(values) => {
                                        setPurchaseRate(values.floatValue ? values.floatValue.toString() : '')
                                    }}
                                    placeholder="Ej: 0.0004"
                                    allowNegative={false}
                                    required
                                />
                            </div>

                            {result !== null && (
                                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <p className="text-muted-foreground">COP a pagar</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(result)}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SheetContent>
        </Sheet>
    )
}
