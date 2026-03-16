import { getSupabaseClient } from "@/lib/supabase/client";
import type { Profile, UserGoal } from "@/lib/supabase/database.types";

// ─── Profil ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[getProfile] error:", error.message);
    return null;
  }
  return data;
}

export async function upsertProfile(
  profile: Database["public"]["Tables"]["profiles"]["Insert"]
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ─── Hedefler ────────────────────────────────────────────────────────────────

/**
 * Kullanıcının o güne kadar geçerli en son hedefini getirir.
 */
export async function getActiveGoal(userId: string): Promise<UserGoal | null> {
  const supabase = getSupabaseClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", userId)
    .lte("valid_from", today)
    .order("valid_from", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Kayıt yoksa sessizce null dön
    if (error.code === "PGRST116") return null;
    console.error("[getActiveGoal] error:", error.message);
    return null;
  }
  return data;
}

export async function setGoal(
  goal: Omit<UserGoal, "id" | "created_at">
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("user_goals").insert(goal);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ─── BMR / TDEE hesabı (Mifflin-St Jeor) ────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
};

export function calculateTDEE(profile: Profile): number | null {
  const { age, gender, height_cm, weight_kg, activity_level } = profile;
  if (!age || !gender || !height_cm || !weight_kg) return null;

  // Mifflin-St Jeor BMR
  const bmr =
    gender === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.55;
  return Math.round(bmr * multiplier);
}

// Database tipini import et (circular import önlemek için burada)
import type { Database } from "@/lib/supabase/database.types";
