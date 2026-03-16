// ─── Open Food Facts API Client ──────────────────────────────────────────────
// Ücretsiz, kayıt gerektirmez. Rate limit: makul kullanım (burst yok).
// Döküman: https://openfoodfacts.github.io/openfoodfacts-server/api/

const BASE_URL =
  process.env.NEXT_PUBLIC_OFF_API_BASE ??
  "https://world.openfoodfacts.org/api/v3";

const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

// ─── Ham API tipleri ──────────────────────────────────────────────────────────

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  "energy_100g"?: number;          // kJ — fallback
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  salt_100g?: number;
}

interface OFFProduct {
  id?: string;
  code?: string;                   // barkod
  product_name?: string;
  product_name_tr?: string;        // Türkçe ad (varsa)
  brands?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  nutriments?: OFFNutriments;
  categories_tags?: string[];
  labels_tags?: string[];
  nutriscore_grade?: string;
}

interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
  page: number;
  page_size: number;
}

// ─── Normalize edilmiş tip (uygulama içi) ────────────────────────────────────

export interface NormalizedFood {
  externalId: string;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  imageUrl: string | null;
  category: string | null;
  mealTypes: string[];
  apiSource: "open_food_facts";
}

// ─── Yardımcı: kJ → kcal ─────────────────────────────────────────────────────

function kjToKcal(kj: number): number {
  return Math.round((kj / 4.184) * 10) / 10;
}

// ─── Yardımcı: kategori tahmin ───────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  "en:chicken":          "chicken",
  "en:poultry":          "chicken",
  "en:beef":             "meat",
  "en:red-meat":         "meat",
  "en:fish":             "fish",
  "en:seafood":          "fish",
  "en:plant-based":      "vegan",
  "en:vegan":            "vegan",
  "en:breads":           "pastry",
  "en:pastries":         "pastry",
  "en:dairy":            "dairy",
  "en:cheeses":          "dairy",
  "en:yogurts":          "dairy",
  "en:legumes":          "legume",
  "en:beans":            "legume",
  "en:lentils":          "legume",
};

function inferCategory(tags: string[] = []): string | null {
  for (const tag of tags) {
    if (CATEGORY_MAP[tag]) return CATEGORY_MAP[tag];
  }
  return null;
}

// ─── Yardımcı: öğün tipi tahmin ──────────────────────────────────────────────

function inferMealTypes(tags: string[] = []): string[] {
  const meals: string[] = [];
  const t = tags.join(" ");
  if (/breakfast|cereal|oat|muesli/.test(t)) meals.push("breakfast");
  if (/snack|bar|biscuit|cracker/.test(t))    meals.push("snack");
  if (meals.length === 0) meals.push("lunch", "dinner");
  return meals;
}

// ─── Normalize fonksiyonu ─────────────────────────────────────────────────────

export function normalizeOFFProduct(p: OFFProduct): NormalizedFood | null {
  const n = p.nutriments;
  if (!n) return null;

  // Kalori hesabı: önce kcal, yoksa kJ'den çevir
  const rawKcal = n["energy-kcal_100g"];
  const rawKj   = n["energy_100g"];
  const calories =
    rawKcal != null
      ? rawKcal
      : rawKj != null
      ? kjToKcal(rawKj)
      : null;

  // Kalori yoksa veya sıfırsa atla (veri kalitesi düşük)
  if (!calories || calories <= 0) return null;

  const name =
    p.product_name_tr?.trim() ||
    p.product_name?.trim() ||
    null;

  if (!name) return null;

  const id = p.code ?? p.id ?? "";
  if (!id) return null;

  return {
    externalId:      id,
    name,
    brand:           p.brands?.trim() || null,
    caloriesPer100g: Math.round(calories * 10) / 10,
    proteinPer100g:  Math.round((n.proteins_100g ?? 0) * 10) / 10,
    carbsPer100g:    Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fatPer100g:      Math.round((n.fat_100g ?? 0) * 10) / 10,
    fiberPer100g:    Math.round((n.fiber_100g ?? 0) * 10) / 10,
    imageUrl:        p.image_front_small_url ?? p.image_front_url ?? null,
    category:        inferCategory(p.categories_tags),
    mealTypes:       inferMealTypes(p.categories_tags),
    apiSource:       "open_food_facts",
  };
}

// ─── API fonksiyonları ────────────────────────────────────────────────────────

/**
 * İsim ile yiyecek ara.
 * Sonuçlar normalize edilir; eksik besin değeri olanlar filtrelenir.
 */
export async function searchOFF(
  query: string,
  pageSize = 20
): Promise<NormalizedFood[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    search_terms:    query,
    search_simple:   "1",
    action:          "process",
    json:            "1",
    page_size:       String(pageSize),
    fields: [
      "code","product_name","product_name_tr","brands",
      "image_front_small_url","nutriments",
      "categories_tags","labels_tags",
    ].join(","),
  });

  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      next: { revalidate: 3600 }, // 1 saat cache (Next.js fetch cache)
    });

    if (!res.ok) {
      console.error("[searchOFF] HTTP error:", res.status);
      return [];
    }

    const data: OFFSearchResponse = await res.json();
    return data.products
      .map(normalizeOFFProduct)
      .filter((f): f is NormalizedFood => f !== null);
  } catch (err) {
    console.error("[searchOFF] fetch error:", err);
    return [];
  }
}

/**
 * Barkod ile tekil ürün getir.
 */
export async function getOFFByBarcode(
  barcode: string
): Promise<NormalizedFood | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/product/${barcode}?fields=code,product_name,product_name_tr,brands,image_front_url,nutriments,categories_tags`,
      { next: { revalidate: 86400 } } // 24 saat cache
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "success" || !data.product) return null;

    return normalizeOFFProduct(data.product);
  } catch (err) {
    console.error("[getOFFByBarcode] fetch error:", err);
    return null;
  }
}
