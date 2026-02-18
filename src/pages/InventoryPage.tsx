
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type Product } from '../services/inventoryApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Plus, Edit, ShoppingCart, TrendingUp, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatCurrency';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: inventoryApi.getAllProducts });
    const [searchTerm, setSearchTerm] = useState('');


    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // Sheet States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [purchaseOpen, setPurchaseOpen] = useState(false);
    const [saleOpen, setSaleOpen] = useState(false);
    const [transactionProduct, setTransactionProduct] = useState<Product | null>(null);

    // Delete State
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>;

    const openCreate = () => { setSelectedProduct(null); setIsCreateOpen(true); };
    const openEdit = (product: Product) => { setSelectedProduct(product); setIsCreateOpen(true); };
    const openPurchase = (product: Product) => { setTransactionProduct(product); setPurchaseOpen(true); };
    const openSale = (product: Product) => { setTransactionProduct(product); setSaleOpen(true); };

    const openDelete = (product: Product) => {
        setProductToDelete(product);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await inventoryApi.deleteProduct(productToDelete.id);
            toast.success('Producto eliminado');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setDeleteOpen(false);
        } catch (error) {
            toast.error('Error al eliminar producto');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus productos, compras y ventas.</p>
                </div>
                {isSuperAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsReportOpen(true)}>
                            <TrendingUp className="mr-2 h-4 w-4" /> Reporte
                        </Button>
                        <Button onClick={openCreate} className="bg-[linear-gradient(to_right,#136BBC,#274565)]">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm focus:outline-none"
                />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-muted-foreground">Producto / SKU</th>
                                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Stock</th>
                                {isSuperAdmin && <th className="px-4 py-3 font-medium text-muted-foreground text-right">Costo Prom.</th>}
                                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Precio Venta</th>
                                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProducts?.map((product) => (
                                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{product.name}</div>
                                        {product.sku && <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant="outline" className={
                                            product.stock === 0
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : product.stock <= product.minStock
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    : 'bg-green-50 text-green-600 border-green-200'
                                        }>
                                            {product.stock} unids
                                        </Badge>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatCurrency(Number(product.costPrice))}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                                        {formatCurrency(Number(product.sellingPrice))}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        {isSuperAdmin && (
                                            <Button variant="outline" size="sm" className="h-8" onClick={() => openPurchase(product)}>
                                                <TrendingUp className="h-3.5 w-3.5 mr-1 text-blue-600" />
                                                <span className="sr-only lg:not-sr-only">Comprar</span>
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" className="h-8" onClick={() => openSale(product)}>
                                            <ShoppingCart className="h-3.5 w-3.5 mr-1 text-green-600" />
                                            <span className="sr-only lg:not-sr-only">Vender</span>
                                        </Button>
                                        {isSuperAdmin && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDelete(product)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts?.length === 0 && (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                                        No se encontraron productos "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredProducts?.map((product) => (
                    <Card key={product.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{product.name}</h3>
                                {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                            </div>
                            {isSuperAdmin && (
                                <div className="flex gap-1 -mt-1 -mr-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDelete(product)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs block">Stock</span>
                                <Badge variant="secondary" className={
                                    product.stock === 0
                                        ? 'text-red-600'
                                        : product.stock <= product.minStock
                                            ? 'text-yellow-700'
                                            : 'text-green-600'
                                }>
                                    {product.stock} unids
                                </Badge>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-muted-foreground text-xs block">Venta</span>
                                <span className="font-medium">{formatCurrency(Number(product.sellingPrice))}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {isSuperAdmin && (
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => openPurchase(product)}>
                                    <TrendingUp className="h-4 w-4 mr-2 text-blue-600" /> Stock
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openSale(product)}>
                                <ShoppingCart className="h-4 w-4 mr-2 text-green-600" /> Vender
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Sheets */}
            <ProductFormSheet
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                product={selectedProduct}
            />

            <SalesReportSheet
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
            />

            {transactionProduct && (
                <>
                    <PurchaseSheet
                        open={purchaseOpen}
                        onOpenChange={setPurchaseOpen}
                        product={transactionProduct}
                    />
                    <SaleSheet
                        open={saleOpen}
                        onOpenChange={setSaleOpen}
                        product={transactionProduct}
                    />
                </>
            )}

            <DeleteConfirmationModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={confirmDelete}
                title="¿Eliminar producto?"
                description={`¿Estás seguro de que deseas eliminar "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}

// --- Sub-components (Sheets) ---

function ProductFormSheet({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product | null }) {
    const queryClient = useQueryClient();
    const isEdit = !!product;

    const mutation = useMutation({
        mutationFn: (data: any) => isEdit ? inventoryApi.updateProduct(product.id, data) : inventoryApi.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(isEdit ? "Producto actualizado" : "Producto creado exitosamente");
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al guardar producto");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            costPrice: Number(formData.get('costPrice')),
            sellingPrice: Number(formData.get('sellingPrice')),
            minStock: Number(formData.get('minStock')),
        };
        mutation.mutate(data);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader onClose={() => onOpenChange(false)}>
                    <SheetTitle>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</SheetTitle>
                </SheetHeader>
                <SheetBody>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre del Producto</Label>
                            <Input name="name" defaultValue={product?.name} required placeholder="Ej: Acetaminofén 500mg" />
                        </div>
                        <div className="space-y-2">
                            <Label>SKU / Código (Opcional)</Label>
                            <Input name="sku" defaultValue={product?.sku} placeholder="Ej: MED-001" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Costo Compra</Label>
                                <Input name="costPrice" type="number" step="0.01" defaultValue={product?.costPrice} required placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio Venta</Label>
                                <Input name="sellingPrice" type="number" step="0.01" defaultValue={product?.sellingPrice} required placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Stock Mínimo</Label>
                            <Input name="minStock" type="number" min="0" defaultValue={product?.minStock ?? 5} required placeholder="5" />
                            <p className="text-xs text-muted-foreground">El badge se pondrá amarillo cuando el stock llegue a este nivel.</p>
                        </div>
                        <Button type="submit" className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </form>
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
}

function PurchaseSheet({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product }) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: any) => inventoryApi.createPurchase({ productId: product.id, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Compra registrada", { description: "El stock ha sido actualizado." });
            onOpenChange(false);
        },
        onError: (error: any) => toast.error("Error al registrar compra", { description: error.message })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        mutation.mutate({
            quantity: Number(formData.get('quantity')),
            costPrice: Number(formData.get('costPrice'))
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader onClose={() => onOpenChange(false)}>
                    <SheetTitle>Registrar Entrada de Stock</SheetTitle>
                </SheetHeader>
                <SheetBody>
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">Stock Actual: {product.stock}</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cantidad a ingresar</Label>
                            <Input name="quantity" type="number" min="1" required placeholder="0" autoFocus />
                        </div>
                        <div className="space-y-2">
                            <Label>Costo Unitario (Nuevo)</Label>
                            <Input name="costPrice" type="number" step="0.01" defaultValue={product.costPrice} required />
                            <p className="text-xs text-muted-foreground">Este valor actualizará el costo promedio del producto.</p>
                        </div>
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Procesando...' : 'Registrar Entrada'}
                        </Button>
                    </form>
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
}

function SaleSheet({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product }) {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const queryClient = useQueryClient();
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState(Number(product.sellingPrice));

    const mutation = useMutation({
        mutationFn: (data: any) => inventoryApi.createSale({ productId: product.id, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Venta registrada exitosamente");
            onOpenChange(false);
        },
        onError: (error: any) => toast.error("Error al registrar venta", { description: error.message })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            quantity: qty,
            sellingPrice: price
        });
    };

    const total = qty * price;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader onClose={() => onOpenChange(false)}>
                    <SheetTitle>Registrar Venta</SheetTitle>
                </SheetHeader>
                <SheetBody>
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Stock: {product.stock}</span>
                            {isSuperAdmin && <span>Costo: {formatCurrency(Number(product.costPrice))}</span>}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input
                                type="number"
                                min="1"
                                max={product.stock}
                                value={qty}
                                onChange={(e) => setQty(Number(e.target.value))}
                                required
                                autoFocus
                                className={qty > product.stock ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {qty > product.stock && (
                                <p className="text-sm text-red-500 font-medium">
                                    No hay suficiente stock. Disponible: {product.stock}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Precio de Venta (Unitario)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="py-4 space-y-2 border-t border-b">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total Venta:</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                        {/* <div className="flex justify-between text-sm text-green-600">
                                <span>Ganancia Estimada:</span>
                                <span>{formatCurrency(profit)}</span>
                            </div> 
                            Removed to avoid confusion with FIFO logic
                            */}
                        <div className="text-xs text-muted-foreground mt-2">
                            * La ganancia real se calculará (FIFO) al registrar la venta.
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={mutation.isPending || qty > product.stock}>
                            {mutation.isPending ? 'Procesando...' : 'Confirmar Venta'}
                        </Button>
                    </form>
                </SheetBody>
            </SheetContent>
        </Sheet >
    );
}

function SalesReportSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setShowScrollTop(e.currentTarget.scrollTop > 200);
    };

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const { data: transactions, isLoading, refetch } = useQuery({
        queryKey: ['transactions', 'report', startDate, endDate],
        queryFn: () => {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return inventoryApi.getTransactions({ startDate: start, endDate: end });
        },
        enabled: open, // Fetch when open
    });

    // Calculate Totals
    const sales = transactions?.filter(t => t.type === 'SALE') || [];
    const totalRevenue = sales.reduce((sum, t) => sum + Number(t.totalPrice), 0);
    const totalProfit = sales.reduce((sum, t) => sum + Number(t.profit || 0), 0);
    const totalItems = sales.reduce((sum, t) => sum + t.quantity, 0);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
                <SheetHeader onClose={() => onOpenChange(false)} className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle>Reporte de Ventas</SheetTitle>
                </SheetHeader>
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto relative"
                >
                    {/* Floating scroll-to-top button */}
                    {showScrollTop && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-full shadow-lg hover:opacity-90 transition-all animate-in fade-in slide-in-from-bottom-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
                            Ir arriba
                        </button>
                    )}
                    <SheetBody>
                        <div className="space-y-6 py-4">
                            {/* Filters */}
                            <div className="flex gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                                <div className="space-y-2 flex-1">
                                    <Label>Desde</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label>Hasta</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                                <Button variant="outline" size="icon" onClick={() => refetch()} title="Refrescar">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                                    <span className="text-xs text-green-600 font-medium uppercase tracking-wider">Total Ventas</span>
                                    <div className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                    <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">Ganancia (Real)</span>
                                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalProfit)}</div>
                                </div>
                                <div className="bg-gray-50 border p-4 rounded-lg col-span-2 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Items Vendidos:</span>
                                    <span className="font-bold text-lg">{totalItems}</span>
                                </div>
                            </div>

                            {/* Top Products */}
                            {sales.length > 0 && (() => {
                                const byProduct = sales.reduce((acc, t) => {
                                    const key = t.product?.name || 'Producto Eliminado';
                                    if (!acc[key]) acc[key] = { name: key, units: 0, revenue: 0, profit: 0 };
                                    acc[key].units += t.quantity;
                                    acc[key].revenue += Number(t.totalPrice);
                                    acc[key].profit += Number(t.profit || 0);
                                    return acc;
                                }, {} as Record<string, { name: string; units: number; revenue: number; profit: number }>);

                                const top = Object.values(byProduct)
                                    .sort((a, b) => b.units - a.units)
                                    .slice(0, 5);
                                const maxUnits = top[0]?.units || 1;

                                return (
                                    <div className="space-y-3">
                                        <h3 className="font-medium border-b pb-2 flex items-center gap-2">
                                            <span>🏆</span> Top Productos
                                        </h3>
                                        {top.map((p, i) => (
                                            <div key={p.name} className="space-y-1">
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                                        </span>
                                                        <span className="font-medium truncate">{p.name}</span>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <span className="font-semibold text-xs">{p.units} unds</span>
                                                        <span className="text-muted-foreground text-xs"> · {formatCurrency(p.revenue)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${(p.units / maxUnits) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-green-600 shrink-0">+{formatCurrency(p.profit)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Transactions List */}
                            <div className="space-y-4">
                                <h3 className="font-medium border-b pb-2">Detalle de Transacciones</h3>
                                {isLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Cargando reporte...</div>
                                ) : sales.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg">
                                        No hay ventas registradas en este periodo.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sales.map((sale) => (
                                            <div key={sale.id} className="flex justify-between items-start text-sm p-3 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors">
                                                <div>
                                                    <div className="font-medium">{sale.product?.name || 'Producto Eliminado'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {' • '}{sale.createdBy?.fullName}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold">
                                                        {sale.quantity} unds x {formatCurrency(Number(sale.pricePerUnit))}
                                                    </div>
                                                    <div className="font-medium text-xs text-muted-foreground">
                                                        Total: {formatCurrency(Number(sale.totalPrice))}
                                                    </div>
                                                    <div className="text-xs text-green-600">
                                                        +{formatCurrency(Number(sale.profit || 0))} ganancia
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </SheetBody>
                </div>
            </SheetContent>
        </Sheet>
    );
}
