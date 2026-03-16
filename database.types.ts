// Bu dosya `supabase gen types typescript` komutuyla otomatik üretilebilir.
// Manuel olarak tutuluyorsa migration'larla senkron tutun.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          gender: "male" | "female" | "other" | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      user_goals: {
        Row: {
          id: string;
          user_id: string;
          daily_calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          valid_from: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_goals"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["user_goals"]["Insert"]>;
      };
      foods: {
        Row: {
          id: string;
          name: string;
          name_normalized: string;
          brand: string | null;
          meal_types: string[];
          category: string | null;
          calories_per_100g: number;
          protein_per_100g: number;
          carbs_per_100g: number;
          fat_per_100g: number;
          fiber_per_100g: number | null;
          image_url: string | null;
          api_source: "open_food_facts" | "edamam" | "manual" | null;
          external_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["foods"]["Row"],
          "id" | "name_normalized" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["foods"]["Insert"]>;
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["meal_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["meal_logs"]["Insert"]>;
      };
      meal_log_items: {
        Row: {
          id: string;
          meal_log_id: string;
          food_id: string;
          quantity_g: number;
          portion_size: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fiber_g: number | null;
          logged_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["meal_log_items"]["Row"], "id" | "logged_at">;
        Update: Partial<Database["public"]["Tables"]["meal_log_items"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Kolay erişim için row tiplerini export et
export type Profile       = Database["public"]["Tables"]["profiles"]["Row"];
export type UserGoal      = Database["public"]["Tables"]["user_goals"]["Row"];
export type Food          = Database["public"]["Tables"]["foods"]["Row"];
export type MealLog       = Database["public"]["Tables"]["meal_logs"]["Row"];
export type MealLogItem   = Database["public"]["Tables"]["meal_log_items"]["Row"];
