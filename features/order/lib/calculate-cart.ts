import type { CartItem } from "@/features/order/types/order.types";
import { parseMoney } from "@/features/order/lib/parse-money";

export function calculateCartTotal(cart: CartItem[]) {
  return cart.reduce((total, item) => {
    return total + parseMoney(item.price) * item.quantity;
  }, 0);
}