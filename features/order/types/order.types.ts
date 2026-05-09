export type Id = number;

export type DictionaryOption = {
  id: Id;
  label: string;
};

export type Customer = {
  id: Id;
  name: string;
  phone?: string;
  loyalityCardId?: Id | null;
};

export type Product = {
  id: Id;
  name: string;
  unitId: Id;
  price: number;
};

export type CartItem = Omit<Product, "price"> & {
  quantity: number;
  price: string;
};

export type RepeatPeriod = "hours" | "days" | "weeks" | "months";

export type RepeatSettings = {
  enabled: boolean;
  period: RepeatPeriod;
  value: string;
  count: string;
  nextDate: string;
};

export type OrderFormState = {
  token: string;
  phone: string;
  customer: Customer | null;
  warehouseId: Id | null;
  payboxId: Id | null;
  organizationId: Id | null;
  priceTypeId: Id | null;
  comment: string;
  repeat: RepeatSettings;
};