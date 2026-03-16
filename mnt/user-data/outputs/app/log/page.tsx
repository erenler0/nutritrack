"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  getUserDailyLog,
  getDailySummary,
  getCalorieHistory,
  removeMealLogItem,
  type MealLogWithItems,
  type DailySummary,
} from "@/lib/services/mealLogService";
import { getActiveGoal } from "@/lib/services/profileService";
import type { UserGoal } from "@/lib/supabase/database.types";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Kahvaltı",
  lunch:     "Öğle yemeği",
  dinner:    "Akşam yemeği",
  snack:     "Atıştırmalık",
};
const MEAL_ICONS: Record<string, string> = {
  breakfast: "○",
  lunch:     "◇",
  dinner:    "◆",
  snack:     "△",
};

// ─── Yardımcı: tarih formatlama ───────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
}

function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function LogPage() {
  const [userId, setUserId]         = useState<string | null>(null);
  const [selectedDate, setDate]     = useState(isoToday());
  const [logs, setLogs]             = useState<MealLogWithItems[]>([]);
  const [summary, setSummary]       = useState<DailySummary | null>(null);
  const [goal, setGoal]             = useState<UserGoal | null>(null);
  const [history, setHistory]       = useState<{ date: string; calories: number }[]>([]);
  const [isLoading, setLoading]     = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const loadDay = useCallback(
    async (uid: string, date: string) => {
      setLoading(true);
      const [dayLogs, daySummary, activeGoal, cal7] = await Promise.all([
        getUserDailyLog(uid, date),
        getDailySummary(uid, date),
        getActiveGoal(uid),
        getCalorieHistory(uid, 7),
      ]);
      setLogs(dayLogs);
      setSummary(daySummary);
      setGoal(activeGoal);
      setHistory(cal7);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (userId) loadDay(userId, selectedDate);
  }, [userId, selectedDate, loadDay]);

  async function handleRemove(itemId: string) {
    if (!userId) return;
    setRemovingId(itemId);
    await removeMealLogItem(itemId);
    await loadDay(userId, selectedDate);
    setRemovingId(null);
  }

  // Hedef yüzdeleri
  const goalCal  = goal?.daily_calories ?? 2000;
  const calPct   = Math.min(Math.round(((summary?.totalCalories ?? 0) / goalCal) * 100), 100);
  const remaining = goalCal - (summary?.totalCalories ?? 0);

  // 7 günlük grafik max
  const maxCal = Math.max(...history.map((h) => h.calories), goalCal, 1);

  return (
    <div className="log-page">
      <div className="log-inner">

        {/* ── Tarih navigasyonu ── */}
        <div className="date-nav">
          <button className="date-btn" onClick={() => setDate(isoOffset(-1))}>←</button>
          <div className="date-center">
            <span className="date-label">{formatDate(selectedDate)}</span>
            {selectedDate !== isoToday() && (
              <button className="today-btn" onClick={() => setDate(isoToday())}>Bugüne dön</button>
            )}
          </div>
          <button
            className="date-btn"
            onClick={() => setDate(isoOffset(1))}
            disabled={selectedDate >= isoToday()}
          >→</button>
        </div>

        {/* ── Günlük özet kartları ── */}
        <div className="summary-cards">
          <div className="sum-card">
            <span className="sum-val" style={{ color: calPct >= 100 ? "#f87171" : "#b6f542" }}>
              {Math.round(summary?.totalCalories ?? 0).toLocaleString("tr-TR")}
            </span>
            <span className="sum-lbl">kcal alındı</span>
          </div>
          <div className="sum-card">
            <span className="sum-val" style={{ color: remaining < 0 ? "#f87171" : "#e8ede9" }}>
              {Math.abs(Math.round(remaining)).toLocaleString("tr-TR")}
            </span>
            <span className="sum-lbl">{remaining < 0 ? "kcal aşıldı" : "kcal kaldı"}</span>
          </div>
          <div className="sum-card">
            <span className="sum-val" style={{ color: "#4ade8a" }}>
              {summary?.totalProtein ?? 0}g
            </span>
            <span className="sum-lbl">protein</span>
          </div>
          <div className="sum-card">
            <span className="sum-val" style={{ color: "#60a5fa" }}>
              {summary?.totalCarbs ?? 0}g
            </span>
            <span className="sum-lbl">karbonhidrat</span>
          </div>
        </div>

        {/* ── Kalori progress bar ── */}
        <div className="calorie-track">
          <div className="calorie-bar-outer">
            <div
              className="calorie-bar-inner"
              style={{
                width: `${calPct}%`,
                background: calPct >= 100 ? "#f87171" : "#b6f542",
              }}
            />
          </div>
          <div className="calorie-track-labels">
            <span>0</span>
            <span>{goalCal.toLocaleString("tr-TR")} kcal hedef</span>
          </div>
        </div>

        {/* ── 7 günlük geçmiş grafiği ── */}
        {history.length > 0 && (
          <div className="history-chart">
            <span className="chart-title">Son 7 gün</span>
            <div className="bar-chart">
              {history.map((h) => {
                const pct = Math.round((h.calories / maxCal) * 100);
                const isToday = h.date === isoToday();
                const isSelected = h.date === selectedDate;
                return (
                  <button
                    key={h.date}
                    className={`hbar-col ${isSelected ? "selected" : ""}`}
                    onClick={() => setDate(h.date)}
                    title={`${h.date}: ${h.calories} kcal`}
                  >
                    <span className="hbar-val">{h.calories > 0 ? h.calories : ""}</span>
                    <div className="hbar-track">
                      <div
                        className="hbar-fill"
                        style={{
                          height: `${pct}%`,
                          background: isToday ? "#b6f542" : isSelected ? "#85b7eb" : "#2e332d",
                        }}
                      />
                      {/* Hedef çizgisi */}
                      <div
                        className="hbar-goal-line"
                        style={{ bottom: `${Math.round((goalCal / maxCal) * 100)}%` }}
                      />
                    </div>
                    <span className="hbar-date">
                      {new Date(h.date).toLocaleDateString("tr-TR", { weekday: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Öğün listesi ── */}
        {isLoading ? (
          <div className="log-loading">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="log-empty">
            <span className="empty-ico">◈</span>
            <p>Bu gün için kayıt yok</p>
            <span>Arama sayfasından yiyecek ekleyebilirsiniz</span>
          </div>
        ) : (
          <div className="meal-list">
            {MEAL_ORDER.filter((m) => logs.some((l) => l.meal_type === m)).map((mealType) => {
              const log = logs.find((l) => l.meal_type === mealType);
              if (!log) return null;
              const mealCal = log.items.reduce((s, i) => s + i.calories, 0);

              return (
                <div key={mealType} className="meal-group">
                  <div className="meal-header">
                    <span className="meal-icon">{MEAL_ICONS[mealType]}</span>
                    <span className="meal-name">{MEAL_LABELS[mealType]}</span>
                    <span className="meal-kcal">{Math.round(mealCal)} kcal</span>
                  </div>

                  <div className="meal-items">
                    {log.items.map((item) => (
                      <div key={item.id} className="log-item">
                        <div className="log-item-main">
                          <span className="log-food-name">{item.food.name}</span>
                          <span className="log-food-brand">{item.food.brand}</span>
                        </div>
                        <div className="log-item-macros">
                          <span className="log-gram">{item.quantity_g}g</span>
                          <span className="log-kcal">{Math.round(item.calories)} kcal</span>
                          <span className="log-p">P{item.protein_g}g</span>
                          <span className="log-c">C{item.carbs_g}g</span>
                          <span className="log-f">F{item.fat_g}g</span>
                        </div>
                        <button
                          className="remove-btn"
                          disabled={removingId === item.id}
                          onClick={() => handleRemove(item.id)}
                        >
                          {removingId === item.id ? "..." : "×"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
