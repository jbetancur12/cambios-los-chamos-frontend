
import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type Product, type ProductPresentation, PaymentMethod } from '../services/inventoryApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Plus, Search, Trash2, ShoppingCart, Minus, Banknote, Landmark, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatCurrency';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
    product: Product;
    presentation?: ProductPresentation;
    quantity: number;
    price: number;
}

function getCartItemLabel(item: CartItem): string {
    return item.presentation
        ? `${item.product.name} — ${item.presentation.name}`
        : item.product.name;
}

function getCartItemKey(item: CartItem): string {
    return item.presentation
        ? `${item.product.id}-${item.presentation.id}`
        : item.product.id;
}

function getEffectiveMax(item: CartItem): number {
    if (item.presentation) {
        return Math.floor(item.product.stock / item.presentation.quantity)
    }
    return item.product.stock
}

const formatPriceInt = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)

export function POSSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => inventoryApi.getAllProducts() });
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const isPrivileged = isSuperAdmin || isAdmin;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [clientName, setClientName] = useState('');
    const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setCart([]);
            setSearchTerm('');
            setPaymentMethod(PaymentMethod.CASH);
            setEditingPrice({});
        }
    }, [open]);

    const inCartKeys = new Set(cart.map(getCartItemKey));

    const searchResults = useMemo(() => {
        if (!searchTerm || !products) return [];
        const lower = searchTerm.toLowerCase();

        const results: { product: Product; presentation?: ProductPresentation }[] = [];

        for (const p of products) {
            const matches = p.name.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower);
            if (!matches) continue;

            const presentations = p.presentations ?? [];

            if (presentations.length > 0) {
                for (const pp of presentations) {
                    const key = `${p.id}-${pp.id}`;
                    if (!inCartKeys.has(key)) {
                        results.push({ product: p, presentation: pp });
                    }
                }
            } else {
                if (!inCartKeys.has(p.id)) {
                    results.push({ product: p });
                }
            }
        }

        return results.slice(0, 10);
    }, [searchTerm, products, cart, inCartKeys]);

    const addToCart = (product: Product, presentation?: ProductPresentation) => {
        const effectiveStock = presentation
            ? Math.floor(product.stock / presentation.quantity)
            : product.stock
        if (effectiveStock <= 0) return
        const price = presentation
            ? Number(presentation.sellingPrice)
            : Number(product.sellingPrice);
        setCart(prev => [...prev, { product, presentation, quantity: 1, price }]);
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const removeFromCart = (key: string) => {
        setCart(prev => prev.filter(item => getCartItemKey(item) !== key));
    };

    const updateQuantity = (key: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (getCartItemKey(item) !== key) return item;
            const newQty = (item.quantity || 0) + delta;
            if (newQty < 1) return item;
            const max = getEffectiveMax(item)
            if (newQty > max) {
                toast.error(`Stock insuficiente. Máximo: ${max}`);
                return item;
            }
            return { ...item, quantity: newQty };
        }));
    };

    const setExactQuantity = (key: string, value: string) => {
        setCart(prev => prev.map(item => {
            if (getCartItemKey(item) !== key) return item;
            if (value === '') return { ...item, quantity: 0 };
            const newQty = parseInt(value, 10);
            if (isNaN(newQty) || newQty < 0) return item;
            const max = getEffectiveMax(item)
            if (newQty > max) {
                toast.error(`Stock insuficiente. Máximo: ${max}`);
                return { ...item, quantity: max };
            }
            return { ...item, quantity: newQty };
        }));
    };

    const updatePrice = (key: string, newPrice: number) => {
        setCart(prev => prev.map(item =>
            getCartItemKey(item) === key ? { ...item, price: newPrice } : item
        ));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const mutation = useMutation({
        mutationFn: (data: { items: any[], paymentMethod: PaymentMethod; clientName?: string }) => inventoryApi.createBulkSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success("Venta registrada exitosamente");
            onOpenChange(false);
        },
        onError: (error: any) => toast.error("Error al registrar venta", { description: error.message })
    });

    const handleCheckout = () => {
        const validCart = cart.filter(item => item.quantity > 0);
        if (validCart.length === 0) {
            toast.error("El carrito está vacío o las cantidades son inválidas.");
            return;
        }

        const items = validCart.map(item => ({
            productId: item.product.id,
            presentationId: item.presentation?.id,
            quantity: item.quantity,
            sellingPrice: item.price
        }));

        if (paymentMethod === PaymentMethod.CREDIT && !clientName.trim()) {
            toast.error("Debes ingresar el nombre del cliente para ventas a crédito (Fiado).");
            return;
        }
        mutation.mutate({ items, paymentMethod, clientName: paymentMethod === PaymentMethod.CREDIT ? clientName.trim() : undefined });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 h-full">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Nueva Venta (POS)
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Search Section */}
                    <div className="p-4 border-b bg-muted/20 space-y-2 relative">
                        <Label>Buscar Producto</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Escribe nombre o SKU..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-4 right-4 z-50 bg-popover text-popover-foreground rounded-md border shadow-md mt-1 overflow-hidden max-h-80 overflow-y-auto">
                                {searchResults.map((result) => {
                                    const { product, presentation } = result;
                                    const effectiveStock = presentation
                                        ? Math.floor(product.stock / presentation.quantity)
                                        : product.stock
                                    const label = presentation
                                        ? `${product.name} — ${presentation.name}`
                                        : product.name;
                                    const price = presentation
                                        ? Number(presentation.sellingPrice)
                                        : Number(product.sellingPrice);
                                    return (
                                        <button
                                            key={getCartItemKey({ product, presentation, quantity: 0, price: 0 } as CartItem)}
                                            onClick={() => addToCart(product, presentation)}
                                            disabled={effectiveStock <= 0}
                                            className={`w-full text-left px-4 py-3 flex justify-between items-center transition-colors border-b last:border-0 ${effectiveStock > 0
                                                ? 'hover:bg-muted/50 cursor-pointer'
                                                : 'opacity-50 cursor-not-allowed bg-muted/20'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate">{label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {presentation
                                                        ? `${presentation.quantity} unids — SKU: ${product.sku || '---'}`
                                                        : `SKU: ${product.sku || '---'}`
                                                    }
                                                </div>
                                            </div>
                                            <div className="text-right ml-3 shrink-0">
                                                <div className="font-bold text-sm">{formatCurrency(price)}</div>
                                                {effectiveStock > 0 ? (
                                                    <Badge variant="outline" className="text-[10px] h-5">Stock: {effectiveStock}</Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-[10px] h-5">Sin Stock</Badge>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Cart List */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 opacity-50">
                                <ShoppingCart className="h-12 w-12 mb-4" />
                                <p>El carrito está vacío</p>
                                <p className="text-sm">Agrega productos para comenzar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => {
                                    const key = getCartItemKey(item);
                                    return (
                                        <div key={key} className="flex gap-4 items-start p-3 rounded-lg border bg-card animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">{getCartItemLabel(item)}</h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center border rounded-md h-8 overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                                                        <button
                                                            onClick={() => updateQuantity(key, -1)}
                                                            className="px-2 hover:bg-muted h-full flex items-center transition-colors"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity === 0 ? '' : item.quantity}
                                                            onChange={(e) => setExactQuantity(key, e.target.value)}
                                                            className="w-10 text-center text-sm font-medium border-0 focus:ring-0 p-0 h-full bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(key, 1)}
                                                            className="px-2 hover:bg-muted h-full flex items-center transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        (Max: {getEffectiveMax(item)})
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    {isPrivileged ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="numeric"
                                                            className="h-8 w-32 text-right px-2"
                                                            value={
                                                                key in editingPrice
                                                                    ? (editingPrice[key] === '' ? '' : formatPriceInt(Number(editingPrice[key])))
                                                                    : formatPriceInt(item.price)
                                                            }
                                                            onFocus={() => {
                                                                if (!(key in editingPrice)) {
                                                                    setEditingPrice(prev => ({ ...prev, [key]: String(item.price) }))
                                                                }
                                                            }}
                                                            onChange={(e) => {
                                                                const raw = e.target.value
                                                                const digits = raw.replace(/\D/g, '')
                                                                const num = digits === '' ? 0 : Number(digits)
                                                                const cursorInRaw = raw.slice(0, e.target.selectionStart ?? 0).replace(/\D/g, '').length

                                                                setEditingPrice(prev => ({ ...prev, [key]: digits }))
                                                                if (digits !== '') updatePrice(key, num)

                                                                const formatted = digits === '' ? '' : formatPriceInt(num)
                                                                requestAnimationFrame(() => {
                                                                    let cursorPos = formatted.length
                                                                    let digitCount = 0
                                                                    for (let i = 0; i < formatted.length; i++) {
                                                                        if (/\d/.test(formatted[i])) digitCount++
                                                                        if (digitCount > cursorInRaw) { cursorPos = i; break }
                                                                    }
                                                                    e.target.setSelectionRange(cursorPos, cursorPos)
                                                                })
                                                            }}
                                                            onBlur={() => {
                                                                setEditingPrice(prev => {
                                                                    const next = { ...prev }
                                                                    delete next[key]
                                                                    return next
                                                                })
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="font-semibold">{formatCurrency(item.price)}</span>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeFromCart(key)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-sm font-bold text-primary">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Checkout */}
                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="space-y-2">
                        <Label>Método de Pago</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={paymentMethod === PaymentMethod.CASH ? "default" : "outline"}
                                className={paymentMethod === PaymentMethod.CASH ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                                size="sm"
                            >
                                <Banknote className="mr-2 h-4 w-4" /> Efectivo
                            </Button>
                            <Button
                                variant={paymentMethod === PaymentMethod.TRANSFER ? "default" : "outline"}
                                className={paymentMethod === PaymentMethod.TRANSFER ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                onClick={() => setPaymentMethod(PaymentMethod.TRANSFER)}
                                size="sm"
                            >
                                <Landmark className="mr-2 h-4 w-4" /> Transferencia
                            </Button>
                            <Button
                                variant={paymentMethod === PaymentMethod.CARD ? "default" : "outline"}
                                className={paymentMethod === PaymentMethod.CARD ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                                size="sm"
                            >
                                <CreditCard className="mr-2 h-4 w-4" /> Tarjeta
                            </Button>
                            <Button
                                variant={paymentMethod === PaymentMethod.CREDIT ? "default" : "outline"}
                                className={paymentMethod === PaymentMethod.CREDIT ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
                                onClick={() => setPaymentMethod(PaymentMethod.CREDIT)}
                                size="sm"
                            >
                                <div className="mr-2 h-4 w-4 font-bold border rounded-full flex items-center justify-center text-[10px] w-4 h-4 border-current">F</div> Fiado
                            </Button>
                        </div>
                    </div>

                    {paymentMethod === PaymentMethod.CREDIT && (
                        <div className="space-y-2">
                            <Label>Nombre del Cliente (Fiado)</Label>
                            <Input
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Nombre de la persona a quien se fía..."
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-end pt-2">
                        <span className="text-sm text-muted-foreground">Total a Pagar</span>
                        <span className="text-3xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                    <Button
                        size="lg"
                        className="w-full text-lg h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || mutation.isPending}
                    >
                        {mutation.isPending ? 'Procesando...' : `Cobrar ${formatCurrency(total)}`}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
