import type { Customer, DictionaryOption, Product } from "@/features/order/types/order.types";

type AnyRecord = Record<string, unknown>;

function getArray(payload: unknown): AnyRecord[] {
  if (Array.isArray(payload)) {
    return payload as AnyRecord[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as AnyRecord;

  const candidates = [
    record.data,
    record.items,
    record.result,
    record.results,
    record.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as AnyRecord[];
    }
  }

  return [];
}

function toNumber(value: unknown): number | null {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getLabel(item: AnyRecord): string {
  return (
    toStringValue(item.name) ||
    toStringValue(item.title) ||
    toStringValue(item.label) ||
    toStringValue(item.full_name) ||
    `#${String(item.id ?? "")}`
  );
}

export function normalizeDictionary(payload: unknown): DictionaryOption[] {
  return getArray(payload)
    .map((item) => {
      const id = toNumber(item.id);

      if (!id) {
        return null;
      }

      return {
        id,
        label: getLabel(item),
      };
    })
    .filter((item): item is DictionaryOption => Boolean(item));
}

export function normalizeCustomers(payload: unknown): Customer[] {
  return getArray(payload)
    .map((item): Customer | null => {
      const id = toNumber(item.id);

      if (!id) {
        return null;
      }

      const loyalityCardId =
        toNumber(item.loyality_card_id) ??
        toNumber(item.loyalty_card_id) ??
        toNumber(item.card_id);

      return {
        id,
        name: getLabel(item),
        phone:
          toStringValue(item.phone) ||
          toStringValue(item.tel) ||
          toStringValue(item.mobile),
        loyalityCardId,
      };
    })
    .filter((item): item is Customer => Boolean(item));
}

export function normalizeProducts(payload: unknown): Product[] {
  return getArray(payload)
    .map((item) => {
      const id = toNumber(item.id);

      if (!id) {
        return null;
      }

      const unitId =
        toNumber(item.unit) ??
        toNumber(item.unit_id) ??
        toNumber(item.base_unit) ??
        116;

      const price =
        toNumber(item.price) ??
        toNumber(item.sale_price) ??
        toNumber(item.retail_price) ??
        0;

      return {
        id,
        name: getLabel(item),
        unitId,
        price,
      };
    })
    .filter((item): item is Product => Boolean(item));
}