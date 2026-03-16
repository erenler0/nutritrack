import { useState, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalculationMode = "single" | "menu" | "custom";
export type PortionMultiplier = 0.5 | 1 | 2;
export type MacroFocus = "balanced" | "protein" | "carbs" | "fat";

export interface FoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}

export interface CustomIngredient {
  food: FoodItem;
  baseGrams: number;
}

export interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface ScaledResult {
  food: FoodItem;
  requiredGrams: number;
  portionGrams: number;
  macros: MacroBreakdown;
  portionLabel: string;
}

export interface MenuResult {
  items: ScaledResult[];
  totalMacros: MacroBreakdown;
  targetCalories: number;
  achievedCalories: number;
  calorieDeviation: number;
}

export interface CustomMixResult {
  ingredients: Array<{
    food: FoodItem;
    grams: number;
    macros: MacroBreakdown;
  }>;
  totalMacros: MacroBreakdown;
  scaleFactor: number;
  scaledIngredients: Array<{
    food: FoodItem;
    grams: number;
    macros: MacroBreakdown;
  }>;
}

// ─── Pure calculation helpers ─────────────────────────────────────────────────

export function calcMacrosForGrams(food: FoodItem, grams: number): MacroBreakdown {
  const ratio = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * ratio * 10) / 10,
    protein: Math.round(food.proteinPer100g * ratio * 10) / 10,
    carbs: Math.round(food.carbsPer100g * ratio * 10) / 10,
    fat: Math.round(food.fatPer100g * ratio * 10) / 10,
    fiber: Math.round((food.fiberPer100g ?? 0) * ratio * 10) / 10,
  };
}

export function gramsForTargetCalories(food: FoodItem, targetCalories: number): number {
  if (food.caloriesPer100g === 0) return 0;
  return Math.round((targetCalories / food.caloriesPer100g) * 100 * 10) / 10;
}

export function portionLabel(multiplier: PortionMultiplier): string {
  const labels: Record<PortionMultiplier, string> = {
    0.5: "½ porsiyon",
    1: "1 porsiyon",
    2: "2 porsiyon",
  };
  return labels[multiplier];
}

export function sumMacros(macros: MacroBreakdown[]): MacroBreakdown {
  return macros.reduce(
    (acc, m) => ({
      calories: Math.round((acc.calories + m.calories) * 10) / 10,
      protein: Math.round((acc.protein + m.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + m.carbs) * 10) / 10,
      fat: Math.round((acc.fat + m.fat) * 10) / 10,
      fiber: Math.round((acc.fiber + m.fiber) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Makro odağına göre kalori dağılımı önerir.
 * Protein: %35P / %40C / %25F
 * Carbs:   %20P / %55C / %25F
 * Balanced: %25P / %50C / %25F
 */
export function macroTargetsForFocus(
  targetCalories: number,
  focus: MacroFocus
): { protein: number; carbs: number; fat: number } {
  const ratios: Record<MacroFocus, [number, number, number]> = {
    balanced: [0.25, 0.5, 0.25],
    protein: [0.35, 0.4, 0.25],
    carbs: [0.2, 0.55, 0.25],
    fat: [0.2, 0.3, 0.5],
  };
  const [p, c, f] = ratios[focus];
  return {
    protein: Math.round((targetCalories * p) / 4),   // 1g protein = 4 kcal
    carbs: Math.round((targetCalories * c) / 4),      // 1g carb   = 4 kcal
    fat: Math.round((targetCalories * f) / 9),        // 1g fat    = 9 kcal
  };
}

// ─── Main hook ────────────────────────────────────────────────────────────────

interface UseCalorieCalculatorOptions {
  defaultMode?: CalculationMode;
  defaultPortion?: PortionMultiplier;
  defaultMacroFocus?: MacroFocus;
}

export function useCalorieCalculator(options: UseCalorieCalculatorOptions = {}) {
  const {
    defaultMode = "single",
    defaultPortion = 1,
    defaultMacroFocus = "balanced",
  } = options;

  const [targetCalories, setTargetCalories] = useState<number>(500);
  const [mode, setMode] = useState<CalculationMode>(defaultMode);
  const [portion, setPortion] = useState<PortionMultiplier>(defaultPortion);
  const [macroFocus, setMacroFocus] = useState<MacroFocus>(defaultMacroFocus);

  // ── Mode: single ────────────────────────────────────────────────────────────
  const calculateSingle = useCallback(
    (food: FoodItem): ScaledResult => {
      const requiredGrams = gramsForTargetCalories(food, targetCalories);
      const portionGrams = Math.round(requiredGrams * portion * 10) / 10;
      const macros = calcMacrosForGrams(food, portionGrams);
      return {
        food,
        requiredGrams,
        portionGrams,
        macros,
        portionLabel: portionLabel(portion),
      };
    },
    [targetCalories, portion]
  );

  // ── Mode: menu (çoklu ürün, kalori eşit bölünür) ────────────────────────────
  const calculateMenu = useCallback(
    (foods: FoodItem[]): MenuResult => {
      if (foods.length === 0) {
        return {
          items: [],
          totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
          targetCalories,
          achievedCalories: 0,
          calorieDeviation: 0,
        };
      }
      const perItemCalories = targetCalories / foods.length;
      const items: ScaledResult[] = foods.map((food) => {
        const requiredGrams = gramsForTargetCalories(food, perItemCalories);
        const portionGrams = Math.round(requiredGrams * portion * 10) / 10;
        const macros = calcMacrosForGrams(food, portionGrams);
        return { food, requiredGrams, portionGrams, macros, portionLabel: portionLabel(portion) };
      });
      const totalMacros = sumMacros(items.map((i) => i.macros));
      const achievedCalories = totalMacros.calories;
      return {
        items,
        totalMacros,
        targetCalories,
        achievedCalories,
        calorieDeviation: Math.round((achievedCalories - targetCalories) * 10) / 10,
      };
    },
    [targetCalories, portion]
  );

  // ── Mode: custom (sabit gram oranları, hedefe ölçeklenir) ───────────────────
  const calculateCustomMix = useCallback(
    (ingredients: CustomIngredient[]): CustomMixResult => {
      const baseIngredients = ingredients.map(({ food, baseGrams }) => ({
        food,
        grams: baseGrams,
        macros: calcMacrosForGrams(food, baseGrams),
      }));
      const baseTotalMacros = sumMacros(baseIngredients.map((i) => i.macros));
      const scaleFactor =
        baseTotalMacros.calories > 0
          ? Math.round((targetCalories / baseTotalMacros.calories) * 1000) / 1000
          : 1;
      const scaledIngredients = baseIngredients.map((ing) => {
        const grams = Math.round(ing.grams * scaleFactor * 10) / 10;
        return { food: ing.food, grams, macros: calcMacrosForGrams(ing.food, grams) };
      });
      return {
        ingredients: baseIngredients,
        totalMacros: baseTotalMacros,
        scaleFactor,
        scaledIngredients,
      };
    },
    [targetCalories]
  );

  // ── Derived: hedef makrolar ─────────────────────────────────────────────────
  const macroTargets = useMemo(
    () => macroTargetsForFocus(targetCalories, macroFocus),
    [targetCalories, macroFocus]
  );

  return {
    // State
    targetCalories,
    mode,
    portion,
    macroFocus,
    macroTargets,
    // Setters
    setTargetCalories,
    setMode,
    setPortion,
    setMacroFocus,
    // Calculators
    calculateSingle,
    calculateMenu,
    calculateCustomMix,
    // Helpers (re-exported for convenience)
    calcMacrosForGrams,
    gramsForTargetCalories,
  };
}
