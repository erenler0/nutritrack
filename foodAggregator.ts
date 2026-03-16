// ─── Food Aggregator ─────────────────────────────────────────────────────────
// Strateji: Supabase cache → OFF API → cache'e yaz
//
// Bu katman SearchPage ve useFoodSearch'ün tek giriş noktası.
// Supabase'de veri varsa API çağrısı yapılmaz (hız + rate limit).
// Yoksa OFF'tan çek, normalize et, Supabase'e yaz, döndür.

import { searchFoods, upsertFood, type SearchFoodsParams } from "@/lib/services/foodsService";
import { searchOFF, getOFFByBarcode, type NormalizedFood } from "@/lib/api/openFoodFacts";
import type { Food } from "@/lib/supabase/database.types";

// ─── Tip dönüşümü: NormalizedFood → Supabase insert shape ────────────────────

function toFoodInsert(
  nf: NormalizedFood
): Omit<Food, "id" | "name_normalized" | "created_at"> {
  return {
    name:               nf.name,
    brand:              nf.brand,
    meal_types:         nf.mealTypes,
    category:           nf.category,
    calories_per_100g:  nf.caloriesPer100g,
    protein_per_100g:   nf.proteinPer100g,
    carbs_per_100g:     nf.carbsPer100g,
    fat_per_100g:       nf.fatPer100g,
    fiber_per_100g:     nf.fiberPer100g,
    image_url:          nf.imageUrl,
    api_source:         nf.apiSource,
    external_id:        nf.externalId,
    created_by:         null,
  };
}

// ─── Ana arama fonksiyonu ─────────────────────────────────────────────────────

export interface AggregatedSearchParams extends SearchFoodsParams {
  /** Supabase'de yeterli sonuç yoksa OFF API'ye fallback yapılsın mı? */
  enableApiFallback?: boolean;
  /** Supabase'de kaç sonuç bulunursa API'ye gitme */
  cacheThreshold?: number;
}

export interface AggregatedSearchResult {
  foods: Food[];
  source: "cache" | "api" | "mixed";
  total: number;
}

export async function aggregatedSearch(
  params: AggregatedSearchParams
): Promise<AggregatedSearchResult> {
  const {
    enableApiFallback = true,
    cacheThreshold = 5,
    ...searchParams
  } = params;

  // 1. Supabase cache'i sorgula
  const cached = await searchFoods(searchParams);

  // Cache yeterliyse direkt dön
  if (!enableApiFallback || cached.count >= cacheThreshold) {
    return {
      foods: cached.data,
      source: "cache",
      total: cached.count,
    };
  }

  // 2. Cache yetersizse OFF API'ye git
  const query = searchParams.query ?? "";
  if (!query.trim()) {
    return { foods: cached.data, source: "cache", total: cached.count };
  }

  const apiResults = await searchOFF(query, 10);

  if (apiResults.length === 0) {
    return { foods: cached.data, source: "cache", total: cached.count };
  }

  // 3. API sonuçlarını Supabase'e cache'le (fire-and-forget)
  const cachePromises = apiResults.map((nf) =>
    upsertFood(toFoodInsert(nf)).catch((e) =>
      console.warn("[aggregatedSearch] upsert skip:", e)
    )
  );
  // Sayfa render'ını bloklamamak için await etmiyoruz
  Promise.allSettled(cachePromises);

  // 4. API sonuçlarını Food tipine çevir (id henüz yok → geçici UUID)
  const apiFoods: Food[] = apiResults.map((nf) => ({
    id:                 `off_${nf.externalId}`,   // geçici — DB'de gerçek ID oluşacak
    name:               nf.name,
    name_normalized:    nf.name.toLowerCase(),
    brand:              nf.brand,
    meal_types:         nf.mealTypes,
    category:           nf.category,
    calories_per_100g:  nf.caloriesPer100g,
    protein_per_100g:   nf.proteinPer100g,
    carbs_per_100g:     nf.carbsPer100g,
    fat_per_100g:       nf.fatPer100g,
    fiber_per_100g:     nf.fiberPer100g,
    image_url:          nf.imageUrl,
    api_source:         "open_food_facts" as const,
    external_id:        nf.externalId,
    created_by:         null,
    created_at:         new Date().toISOString(),
  }));

  // Duplicate önleme: cache'te zaten olan external_id'leri filtrele
  const cachedExternalIds = new Set(
    cached.data.map((f) => f.external_id).filter(Boolean)
  );
  const freshFromApi = apiFoods.filter(
    (f) => !cachedExternalIds.has(f.external_id)
  );

  const merged = [...cached.data, ...freshFromApi];

  return {
    foods: merged,
    source: cached.data.length > 0 ? "mixed" : "api",
    total: merged.length,
  };
}

// ─── Barkod araması ───────────────────────────────────────────────────────────

export async function searchByBarcode(barcode: string): Promise<Food | null> {
  // Önce Supabase'de barkoda göre bak
  const cached = await searchFoods({ query: barcode, limit: 1 });
  if (cached.data.length > 0) return cached.data[0];

  // Yoksa OFF'tan çek ve cache'e yaz
  const nf = await getOFFByBarcode(barcode);
  if (!nf) return null;

  const inserted = await upsertFood(toFoodInsert(nf));

  // upsert başarısızsa yine de geçici objeyi dön
  if (!inserted) {
    return {
      id:                `off_${nf.externalId}`,
      name:              nf.name,
      name_normalized:   nf.name.toLowerCase(),
      brand:             nf.brand,
      meal_types:        nf.mealTypes,
      category:          nf.category,
      calories_per_100g: nf.caloriesPer100g,
      protein_per_100g:  nf.proteinPer100g,
      carbs_per_100g:    nf.carbsPer100g,
      fat_per_100g:      nf.fatPer100g,
      fiber_per_100g:    nf.fiberPer100g,
      image_url:         nf.imageUrl,
      api_source:        "open_food_facts",
      external_id:       nf.externalId,
      created_by:        null,
      created_at:        new Date().toISOString(),
    };
  }

  return inserted;
}
