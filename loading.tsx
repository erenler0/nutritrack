export default function GlobalLoading() {
  return (
    <div className="loading-page">
      <div className="loading-grid">
        {/* Sidebar skeleton */}
        <div className="sk-sidebar">
          <div className="sk-block tall" />
          <div className="sk-block" />
          <div className="sk-block" />
          <div className="sk-block short" />
        </div>

        {/* Results skeleton */}
        <div className="sk-results">
          <div className="sk-header" />
          <div className="sk-cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="sk-line wide" />
                <div className="sk-line short" />
                <div className="sk-line mid" />
                <div className="sk-bar" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .loading-page {
          min-height: 100vh;
          background: #0d0f0e;
          padding: 0;
        }
        .loading-grid {
          display: grid;
          grid-template-columns: 290px 1fr;
          height: calc(100vh - 52px);
        }
        @keyframes shimmer {
          0%   { opacity: .4; }
          50%  { opacity: .15; }
          100% { opacity: .4; }
        }
        .sk-sidebar {
          background: #141716;
          border-right: 1px solid #252825;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sk-block {
          height: 48px;
          background: #1c1f1d;
          border-radius: 10px;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        .sk-block.tall  { height: 80px; }
        .sk-block.short { height: 32px; }
        .sk-results { padding: 1.5rem; }
        .sk-header {
          height: 28px;
          width: 180px;
          background: #1c1f1d;
          border-radius: 8px;
          margin-bottom: 1.25rem;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        .sk-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }
        .sk-card {
          background: #141716;
          border: 1px solid #252825;
          border-radius: 14px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        .sk-line {
          height: 14px;
          background: #1c1f1d;
          border-radius: 6px;
        }
        .sk-line.wide  { width: 80%; }
        .sk-line.mid   { width: 60%; }
        .sk-line.short { width: 40%; }
        .sk-bar {
          height: 4px;
          background: #1c1f1d;
          border-radius: 2px;
        }
        @media (max-width: 768px) {
          .loading-grid { grid-template-columns: 1fr; }
          .sk-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
