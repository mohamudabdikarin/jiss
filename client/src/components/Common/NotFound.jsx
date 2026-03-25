export default function NotFound({ t, showPage, siteSettings }) {
  const custom404 = siteSettings?.custom404;
  const title = custom404?.title || t?.not_found_title || 'Page not found';
  const message = custom404?.message || t?.not_found_msg || "The page you're looking for doesn't exist or has been moved.";
  return (
    <div className="page-wrapper">
      <main>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 72, color: 'var(--border)', marginBottom: 8 }}>404</h1>
          <h2 style={{ marginBottom: 16, fontSize: 24 }}>{title}</h2>
          <p style={{ marginBottom: 24, color: 'var(--text-light)' }}>{message}</p>
          <button
            type="button"
            onClick={() => showPage?.('home')}
            style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            {t?.not_found_back ?? 'Go to Home'}
          </button>
        </div>
      </main>
    </div>
  );
}
