"use client";

import { useState } from "react";
import type { FoodItem, ScaledResult, PortionMultiplier } from "../hooks/useCalorieCalculator";

interface FoodCardProps {
  result: ScaledResult;
  onPortionChange: (portion: PortionMultiplier) => void;
  onAddToLog: (result: ScaledResult) => void;
  isAdded?: boolean;
}

const PORTIONS: PortionMultiplier[] = [0.5, 1, 2];
const PORTION_LABELS: Record<PortionMultiplier, string> = { 0.5: "½", 1: "1", 2: "2" };

export default function FoodCard({
  result,
  onPortionChange,
  onAddToLog,
  isAdded = false,
}: FoodCardProps) {
  const { food, portionGrams, macros, portionLabel } = result;
  const total = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9 || 1;
  const pPct = Math.round((macros.protein * 4 / total) * 100);
  const cPct = Math.round((macros.carbs * 4 / total) * 100);
  const fPct = 100 - pPct - cPct;

  return (
    <div className={`food-card ${isAdded ? "added" : ""}`}>
      {/* Header */}
      <div className="card-header">
        <div>
          <h3 className="food-name">{food.name}</h3>
          {food.brand && <span className="food-brand">{food.brand}</span>}
        </div>
        <div className="gram-badge">{portionGrams}g</div>
      </div>

      {/* Kalori + makro özet */}
      <div className="macro-summary">
        <div className="kcal-big">{Math.round(macros.calories)}<span>kcal</span></div>
        <div className="macro-pills">
          <span className="pill protein">P {macros.protein}g</span>
          <span className="pill carbs">C {macros.carbs}g</span>
          <span className="pill fat">F {macros.fat}g</span>
          {macros.fiber > 0 && (
            <span className="pill fiber">Lif {macros.fiber}g</span>
          )}
        </div>
      </div>

      {/* Makro bar */}
      <div className="macro-bar-track" title={`P${pPct}% / C${cPct}% / F${fPct}%`}>
        <div className="bar-seg bar-p" style={{ width: `${pPct}%` }} />
        <div className="bar-seg bar-c" style={{ width: `${cPct}%` }} />
        <div className="bar-seg bar-f" style={{ width: `${fPct}%` }} />
      </div>

      {/* Porsiyon seçici */}
      <div className="portion-row">
        <span className="portion-label-txt">Porsiyon</span>
        <div className="portion-seg">
          {PORTIONS.map((p) => (
            <button
              key={p}
              className={`pseg-btn ${portionLabel === PORTION_LABELS[p] + " porsiyon" ? "active" : ""}`}
              onClick={() => onPortionChange(p)}
            >
              {PORTION_LABELS[p]}
            </button>
          ))}
        </div>
        <span className="portion-info">{portionLabel}</span>
      </div>

      {/* Ekle butonu */}
      <button
        className={`add-btn ${isAdded ? "added" : ""}`}
        onClick={() => onAddToLog(result)}
        disabled={isAdded}
      >
        {isAdded ? "✓ Günlüğe eklendi" : "+ Günlüğe ekle"}
      </button>
    </div>
  );
}
