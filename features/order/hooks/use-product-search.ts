import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/features/order/types/order.types";

export function useProductSearch(
  token: string,
  query: string,
  priceTypeId?: number | null,
) {
  return useQuery({
    queryKey: ["tablecrm-products", token, query, priceTypeId],
    enabled: Boolean(token),
    queryFn: async (): Promise<Product[]> => {
      const params = new URLSearchParams();

      if (query) {
        params.set("query", query);
      }

      if (priceTypeId) {
        params.set("priceTypeId", String(priceTypeId));
      }

      const response = await fetch(`/api/tablecrm/nomenclature?${params}`, {
        headers: {
          "x-tablecrm-token": token,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить товары");
      }

      const data = await response.json();

      return data.products;
    },
  });
}