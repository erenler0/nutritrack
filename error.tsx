"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Production'da Sentry/LogRocket'a gönder
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon">◈</div>
        <h2 className="error-title">Bir şeyler ters gitti</h2>
        <p className="error-desc">
          {error.message ?? "Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin."}
        </p>
        {error.digest && (
          <code className="error-digest">Hata kodu: {error.digest}</code>
        )}
        <div className="error-actions">
          <button className="error-btn primary" onClick={reset}>
            Tekrar dene
          </button>
          <button
            className="error-btn"
            onClick={() => (window.location.href = "/search")}
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>

      <style>{`
        .error-page {
          min-height: 100vh;
          background: #0d0f0e;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }
        .error-card {
          max-width: 400px;
          width: 100%;
          background: #141716;
          border: 1px solid #252825;
          border-radius: 14px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }
        .error-icon { font-size: 32px; color: #f87171; }
        .error-title { font-size: 18px; font-weight: 500; color: #e8ede9; }
        .error-desc { font-size: 13px; color: #8a9489; line-height: 1.6; }
        .error-digest {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #52584f;
          background: #0d0f0e;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .error-actions { display: flex; gap: 8px; margin-top: 4px; }
        .error-btn {
          padding: 9px 18px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          background: none;
          border: 1px solid #252825;
          border-radius: 8px;
          color: #8a9489;
          cursor: pointer;
          transition: all .15s;
        }
        .error-btn.primary {
          border-color: #b6f542;
          color: #b6f542;
          background: #1e2e0a;
        }
        .error-btn:hover { border-color: #2e332d; color: #e8ede9; }
        .error-btn.primary:hover { background: #b6f542; color: #0d0f0e; }
      `}</style>
    </div>
  );
}
