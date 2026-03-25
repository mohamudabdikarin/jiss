import { useState, useEffect } from 'react';

export default function ArticleSearch({ value, onChange, placeholder, t }) {
  const [local, setLocal] = useState(value || '');
  const debounceMs = 350;

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange && local !== (value || '')) onChange(local);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs]);

  return (
    <div className="article-search" style={{ marginBottom: 16 }}>
      <input
        type="search"
        className="form-input"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder ?? (t?.article_search_placeholder ?? 'Search articles...')}
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '10px 14px',
          fontSize: 14,
          border: '1px solid var(--border)',
          borderRadius: 6
        }}
      />
    </div>
  );
}
