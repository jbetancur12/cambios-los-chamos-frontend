import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCurrentExchangeRate } from '@/hooks/queries/useExchangeRateQueries'
import { NumericFormat } from 'react-number-format'

interface CalculatorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CalculatorModal({ open, onOpenChange }: CalculatorModalProps) {
    // React Query hook
    const rateQuery = useCurrentExchangeRate()
    const rate = rateQuery.data

    // Handle errors
    useEffect(() => {
        if (rateQuery.error) {
            toast.error('Error al obtener tasas de cambio')
        }
    }, [rateQuery.error])

    // Tab 1: BCV (Tasa oficial)
    const [usdBCV, setUsdBCV] = useState('')
    const [resultBCV, setResultBCV] = useState<{ ves: number; cop: number } | null>(null)

    // Tab 2: Precio manual
    const [usdManual, setUsdManual] = useState('')
    const [priceVES, setPriceVES] = useState('')
    const [resultManual, setResultManual] = useState<{ ves: number; cop: number } | null>(null)

    // Tab 3: VES a COP
    const [vesAmount, setVesAmount] = useState('')
    const [resultVES, setResultVES] = useState<number | null>(null)

    // Cálculo BCV en tiempo real
    useEffect(() => {
        if (!rate) return

        const usdNum = parseFloat(usdBCV)
        if (isNaN(usdNum) || usdNum <= 0) {
            setResultBCV(null)
            return
        }

        const ves = usdNum * rate.bcv
        const cop = ves * rate.sellRate
        setResultBCV({ ves, cop })
    }, [usdBCV, rate])

    // Cálculo Manual en tiempo real
    useEffect(() => {
        if (!rate) return

        const usdNum = parseFloat(usdManual)
        const priceNum = parseFloat(priceVES)

        if (isNaN(usdNum) || usdNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
            setResultManual(null)
            return
        }

        const ves = usdNum * priceNum
        const cop = ves * rate.sellRate
        setResultManual({ ves, cop })
    }, [usdManual, priceVES, rate])

    // Cálculo VES a COP en tiempo real
    useEffect(() => {
        if (!rate) return

        const vesNum = parseFloat(vesAmount)
        if (isNaN(vesNum) || vesNum <= 0) {
            setResultVES(null)
            return
        }

        const cop = vesNum * rate.sellRate
        setResultVES(cop)
    }, [vesAmount, rate])

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const [activeTab, setActiveTab] = useState<'bcv' | 'manual' | 'ves'>('bcv')

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-4" onClose={() => onOpenChange(false)}>
                    <SheetTitle className="text-center">💱 Calculadora de Giros</SheetTitle>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Tasas actuales */}
                    {rate && (
                        <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <img src="/bcv.png" alt="BCV" className="w-6 h-auto" />
                                            <span className="text-sm font-medium">BCV</span>
                                        </div>
                                        <p className="text-lg font-bold text-[#136BBC] dark:text-blue-400">
                                            {formatCurrency(rate.bcv)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tasa Venta</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(rate.sellRate)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Manual Tabs */}
                    <div className="w-full">
                        <div className="grid w-full grid-cols-3 bg-muted p-1 rounded-md mb-2">
                            <button
                                onClick={() => setActiveTab('bcv')}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'bcv'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Tasa BCV
                            </button>
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'manual'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setActiveTab('ves')}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'ves'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                VES-COP
                            </button>
                        </div>

                        {/* Tab 1: BCV */}
                        {activeTab === 'bcv' && (
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">USD a enviar</label>
                                        <NumericFormat
                                            customInput={Input}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            decimalScale={2}
                                            value={usdBCV}
                                            onValueChange={(values) => setUsdBCV(values.floatValue?.toString() || '')}
                                            placeholder="Ej: 100"
                                            allowNegative={false}
                                            className="text-lg"
                                        />
                                    </div>

                                    {resultBCV && (
                                        <div className="p-4 bg-muted rounded-lg space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Bolívares (VES)</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(resultBCV.ves)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center border-t pt-2 mt-2">
                                                <span className="font-medium">Recibe (COP)</span>
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(resultBCV.cop)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tab 2: Manual */}
                        {activeTab === 'manual' && (
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">USD a enviar</label>
                                        <NumericFormat
                                            customInput={Input}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            decimalScale={2}
                                            value={usdManual}
                                            onValueChange={(values) => setUsdManual(values.floatValue?.toString() || '')}
                                            placeholder="Ej: 100"
                                            allowNegative={false}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Precio VES (por USD)</label>
                                        <NumericFormat
                                            customInput={Input}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            decimalScale={2}
                                            value={priceVES}
                                            onValueChange={(values) => setPriceVES(values.floatValue?.toString() || '')}
                                            placeholder="Ej: 45.50"
                                            allowNegative={false}
                                        />
                                    </div>

                                    {resultManual && (
                                        <div className="p-4 bg-muted rounded-lg space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Bolívares (VES)</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(resultManual.ves)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center border-t pt-2 mt-2">
                                                <span className="font-medium">Recibe (COP)</span>
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(resultManual.cop)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tab 3: VES a COP */}
                        {activeTab === 'ves' && (
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Bolívares (VES)</label>
                                        <NumericFormat
                                            customInput={Input}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            decimalScale={2}
                                            value={vesAmount}
                                            onValueChange={(values) => setVesAmount(values.floatValue?.toString() || '')}
                                            placeholder="Monto en VES"
                                            allowNegative={false}
                                            className="text-lg"
                                        />
                                    </div>

                                    {resultVES !== null && (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Recibe (COP)</span>
                                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(resultVES)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
