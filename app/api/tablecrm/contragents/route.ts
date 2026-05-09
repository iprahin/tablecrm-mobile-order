import { NextRequest, NextResponse } from "next/server";
import { tablecrmGetWithFallback } from "@/lib/tablecrm/tablecrm-client";
import { normalizeCustomers } from "@/lib/tablecrm/tablecrm-normalizers";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-tablecrm-token");
    const phone = request.nextUrl.searchParams.get("phone") ?? "";

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 401 },
      );
    }

    const raw = await tablecrmGetWithFallback<unknown>(
      [
        "/contragents/",
        "/meta_contragents/",
      ],
      token,
      {
        phone,
        search: phone,
        q: phone,
        query: phone,
        limit: 20,
        offset: 0,
      },
    );

    const customers = normalizeCustomers(raw);

    const phoneDigits = normalizePhone(phone);

    const filteredCustomers = phoneDigits
      ? customers.filter((customer) => {
          const customerPhoneDigits = normalizePhone(customer.phone ?? "");

          return (
            customerPhoneDigits.includes(phoneDigits) ||
            phoneDigits.includes(customerPhoneDigits)
          );
        })
      : customers;

    return NextResponse.json({
      customers:
        filteredCustomers.length > 0
          ? filteredCustomers.slice(0, 20)
          : customers.slice(0, 20),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to search customers",
      },
      { status: 500 },
    );
  }
}