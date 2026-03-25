import ArticleCard from '../Articles/ArticleCard';
import ArticleSearch from '../Articles/ArticleSearch';
import Pagination from '../Common/Pagination';

export default function SearchResultsPage({ articles, searchQuery, onSearchChange, pagination, onPageChange, t, showArticle, loading }) {
  const list = Array.isArray(articles) ? articles : [];
  const totalPages = pagination?.pages ?? 1;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="page-wrapper">
      <main>
        <h1 style={{ marginBottom: 24, fontSize: 28 }}>{t?.article_search_results ?? 'Search Articles'}</h1>

        <ArticleSearch value={searchQuery} onChange={onSearchChange} placeholder={t?.article_search_placeholder ?? 'Search by title, abstract, keywords...'} t={t} />

        {loading ? (
          <div className="page-loading" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : !searchQuery?.trim() ? (
          <p className="no-content-msg">{t?.article_search_enter ?? 'Enter a search term above.'}</p>
        ) : list.length === 0 ? (
          <p className="no-content-msg">{t?.article_search_no_results ?? 'No articles found.'}</p>
        ) : (
          <>
            <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-light)' }}>
              {t?.article_search_found ?? 'Found'} {pagination?.total ?? list.length} {t?.article_search_articles ?? 'articles'}
            </p>
            <div className="article-list">
              {list.map((article, i) => (
                <ArticleCard key={article._id || i} article={article} type={article.type} t={t} showArticle={showArticle} />
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
