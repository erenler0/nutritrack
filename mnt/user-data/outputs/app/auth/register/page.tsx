"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const PASSWORD_RULES = [
  { label: "En az 8 karakter",       test: (p: string) => p.length >= 8 },
  { label: "Büyük harf içeriyor",    test: (p: string) => /[A-Z]/.test(p) },
  { label: "Rakam içeriyor",         test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const { signUp } = useAuth();

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const strength = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strengthLabel = ["Zayıf", "Orta", "Güçlü"][strength - 1] ?? "";
  const strengthColor = ["#f87171", "#fb923c", "#4ade8a"][strength - 1] ?? "transparent";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (strength < 2) {
      setError("Lütfen daha güçlü bir şifre seçin.");
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, fullName);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-mark">◈</span>
            <span className="logo-text">NutriTrack</span>
          </div>
          <h1 className="auth-title">Hesap oluştur</h1>
          <p className="auth-sub">Ücretsiz, kredi kartı gerekmez</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Ad soyad */}
          <div className="auth-field">
            <label className="auth-label">Ad soyad</label>
            <input
              className="auth-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adınız Soyadınız"
              autoComplete="name"
            />
          </div>

          {/* E-posta */}
          <div className="auth-field">
            <label className="auth-label">E-posta</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sen@ornek.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Şifre */}
          <div className="auth-field">
            <label className="auth-label">Şifre</label>
            <div className="pass-wrap">
              <input
                className="auth-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>

            {/* Şifre gücü */}
            {password.length > 0 && (
              <div className="strength-wrap">
                <div className="strength-bar">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="strength-seg"
                      style={{ background: i < strength ? strengthColor : undefined }}
                    />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
            )}

            {/* Kurallar */}
            <div className="pass-rules">
              {PASSWORD_RULES.map((r) => (
                <span
                  key={r.label}
                  className={`pass-rule ${r.test(password) ? "ok" : ""}`}
                >
                  {r.test(password) ? "✓" : "○"} {r.label}
                </span>
              ))}
            </div>
          </div>

          {/* Şifre tekrar */}
          <div className="auth-field">
            <label className="auth-label">Şifre tekrar</label>
            <input
              className={`auth-input ${
                confirm && confirm !== password ? "input-error" : ""
              }`}
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              autoComplete="new-password"
              required
            />
            {confirm && confirm !== password && (
              <span className="field-error">Şifreler eşleşmiyor</span>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Hesap oluşturuluyor..." : "Kayıt ol"}
          </button>

          <p className="terms-note">
            Kayıt olarak{" "}
            <Link href="/terms" className="auth-link">Kullanım Koşulları</Link>
            'nı kabul etmiş sayılırsın.
          </p>
        </form>

        <p className="auth-footer">
          Zaten hesabın var mı?{" "}
          <Link href="/auth/login" className="auth-link">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
