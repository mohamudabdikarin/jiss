import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { dashboardAPI } from '../../api';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const search = useCallback(async () => {
    if (!query.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await dashboardAPI.globalSearch(query.trim());
      setResults(data.data);
    } catch {
      setResults({ pages: [], articles: [], media: [], categories: [] });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const goTo = (item, type) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    if (type === 'page') navigate(`/pages/${item._id}`);
    if (type === 'article') navigate(`/articles/${item._id}`);
    if (type === 'media') navigate('/media');
    if (type === 'category') navigate('/articles');
  };

  if (!open) {
    return (
      <button type="button" className="topbar-btn topbar-search-btn" onClick={() => setOpen(true)} title="Search (Ctrl+K)" aria-label="Open search">
        <FiSearch aria-hidden /><span className="topbar-btn-text search-placeholder">Search…</span>
      </button>
    );
  }

  return (
    <div className="global-search-overlay" onClick={() => setOpen(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'max(24px, env(safe-area-inset-top)) 16px 16px', paddingTop: 'max(72px, calc(env(safe-area-inset-top) + 24px))'
    }}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()} style={{
        background: 'var(--card-bg)', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: 'min(480px, 85vh)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--card-border)' }}>
          <FiSearch style={{ marginRight: 8, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search pages, articles, media..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15 }}
          />
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><FiX /></button>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto', padding: 12 }}>
          {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Searching...</p>}
          {!loading && results && (
            <>
              {results.pages?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>PAGES</div>
                  {results.pages.map(p => (
                    <div key={p._id} onClick={() => goTo(p, 'page')} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6 }} className="search-result-item">
                      {p.title} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— {p.slug}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.articles?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>ARTICLES</div>
                  {results.articles.map(a => (
                    <div key={a._id} onClick={() => goTo(a, 'article')} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6 }} className="search-result-item">
                      {a.title} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— {a.type}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.media?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>MEDIA</div>
                  {results.media.map(m => (
                    <div key={m._id} onClick={() => goTo(m, 'media')} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6 }} className="search-result-item">
                      {m.originalName || m.filename}
                    </div>
                  ))}
                </div>
              )}
              {[results.pages, results.articles, results.media].every(arr => !arr?.length) && query && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No results found</p>
              )}
            </>
          )}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Press Esc to close · Ctrl+K to toggle</p>
        </div>
      </div>
    </div>
  );
}
