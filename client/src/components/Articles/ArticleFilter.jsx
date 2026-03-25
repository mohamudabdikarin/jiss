export default function ArticleFilter({ categories = [], filters, onChange, t }) {
  const { category, year, sort } = filters || {};
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="article-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
      {categories?.length > 0 && (
        <select
          value={category || ''}
          onChange={e => onChange({ ...filters, category: e.target.value || undefined })}
          style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6 }}
        >
          <option value="">{t?.article_filter_category ?? 'All categories'}</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      )}
      <select
        value={year || ''}
        onChange={e => onChange({ ...filters, year: e.target.value || undefined })}
        style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6 }}
      >
        <option value="">{t?.article_filter_year ?? 'All years'}</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={sort || '-publicationDate'}
        onChange={e => onChange({ ...filters, sort: e.target.value })}
        style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6 }}
      >
        <option value="-publicationDate">{t?.article_sort_newest ?? 'Newest first'}</option>
        <option value="publicationDate">{t?.article_sort_oldest ?? 'Oldest first'}</option>
        <option value="-views">{t?.article_sort_views ?? 'Most viewed'}</option>
        <option value="-downloads">{t?.article_sort_downloads ?? 'Most downloaded'}</option>
      </select>
      {(category || year) && (
        <button
          type="button"
          onClick={() => onChange({})}
          style={{ padding: '8px 12px', fontSize: 13, background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
        >
          {t?.article_filter_reset ?? 'Reset'}
        </button>
      )}
    </div>
  );
}
