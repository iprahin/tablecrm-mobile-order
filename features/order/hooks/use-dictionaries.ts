import { useQuery } from "@tanstack/react-query";
import type { DictionaryOption } from "@/features/order/types/order.types";

type DictionariesResponse = {
  warehouses: DictionaryOption[];
  payboxes: DictionaryOption[];
  organizations: DictionaryOption[];
  priceTypes: DictionaryOption[];
};

export function useDictionaries(token: string) {
  return useQuery({
    queryKey: ["tablecrm-dictionaries", token],
    enabled: Boolean(token),
    queryFn: async (): Promise<DictionariesResponse> => {
      const response = await fetch("/api/tablecrm/dictionaries", {
        headers: {
          "x-tablecrm-token": token,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить справочники");
      }

      return response.json();
    },
  });
}