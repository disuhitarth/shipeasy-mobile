export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  walletBalance: number;
  stripeCustomerId?: string;
  autoReload?: {
    enabled: boolean;
    threshold: number;
    amount: number;
  };
  isActive: boolean;
  createdAt: string;
}

export interface ShipmentItem {
  description: string;
  quantity: number;
  value: number;
  currency: string;
  countryOfOrigin: string;
  hsCode: string;
}

export interface Shipment {
  _id: string;
  userId?: string;
  shipCode: string;
  trackingCode?: string;
  status: ShipmentStatus;
  recipientName: string;
  recipientAddress1: string;
  recipientAddress2?: string;
  recipientCity: string;
  recipientProvinceCode: string;
  recipientPostalCode: string;
  recipientCountryCode: string;
  weight: number;
  weightUnit: string;
  length?: number;
  width?: number;
  height?: number;
  sizeUnit?: string;
  packageType: string;
  postageType: string;
  items: ShipmentItem[];
  customerRate: number;
  customerTax: number;
  customerTotal: number;
  labelFormat?: string;
  service?: string;
  insured?: boolean;
  signatureConfirmation?: boolean;
  includeReturnLabel?: boolean;
  stripeSessionId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentStatus =
  | 'pending'
  | 'label-created'
  | 'picked-up'
  | 'in-transit'
  | 'out-for-delivery'
  | 'delivered'
  | 'void-requested'
  | 'voided'
  | 'failed';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  createdAt: string;
}

export type TransactionType =
  | 'deposit'
  | 'shipment_charge'
  | 'refund'
  | 'admin_credit'
  | 'admin_debit';

export interface Address {
  _id: string;
  userId: string;
  label?: string;
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  provinceCode: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  email?: string;
  isResidential: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface SKU {
  _id: string;
  userId: string;
  sku: string;
  name: string;
  description: string;
  hsCode: string;
  countryOfOrigin: string;
  ddpStatus: 'pending' | 'approved' | 'failed' | 'missing_info';
  ddpApprovedAt?: string;
  classificationNotes?: string;
  shippingScope: 'us_only' | 'worldwide' | 'custom';
  allowedCountries?: string[];
  defaultValue: number;
  defaultCurrency: string;
  defaultQuantity: number;
  manufacturer?: {
    name: string;
    address1: string;
    city: string;
    provinceCode: string;
    postalCode: string;
    countryCode: string;
    midCode?: string;
  };
  imageUrl?: string;
  preferredPostageType?: string;
  requiresSignature: boolean;
  requiresInsurance: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  service: string;
  days: string;
  postageType: string;
  baseRate: number;
  markedUpRate: number;
  tax: number;
  totalPrice: number;
  profit: number;
}

export interface TrackingEvent {
  date: string;
  location: string;
  description: string;
  status: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AIParsedAddress {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province_code: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  email?: string;
  confidence: number;
  warnings: string[];
  detected_quantity?: number;
  detected_product?: string;
  sku?: string;
  hs_code?: string;
  weight?: number;
  weight_unit?: string;
  length?: number;
  width?: number;
  height?: number;
  size_unit?: string;
  value?: number;
  original_text: string;
}

export interface AIBatchResult {
  addresses: AIParsedAddress[];
  total_detected: number;
  processing_notes: string[];
}
