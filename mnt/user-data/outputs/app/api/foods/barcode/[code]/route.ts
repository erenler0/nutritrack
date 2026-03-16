// app/api/foods/barcode/[code]/route.ts
// GET /api/foods/barcode/8690637011009

import { NextRequest, NextResponse } from "next/server";
import { searchByBarcode } from "@/lib/api/foodAggregator";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code || !/^\d{8,14}$/.test(code)) {
    return NextResponse.json(
      { error: "Geçersiz barkod formatı. 8–14 haneli sayı olmalı." },
      { status: 400 }
    );
  }

  try {
    const food = await searchByBarcode(code);

    if (!food) {
      return NextResponse.json(
        { error: "Bu barkoda ait ürün bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ food }, {
      headers: { "Cache-Control": "public, s-maxage=86400" }, // 24 saat
    });
  } catch (err) {
    console.error("[GET /api/foods/barcode] error:", err);
    return NextResponse.json(
      { error: "Barkod sorgulanırken hata oluştu." },
      { status: 500 }
    );
  }
}
