import Link from "next/link";

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="nf-code">404</div>
        <h1 className="nf-title">Sayfa bulunamadı</h1>
        <p className="nf-desc">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <Link href="/search" className="nf-btn">
          Ana sayfaya dön
        </Link>
      </div>

      <style>{`
        .notfound-page {
          min-height: 100vh;
          background: #0d0f0e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }
        .notfound-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .nf-code {
          font-family: 'DM Mono', monospace;
          font-size: 80px;
          font-weight: 500;
          color: #1e2e0a;
          line-height: 1;
          letter-spacing: -.04em;
        }
        .nf-title { font-size: 22px; font-weight: 500; color: #e8ede9; }
        .nf-desc  { font-size: 14px; color: #52584f; }
        .nf-btn {
          margin-top: 8px;
          padding: 10px 24px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          background: #1e2e0a;
          border: 1px solid #b6f542;
          border-radius: 10px;
          color: #b6f542;
          text-decoration: none;
          transition: all .2s;
        }
        .nf-btn:hover { background: #b6f542; color: #0d0f0e; }
      `}</style>
    </div>
  );
}
