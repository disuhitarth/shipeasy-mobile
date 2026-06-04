import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from './api';
import type { Shipment, Transaction, Address, SKU, ShippingRate, Pagination } from '@/types';

// ── Shipments ──

export function useShipments(page = 1, status?: string) {
  return useQuery({
    queryKey: ['shipments', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await api.get<{ shipments: Shipment[]; pagination: Pagination }>(
        `/shipments?${params}`,
      );
      return res.data;
    },
  });
}

export const SHIPMENTS_PAGE_SIZE = 20;

export function useInfiniteShipments(filter?: { status?: string; sort?: string; search?: string }) {
  return useInfiniteQuery({
    queryKey: ['shipments', 'infinite', filter],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(SHIPMENTS_PAGE_SIZE),
      });
      if (filter?.status) params.set('status', filter.status);
      if (filter?.sort) params.set('sort', filter.sort);
      if (filter?.search) params.set('search', filter.search);
      const res = await api.get<{ shipments: Shipment[]; pagination: Pagination }>(
        `/shipments?${params}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useShipment(shipCode: string) {
  return useQuery({
    queryKey: ['shipment', shipCode],
    queryFn: async () => {
      const res = await api.get<Shipment>(`/shipments/${shipCode}`);
      return res.data;
    },
    enabled: !!shipCode,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Shipment>) => {
      const res = await api.post<Shipment>('/shipments', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useVoidShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shipCode: string) => {
      const res = await api.post(`/shipments/${shipCode}/void`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useTracking(shipCode: string) {
  return useQuery({
    queryKey: ['tracking', shipCode],
    queryFn: async () => {
      const res = await api.get(`/shipments/${shipCode}/track`);
      return res.data;
    },
    enabled: !!shipCode,
  });
}

// ── Wallet ──

export function useWalletData() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get<{
        balance: number;
        role: string;
        transactions: Transaction[];
      }>('/wallet');
      return res.data;
    },
  });
}

export const WALLET_TX_PAGE_SIZE = 20;

export type InfiniteWalletTxResult = ReturnType<typeof useInfiniteWalletTransactions>;

export function useInfiniteWalletTransactions() {
  return useInfiniteQuery({
    queryKey: ['wallet', 'transactions', 'infinite'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(WALLET_TX_PAGE_SIZE),
      });
      const res = await api.get<{ transactions: Transaction[]; pagination: Pagination }>(
        `/wallet/transactions?${params}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useCreateTopup() {
  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post<{ url: string }>('/wallet/topup', { amount });
      return res.data;
    },
  });
}

export function useAutoReload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { enabled: boolean; threshold?: number; amount?: number }) => {
      const res = await api.put('/wallet/auto-reload', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
}

// ── Rates ──

export function useGetRates() {
  return useMutation({
    mutationFn: async (data: {
      fromPostalCode: string;
      toCountry: string;
      toPostalCode: string;
      weight: number;
      weightUnit: string;
      length?: number;
      width?: number;
      height?: number;
    }) => {
      const res = await api.post<{ rates: ShippingRate[] }>('/rates', data);
      return res.data;
    },
  });
}

export function useQuickQuote() {
  return useMutation({
    mutationFn: async (data: {
      toPostalCode: string;
      toCountry: string;
      packageType: string;
    }) => {
      const res = await api.post<{ startingFrom: number }>('/rates/quote', data);
      return res.data;
    },
  });
}

// ── Addresses ──

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get<Address[]>('/addresses');
      return res.data;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Address>) => {
      const res = await api.post<Address>('/addresses', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Address> }) => {
      const res = await api.put<Address>(`/addresses/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/addresses/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

// ── SKUs ──

export function useSKUs() {
  return useQuery({
    queryKey: ['skus'],
    queryFn: async () => {
      const res = await api.get<SKU[]>('/skus');
      return res.data;
    },
  });
}

export function useCreateSKU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SKU>) => {
      const res = await api.post<SKU>('/skus', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skus'] }),
  });
}

export function useUpdateSKU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SKU> }) => {
      const res = await api.put<SKU>(`/skus/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skus'] }),
  });
}

export function useDeleteSKU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skus/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skus'] }),
  });
}

// ── AI ──

export function useParseBatch() {
  return useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post('/ai/parse-batch', { text });
      return res.data;
    },
  });
}

export function useClassifyHS() {
  return useMutation({
    mutationFn: async (description: string) => {
      const res = await api.post('/ai/classify-hs', { description });
      return res.data;
    },
  });
}

// ── Guest Checkout ──

export function useGuestCheckout() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      province_code: string;
      postal_code: string;
      country_code: string;
      email: string;
      phone?: string;
      itemDescription: string;
      packagePreset: string;
    }) => {
      const res = await api.post<{ url: string }>('/checkout/guest', data);
      return res.data;
    },
  });
}
