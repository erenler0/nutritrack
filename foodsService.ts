import { getSupabaseClient } from "@/lib/supabase/client";
import type { Food } from "@/lib/supabase/database.types";

export interface SearchFoodsParams {
  query?: string;
  mealType?: string;       // 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'all'
  category?: string;       // 'chicken' | 'meat' | 'fish' | 'vegan' | ...
  macroFocus?: string;     // 'protein' | 'carbs' | 'fat' | 'all'
  limit?: number;
  offset?: number;
}

export interface SearchFoodsResult {
  data: Food[];
  count: number;
  error: string | null;
}

// Makro odağına göre minimum eşikler
const MACRO_THRESHOLDS: Record<string, { field: keyof Food; min: number }> = {
  protein: { field: "protein_per_100g", min: 15 },
  carbs:   { field: "carbs_per_100g",   min: 20 },
  fat:     { field: "fat_per_100g",      min: 8 },
};

/**
 * Yiyecek arama — filtre kombinasyonları desteklenir.
 * Trigram index sayesinde kısmi ve yazım hatalı aramalar da çalışır.
 */
export async function searchFoods(
  params: SearchFoodsParams = {}
): Promise<SearchFoodsResult> {
  const {
    query = "",
    mealType = "all",
    category = "all",
    macroFocus = "all",
    limit = 20,
    offset = 0,
  } = params;

  const supabase = getSupabaseClient();

  let q = supabase
    .from("foods")
    .select("*", { count: "exact" })
    .order("name")
    .range(offset, offset + limit - 1);

  // Metin araması: trigram benzerliği (ilike yeterli, tam fuzzy için RPC gerekir)
  if (query.trim()) {
    q = q.ilike("name_normalized", `%${query.toLowerCase().trim()}%`);
  }

  // Öğün tipi filtresi: array overlap
  if (mealType !== "all") {
    q = q.contains("meal_types", [mealType]);
  }

  // Kategori filtresi
  if (category !== "all") {
    q = q.eq("category", category);
  }

  // Makro odağı filtresi: minimum eşik
  const threshold = MACRO_THRESHOLDS[macroFocus];
  if (threshold) {
    q = q.gte(threshold.field as string, threshold.min);
  }

  const { data, error, count } = await q;

  if (error) {
    console.error("[searchFoods] Supabase error:", error.message);
    return { data: [], count: 0, error: error.message };
  }

  return { data: data ?? [], count: count ?? 0, error: null };
}

/**
 * Tekil yiyecek getir
 */
export async function getFoodById(id: string): Promise<Food | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getFoodById] Supabase error:", error.message);
    return null;
  }

  return data;
}

/**
 * Yeni yiyecek ekle (kullanıcı katkısı veya API cache)
 */
export async function upsertFood(
  food: Omit<Food, "id" | "name_normalized" | "created_at">
): Promise<Food | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("foods")
    .upsert(food, { onConflict: "api_source,external_id" })
    .select()
    .single();

  if (error) {
    console.error("[upsertFood] Supabase error:", error.message);
    return null;
  }

  return data;
}
