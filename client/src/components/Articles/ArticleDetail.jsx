import { useState, useEffect, useMemo } from 'react';
import { publicAPI } from '../../api';

// Extract headings and inject ids into HTML for Table of Contents
function processAbstractForToc(html) {
  if (!html) return { html: '', headings: [] };
  const div = document.createElement('div');
  div.innerHTML = html;
  const heads = div.querySelectorAll('h2, h3, h4');
  const headings = [];
  heads.forEach((h, i) => {
    const id = `heading-${i}`;
    h.id = id;
    headings.push({ id, text: h.textContent?.trim() || '', tag: h.tagName.toLowerCase() });
  });
  return { html: div.innerHTML, headings: headings.filter(h => h.text) };
}

export default function ArticleDetail({ article, t, showPage, showArticle, siteSettings }) {
  const [relatedFromApi, setRelatedFromApi] = useState([]);

  useEffect(() => {
    if (!article?.slug) return;
    const related = article.relatedArticles || [];
    if (related.length > 0) return;
    publicAPI.getRelatedArticles(article.slug)
      .then(({ data }) => setRelatedFromApi(data.data ?? data ?? []))
      .catch(() => setRelatedFromApi([]));
  }, [article?.slug, article?.relatedArticles?.length]);

  if (!article) {
    return (
      <div className="page-wrapper">
        <main>
          <p className="no-content-msg">{t?.article_not_found ?? t?.no_content_msg ?? 'Article not found.'}</p>
        </main>
      </div>
    );
  }

  const authors = article.authors || [];
  const date = article.publicationDate || article.submissionDate;
  const dateStr = date ? new Date(date).toLocaleDateString() : '';
  const readingTime = article.readingTime || Math.max(1, Math.ceil((article.abstract || '').split(/\s+/).length / 200));
  const { html: abstractHtml, headings: tocItems } = useMemo(() => processAbstractForToc(article.abstract), [article.abstract]);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article.title || '';

  const handleDownload = (e) => {
    e.preventDefault();
    if (article.pdfUrl) {
      publicAPI.trackDownload(article._id).catch(() => {}).finally(() => {
        window.open(article.pdfUrl, '_blank');
      });
    }
  };

  const handlePrint = () => window.print();

  const shareLinks = [
    { name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, icon: '𝕏' },
    { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, icon: 'in' },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: 'f' }
  ];

  const related = (article.relatedArticles?.length ? article.relatedArticles : relatedFromApi) || [];

  return (
    <div className="page-wrapper">
      <main>
        <div className="article-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button type="button" onClick={() => showPage(article.type === 'preprint' ? 'preprints' : 'published')}
            style={{ fontSize: 14, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
            ← {t?.article_back ?? 'Back to list'}
          </button>
          <button type="button" onClick={handlePrint} className="article-print-btn"
            style={{ fontSize: 13, padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'var(--card-bg)' }}>
            🖨️ {t?.article_print ?? 'Print'}
          </button>
        </div>

        <article className="article-detail article-printable">
          <h1 style={{ fontSize: 24, marginBottom: 12, color: 'var(--primary)' }}>{article.title}</h1>

          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-light)' }}>
            {authors.map((a, i) => (
              <span key={i}>
                {a.name}{a.affiliation ? ` (${a.affiliation})` : ''}{i < authors.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>

          <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-light)', display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {readingTime > 0 && <span>⏱ {readingTime} {t?.article_min_read ?? 'min read'}</span>}
            {article.volume && <span>{t?.article_vol_abbr ?? 'Vol.'} {article.volume}</span>}
            {article.issue && <span>{t?.article_issue_label ?? 'Issue'} {article.issue}</span>}
            {dateStr && <span>{dateStr}</span>}
          </div>

          {tocItems.length > 0 && (
            <nav className="article-toc" style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{t?.article_toc ?? 'Table of Contents'}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tocItems.map((h, i) => (
                  <li key={h.id} style={{ marginLeft: h.tag === 'h3' ? 12 : h.tag === 'h4' ? 24 : 0, marginBottom: 4 }}>
                    <a href={`#${h.id}`} style={{ fontSize: 13 }}>{h.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {article.abstract && (
            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>{t?.article_abstract ?? 'Abstract'}</h3>
              <div dangerouslySetInnerHTML={{ __html: abstractHtml }} style={{ lineHeight: 1.7 }} />
            </section>
          )}

          {article.keywords?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <strong>{t?.article_keywords ?? 'Keywords'}:</strong> {article.keywords.join(', ')}
            </div>
          )}

          {article.doi && (
            <p style={{ marginBottom: 12 }}>
              <strong>{t?.hero_doi ?? 'DOI'}:</strong>{' '}
              <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener">{article.doi}</a>
            </p>
          )}

          <div className="article-share-actions" style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {article.pdfUrl && (
              <a href={article.pdfUrl} target="_blank" rel="noopener" onClick={handleDownload}
                style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: 6, fontWeight: 600 }}>
                {t?.article_download_pdf ?? 'Download PDF'}
              </a>
            )}
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{t?.article_share ?? 'Share:'}</span>
            {shareLinks.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener" title={s.name}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                {s.name}
              </a>
            ))}
          </div>

          {related.length > 0 && (
            <section style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t?.article_related ?? 'Related Articles'}</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {related.map((r, i) => (
                  <li key={r._id || i} style={{ marginBottom: 8 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); showArticle && showArticle(r.slug); }} style={{ color: 'var(--accent)' }}>
                      {r.title || r}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
