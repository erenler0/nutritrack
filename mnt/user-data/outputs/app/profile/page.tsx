"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  getProfile,
  upsertProfile,
  getActiveGoal,
  setGoal,
  calculateTDEE,
} from "@/lib/services/profileService";
import type { Profile, UserGoal } from "@/lib/supabase/database.types";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS = [
  { value: "sedentary",   label: "Hareketsiz",         sub: "Masa başı iş, egzersiz yok" },
  { value: "light",       label: "Az hareketli",        sub: "Haftada 1–3 gün egzersiz" },
  { value: "moderate",    label: "Orta hareketli",      sub: "Haftada 3–5 gün egzersiz" },
  { value: "active",      label: "Aktif",               sub: "Haftada 6–7 gün egzersiz" },
  { value: "very_active", label: "Çok aktif",           sub: "Günde 2x antrenman" },
] as const;

const MACRO_PRESETS = [
  { label: "Dengeli",      protein: 25, carbs: 50, fat: 25 },
  { label: "Yüksek protein", protein: 35, carbs: 40, fat: 25 },
  { label: "Düşük karbonhidrat", protein: 30, carbs: 25, fat: 45 },
  { label: "Özel",         protein: 0,  carbs: 0,  fat: 0  },
] as const;

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Partial<Profile>>({
    activity_level: "moderate",
    gender: "male",
  });
  const [goal, setGoalState] = useState<Partial<UserGoal>>({
    daily_calories: 2000,
    protein_g: 125,
    carbs_g: 250,
    fat_g: 55,
  });
  const [tdee, setTdee] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activePreset, setActivePreset] = useState(0);

  // Auth kullanıcısını al
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadData(data.user.id);
      }
    });
  }, []);

  async function loadData(uid: string) {
    const [p, g] = await Promise.all([getProfile(uid), getActiveGoal(uid)]);
    if (p) setProfile(p);
    if (g) setGoalState(g);
  }

  // TDEE'yi profil değiştikçe hesapla
  useEffect(() => {
    const result = calculateTDEE(profile as Profile);
    setTdee(result);
    if (result) {
      setGoalState((prev) => ({ ...prev, daily_calories: result }));
      applyMacroPreset(activePreset, result);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.age, profile.gender, profile.height_cm, profile.weight_kg, profile.activity_level]);

  function applyMacroPreset(idx: number, calories?: number) {
    const kcal = calories ?? goal.daily_calories ?? 2000;
    const preset = MACRO_PRESETS[idx];
    if (idx === 3) return; // Özel — dokunma
    setActivePreset(idx);
    setGoalState((prev) => ({
      ...prev,
      protein_g: Math.round((kcal * preset.protein) / 100 / 4),
      carbs_g:   Math.round((kcal * preset.carbs) / 100 / 4),
      fat_g:     Math.round((kcal * preset.fat) / 100 / 9),
    }));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      await Promise.all([
        upsertProfile({ ...profile, id: userId } as Profile),
        setGoal({ ...goal, user_id: userId, valid_from: new Date().toISOString().split("T")[0] } as UserGoal),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const totalPct =
    (goal.protein_g ?? 0) * 4 +
    (goal.carbs_g ?? 0) * 4 +
    (goal.fat_g ?? 0) * 9;

  return (
    <div className="profile-page">
      <div className="profile-inner">

        {/* ── Profil bilgileri ── */}
        <section className="profile-section">
          <h2 className="section-title">Kişisel bilgiler</h2>

          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">Ad soyad</label>
              <input
                className="field-input"
                type="text"
                value={profile.full_name ?? ""}
                placeholder="Adınız"
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="field-label">Cinsiyet</label>
              <div className="seg-group">
                {(["male", "female", "other"] as const).map((g) => (
                  <button
                    key={g}
                    className={`seg-btn ${profile.gender === g ? "active" : ""}`}
                    onClick={() => setProfile((p) => ({ ...p, gender: g }))}
                  >
                    {g === "male" ? "Erkek" : g === "female" ? "Kadın" : "Diğer"}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Yaş</label>
              <input
                className="field-input"
                type="number"
                value={profile.age ?? ""}
                min={10} max={120}
                placeholder="25"
                onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))}
              />
            </div>

            <div className="form-field">
              <label className="field-label">Boy (cm)</label>
              <input
                className="field-input"
                type="number"
                value={profile.height_cm ?? ""}
                min={100} max={250} step={0.5}
                placeholder="175"
                onChange={(e) => setProfile((p) => ({ ...p, height_cm: Number(e.target.value) }))}
              />
            </div>

            <div className="form-field">
              <label className="field-label">Kilo (kg)</label>
              <input
                className="field-input"
                type="number"
                value={profile.weight_kg ?? ""}
                min={30} max={300} step={0.5}
                placeholder="70"
                onChange={(e) => setProfile((p) => ({ ...p, weight_kg: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Aktivite seçici */}
          <div className="activity-grid">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`activity-card ${profile.activity_level === opt.value ? "active" : ""}`}
                onClick={() => setProfile((p) => ({ ...p, activity_level: opt.value }))}
              >
                <span className="act-label">{opt.label}</span>
                <span className="act-sub">{opt.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── TDEE sonucu ── */}
        {tdee && (
          <div className="tdee-banner">
            <div className="tdee-main">
              <span className="tdee-val">{tdee.toLocaleString("tr-TR")}</span>
              <span className="tdee-unit">kcal/gün</span>
            </div>
            <p className="tdee-desc">
              Mifflin-St Jeor formülüyle hesaplanan günlük toplam enerji harcamanız (TDEE).
              Bu değer otomatik olarak hedefinize uygulandı.
            </p>
          </div>
        )}

        {/* ── Hedef kurulumu ── */}
        <section className="profile-section">
          <h2 className="section-title">Günlük hedefler</h2>

          <div className="form-field" style={{ marginBottom: "1.25rem" }}>
            <label className="field-label">Günlük kalori hedefi</label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <input
                className="field-input kcal-field"
                type="number"
                value={goal.daily_calories ?? ""}
                min={500} max={6000} step={50}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setGoalState((g) => ({ ...g, daily_calories: v }));
                  applyMacroPreset(activePreset, v);
                }}
              />
              <span className="field-label">kcal</span>
            </div>
          </div>

          {/* Makro preset */}
          <div className="preset-row">
            {MACRO_PRESETS.map((p, i) => (
              <button
                key={p.label}
                className={`preset-btn ${activePreset === i ? "active" : ""}`}
                onClick={() => applyMacroPreset(i)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Makro girişleri */}
          <div className="macro-inputs">
            {(["protein_g", "carbs_g", "fat_g"] as const).map((key) => {
              const labels = { protein_g: "Protein (g)", carbs_g: "Karbonhidrat (g)", fat_g: "Yağ (g)" };
              const colors = { protein_g: "#4ade8a", carbs_g: "#60a5fa", fat_g: "#fb923c" };
              return (
                <div key={key} className="macro-input-card">
                  <label className="field-label" style={{ color: colors[key] }}>
                    {labels[key]}
                  </label>
                  <input
                    className="field-input"
                    type="number"
                    value={goal[key] ?? ""}
                    min={0}
                    step={1}
                    onChange={(e) => {
                      setActivePreset(3); // özel
                      setGoalState((g) => ({ ...g, [key]: Number(e.target.value) }));
                    }}
                  />
                  <span className="macro-kcal-hint">
                    ≈ {key === "fat_g"
                      ? Math.round((goal[key] ?? 0) * 9)
                      : Math.round((goal[key] ?? 0) * 4)} kcal
                  </span>
                </div>
              );
            })}
          </div>

          {/* Makro bar */}
          {totalPct > 0 && (
            <div className="macro-preview-bar">
              <div
                className="mpb-seg mpb-p"
                style={{ width: `${Math.round(((goal.protein_g ?? 0) * 4) / totalPct * 100)}%` }}
              />
              <div
                className="mpb-seg mpb-c"
                style={{ width: `${Math.round(((goal.carbs_g ?? 0) * 4) / totalPct * 100)}%` }}
              />
              <div
                className="mpb-seg mpb-f"
                style={{ width: `${Math.round(((goal.fat_g ?? 0) * 9) / totalPct * 100)}%` }}
              />
            </div>
          )}
        </section>

        {/* ── Kaydet ── */}
        <button className={`save-btn ${saved ? "saved" : ""}`} onClick={handleSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "Profili kaydet"}
        </button>

      </div>
    </div>
  );
}
