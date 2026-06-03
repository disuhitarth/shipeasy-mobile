export interface CustomsItem {
  description: string;
  quantity: string;
  value: string;
  origin: string;
  hsCode: string;
}

export interface WizardState {
  fromId: string;
  toName: string;
  toLine: string;
  toCity: string;
  toProvince: string;
  toPostal: string;
  toCountry: string;
  packageType: string;
  weightUnit: 'lb' | 'oz' | 'kg' | 'g';
  weight: string;
  dimUnit: 'in' | 'cm';
  length: string;
  width: string;
  height: string;
  appliedSku: {
    id: string;
    name: string;
    sku: string;
    weight: string;
    weightUnit: string;
    dims: string;
    value: string;
    countryOfOrigin: string;
    hsCode: string;
  } | null;
  items: CustomsItem[];
  rateId: string;
}

export const DEFAULT_WIZARD: WizardState = {
  fromId: '',
  toName: '',
  toLine: '',
  toCity: '',
  toProvince: '',
  toPostal: '',
  toCountry: 'CA',
  packageType: 'Box / Parcel',
  weightUnit: 'lb',
  weight: '',
  dimUnit: 'in',
  length: '',
  width: '',
  height: '',
  appliedSku: null,
  items: [{ description: '', quantity: '1', value: '', origin: 'Canada', hsCode: '' }],
  rateId: '',
};

export const PACKAGE_TYPES = ['Box / Parcel', 'Soft pack', 'Envelope'];
export const WEIGHT_UNITS = ['lb', 'oz', 'kg', 'g'] as const;
export const DIM_UNITS = ['in', 'cm'] as const;
export const STEP_TITLES = ['Address', 'Package', 'Customs', 'Rates', 'Review'];
export const STEP_SUBS = [
  'Confirm sender and recipient.',
  'Tell us about your parcel.',
  'Declare the contents.',
  'Live prices, tax included.',
  'Charged from your wallet balance.',
];
