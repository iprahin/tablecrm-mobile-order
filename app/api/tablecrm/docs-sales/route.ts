import { NextRequest, NextResponse } from "next/server";
import { tablecrmPost } from "@/lib/tablecrm/tablecrm-client";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-tablecrm-token");

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 401 });
    }

    const body = await request.json();

    const result = await tablecrmPost("/docs_sales/", token, body);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create sale",
      },
      { status: 500 },
    );
  }
}