// app/api/foods/search/route.ts
// GET /api/foods/search?q=tavuk&mealType=lunch&category=chicken&macroFocus=protein

import { NextRequest, NextResponse } from "next/server";
import { aggregatedSearch } from "@/lib/api/foodAggregator";

export const runtime = "edge"; // Vercel Edge — düşük gecikme

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const query       = searchParams.get("q") ?? "";
  const mealType    = searchParams.get("mealType") ?? "all";
  const category    = searchParams.get("category") ?? "all";
  const macroFocus  = searchParams.get("macroFocus") ?? "all";
  const limit       = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
  const offset      = Number(searchParams.get("offset") ?? "0");

  try {
    const result = await aggregatedSearch({
      query,
      mealType,
      category,
      macroFocus,
      limit,
      offset,
      enableApiFallback: true,
      cacheThreshold: 5,
    });

    return NextResponse.json(result, {
      headers: {
        // Tarayıcı 30sn, CDN 5dk cache
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[GET /api/foods/search] error:", err);
    return NextResponse.json(
      { error: "Arama sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
