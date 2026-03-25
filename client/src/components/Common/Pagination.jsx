import { fillTranslationTemplate } from '../../lang/template';

export default function Pagination({ currentPage, totalPages, onPageChange, t }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const show = 3;
  let start = Math.max(1, currentPage - Math.floor(show / 2));
  let end = Math.min(totalPages, start + show - 1);
  if (end - start + 1 < show) start = Math.max(1, end - show + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="pagination" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} aria-label={t?.pagination_aria ?? 'Pagination'}>
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        style={{ padding: '8px 12px', fontSize: 13 }}
      >
        «
      </button>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        style={{ padding: '8px 12px', fontSize: 13 }}
      >
        ‹
      </button>
      {pages.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: p === currentPage ? 600 : 400,
            background: p === currentPage ? 'var(--primary)' : 'transparent',
            color: p === currentPage ? 'white' : 'inherit',
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        style={{ padding: '8px 12px', fontSize: 13 }}
      >
        ›
      </button>
      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        style={{ padding: '8px 12px', fontSize: 13 }}
      >
        »
      </button>
      <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-light)' }}>
        {fillTranslationTemplate(t?.pagination_summary ?? 'Page {current} of {total}', { current: currentPage, total: totalPages })}
      </span>
    </nav>
  );
}
