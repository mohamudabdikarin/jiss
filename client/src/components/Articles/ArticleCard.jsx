export default function ArticleCard({ article, type, t, showArticle }) {
  const authors = article.authors?.map(a => a.name).join(', ') || '';
  const abstractPreview = typeof article.abstract === 'string' ? article.abstract.replace(/<[^>]+>/g, '').slice(0, 180) + '…' : '';
  const date = article.publicationDate || article.submissionDate || article.createdAt;
  const dateStr = date ? new Date(date).toLocaleDateString() : '';

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (article.pdfUrl) {
      window.open(article.pdfUrl, '_blank');
    }
  };

  return (
    <div className="article-card" style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20,
      marginBottom: 16,
      background: 'var(--white)',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s'
    }} onClick={() => showArticle(article.slug)}>
      <h3 style={{ fontSize: 17, marginBottom: 8, color: 'var(--primary)' }}>
        {article.title}
      </h3>
      {authors && (
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>
          {t?.article_authors ?? 'Authors'}: {authors}
        </p>
      )}
      {abstractPreview && (
        <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>{abstractPreview}</p>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: 'var(--text-light)' }}>
        {dateStr && <span>{dateStr}</span>}
        {article.category?.name && <span>• {article.category.name}</span>}
      </div>
      {article.pdfUrl && (
        <a href={article.pdfUrl} target="_blank" rel="noopener" onClick={handleDownload}
          style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 600 }}>
          {t?.article_download_pdf ?? 'Download PDF'}
        </a>
      )}
    </div>
  );
}
