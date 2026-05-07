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

export const PaymentMethod = {
    CASH: 'CASH',
    TRANSFER: 'TRANSFER',
    CARD: 'CARD',
    CREDIT: 'CREDIT'
} as const;

export type ProductTransactionType = typeof ProductTransactionType[keyof typeof ProductTransactionType];
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const TransactionStatus = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
} as const;
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export interface ProductTransaction {
    id: string;
    product: Product;
    type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
    status: TransactionStatus;
    paymentMethod?: PaymentMethod;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    profit?: number;
    createdAt: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
}

import { api } from '@/lib/api';

export const inventoryApi = {
    // Products
    getAllProducts: async (params?: { includeInactive?: boolean }) => {
        const queryParams = params?.includeInactive ? { params: { includeInactive: 'true' } } : undefined;
        return await api.get<Product[]>('/inventory/products', queryParams);
    },
    getProduct: async (id: string) => {
        return await api.get<Product>(`/inventory/products/${id}`);
    },
    reactivateProduct: async (id: string) => {
        return await api.put<Product>(`/inventory/products/${id}`, { isActive: true });
    },
    createProduct: async (data: Partial<Product> & { stock?: number }) => {
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
    createPurchase: async (data: { productId: string; quantity: number; costPrice?: number }) => {
        return await api.post('/inventory/transactions/purchase', data);
    },
    getPendingPurchases: async () => {
        return await api.get<ProductTransaction[]>('/inventory/transactions/purchase/pending');
    },
    resolvePendingPurchase: async (id: string, costPrice: number) => {
        return await api.put(`/inventory/transactions/purchase/${id}/resolve`, { costPrice });
    },
    createSale: async (data: { productId: string; quantity: number; sellingPrice?: number; paymentMethod?: PaymentMethod }) => {
        return await api.post('/inventory/transactions/sale', data);
    },
    createBulkSale: async (data: { items: { productId: string; quantity: number; sellingPrice?: number }[]; paymentMethod?: PaymentMethod }) => {
        return await api.post('/inventory/transactions/bulk-sale', data);
    },
    createAdjustment: async (data: { productId: string; quantity: number; reason?: string }) => {
        return await api.post('/inventory/transactions/adjustment', data);
    }
};
