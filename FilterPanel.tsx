"use client";

import { useState } from "react";

export type MealType = "all" | "breakfast" | "lunch" | "dinner" | "snack";
export type MacroFocus = "all" | "protein" | "carbs" | "fat";
export type FoodCategory =
  | "all"
  | "meat"
  | "chicken"
  | "fish"
  | "vegan"
  | "pastry"
  | "dairy"
  | "legume";

export interface Filters {
  mealType: MealType;
  macroFocus: MacroFocus;
  foodCategory: FoodCategory;
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: "all",       label: "Tümü"       },
  { value: "breakfast", label: "Kahvaltı"   },
  { value: "lunch",     label: "Öğle"       },
  { value: "dinner",    label: "Akşam"      },
  { value: "snack",     label: "Atıştırmalık" },
];

const MACRO_OPTIONS: { value: MacroFocus; label: string; sub: string }[] = [
  { value: "all",     label: "Dengeli",  sub: "P25 / C50 / F25" },
  { value: "protein", label: "Protein",  sub: "P35 / C40 / F25" },
  { value: "carbs",   label: "Karbonhidrat", sub: "P20 / C55 / F25" },
  { value: "fat",     label: "Yağ",      sub: "P20 / C30 / F50" },
];

const CATEGORY_OPTIONS: { value: FoodCategory; label: string; icon: string }[] = [
  { value: "all",     label: "Tümü",        icon: "◈" },
  { value: "meat",    label: "Et",          icon: "◆" },
  { value: "chicken", label: "Tavuk",       icon: "◇" },
  { value: "fish",    label: "Balık",       icon: "◈" },
  { value: "vegan",   label: "Vegan",       icon: "○" },
  { value: "pastry",  label: "Hamur işi",   icon: "□" },
  { value: "dairy",   label: "Süt ürünü",   icon: "△" },
  { value: "legume",  label: "Baklagil",    icon: "◉" },
];

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    onChange({ ...filters, [key]: val });

  return (
    <div className="filter-panel">
      {/* Öğün tipi */}
      <div className="filter-group">
        <span className="filter-label">Öğün</span>
        <div className="toggle-bar">
          {MEAL_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`toggle-btn ${filters.mealType === o.value ? "active" : ""}`}
              onClick={() => set("mealType", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Makro odağı */}
      <div className="filter-group">
        <span className="filter-label">Makro odağı</span>
        <div className="macro-grid">
          {MACRO_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`macro-card ${filters.macroFocus === o.value ? "active" : ""}`}
              onClick={() => set("macroFocus", o.value)}
            >
              <span className="macro-name">{o.label}</span>
              <span className="macro-ratio">{o.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Yemek kategorisi */}
      <div className="filter-group">
        <span className="filter-label">Kategori</span>
        <div className="category-wrap">
          {CATEGORY_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`cat-chip ${filters.foodCategory === o.value ? "active" : ""}`}
              onClick={() => set("foodCategory", o.value)}
            >
              <span className="cat-icon">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
