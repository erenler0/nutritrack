"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/search";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    // next parametresini geçici olarak saklıyoruz;
    // signIn içinde router.push("/search") yapıyor ama
    // biz next'e yönlendirmek için override ediyoruz.
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // Başarılı: useAuth içinde router.push("/search") çalışır
    // İleride next desteği için useAuth'a parametre eklenebilir
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo / başlık */}
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-mark">◈</span>
            <span className="logo-text">NutriTrack</span>
          </div>
          <h1 className="auth-title">Tekrar hoşgeldin</h1>
          <p className="auth-sub">Hesabına giriş yap</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
            <div className="label-row">
              <label className="auth-label">Şifre</label>
              <Link href="/auth/forgot-password" className="forgot-link">
                Şifremi unuttum
              </Link>
            </div>
            <div className="pass-wrap">
              <input
                className="auth-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          {/* Hata */}
          {error && <div className="auth-error">{error}</div>}

          {/* Giriş butonu */}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>

        {/* Alt link */}
        <p className="auth-footer">
          Hesabın yok mu?{" "}
          <Link href="/auth/register" className="auth-link">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
