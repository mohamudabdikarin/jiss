import ArticleCard from './ArticleCard';
import ArticleSearch from './ArticleSearch';
import ArticleFilter from './ArticleFilter';
import Pagination from '../Common/Pagination';

export default function ArticleList({
  articles,
  type,
  t,
  showArticle,
  showPage,
  siteSettings,
  pageHeading,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  categories = [],
  pagination,
  onPageChange,
  loading
}) {
  const list = Array.isArray(articles) ? articles : [];
  const typeLabel =
    type === 'preprints'
      ? (t?.article_preprints ?? 'Preprints')
      : type === 'articles'
        ? (t?.article_all ?? 'All articles')
        : (t?.article_published ?? 'Published Articles');
  const heading = (pageHeading && String(pageHeading).trim()) ? pageHeading : typeLabel;
  const totalPages = pagination?.pages ?? 1;
  const currentPage = pagination?.page ?? 1;
  const total = pagination?.total ?? list.length;
  const limit = pagination?.limit ?? 10;
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);
  const extUrl = null;
  const showIntro = type === 'preprints';
  const showArticlesIntro = type === 'articles';

  return (
    <div className={`page-wrapper${type === 'articles' ? ' page-template-articles' : ''}`}>
      <main>
        <h1 style={{ marginBottom: 8, fontSize: 28, color: 'var(--primary)' }}>{heading}</h1>
        {showIntro && (
          <p style={{ marginBottom: 16, color: 'var(--text-light)', fontSize: 14, maxWidth: 720 }}>
            {t?.preprints_intro ?? 'Preprints are early versions of research articles before peer review. Browse and access preprints submitted to IJCDS.'}
          </p>
        )}
        {showArticlesIntro && (
          <p style={{ marginBottom: 16, color: 'var(--text-light)', fontSize: 14, maxWidth: 720 }}>
            {t?.articles_catalog_intro ?? 'Browse preprints and published articles from the journal.'}
          </p>
        )}
        {extUrl && (
          <a href={extUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', marginBottom: 24, fontSize: 13, color: 'var(--accent)' }}>
            ↗ {t?.repo_view_external ?? 'View on journal site'}
          </a>
        )}

        {onSearchChange && (
          <ArticleSearch value={search} onChange={onSearchChange} t={t} />
        )}
        {onFilterChange && (
          <ArticleFilter categories={categories} filters={filters} onChange={onFilterChange} t={t} />
        )}

        {loading ? (
          <div className="page-loading" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : list.length === 0 ? (
          <p className="no-content-msg">{t?.no_content_msg ?? 'No articles available.'}</p>
        ) : (
          <>
            <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-light)' }}>
              {t?.repo_now_showing ?? 'Now showing'} {start} – {end} {t?.repo_of ?? 'of'} {total}
            </div>
            <div className="article-list">
              {list.map((article, i) => (
                <ArticleCard key={article._id || i} article={article} type={type} t={t} showArticle={showArticle} />
              ))}
            </div>
            {onPageChange && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                t={t}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
