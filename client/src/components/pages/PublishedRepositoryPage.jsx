import { useState, useEffect } from 'react';
import { publicAPI } from '../../api';
import { fillTranslationTemplate } from '../../lang/template';
import ArticleCard from '../Articles/ArticleCard';
import ArticleSearch from '../Articles/ArticleSearch';
import ArticleFilter from '../Articles/ArticleFilter';
import Pagination from '../Common/Pagination';

/** Repository-style Published Articles page: Preprint section first, then Volumes list */
export default function PublishedRepositoryPage({ t, showPage, showArticle, siteSettings }) {
  const [view, setView] = useState('repository'); // 'repository' | 'volume' | 'preprints'
  const [volumes, setVolumes] = useState([]);
  const [selectedVolume, setSelectedVolume] = useState(null);
  const [preprintCount, setPreprintCount] = useState(0);
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', year: '', sort: '-publicationDate' });

  useEffect(() => {
    publicAPI.getVolumes()
      .then(({ data }) => setVolumes(data?.data ?? []))
      .catch(() => setVolumes([]));
    publicAPI.getArticles({ type: 'preprint', status: 'published', limit: 1 })
      .then(({ data }) => setPreprintCount(data?.pagination?.total ?? 0))
      .catch(() => setPreprintCount(0));
    publicAPI.getCategories()
      .then(({ data }) => setCategories(data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (view === 'preprints') {
      setLoading(true);
      const params = { 
        type: 'preprint', 
        status: 'published', 
        page, 
        limit: 10, 
        sort: filters.sort || '-publicationDate' 
      };
      if (search?.trim()) params.search = search.trim();
      if (filters.category) params.category = filters.category;
      if (filters.year) params.year = filters.year;
      publicAPI.getArticles(params)
        .then(({ data }) => {
          setArticles(data?.data ?? []);
          setPagination(data?.pagination ?? null);
        })
        .catch(() => { setArticles([]); setPagination(null); })
        .finally(() => setLoading(false));
    } else if (view === 'volume' && selectedVolume) {
      setLoading(true);
      const params = { 
        type: 'published', 
        status: 'published', 
        volume: selectedVolume, 
        page, 
        limit: 10, 
        sort: filters.sort || '-publicationDate' 
      };
      if (search?.trim()) params.search = search.trim();
      if (filters.category) params.category = filters.category;
      if (filters.year) params.year = filters.year;
      publicAPI.getArticles(params)
        .then(({ data }) => {
          setArticles(data?.data ?? []);
          setPagination(data?.pagination ?? null);
        })
        .catch(() => { setArticles([]); setPagination(null); })
        .finally(() => setLoading(false));
    }
  }, [view, selectedVolume, page, search, filters]);

  const goToPreprints = () => {
    setView('preprints');
    setSelectedVolume(null);
    setPage(1);
    setSearch('');
    setFilters({ category: '', year: '', sort: '-publicationDate' });
  };

  const goToVolume = (vol) => {
    setView('volume');
    setSelectedVolume(vol);
    setPage(1);
    setSearch('');
    setFilters({ category: '', year: '', sort: '-publicationDate' });
  };

  const handleSearchChange = (q) => {
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const goBack = () => {
    setView('repository');
    setSelectedVolume(null);
    setArticles([]);
    setPagination(null);
  };

  if (view === 'preprints') {
    const total = pagination?.total ?? articles.length;
    const limit = pagination?.limit ?? 10;
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    const extUrl = null;
    return (
      <div className="page-wrapper">
        <main>
          <button type="button" onClick={goBack} className="repo-back-btn" style={{ marginBottom: 16, padding: '6px 12px', background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            ← {t?.article_back ?? 'Back'}
          </button>
          <h1 style={{ marginBottom: 8, fontSize: 22, color: 'var(--primary)' }}>{t?.article_preprints ?? 'Preprints'}</h1>
          <p style={{ marginBottom: 20, color: 'var(--text-light)', fontSize: 14, maxWidth: 720 }}>{t?.preprints_intro ?? 'Preprints are early versions of research articles before peer review.'}</p>
          {extUrl && (
            <a href={extUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', marginBottom: 24, fontSize: 13, color: 'var(--accent)' }}>
              ↗ {t?.repo_view_external ?? 'View on journal site'}
            </a>
          )}
          <ArticleSearch value={search} onChange={handleSearchChange} t={t} />
          <ArticleFilter categories={categories} filters={filters} onChange={handleFilterChange} t={t} />
          {loading ? (
            <div className="page-loading" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : articles.length === 0 ? (
            <p className="no-content-msg">{t?.no_content_msg ?? 'No preprints available.'}</p>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-light)' }}>
                {t?.repo_now_showing ?? 'Now showing'} {start} – {end} {t?.repo_of ?? 'of'} {total}
              </div>
              <div className="article-list">
                {articles.map((a, i) => (
                  <ArticleCard key={a._id || i} article={a} type="preprints" t={t} showArticle={showArticle} />
                ))}
              </div>
              {pagination?.pages > 1 && (
                <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} t={t} />
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  if (view === 'volume') {
    const volLabel = selectedVolume
      ? fillTranslationTemplate(t?.repo_volume_title ?? 'IJCDS Volume {volume}', { volume: selectedVolume })
      : '';
    const total = pagination?.total ?? articles.length;
    const limit = pagination?.limit ?? 10;
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    const extUrl = null;
    return (
      <div className="page-wrapper">
        <main>
          <button type="button" onClick={goBack} className="repo-back-btn" style={{ marginBottom: 16, padding: '6px 12px', background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            ← {t?.article_back ?? 'Back'}
          </button>
          <h1 style={{ marginBottom: 8, fontSize: 22, color: 'var(--primary)' }}>{volLabel}</h1>
          {extUrl && (
            <a href={extUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', marginBottom: 24, fontSize: 13, color: 'var(--accent)' }}>
              ↗ {t?.repo_view_external ?? 'View on journal site'}
            </a>
          )}
          <ArticleSearch value={search} onChange={handleSearchChange} t={t} />
          <ArticleFilter categories={categories} filters={filters} onChange={handleFilterChange} t={t} />
          {loading ? (
            <div className="page-loading" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : articles.length === 0 ? (
            <p className="no-content-msg">{t?.repo_no_volume_articles ?? t?.no_content_msg ?? 'No articles in this volume.'}</p>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-light)' }}>
                {t?.repo_now_showing ?? 'Now showing'} {start} – {end} {t?.repo_of ?? 'of'} {total}
              </div>
              <div className="article-list">
                {articles.map((a, i) => (
                  <ArticleCard key={a._id || i} article={a} type="published" t={t} showArticle={showArticle} />
                ))}
              </div>
              {pagination?.pages > 1 && (
                <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} t={t} />
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  // Repository overview
  const extUrl = null;
  const doi = siteSettings?.journalMeta?.doi;
  
  // Filter volumes based on search and filters
  const filteredVolumes = volumes.filter(v => {
    if (search?.trim()) {
      const q = search.toLowerCase();
      const volTitle = fillTranslationTemplate(t?.repo_volume_title ?? 'IJCDS Volume {volume}', { volume: v.volume }).toLowerCase();
      const year = String(v.year || '');
      if (!volTitle.includes(q) && !year.includes(q)) return false;
    }
    if (filters.year && String(v.year) !== String(filters.year)) return false;
    return true;
  });

  // Sort volumes
  const sortedVolumes = [...filteredVolumes].sort((a, b) => {
    if (filters.sort === 'volume') return a.volume - b.volume;
    if (filters.sort === '-volume') return b.volume - a.volume;
    if (filters.sort === 'year') return (a.year || 0) - (b.year || 0);
    return (b.year || 0) - (a.year || 0); // default: -year
  });

  return (
    <div className="page-wrapper">
      <main>
        <h1 style={{ marginBottom: 8, fontSize: 22, color: 'var(--primary)' }}>{t?.article_published ?? 'Published Articles'}</h1>
        {siteSettings?.siteName && <p style={{ marginBottom: 12, color: 'var(--text-light)', fontSize: 14 }}>{siteSettings.siteName}</p>}
        <p style={{ marginBottom: 12, color: 'var(--text)', fontSize: 14, maxWidth: 720, lineHeight: 1.6 }}>
          {t?.repo_welcome || ''}
        </p>
        {(doi || extUrl) && (
          <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {doi && <span style={{ fontSize: 13, color: 'var(--text-light)' }}><strong>{t?.hero_doi ?? 'DOI'}:</strong> {doi}</span>}
            {extUrl && (
              <a href={extUrl} target="_blank" rel="noopener" style={{ fontSize: 13, color: 'var(--accent)' }}>
                ↗ {t?.repo_view_external ?? 'View on journal site'}
              </a>
            )}
          </div>
        )}

        {/* Search and Filter */}
        <ArticleSearch value={search} onChange={handleSearchChange} t={t} placeholder={t?.repo_search_placeholder ?? 'Search volumes...'} />
        <div className="article-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <select
            value={filters.year || ''}
            onChange={e => handleFilterChange({ ...filters, year: e.target.value || '' })}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6 }}
          >
            <option value="">{t?.article_filter_year ?? 'All years'}</option>
            {Array.from(new Set(volumes.map(v => v.year).filter(Boolean))).sort((a, b) => b - a).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filters.sort || '-year'}
            onChange={e => handleFilterChange({ ...filters, sort: e.target.value })}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6 }}
          >
            <option value="-year">{t?.repo_sort_year_desc ?? 'Newest year'}</option>
            <option value="year">{t?.repo_sort_year_asc ?? 'Oldest year'}</option>
            <option value="-volume">{t?.repo_sort_volume_desc ?? 'Volume (high to low)'}</option>
            <option value="volume">{t?.repo_sort_volume_asc ?? 'Volume (low to high)'}</option>
          </select>
          {(search || filters.year) && (
            <button
              type="button"
              onClick={() => { setSearch(''); handleFilterChange({ sort: '-year' }); }}
              style={{ padding: '8px 12px', fontSize: 13, background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
            >
              {t?.article_filter_reset ?? 'Reset'}
            </button>
          )}
        </div>

        {/* Collections (Preprint first) */}
        <section className="repo-section" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--text)' }}>{t?.repo_collections ?? t?.sb_preprint ?? 'Collections'}</h2>
          <ul className="repo-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <a href="#" onClick={e => { e.preventDefault(); goToPreprints(); }} className="repo-link" style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', color: 'var(--accent)', fontSize: 15 }}>
                {t?.sb_preprint ?? 'Preprint'}
                {preprintCount > 0 && <span style={{ color: 'var(--text-light)', fontSize: 12, marginLeft: 8 }}>({preprintCount})</span>}
              </a>
            </li>
          </ul>
        </section>

        {/* Communities / Volumes */}
        <section className="repo-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 16, margin: 0, color: 'var(--text)' }}>{t?.repo_communities ?? t?.nav_published ?? 'Communities'}</h2>
            {sortedVolumes.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {t?.repo_now_showing ?? 'Now showing'} 1 – {sortedVolumes.length} {t?.repo_of ?? 'of'} {volumes.length}
              </span>
            )}
          </div>
          {sortedVolumes.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>
              {search || filters.year ? (t?.repo_no_results ?? 'No volumes match your search.') : (t?.repo_no_volumes ?? t?.no_content_msg ?? 'No volumes yet.')}
            </p>
          ) : (
            <ul className="repo-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sortedVolumes.map((v, i) => (
                <li key={i}>
                  <a href="#" onClick={e => { e.preventDefault(); goToVolume(v.volume); }} className="repo-link" style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', color: 'var(--accent)', fontSize: 15 }}>
                    {fillTranslationTemplate(t?.repo_volume_title ?? 'IJCDS Volume {volume}', { volume: v.volume })}
                    <span style={{ display: 'block', color: 'var(--text-light)', fontSize: 12, marginTop: 2 }}>{v.year || '—'}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
