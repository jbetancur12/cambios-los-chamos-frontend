
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type Product } from '../services/inventoryApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Plus, Edit, ShoppingCart, TrendingUp, Search, Archive, Calendar, RotateCcw, Download, SlidersHorizontal, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatCurrency';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { POSSheet } from './POSSheet';

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [showArchived, setShowArchived] = useState(false);
    const { data: products, isLoading } = useQuery({ 
        queryKey: ['products', showArchived], 
        queryFn: () => inventoryApi.getAllProducts({ includeInactive: showArchived }) 
    });
    const [searchTerm, setSearchTerm] = useState('');


    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const isPrivileged = isSuperAdmin || isAdmin;

    // Sheet States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [purchaseOpen, setPurchaseOpen] = useState(false);

    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [transactionProduct, setTransactionProduct] = useState<Product | null>(null);

    // Archive State
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [productToArchive, setProductToArchive] = useState<Product | null>(null);

    // POS State
    const [posOpen, setPosOpen] = useState(false);

    // Pending Purchases State
    const [isPendingPurchasesOpen, setIsPendingPurchasesOpen] = useState(false);
    const { data: pendingPurchases } = useQuery({
        queryKey: ['pendingPurchases'],
        queryFn: () => inventoryApi.getPendingPurchases(),
        enabled: isSuperAdmin // Only fetch if SuperAdmin
    });

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>;

    const openCreate = () => { setSelectedProduct(null); setIsCreateOpen(true); };
    const openEdit = (product: Product) => { setSelectedProduct(product); setIsCreateOpen(true); };
    const openPurchase = (product: Product) => { setTransactionProduct(product); setPurchaseOpen(true); };
    const openAdjustment = (product: Product) => { setTransactionProduct(product); setAdjustmentOpen(true); };

    const openArchive = (product: Product) => {
        setProductToArchive(product);
        setArchiveOpen(true);
    };

    const confirmArchive = async () => {
        if (!productToArchive) return;
        try {
            await inventoryApi.deleteProduct(productToArchive.id);
            toast.success('Producto archivado correctamente');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setArchiveOpen(false);
        } catch (error) {
            toast.error('Error al archivar producto');
        }
    };

    const handleRestore = async (product: Product) => {
        try {
            await inventoryApi.reactivateProduct(product.id);
            toast.success('Producto restaurado correctamente');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) {
            toast.error('Error al restaurar producto');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus productos, compras y ventas.</p>
                </div>
                {isPrivileged && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setIsReportOpen(true)}>
                            <TrendingUp className="mr-2 h-4 w-4" /> Reporte
                        </Button>
                        {isSuperAdmin && pendingPurchases && pendingPurchases.length > 0 && (
                            <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => setIsPendingPurchasesOpen(true)}>
                                Revisar Entradas ({pendingPurchases.length})
                            </Button>
                        )}
                        {isPrivileged && (
                            <Button onClick={openCreate} className="bg-[linear-gradient(to_right,#136BBC,#274565)]">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                            </Button>
                        )}
                        <Button onClick={() => setPosOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                            <ShoppingCart className="mr-2 h-4 w-4" /> Nueva Venta (POS)
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 w-full max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none text-sm focus:outline-none"
                    />
                </div>
                
                {isSuperAdmin && (
                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id="showArchived" 
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="rounded border-gray-300 text-[linear-gradient(to_right,#136BBC,#274565)] focus:ring-[linear-gradient(to_right,#136BBC,#274565)]"
                        />
                        <Label htmlFor="showArchived" className="text-sm cursor-pointer">Ver Archivados</Label>
                    </div>
                )}
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
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {product.sku && <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>}
                                            {product.presentations && product.presentations.length > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                                                    {product.presentations.length} present.
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {!product.isActive ? (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                                                Archivado
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className={
                                                product.stock === 0
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : product.stock <= product.minStock
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        : 'bg-green-50 text-green-600 border-green-200'
                                            }>
                                                {product.stock} unids
                                            </Badge>
                                        )}
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
                                        {product.isActive ? (
                                            <>
                                                {isPrivileged && (
                                                    <Button variant="outline" size="sm" className="h-8" onClick={() => openPurchase(product)}>
                                                        <TrendingUp className="h-3.5 w-3.5 mr-1 text-blue-600" />
                                                        <span className="sr-only lg:not-sr-only">Comprar</span>
                                                    </Button>
                                                )}

                                                {isPrivileged && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openAdjustment(product)} title="Ajuste de Inventario">
                                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {isSuperAdmin && (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50" onClick={() => openArchive(product)} title="Archivar">
                                                            <Archive className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            isSuperAdmin && (
                                                <Button variant="outline" size="sm" className="h-8 text-[linear-gradient(to_right,#136BBC,#274565)]" onClick={() => handleRestore(product)}>
                                                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                    Restaurar
                                                </Button>
                                            )
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                                    {product.presentations && product.presentations.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                                            {product.presentations.length} present.
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isPrivileged && product.isActive && (
                                <div className="flex gap-1 -mt-1 -mr-2">
                                    {isSuperAdmin && (
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="text-blue-500" onClick={() => openAdjustment(product)} title="Ajuste de Inventario">
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </Button>
                                    {isSuperAdmin && (
                                        <Button variant="ghost" size="icon" className="text-amber-500" onClick={() => openArchive(product)} title="Archivar">
                                            <Archive className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                            {isSuperAdmin && !product.isActive && (
                                <div className="flex gap-1 -mt-1 -mr-2">
                                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => handleRestore(product)} title="Restaurar">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs block">Stock</span>
                                {!product.isActive ? (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                                        Archivado
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className={
                                        product.stock === 0
                                            ? 'text-red-600'
                                            : product.stock <= product.minStock
                                                ? 'text-yellow-700'
                                                : 'text-green-600'
                                    }>
                                        {product.stock} unids
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-muted-foreground text-xs block">Venta</span>
                                <span className="font-medium">{formatCurrency(Number(product.sellingPrice))}</span>
                            </div>
                        </div>

                        {product.isActive && (
                            <div className="flex gap-2 pt-2">
                                {isPrivileged && (
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openPurchase(product)}>
                                        <TrendingUp className="h-4 w-4 mr-2 text-blue-600" /> Stock
                                    </Button>
                                )}

                            </div>
                        )}
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

            <PendingPurchasesSheet 
                open={isPendingPurchasesOpen} 
                onOpenChange={setIsPendingPurchasesOpen} 
            />

            {transactionProduct && (
                <>
                    <PurchaseSheet
                        open={purchaseOpen}
                        onOpenChange={setPurchaseOpen}
                        product={transactionProduct}
                    />
                    <AdjustmentSheet
                        open={adjustmentOpen}
                        onOpenChange={setAdjustmentOpen}
                        product={transactionProduct}
                    />
                </>
            )}

            <DeleteConfirmationModal
                open={archiveOpen}
                onOpenChange={setArchiveOpen}
                onConfirm={confirmArchive}
                title="¿Archivar producto?"
                description={`¿Estás seguro de que deseas archivar "${productToArchive?.name}"? El producto dejará de aparecer en el inventario pero su historial de transacciones se conservará.`}
            />

            <POSSheet open={posOpen} onOpenChange={setPosOpen} />
        </div>
    );
}

// --- Sub-components (Sheets) ---

/** Formats a raw numeric string into locale display (e.g. 1200 -> "1.200") */
function formatNumberDisplay(value: string): string {
    const num = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
}

/** Strips locale formatting back to a plain number (e.g. "1.200,50" -> 1200.50) */
function parseFormattedNumber(formatted: string): number {
    const cleaned = formatted.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function CurrencyInput({ label, name, defaultValue, required = true }: { label: string; name: string; defaultValue?: string | number; required?: boolean }) {
    const [display, setDisplay] = React.useState(() => {
        if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
            return formatNumberDisplay(String(defaultValue));
        }
        return '';
    });

    React.useEffect(() => {
        if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
            setDisplay(formatNumberDisplay(String(defaultValue)));
        } else {
            setDisplay('');
        }
    }, [defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only digits, dots (thousand sep) and comma (decimal sep)
        const raw = e.target.value.replace(/[^0-9.,]/g, '');
        setDisplay(raw);
    };

    const handleBlur = () => {
        if (display) {
            setDisplay(formatNumberDisplay(display));
        }
    };

    const numericValue = parseFormattedNumber(display);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                    type="text"
                    inputMode="decimal"
                    value={display}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={required}
                    placeholder="0"
                    className="pl-7"
                />
            </div>
            <input type="hidden" name={name} value={numericValue} />
        </div>
    );
}

function PresentationPriceInput({ value, onChange, className }: { value: number | ''; onChange: (v: number | '') => void; className?: string }) {
    const [display, setDisplay] = React.useState(() => value && value !== 0 ? formatNumberDisplay(String(value)) : '')
    const isFocused = React.useRef(false)

    React.useEffect(() => {
        if (!isFocused.current) {
            setDisplay(value && value !== 0 ? formatNumberDisplay(String(value)) : '')
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isFocused.current = true
        const raw = e.target.value.replace(/[^0-9.,]/g, '')
        setDisplay(raw)
    }

    const handleBlur = () => {
        isFocused.current = false
        if (display) {
            const num = parseFormattedNumber(display)
            setDisplay(formatNumberDisplay(display))
            onChange(num)
        } else {
            onChange('')
        }
    }

    return (
        <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
            <Input
                type="text"
                inputMode="decimal"
                value={display}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0"
                className={className ? `pl-5 ${className}` : 'pl-5 h-8 text-sm'}
            />
        </div>
    )
}

function ProductFormSheet({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product | null }) {
    const queryClient = useQueryClient();
    const isEdit = !!product;
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showInStore, setShowInStore] = useState(product?.showInStore ?? true);
    const [presentations, setPresentations] = useState<{ id?: string; name: string; quantity: number | ''; sellingPrice: number | ''; showInStore: boolean }[]>([]);

    useEffect(() => {
        setShowInStore(product?.showInStore ?? true)
        setPresentations(
            product?.presentations?.map(p => ({ id: p.id, name: p.name, quantity: p.quantity, sellingPrice: Number(p.sellingPrice), showInStore: p.showInStore ?? true })) || []
        )
        setImageFile(null)
        setImagePreview(null)
    }, [product])

    const addPresentation = () => {
        setPresentations(prev => [...prev, { name: '', quantity: 1, sellingPrice: 0, showInStore: true }]);
    };

    const updatePresentation = (index: number, field: string, value: any) => {
        setPresentations(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const removePresentation = (index: number) => {
        setPresentations(prev => prev.filter((_, i) => i !== index));
    };

    const mutation = useMutation({
        mutationFn: (data: any) => isEdit ? inventoryApi.updateProduct(product.id, data) : inventoryApi.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(isEdit ? "Producto actualizado" : "Producto creado exitosamente");
            onOpenChange(false);
            setImageFile(null);
            setImagePreview(null);
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al guardar producto");
        }
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data: any = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            costPrice: Number(formData.get('costPrice')),
            sellingPrice: Number(formData.get('sellingPrice')),
            minStock: Number(formData.get('minStock')),
            showInStore: formData.get('showInStore') === 'on',
            presentations: presentations.filter(p => p.name.trim() !== '').map(p => ({ ...p, quantity: p.quantity || 1, sellingPrice: p.sellingPrice || 0 })),
        };
        
        if (!isEdit) {
            data.stock = Number(formData.get('stock') || 0);
        }
        
        // Save product first, then upload image
        mutation.mutate(data, {
            onSuccess: async (savedProduct: any) => {
                if (imageFile) {
                    setUploading(true);
                    try {
                        const productId = isEdit ? product!.id : savedProduct.id;
                        await inventoryApi.uploadImage(productId, imageFile);
                        toast.success("Imagen subida exitosamente");
                        queryClient.invalidateQueries({ queryKey: ['products'] });
                    } catch (err: any) {
                        toast.error(err.message || "Error al subir imagen");
                    } finally {
                        setUploading(false);
                    }
                }
            }
        });
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
                            <Input name="name" defaultValue={product?.name} required placeholder="Ej: Harina PAN 1kg" />
                        </div>
                        <div className="space-y-2">
                            <Label>SKU / Código (Opcional)</Label>
                            <Input name="sku" defaultValue={product?.sku} placeholder="Ej: HP-001" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CurrencyInput label="Costo Compra" name="costPrice" defaultValue={product?.costPrice} />
                            <CurrencyInput label="Precio Venta" name="sellingPrice" defaultValue={product?.sellingPrice} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Stock Mínimo</Label>
                                <Input name="minStock" type="number" min="0" defaultValue={product?.minStock ?? 5} required placeholder="5" />
                            </div>
                            {!isEdit && (
                                <div className="space-y-2">
                                    <Label>Stock Inicial</Label>
                                    <Input name="stock" type="number" min="0" defaultValue={0} required placeholder="0" />
                                </div>
                            )}
                        </div>

                        {/* Presentaciones */}
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Presentaciones (opcional)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addPresentation} className="h-7 text-xs">
                                    <Plus className="h-3 w-3 mr-1" /> Agregar
                                </Button>
                            </div>
                            {presentations.length === 0 && (
                                <p className="text-xs text-muted-foreground">Sin presentaciones. El producto se venderá por unidad.</p>
                            )}
                            {presentations.map((pp, i) => (
                                <div key={i} className={`flex gap-2 items-start p-3 rounded-lg border ${pp.showInStore ? 'bg-muted/10' : 'bg-gray-50 opacity-70'}`}>
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Nombre (ej: Docena)"
                                            value={pp.name}
                                            onChange={(e) => updatePresentation(i, 'name', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Label className="text-[10px] text-muted-foreground">Cantidad</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={pp.quantity}
                                                    onChange={(e) => updatePresentation(i, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-[10px] text-muted-foreground">Precio Venta</Label>
                                                <PresentationPriceInput
                                                    value={pp.sellingPrice}
                                                    onChange={(v) => updatePresentation(i, 'sellingPrice', v)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Switch
                                                checked={pp.showInStore}
                                                onCheckedChange={(v) => updatePresentation(i, 'showInStore', v)}
                                                id={`pp-show-${i}`}
                                            />
                                            <Label htmlFor={`pp-show-${i}`} className="text-[11px] text-muted-foreground cursor-pointer">
                                                Mostrar en tienda online
                                            </Label>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 mt-0 shrink-0"
                                        onClick={() => removePresentation(i)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {(import.meta.env.VITE_STORE_ENABLED === 'true') && (
                          <div className="space-y-2">
                            <Label>Imagen del Producto</Label>
                            <div className="flex items-center gap-3">
                              {(imagePreview || product?.imageUrl) && (
                                <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border">
                                  <img
                                    src={imagePreview || inventoryApi.getImageUrl(product!.id)}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                </div>
                              )}
                              <label className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#136BBC] transition px-3 py-2 text-sm text-gray-500">
                                  <Upload className="h-4 w-4" />
                                  {imageFile ? imageFile.name : product?.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                              </label>
                            </div>
                          </div>
                        )}

                        {(import.meta.env.VITE_STORE_ENABLED === 'true') && (
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                            <div>
                              <Label className="text-sm font-medium">Mostrar en tienda online</Label>
                              <p className="text-xs text-muted-foreground mt-0.5">El producto aparecerá en la tienda pública</p>
                            </div>
                            <Switch checked={showInStore} onCheckedChange={setShowInStore} />
                            <input type="hidden" name="showInStore" value={showInStore ? 'on' : 'off'} />
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">El stock mínimo pondrá el badge en amarillo cuando llegue a ese nivel.</p>
                        
                        <Button type="submit" className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)] mt-4" disabled={mutation.isPending || uploading}>
                            {uploading ? 'Subiendo imagen...' : mutation.isPending ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </form>
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
}

function PurchaseSheet({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product }) {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: any) => inventoryApi.createPurchase({ productId: product.id, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Entrada registrada", { description: "El stock ha sido actualizado." });
            onOpenChange(false);
        },
        onError: (error: any) => toast.error("Error al registrar entrada", { description: error.message })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        const costPriceVal = formData.get('costPrice');
        const data: any = { quantity: Number(formData.get('quantity')) };
        
        if (costPriceVal !== null) {
            data.costPrice = Number(costPriceVal);
        }

        mutation.mutate(data);
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
                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <CurrencyInput label="Costo Unitario (Nuevo)" name="costPrice" defaultValue={product.costPrice} />
                                <p className="text-xs text-muted-foreground">Este valor actualizará el costo promedio del producto.</p>
                            </div>
                        )}
                        {!isSuperAdmin && (
                            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                Esta entrada quedará pendiente de validación de costos por parte del Administrador.
                            </p>
                        )}
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Procesando...' : 'Registrar Entrada'}
                        </Button>
                    </form>
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
}

function AdjustmentSheet({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product }) {
    const queryClient = useQueryClient();
    const [qty, setQty] = useState<string | number>("");
    
    const parsedQty = Number(qty) || 0;
    
    const mutation = useMutation({
        mutationFn: (data: any) => inventoryApi.createAdjustment({ productId: product.id, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Ajuste de inventario registrado");
            onOpenChange(false);
            setQty(""); // reset on success
        },
        onError: (error: any) => toast.error("Error al registrar ajuste", { description: error.message })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (parsedQty === 0) return;

        mutation.mutate({
            quantity: parsedQty
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader onClose={() => onOpenChange(false)}>
                    <SheetTitle>Ajuste de Inventario</SheetTitle>
                </SheetHeader>
                <SheetBody>
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">Stock Actual: {product.stock}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cantidad (+ para sumar, - para restar)</Label>
                            <Input
                                type="number"
                                step="1"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                required
                                autoFocus
                                className={parsedQty < 0 && Math.abs(parsedQty) > product.stock ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {parsedQty < 0 && Math.abs(parsedQty) > product.stock && (
                                <p className="text-sm text-red-500 font-medium">
                                    No hay suficiente stock. Disponible: {product.stock}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full bg-[linear-gradient(to_right,#136BBC,#274565)]" disabled={mutation.isPending || (parsedQty < 0 && Math.abs(parsedQty) > product.stock) || parsedQty === 0}>
                            {mutation.isPending ? 'Procesando...' : 'Confirmar Ajuste'}
                        </Button>
                    </form>
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
}

function PendingPurchasesSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    
    const { data: pendingPurchases, isLoading } = useQuery({
        queryKey: ['pendingPurchases'],
        queryFn: () => inventoryApi.getPendingPurchases(),
        enabled: open
    });

    const resolveMutation = useMutation({
        mutationFn: ({ id, costPrice }: { id: string, costPrice: number }) => inventoryApi.resolvePendingPurchase(id, costPrice),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingPurchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Costo actualizado y entrada aprobada");
        },
        onError: (error: any) => toast.error("Error al aprobar entrada", { description: error.message })
    });

    const handleResolve = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const costPrice = Number(formData.get('costPrice'));
        resolveMutation.mutate({ id, costPrice });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
                <SheetHeader onClose={() => onOpenChange(false)} className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle>Compras Pendientes de Revisión</SheetTitle>
                </SheetHeader>
                <SheetBody className="overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                    ) : !pendingPurchases || pendingPurchases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg">
                            No hay entradas pendientes.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Ingresa el costo real (según factura) para cada entrada registrada por los administradores.
                            </p>
                            {pendingPurchases.map(purchase => (
                                <div key={purchase.id} className="p-4 border rounded-lg bg-card space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold">{purchase.product?.name}</h4>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {new Date(purchase.createdAt).toLocaleDateString()} {new Date(purchase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {' • Ingresado por: '}{purchase.createdBy?.fullName}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                            +{purchase.quantity} unds
                                        </Badge>
                                    </div>
                                    <form onSubmit={(e) => handleResolve(e, purchase.id)} className="flex items-end gap-2 pt-2 border-t">
                                        <div className="flex-1">
                                            <CurrencyInput label="Costo Factura (Ud)" name="costPrice" defaultValue={purchase.product?.costPrice || 0} />
                                        </div>
                                        <Button type="submit" className="bg-green-600 hover:bg-green-700 h-9" disabled={resolveMutation.isPending}>
                                            Aprobar
                                        </Button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
}

function SalesReportSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const _now = new Date();
    const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
    const [filterType, setFilterType] = React.useState<'SINGLE' | 'CUSTOM'>('SINGLE');
    const [singleDate, setSingleDate] = React.useState<string>(today);
    const [customRange, setCustomRange] = React.useState({ from: today, to: today });
    const [customModalOpen, setCustomModalOpen] = React.useState(false);
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Derive actual query dates
    const startDate = filterType === 'CUSTOM' ? customRange.from : singleDate;
    const endDate = filterType === 'CUSTOM' ? customRange.to : singleDate;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setShowScrollTop(e.currentTarget.scrollTop > 200);
    };

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions', 'report', startDate, endDate],
        queryFn: () => {
            // Parse date strings as LOCAL midnight (not UTC midnight like new Date("YYYY-MM-DD") would do)
            const [sy, sm, sd] = startDate.split('-').map(Number);
            const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
            const [ey, em, ed] = endDate.split('-').map(Number);
            const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
            return inventoryApi.getTransactions({ startDate: start, endDate: end });
        },
        enabled: open,
    });

    // Calculate Totals
    const sales = transactions?.filter(t => t.type === 'SALE') || [];
    const totalRevenue = sales.reduce((sum, t) => sum + Number(t.totalPrice), 0);
    const totalProfit = sales.reduce((sum, t) => sum + Number(t.profit || 0), 0);
    const totalItems = sales.reduce((sum, t) => sum + t.quantity, 0);

    const exportToExcel = () => {
        if (!sales.length) {
            toast.error("No hay ventas para exportar en las fechas seleccionadas.");
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Fecha,Hora,Producto,Cantidad,Costo Unitario,Precio de Venta,Total Venta,Ganancia Neta,Metodo Pago,Vendedor\n";

        sales.forEach(sale => {
            const dateObj = new Date(sale.createdAt);
            const date = dateObj.toLocaleDateString('es-CO');
            const time = dateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            
            // Format numbers to avoid excel scientific notation or comma issues
            // Use replacing . with , for Spanish Excel or vice-versa depending on standard, 
            // but standard CSV usually expects standard numbers if quoted correctly.
            const cost = sale.product?.costPrice || 0;
            const price = sale.pricePerUnit;
            const total = sale.totalPrice;
            const profit = sale.profit || 0;

            const row = [
                `"${date}"`,
                `"${time}"`,
                `"${sale.product?.name?.replace(/"/g, '""')}"`,
                sale.quantity,
                cost,
                price,
                total,
                profit,
                `"${sale.paymentMethod || 'CASH'}"`,
                `"${sale.createdBy?.fullName}"`
            ].join(",");

            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Ventas_${startDate}_al_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Reporte descargado correctamente");
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
                    <SheetHeader onClose={() => onOpenChange(false)} className="px-6 pt-6 pb-4 border-b">
                        <SheetTitle>Reporte de Ventas</SheetTitle>
                    </SheetHeader>
                    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative">
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
                                {/* Date filter */}
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant={filterType === 'SINGLE' ? 'default' : 'outline'}
                                        size="sm"
                                        className={`relative overflow-hidden ${filterType === 'SINGLE' ? 'text-white' : ''}`}
                                        style={filterType === 'SINGLE' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                                        onClick={() => dateInputRef.current?.showPicker()}
                                    >
                                        <Calendar className="mr-2 h-3 w-3" />
                                        {singleDate === today ? 'Ver día (Hoy)' : `Ver día: ${singleDate}`}
                                    </Button>
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        value={singleDate}
                                        onChange={(e) => { if (e.target.value) { setSingleDate(e.target.value); setFilterType('SINGLE'); } }}
                                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                                        tabIndex={-1}
                                    />
                                    <Button
                                        variant={filterType === 'CUSTOM' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCustomModalOpen(true)}
                                        className={filterType === 'CUSTOM' ? 'text-white' : ''}
                                        style={filterType === 'CUSTOM' ? { background: 'linear-gradient(to right, #136BBC, #274565)' } : {}}
                                    >
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {filterType === 'CUSTOM' ? `${customRange.from} → ${customRange.to}` : 'Personalizado'}
                                    </Button>
                                    {isSuperAdmin && (
                                        <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!sales.length} className="ml-auto border-green-200 text-green-700 hover:bg-green-50">
                                            <Download className="mr-2 h-4 w-4" /> Exportar a Excel
                                        </Button>
                                    )}
                                </div>

                                {/* Summary Cards */}
                                <div className={`grid ${isSuperAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                                        <span className="text-xs text-green-600 font-medium uppercase tracking-wider">Total Ventas</span>
                                        <div className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</div>
                                    </div>
                                    {isSuperAdmin && (
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                            <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">Ganancia (Real)</span>
                                            <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalProfit)}</div>
                                        </div>
                                    )}
                                    <div className={`bg-gray-50 border p-4 rounded-lg ${isSuperAdmin ? 'col-span-2' : 'col-span-1'} flex justify-between items-center`}>
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
                                    const top = Object.values(byProduct).sort((a, b) => b.units - a.units).slice(0, 5);
                                    const maxUnits = top[0]?.units || 1;
                                    return (
                                        <div className="space-y-3">
                                            <h3 className="font-medium border-b pb-2 flex items-center gap-2"><span>🏆</span> Top Productos</h3>
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
                                                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.units / maxUnits) * 100}%` }} />
                                                        </div>
                                                        <span className="text-xs text-green-600 shrink-0">
                                                            {isSuperAdmin && `+${formatCurrency(p.profit)}`}
                                                        </span>
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
                                            {sales.map((sale) => {
                                                const pmLabels: Record<string, string> = { CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta', CREDIT: 'Fiado' };
                                                return (
                                                <div key={sale.id} className="flex justify-between items-start text-sm p-3 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors">
                                                    <div>
                                                        <div className="font-medium">{sale.product?.name || 'Producto Eliminado'}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' • '}{sale.createdBy?.fullName}
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            {sale.paymentMethod && (
                                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sale.paymentMethod === 'CREDIT' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {pmLabels[sale.paymentMethod] || sale.paymentMethod}
                                                                </span>
                                                            )}
                                                            {sale.clientName && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    Cliente: {sale.clientName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {sale.presentationName && sale.presentationQuantity ? (
                                                            <div className="text-sm font-semibold">{sale.presentationName} {sale.quantity / sale.presentationQuantity}x{formatCurrency(Number(sale.pricePerUnit) * sale.presentationQuantity)}</div>
                                                        ) : (
                                                            <div className="text-sm font-semibold">{sale.quantity} unds x {formatCurrency(Number(sale.pricePerUnit))}</div>
                                                        )}
                                                        <div className="font-medium text-xs text-muted-foreground">Total: {formatCurrency(Number(sale.totalPrice))}</div>
                                                        {isSuperAdmin && (
                                                            <div className="text-xs text-green-600">+{formatCurrency(Number(sale.profit || 0))} ganancia</div>
                                                        )}
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SheetBody>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Custom Date Range Modal */}
            {customModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setCustomModalOpen(false); }}
                >
                    <Card className="w-full max-w-sm">
                        <div className="p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Rango de Fechas Personalizado</h2>
                            <div className="space-y-2">
                                <Label>Desde</Label>
                                <Input type="date" value={customRange.from} onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Hasta</Label>
                                <Input type="date" value={customRange.to} onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={() => { setFilterType('CUSTOM'); setCustomModalOpen(false); }}
                                    className="flex-1"
                                    size="sm"
                                    style={{ background: 'linear-gradient(to right, #136BBC, #274565)' }}
                                >
                                    Aplicar
                                </Button>
                                <Button onClick={() => setCustomModalOpen(false)} variant="outline" className="flex-1" size="sm">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
