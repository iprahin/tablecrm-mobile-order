import type { CartItem, Customer, Id, RepeatSettings } from "@/features/order/types/order.types";
import { parseMoney } from "./parse-money";

type BuildSalePayloadParams = {
  cart: CartItem[];
  customer: Customer;
  warehouseId: Id;
  payboxId: Id;
  organizationId: Id;
  paidRubles: number;
  shouldConduct: boolean;
  repeat: RepeatSettings;
  comment?: string;
};

function toUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

export function buildSalePayload(params: BuildSalePayloadParams) {
  const settings: Record<string, string | number> = {};

  if (params.repeat.enabled) {
    settings.repeatability_period = params.repeat.period;
    settings.repeatability_value = params.repeat.value;
    settings.repeatability_count = params.repeat.count;

    if (params.repeat.nextDate) {
      settings.date_next_created = toUnixSeconds(new Date(params.repeat.nextDate));
    }
  }

  const sale: Record<string, unknown> = {
    priority: 0,
    dated: toUnixSeconds(new Date()),
    operation: "Заказ",
    tax_included: true,
    tax_active: true,
    goods: params.cart.map((item) => ({
      price: parseMoney(item.price),
      quantity: item.quantity,
      unit: item.unitId,
      discount: 0,
      sum_discounted: 0,
      nomenclature: item.id,
    })),
    settings,
    warehouse: params.warehouseId,
    contragent: params.customer.id,
    paybox: params.payboxId,
    organization: params.organizationId,
    status: params.shouldConduct,
    paid_rubles: Number(params.paidRubles.toFixed(2)),
    paid_lt: 0,
  };

  if (params.customer.loyalityCardId) {
    sale.loyality_card_id = params.customer.loyalityCardId;
  }

  if (params.comment) {
    sale.comment = params.comment;
  }

  return [sale];
}