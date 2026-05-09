import type { CartItem } from "@/features/order/types/order.types";

export function calculateCartTotal(cart: CartItem[]) {
  return cart.reduce((total, item) => {
    const rawSum = item.price * item.quantity;
    const finalSum = rawSum - item.discount;

    return total + Math.max(finalSum, 0);
  }, 0);
}