import { NextRequest, NextResponse } from "next/server";
import { tablecrmGet } from "@/lib/tablecrm/tablecrm-client";
import { normalizeCustomers } from "@/lib/tablecrm/tablecrm-normalizers";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-tablecrm-token");
    const phone = request.nextUrl.searchParams.get("phone") ?? "";

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 401 });
    }

    const raw = await tablecrmGet("/meta_contragents/", token, {
      search: phone,
      phone,
    });

    return NextResponse.json({
      customers: normalizeCustomers(raw),
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