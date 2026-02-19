export interface Product {
    id: string;
    name: string;
    sku?: string;
    description?: string;
    stock: number;
    minStock: number;
    costPrice: string;
    sellingPrice: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const ProductTransactionType = {
    PURCHASE: 'PURCHASE',
    SALE: 'SALE',
    ADJUSTMENT: 'ADJUSTMENT'
} as const;

export type ProductTransactionType = typeof ProductTransactionType[keyof typeof ProductTransactionType];

export interface ProductTransaction {
    id: string;
    productId: string;
    product?: Product;
    type: ProductTransactionType;
    quantity: number;
    pricePerUnit: string;
    totalPrice: string;
    profit?: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    createdAt: string;
}

import { api } from '@/lib/api';

export const inventoryApi = {
    // Products
    getAllProducts: async () => {
        return await api.get<Product[]>('/inventory/products');
    },
    getProduct: async (id: string) => {
        return await api.get<Product>(`/inventory/products/${id}`);
    },
    createProduct: async (data: Partial<Product>) => {
        return await api.post<Product>('/inventory/products', data);
    },
    updateProduct: async (id: string, data: Partial<Product>) => {
        return await api.put<Product>(`/inventory/products/${id}`, data);
    },
    deleteProduct: async (id: string) => {
        return await api.delete(`/inventory/products/${id}`);
    },

    // Transactions
    getTransactions: async (params?: { productId?: string; startDate?: Date; endDate?: Date }) => {
        const queryParams: any = {};
        if (params?.productId) queryParams.productId = params.productId;
        if (params?.startDate) queryParams.startDate = params.startDate.toISOString();
        if (params?.endDate) queryParams.endDate = params.endDate.toISOString();

        return await api.get<ProductTransaction[]>('/inventory/transactions', { params: queryParams });
    },
    createPurchase: async (data: { productId: string; quantity: number; costPrice: number }) => {
        return await api.post('/inventory/transactions/purchase', data);
    },
    createSale: async (data: { productId: string; quantity: number; sellingPrice?: number }) => {
        return await api.post('/inventory/transactions/sale', data);
    },
    createBulkSale: async (data: { items: { productId: string; quantity: number; sellingPrice?: number }[] }) => {
        return await api.post('/inventory/transactions/bulk-sale', data);
    },
    createAdjustment: async (data: { productId: string; quantity: number; reason?: string }) => {
        return await api.post('/inventory/transactions/adjustment', data);
    }
};
