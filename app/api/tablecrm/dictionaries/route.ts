import { NextRequest, NextResponse } from "next/server";
import {
  tablecrmGet,
  tablecrmGetWithFallback,
} from "@/lib/tablecrm/tablecrm-client";
import { normalizeDictionary } from "@/lib/tablecrm/tablecrm-normalizers";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-tablecrm-token");

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 401 },
      );
    }

    const [warehousesRaw, payboxesRaw, organizationsRaw, priceTypesRaw] =
      await Promise.all([
        tablecrmGet("/warehouses/", token),

        tablecrmGetWithFallback(
          [
            "/pboxes/",
            "/payboxes/",
            "/meta_payboxes/",
          ],
          token,
        ),

        tablecrmGet("/organizations/", token),
        tablecrmGet("/price_types/", token),
      ]);

    return NextResponse.json({
      warehouses: normalizeDictionary(warehousesRaw),
      payboxes: normalizeDictionary(payboxesRaw),
      organizations: normalizeDictionary(organizationsRaw),
      priceTypes: normalizeDictionary(priceTypesRaw),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load dictionaries",
      },
      { status: 500 },
    );
  }
}