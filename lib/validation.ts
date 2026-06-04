export type Validator = (value: any) => string | null;

export type ValidationSchema<T> = {
  [K in keyof T]?: Validator | Validator[];
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const CA_POSTAL_REGEX = /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i;
const PHONE_NA_PARENS = /^\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}$/;
const PHONE_NA_INTL = /^\+?1?\d{10,11}$/;
const HS_CODE_REGEX = /^\d{6,10}$/;
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/i;

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (typeof value === 'number') return Number.isNaN(value);
  return false;
}

export function validateEmail(email: string): string | null {
  if (isBlank(email)) return 'Email is required';
  const trimmed = String(email).trim();
  if (trimmed.length > 254) return 'Email is too long';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(trimmed)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (isBlank(password)) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  return null;
}

export function validateName(name: string): string | null {
  if (isBlank(name)) return 'Name is required';
  const trimmed = String(name).trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be 50 characters or fewer';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (isBlank(phone)) return null;
  const cleaned = String(phone).replace(/\s+/g, '');
  if (!PHONE_NA_PARENS.test(phone) && !PHONE_NA_INTL.test(cleaned)) {
  return 'Use a valid Canadian phone (e.g. (416) 555-0123)';
  }
  return null;
}

export function validatePostalCode(code: string, country: string = 'CA'): string | null {
  if (isBlank(code)) return 'Postal code is required';
  if ((country || 'CA').toUpperCase() === 'CA') {
    if (!CA_POSTAL_REGEX.test(String(code).trim())) {
      return 'Use Canadian format A1A 1A1';
    }
  } else {
    if (String(code).trim().length < 3) return 'Postal code is too short';
  }
  return null;
}

export function validateCity(city: string): string | null {
  if (isBlank(city)) return 'City is required';
  if (String(city).trim().length > 80) return 'City is too long';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (isBlank(value)) return `${fieldName} is required`;
  return null;
}

export function validateWeight(weight: number, unit: 'kg' | 'lb'): string | null {
  if (typeof weight !== 'number' || Number.isNaN(weight)) return 'Enter a valid weight';
  if (weight <= 0) return 'Weight must be greater than 0';
  const maxKg = 70;
  const maxLb = 150;
  if (unit === 'kg' && weight > maxKg) return `Max ${maxKg} kg`;
  if (unit === 'lb' && weight > maxLb) return `Max ${maxLb} lb`;
  return null;
}

export function validateDimensions(
  length: number,
  width: number,
  height: number,
  unit: 'cm' | 'in',
): string | null {
  const values = [length, width, height];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (typeof v !== 'number' || Number.isNaN(v)) continue;
    if (v < 0) return 'Dimensions cannot be negative';
    if (unit === 'cm' && v > 200) return 'Max 200 cm per side';
    if (unit === 'in' && v > 80) return 'Max 80 in per side';
  }
  return null;
}

export function validateAmount(amount: number, min: number, max: number): string | null {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 'Enter a valid amount';
  if (amount < min) return `Minimum is $${min.toFixed(2)}`;
  if (amount > max) return `Maximum is $${max.toFixed(2)}`;
  return null;
}

export function validateHSCode(code: string): string | null {
  if (isBlank(code)) return null;
  const cleaned = String(code).replace(/[.\s-]/g, '');
  if (!HS_CODE_REGEX.test(cleaned)) return 'HS code must be 6–10 digits';
  return null;
}

export function validateCountryCode(code: string): string | null {
  if (isBlank(code)) return 'Country is required';
  if (!COUNTRY_CODE_REGEX.test(String(code).trim())) {
  return 'Use a 2-letter ISO code (e.g. CA, US)';
  }
  return null;
}

function runValidator(value: unknown, validator: Validator | Validator[]): string | null {
  if (Array.isArray(validator)) {
    for (const v of validator) {
      const err = v(value);
      if (err) return err;
    }
    return null;
  }
  return validator(value);
}

export function validateForm<T>(
  values: T,
  schema: ValidationSchema<T>,
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const validator = schema[key];
    if (!validator) continue;
    const value = (values as any)[key];
    const err = runValidator(value, validator as Validator | Validator[]);
    if (err) errors[key as string] = err;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
