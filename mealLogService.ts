import { getSupabaseClient } from "@/lib/supabase/client";
import type { MealLog, MealLogItem, Food } from "@/lib/supabase/database.types";
import { calcMacrosForGrams } from "@/hooks/useCalorieCalculator";

// ─── Tipler ──────────────────────────────────────────────────────────────────

export interface LogMealItemParams {
  userId: string;
  logDate?: string;          // ISO date, varsayılan: bugün
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  food: Food;
  quantityG: number;
  portionSize?: number;      // 0.5 | 1 | 2
}

export interface MealLogWithItems extends MealLog {
  items: Array<MealLogItem & { food: Food }>;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: {
    type: string;
    calories: number;
    itemCount: number;
  }[];
}

// ─── Öğün kaydı ──────────────────────────────────────────────────────────────

/**
 * Bir yiyeceği günlüğe ekle.
 * meal_logs tablosunda o gün+öğün için kayıt yoksa oluşturur (upsert),
 * ardından meal_log_items'a kalemi ekler.
 */
export async function logMealItem(
  params: LogMealItemParams
): Promise<{ success: boolean; error: string | null }> {
  const {
    userId,
    logDate = new Date().toISOString().split("T")[0],
    mealType,
    food,
    quantityG,
    portionSize = 1,
  } = params;

  const supabase = getSupabaseClient();

  // 1. meal_log kaydını bul veya oluştur
  const { data: log, error: logError } = await supabase
    .from("meal_logs")
    .upsert(
      { user_id: userId, log_date: logDate, meal_type: mealType },
      { onConflict: "user_id,log_date,meal_type" }
    )
    .select()
    .single();

  if (logError || !log) {
    console.error("[logMealItem] meal_log upsert hatası:", logError?.message);
    return { success: false, error: logError?.message ?? "Log oluşturulamadı" };
  }

  // 2. Makroları hesapla (snapshot)
  const macros = calcMacrosForGrams(
    {
      id: food.id,
      name: food.name,
      caloriesPer100g: food.calories_per_100g,
      proteinPer100g: food.protein_per_100g,
      carbsPer100g: food.carbs_per_100g,
      fatPer100g: food.fat_per_100g,
      fiberPer100g: food.fiber_per_100g ?? 0,
    },
    quantityG
  );

  // 3. Log kalemini ekle
  const { error: itemError } = await supabase.from("meal_log_items").insert({
    meal_log_id:  log.id,
    food_id:      food.id,
    quantity_g:   quantityG,
    portion_size: portionSize,
    calories:     macros.calories,
    protein_g:    macros.protein,
    carbs_g:      macros.carbs,
    fat_g:        macros.fat,
    fiber_g:      macros.fiber,
  });

  if (itemError) {
    console.error("[logMealItem] item insert hatası:", itemError.message);
    return { success: false, error: itemError.message };
  }

  return { success: true, error: null };
}

// ─── Günlük log ──────────────────────────────────────────────────────────────

/**
 * Kullanıcının belirli bir günkü tüm öğün loglarını getirir.
 * Her log altında yiyecek detaylarıyla birlikte kalemler bulunur.
 */
export async function getUserDailyLog(
  userId: string,
  date: string = new Date().toISOString().split("T")[0]
): Promise<MealLogWithItems[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("meal_logs")
    .select(`
      *,
      items:meal_log_items (
        *,
        food:foods (*)
      )
    `)
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("meal_type");

  if (error) {
    console.error("[getUserDailyLog] Supabase error:", error.message);
    return [];
  }

  return (data as MealLogWithItems[]) ?? [];
}

/**
 * Günlük makro özeti — hedef karşılaştırması için
 */
export async function getDailySummary(
  userId: string,
  date: string = new Date().toISOString().split("T")[0]
): Promise<DailySummary> {
  const logs = await getUserDailyLog(userId, date);

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  const meals = logs.map((log) => {
    const mealCalories = log.items.reduce((sum, item) => sum + item.calories, 0);
    totalCalories += mealCalories;
    totalProtein  += log.items.reduce((sum, item) => sum + item.protein_g, 0);
    totalCarbs    += log.items.reduce((sum, item) => sum + item.carbs_g, 0);
    totalFat      += log.items.reduce((sum, item) => sum + item.fat_g, 0);
    totalFiber    += log.items.reduce((sum, item) => sum + (item.fiber_g ?? 0), 0);

    return {
      type:      log.meal_type,
      calories:  Math.round(mealCalories * 10) / 10,
      itemCount: log.items.length,
    };
  });

  return {
    date,
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein:  Math.round(totalProtein * 10) / 10,
    totalCarbs:    Math.round(totalCarbs * 10) / 10,
    totalFat:      Math.round(totalFat * 10) / 10,
    totalFiber:    Math.round(totalFiber * 10) / 10,
    meals,
  };
}

/**
 * Log kalemini sil
 */
export async function removeMealLogItem(
  itemId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("meal_log_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

/**
 * Son N günün kalori geçmişi — profil sayfası grafiği için
 */
export async function getCalorieHistory(
  userId: string,
  days: number = 7
): Promise<{ date: string; calories: number }[]> {
  const supabase = getSupabaseClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days + 1);
  const fromISO = fromDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("meal_logs")
    .select(`
      log_date,
      items:meal_log_items (calories)
    `)
    .eq("user_id", userId)
    .gte("log_date", fromISO)
    .order("log_date");

  if (error || !data) return [];

  // Tarihe göre kalori topla
  const byDate: Record<string, number> = {};
  for (const log of data as any[]) {
    const d = log.log_date as string;
    const cal = (log.items as { calories: number }[]).reduce(
      (s, i) => s + i.calories,
      0
    );
    byDate[d] = (byDate[d] ?? 0) + cal;
  }

  return Object.entries(byDate)
    .map(([date, calories]) => ({ date, calories: Math.round(calories) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
