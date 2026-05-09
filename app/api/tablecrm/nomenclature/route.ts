import { NextRequest, NextResponse } from "next/server";
import { tablecrmGet } from "@/lib/tablecrm/tablecrm-client";
import { normalizeProducts } from "@/lib/tablecrm/tablecrm-normalizers";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-tablecrm-token");
    const query = request.nextUrl.searchParams.get("query") ?? "";
    const priceTypeId = request.nextUrl.searchParams.get("priceTypeId") ?? "";

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 401 });
    }

    const raw = await tablecrmGet("/nomenclature/", token, {
      search: query,
      q: query,
      price_type: priceTypeId,
      price_type_id: priceTypeId,
    });

    return NextResponse.json({
      products: normalizeProducts(raw),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to search products",
      },
      { status: 500 },
    );
  }
}