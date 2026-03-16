"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import FilterPanel, { type Filters } from "@/components/FilterPanel";
import FoodCard from "@/components/FoodCard";
import {
  useCalorieCalculator,
  type FoodItem,
  type PortionMultiplier,
  type ScaledResult,
} from "@/hooks/useCalorieCalculator";

// ─── Mock veri (Supabase bağlantısı kurulunca kaldırılacak) ──────────────────
import { MOCK_FOODS } from "@/data/mockFoods";

// ─── Filtre uygulama mantığı ─────────────────────────────────────────────────
function applyFilters(foods: FoodItem[], filters: Filters, query: string): FoodItem[] {
  return foods.filter((f) => {
    const matchQuery =
      !query || f.name.toLowerCase().includes(query.toLowerCase());
    const matchMeal =
      filters.mealType === "all" || f.mealTypes?.includes(filters.mealType);
    const matchCat =
      filters.foodCategory === "all" || f.category === filters.foodCategory;
    const matchMacro =
      filters.macroFocus === "all" ||
      (filters.macroFocus === "protein" && f.proteinPer100g >= 15) ||
      (filters.macroFocus === "carbs" && f.carbsPer100g >= 30) ||
      (filters.macroFocus === "fat" && f.fatPer100g >= 10);
    return matchQuery && matchMeal && matchCat && matchMacro;
  });
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    mealType: "all",
    macroFocus: "all",
    foodCategory: "all",
  });
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ScaledResult[]>([]);
  const [portions, setPortions] = useState<Record<string, PortionMultiplier>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    targetCalories,
    setTargetCalories,
    calculateSingle,
    macroTargets,
  } = useCalorieCalculator();

  // Arama & filtre değiştikçe sonuçları güncelle
  const updateResults = useCallback(() => {
    const filtered = applyFilters(MOCK_FOODS, filters, query);
    const scaled = filtered.map((food) => {
      const p = (portions[food.id] ?? 1) as PortionMultiplier;
      return calculateSingle(food);
    });
    setResults(scaled);
  }, [query, filters, targetCalories, portions, calculateSingle]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(updateResults, 200);
    return () => clearTimeout(debounceRef.current);
  }, [updateResults]);

  const handlePortionChange = (foodId: string, p: PortionMultiplier) => {
    setPortions((prev) => ({ ...prev, [foodId]: p }));
  };

  const handleAddToLog = (result: ScaledResult) => {
    setAddedIds((prev) => new Set([...prev, result.food.id]));
    // TODO: Supabase insert → meal_log_items
  };

  return (
    <div className="search-page">
      {/* ── Sol panel: kontroller ── */}
      <aside className="search-sidebar">
        <div className="sidebar-top">
          <h1 className="page-title">
            <span className="title-accent">Kalori</span>
            <br />Hesapla
          </h1>

          {/* Kalori girişi */}
          <div className="kcal-input-wrap">
            <label className="input-label">Hedef kalori</label>
            <div className="kcal-row">
              <input
                type="number"
                className="kcal-input"
                value={targetCalories}
                min={50}
                max={3000}
                step={50}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
              />
              <span className="kcal-unit">kcal</span>
            </div>
            {/* Makro hedefleri */}
            <div className="macro-targets">
              <span>P {macroTargets.protein}g</span>
              <span>C {macroTargets.carbs}g</span>
              <span>F {macroTargets.fat}g</span>
            </div>
          </div>

          {/* Arama kutusu */}
          <div className="search-input-wrap">
            <label className="input-label">Yiyecek ara</label>
            <input
              type="search"
              className="search-input"
              placeholder="tavuk, pirinç, yulaf..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filtreler */}
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Günlük özeti */}
        {addedIds.size > 0 && (
          <div className="log-summary">
            <span className="log-count">{addedIds.size} öğe</span>
            <span className="log-label">günlüğe eklendi</span>
          </div>
        )}
      </aside>

      {/* ── Sağ panel: sonuçlar ── */}
      <main className="results-area">
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <p>Sonuç bulunamadı</p>
            <span>Filtrelerinizi veya arama terimini değiştirin</span>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span className="results-count">{results.length} sonuç</span>
              <span className="results-hint">{targetCalories} kcal için ölçeklenmiş</span>
            </div>
            <div className="results-grid">
              {results.map((result) => (
                <FoodCard
                  key={result.food.id}
                  result={result}
                  isAdded={addedIds.has(result.food.id)}
                  onPortionChange={(p) => handlePortionChange(result.food.id, p)}
                  onAddToLog={handleAddToLog}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
