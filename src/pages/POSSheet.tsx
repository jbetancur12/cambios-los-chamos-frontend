
import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type Product } from '../services/inventoryApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Plus, Search, Trash2, ShoppingCart, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatCurrency';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
    product: Product;
    quantity: number;
    price: number;
}

export function POSSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    const { data: products } = useQuery({ queryKey: ['products'], queryFn: inventoryApi.getAllProducts });
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Reset cart when closing
    useEffect(() => {
        if (!open) {
            setCart([]);
            setSearchTerm('');
        }
    }, [open]);

    // Filter products for search
    const searchResults = useMemo(() => {
        if (!searchTerm || !products) return [];
        const lower = searchTerm.toLowerCase();
        return products.filter(p =>
            (p.name.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower)) &&
            !cart.some(item => item.product.id === p.id) // Exclude already added
        ).slice(0, 5);
    }, [searchTerm, products, cart]);

    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;
        setCart(prev => [...prev, { product, quantity: 1, price: Number(product.sellingPrice) }]);
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                if (newQty > item.product.stock) {
                    toast.error(`Stock insuficiente. Máximo: ${item.product.stock}`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const updatePrice = (productId: string, newPrice: number) => {
        setCart(prev => prev.map(item =>
            item.product.id === productId ? { ...item, price: newPrice } : item
        ));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const mutation = useMutation({
        mutationFn: (items: any[]) => inventoryApi.createBulkSale({ items }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Venta registrada exitosamente");
            onOpenChange(false);
        },
        onError: (error: any) => toast.error("Error al registrar venta", { description: error.message })
    });

    const handleCheckout = () => {
        if (cart.length === 0) return;

        const items = cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            sellingPrice: item.price
        }));

        mutation.mutate(items);
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
                            <div className="absolute top-full left-4 right-4 z-50 bg-popover text-popover-foreground rounded-md border shadow-md mt-1 overflow-hidden">
                                {searchResults.map(product => {
                                    const hasStock = product.stock > 0;
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            disabled={!hasStock}
                                            className={`w-full text-left px-4 py-3 flex justify-between items-center transition-colors border-b last:border-0 ${hasStock
                                                    ? 'hover:bg-muted/50 cursor-pointer'
                                                    : 'opacity-50 cursor-not-allowed bg-muted/20'
                                                }`}
                                        >
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">SKU: {product.sku || '---'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">{formatCurrency(Number(product.sellingPrice))}</div>
                                                {hasStock ? (
                                                    <Badge variant="outline" className="text-[10px] h-5">Stock: {product.stock}</Badge>
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
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex gap-4 items-start p-3 rounded-lg border bg-card animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{item.product.name}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center border rounded-md h-8">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, -1)}
                                                        className="px-2 hover:bg-muted h-full flex items-center"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, 1)}
                                                        className="px-2 hover:bg-muted h-full flex items-center"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    (Max: {item.product.stock})
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                {isSuperAdmin ? (
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-24 text-right px-2"
                                                        value={item.price}
                                                        onChange={(e) => updatePrice(item.product.id, Number(e.target.value))}
                                                    />
                                                ) : (
                                                    <span className="font-semibold">{formatCurrency(item.price)}</span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeFromCart(item.product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="text-sm font-bold text-primary">
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Checkout */}
                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="flex justify-between items-end">
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
