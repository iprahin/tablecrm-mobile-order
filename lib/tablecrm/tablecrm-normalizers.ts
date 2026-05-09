import type {
  Customer,
  DictionaryOption,
  Product,
} from "@/features/order/types/order.types";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getArray(payload: unknown): AnyRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.items,
    payload.result,
    payload.results,
    payload.rows,
    payload.objects,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }

    if (isRecord(candidate)) {
      const nested = getArray(candidate);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function toNumber(value: unknown): number | null {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function getLabel(item: AnyRecord): string {
  const fullName = [
    toStringValue(item.last_name),
    toStringValue(item.first_name),
    toStringValue(item.middle_name),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    toStringValue(item.name) ||
    toStringValue(item.title) ||
    toStringValue(item.label) ||
    toStringValue(item.full_name) ||
    toStringValue(item.fio) ||
    toStringValue(item.company_name) ||
    toStringValue(item.contragent_name) ||
    fullName ||
    `#${String(item.id ?? "")}`
  );
}

function getNestedId(value: unknown): number | null {
  if (typeof value === "number" || typeof value === "string") {
    return toNumber(value);
  }

  if (isRecord(value)) {
    return toNumber(value.id) ?? toNumber(value.idx);
  }

  if (Array.isArray(value)) {
    const firstRecord = value.find(isRecord);

    if (firstRecord) {
      return toNumber(firstRecord.id) ?? toNumber(firstRecord.idx);
    }
  }

  return null;
}

function getPhone(item: AnyRecord): string {
  const directPhone =
    toStringValue(item.phone) ||
    toStringValue(item.tel) ||
    toStringValue(item.mobile) ||
    toStringValue(item.phone_number) ||
    toStringValue(item.main_phone);

  if (directPhone) {
    return directPhone;
  }

  const phonesCandidate = item.phones ?? item.phone_numbers ?? item.contacts;

  if (Array.isArray(phonesCandidate)) {
    for (const phoneItem of phonesCandidate) {
      if (!isRecord(phoneItem)) {
        continue;
      }

      const nestedPhone =
        toStringValue(phoneItem.phone) ||
        toStringValue(phoneItem.value) ||
        toStringValue(phoneItem.number) ||
        toStringValue(phoneItem.title);

      if (nestedPhone) {
        return nestedPhone;
      }
    }
  }

  return "";
}

export function normalizeDictionary(payload: unknown): DictionaryOption[] {
  return getArray(payload)
    .map((item) => {
      const id = toNumber(item.id) ?? toNumber(item.idx);

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
      const id = toNumber(item.id) ?? toNumber(item.idx);

      if (!id) {
        return null;
      }

      const loyalityCardId =
        getNestedId(item.loyality_card_id) ??
        getNestedId(item.loyalty_card_id) ??
        getNestedId(item.card_id) ??
        getNestedId(item.loyality_card) ??
        getNestedId(item.loyalty_card) ??
        getNestedId(item.loyality_cards) ??
        getNestedId(item.loyalty_cards) ??
        getNestedId(item.cards);

      return {
        id,
        name: getLabel(item),
        phone: getPhone(item),
        loyalityCardId,
      };
    })
    .filter((item): item is Customer => Boolean(item));
}

export function normalizeProducts(payload: unknown): Product[] {
  return getArray(payload)
    .map((item) => {
      const id = toNumber(item.id) ?? toNumber(item.idx);

      if (!id) {
        return null;
      }

      const unitId =
        getNestedId(item.unit) ??
        toNumber(item.unit_id) ??
        toNumber(item.base_unit) ??
        toNumber(item.measure_unit) ??
        116;

      const price =
        toNumber(item.price) ??
        toNumber(item.sale_price) ??
        toNumber(item.retail_price) ??
        toNumber(item.cost) ??
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