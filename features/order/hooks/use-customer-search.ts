import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@/features/order/types/order.types";

export function useCustomerSearch(token: string, phone: string) {
  return useQuery({
    queryKey: ["tablecrm-customers", token, phone],
    enabled: Boolean(token) && phone.length >= 3,
    queryFn: async (): Promise<Customer[]> => {
      const params = new URLSearchParams({ phone });

      const response = await fetch(`/api/tablecrm/contragents?${params}`, {
        headers: {
          "x-tablecrm-token": token,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось найти клиента");
      }

      const data = await response.json();

      return data.customers;
    },
  });
}