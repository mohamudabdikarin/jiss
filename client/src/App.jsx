import { useState, useEffect, useCallback } from 'react';
import { publicAPI } from './api';
import { fallbackTranslations } from './lang/fallback';
import { mergeSectionTranslationHtml, normalizePageSlugForTranslations } from './lang/pageTranslationMerge';
import ArticleList from './components/Articles/ArticleList';
import PublishedRepositoryPage from './components/pages/PublishedRepositoryPage';
import ArticleDetail from './components/Articles/ArticleDetail';
import SearchResultsPage from './components/pages/SearchResultsPage';
import NotFound from './components/Common/NotFound';
import SEOHead from './components/Common/SEOHead';
import Sidebar from './components/layout/Sidebar';
import { buildAnalyticsPagePath, trackGtagPageView } from './utils/analytics';

// Language codes — labels come from translations (t.lang_en_label etc)
const LANG_CODES = ['en', 'ar', 'ms', 'zh'];
const LANG_STORAGE_KEY = 'ijcds_site_lang';

function readStoredLang() {
  try {
    const s = localStorage.getItem(LANG_STORAGE_KEY);
    if (s && LANG_CODES.includes(s)) return s;
  } catch {}
  return 'en';
}

// Map nav URL slugs to translation keys (so nav/footer use t instead of API labels)
const SLUG_TO_T_KEY = {
  home: 'nav_home', preprints: 'nav_preprints', published: 'nav_published', search: 'nav_search',
  aims: 'nav_aims', editorial: 'nav_editorial', authors: 'nav_authors', reviewers: 'nav_reviewers',
  indexing: 'nav_indexing', ethics: 'nav_ethics', apc: 'nav_apc', contact: 'nav_contact'
};
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentLang, setCurrentLang] = useState(readStoredLang);
  const [t, setT] = useState(() => ({
    ...(fallbackTranslations[readStoredLang()] || fallbackTranslations.en)
  }));
  const [apiContent, setApiContent] = useState(null);

  // Dynamic data from API
  const [siteSettings, setSiteSettings] = useState(null);
  const [navItems, setNavItems] = useState([]);
  const [sidebarItems, setSidebarItems] = useState([]);
  const [footerData, setFooterData] = useState(null);
  const [components, setComponents] = useState([]);
  const [redirectsMap, setRedirectsMap] = useState({});
  const [pageData, setPageData] = useState(null);
  const [articlesData, setArticlesData] = useState(null);
  const [articleData, setArticleData] = useState(null);
  const [articleSlug, setArticleSlug] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageNotFound, setPageNotFound] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(null);

  const [articleFilters, setArticleFilters] = useState({ search: '', category: '', year: '', sort: '-publicationDate', page: 1 });
  const [articlesPagination, setArticlesPagination] = useState(null);
  const [categories, setCategories] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchPagination, setSearchPagination] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch categories once when needed (article listings + CMS pages with article templates)
  useEffect(() => {
    if (initialLoading) return;
    const pagesNeedingCategories = ['preprints', 'published', 'search'];
    const cmsTpl = pageData?.template;
    const cmsNeedsCategories =
      cmsTpl && ['preprint', 'articles'].includes(cmsTpl) &&
      !['preprints', 'published', 'search', 'article'].includes(currentPage);
    if (pagesNeedingCategories.includes(currentPage) || cmsNeedsCategories) {
      publicAPI.getCategories().then(({ data }) => {
        const cats = data.data ?? data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);
      }).catch(() => setCategories([]));
    }
  }, [initialLoading, currentPage, pageData?.template]);

  // Fetch all initial data from API
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, headerNavRes, sidebarNavRes, footerRes, componentsRes, redirectsRes] = await Promise.allSettled([
          publicAPI.getSettings(),
          publicAPI.getNavigation('header'),
          publicAPI.getNavigation('sidebar'),
          publicAPI.getFooter(),
          publicAPI.getComponents(),
          publicAPI.getRedirects()
        ]);

        // Check for maintenance mode (503)
        const results = [settingsRes, headerNavRes, sidebarNavRes, footerRes, componentsRes, redirectsRes];
        for (const r of results) {
          if (r.status === 'rejected' && r.reason?.response?.status === 503 && r.reason?.response?.data?.maintenance) {
            setMaintenanceMessage(r.reason.response.data.message || 'Site is under maintenance. Please check back soon.');
            setInitialLoading(false);
            return;
          }
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.data) {
          const s = settingsRes.value.data.data;
          setSiteSettings(s);
          if (s.translations) setApiContent(s.translations);
        }

        if (headerNavRes.status === 'fulfilled' && headerNavRes.value.data?.data) {
          const nav = headerNavRes.value.data.data;
          const items = nav?.items ?? [];
          const sorted = [...items]
            .filter(item => item.isVisible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setNavItems(sorted);
        }
        if (sidebarNavRes.status === 'fulfilled' && sidebarNavRes.value.data?.data) {
          const nav = sidebarNavRes.value.data.data;
          const items = nav?.items ?? [];
          const sorted = [...items]
            .filter(item => item.isVisible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setSidebarItems(sorted);
        }

        if (footerRes.status === 'fulfilled' && footerRes.value.data?.data) {
          setFooterData(footerRes.value.data.data);
        }
        if (componentsRes.status === 'fulfilled' && componentsRes.value.data?.data) {
          setComponents(Array.isArray(componentsRes.value.data.data) ? componentsRes.value.data.data : []);
        }
        const rlist = redirectsRes.status === 'fulfilled' ? (redirectsRes.value.data?.data ?? []) : [];
        const map = {};
        rlist.forEach(r => { map[r.fromPath?.replace(/^\//, '') || r.fromPath] = r.toPath || '/'; });
        setRedirectsMap(map);
      } catch (e) {
        // API down — fallback to hardcoded content
      } finally {
        setInitialLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch page, articles, or single article when currentPage changes
  useEffect(() => {
    if (initialLoading) return;
    setPageNotFound(false);
    setPageLoading(true);
    setPageData(null);
    setArticlesData(null);
    setArticleData(null);
    setSearchResults(null);

    if (currentPage === 'preprints') {
      const params = {
        type: 'preprint',
        status: 'published',
        page: articleFilters.page,
        limit: 10,
        sort: articleFilters.sort || '-publicationDate'
      };
      if (articleFilters.search?.trim()) params.search = articleFilters.search.trim();
      if (articleFilters.category) params.category = articleFilters.category;
      if (articleFilters.year) params.year = articleFilters.year;
      publicAPI.getArticles(params)
        .then(({ data }) => {
          setArticlesData(data.data ?? []);
          setArticlesPagination(data.pagination ?? null);
        })
        .catch(() => { setArticlesData(null); setArticlesPagination(null); })
        .finally(() => setPageLoading(false));
    } else if (currentPage === 'published') {
      setPageLoading(false);
    } else if (currentPage === 'search') {
      if (searchQuery?.trim()) {
        setSearchLoading(true);
        publicAPI.searchArticles({ q: searchQuery.trim(), page: articleFilters.page, limit: 10 })
          .then(({ data }) => {
            setSearchResults(data.data ?? []);
            setSearchPagination(data.pagination ?? null);
          })
          .catch(() => { setSearchResults(null); setSearchPagination(null); })
          .finally(() => setSearchLoading(false));
      } else {
        setSearchResults(null);
        setSearchPagination(null);
        setSearchLoading(false);
      }
      setPageLoading(false);
    } else if (articleSlug) {
      publicAPI.getArticle(articleSlug)
        .then(({ data }) => setArticleData(data.data))
        .catch(() => setArticleData(null))
        .finally(() => setPageLoading(false));
    } else {
      const slug = currentPage === 'home' ? null : currentPage;
      const fetchPage = slug ? publicAPI.getPage(slug) : publicAPI.getHome();
      fetchPage
        .then(async ({ data }) => {
          if (data?.data) {
            const p = data.data;
            const tpl = p.template || 'default';
            if (tpl === 'preprint' || tpl === 'articles') {
              const params = {
                status: 'published',
                page: articleFilters.page,
                limit: 10,
                sort: articleFilters.sort || '-publicationDate'
              };
              if (tpl === 'preprint') params.type = 'preprint';
              if (articleFilters.search?.trim()) params.search = articleFilters.search.trim();
              if (articleFilters.category) params.category = articleFilters.category;
              if (articleFilters.year) params.year = articleFilters.year;
              try {
                const artRes = await publicAPI.getArticles(params);
                setArticlesData(artRes.data.data ?? []);
                setArticlesPagination(artRes.data.pagination ?? null);
              } catch {
                setArticlesData(null);
                setArticlesPagination(null);
              }
            } else {
              setArticlesData(null);
              setArticlesPagination(null);
            }
            setPageData(p);
            setPageNotFound(false);
          } else {
            setPageData(null);
            setArticlesData(null);
            setArticlesPagination(null);
            setPageNotFound(!!slug);
          }
        })
        .catch((err) => {
          setPageData(null);
          setArticlesData(null);
          setArticlesPagination(null);
          setPageNotFound(slug ? (err?.response?.status === 404) : false);
        })
        .finally(() => setPageLoading(false));
    }
  }, [currentPage, articleSlug, initialLoading, articleFilters.search, articleFilters.category, articleFilters.year, articleFilters.sort, articleFilters.page, searchQuery]);

  const switchLang = useCallback((code) => {
    if (!LANG_CODES.includes(code)) return;
    setCurrentLang(code);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {}
    const fallback = fallbackTranslations[code] ?? fallbackTranslations.en;
    const fromApi = apiContent?.[code];
    const langData = fromApi ? { ...fallback, ...fromApi } : fallback;
    setT(langData);
    document.body.setAttribute('dir', langData.dir ?? 'ltr');
    document.body.className = langData.fontClass ?? '';
  }, [apiContent]);

  const showPage = useCallback((name) => {
    setArticleSlug(null);
    setCurrentPage(name);
    setPageNotFound(false);
    window.scrollTo(0, 0);
    const hash = name === 'home' ? '' : name;
    if (window.location.hash !== (hash ? `#${hash}` : '')) {
      window.history.replaceState(null, '', (window.location.pathname || '/') + (hash ? `#${hash}` : ''));
    }
  }, []);

  const showSearch = useCallback((query) => {
    setSearchQuery(query || '');
    setArticleFilters(f => ({ ...f, page: 1 }));
    setCurrentPage('search');
    setArticleSlug(null);
    window.scrollTo(0, 0);
  }, []);

  const handleArticleFilterChange = useCallback((filters) => {
    setArticleFilters(prev => ({ ...prev, ...filters, page: 1 }));
  }, []);

  const handleArticlePageChange = useCallback((page) => {
    setArticleFilters(prev => ({ ...prev, page }));
    window.scrollTo(0, 0);
  }, []);

  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q);
    setArticleFilters(f => ({ ...f, page: 1 }));
  }, []);

  const showArticle = useCallback((slug) => {
    setArticleSlug(slug);
    setCurrentPage('article');
    window.scrollTo(0, 0);
  }, []);

  // Client-side redirect check
  useEffect(() => {
    const slug = currentPage === 'home' ? '' : currentPage;
    const target = redirectsMap[slug];
    if (target) {
      const toPath = target.startsWith('http') ? target : (target.startsWith('/') ? target : `/${target}`);
      if (toPath.startsWith('http')) window.location.href = toPath;
      else showPage(toPath.replace(/^\//, '') || 'home');
    }
  }, [currentPage, redirectsMap]);

  // Hash routing: sync URL hash with currentPage (enables opening #published/#preprints in new tab)
  const hashToPage = (h) => {
    const hash = (h || window.location.hash).replace(/^#\/?/, '');
    if (hash === 'published' || hash === 'preprints' || hash === 'search' || hash === 'home') return hash;
    if (hash && ['aims', 'editorial', 'authors', 'reviewers', 'indexing', 'ethics', 'apc', 'contact'].includes(hash)) return hash;
    return null;
  };
  useEffect(() => {
    const applyHash = () => {
      const page = hashToPage(window.location.hash);
      if (page && page !== currentPage) {
        setArticleSlug(null);
        setCurrentPage(page);
        setPageNotFound(false);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for maintenance mode (from any API call)
  useEffect(() => {
    const onMaintenance = (e) => setMaintenanceMessage(e.detail || 'Site is under maintenance.');
    window.addEventListener('maintenance', onMaintenance);
    return () => window.removeEventListener('maintenance', onMaintenance);
  }, []);

  // GA4: virtual page views on SPA navigation (initial load handled by gtag in index.html)
  useEffect(() => {
    if (initialLoading || maintenanceMessage) return;
    if (typeof window.gtag !== 'function') return;
    const pagePath = buildAnalyticsPagePath(currentPage, articleSlug, searchQuery);
    const pageTitleForGa =
      currentPage === 'article' && articleData?.title
        ? articleData.title
        : currentPage === 'preprints'
          ? (t?.article_preprints ?? 'Preprints')
          : currentPage === 'published'
            ? (t?.article_published ?? 'Published Articles')
            : currentPage === 'search'
              ? (t?.article_search_results ?? 'Search Articles')
              : pageData?.title;
    trackGtagPageView(pagePath, pageTitleForGa || undefined);
  }, [
    initialLoading,
    maintenanceMessage,
    currentPage,
    articleSlug,
    searchQuery,
    articleData?.title,
    pageData?.title,
    t?.article_preprints,
    t?.article_published,
    t?.article_search_results
  ]);

  // When API translations load or user language changes, merge fallbacks + DB strings
  useEffect(() => {
    if (apiContent) switchLang(currentLang);
  }, [apiContent, currentLang, switchLang]);

  // Navigation items from API only
  const renderNavItems = navItems ?? [];

  // Check if a nav URL is an internal page reference
  const isInternalNav = (url) => {
    if (!url) return false;
    if (url.startsWith('http://') || url.startsWith('https://')) return false;
    if (url.startsWith('/')) return true;
    // Also treat short slugs (no protocol) as internal
    return !url.includes('.');
  };

  const getNavSlug = (url) => {
    if (!url) return 'home';
    let slug = url.replace(/^\/+/, '').replace(/\/+$/, '');
    return slug || 'home';
  };

  const getTranslatedLabel = (slug, apiLabel, t) => {
    const key = SLUG_TO_T_KEY[slug];
    return key && t?.[key] ? t[key] : apiLabel;
  };

  if (maintenanceMessage) {
    return (
      <div className="maintenance-screen">
        <img src="/maintenance-illustration.png" alt="" className="maintenance-illustration" />
        <h1 className="maintenance-title">{t?.maintenance_title ?? 'Under Maintenance'}</h1>
        <p className="maintenance-message">{maintenanceMessage}</p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner" />
          <p className="loading-text">{t?.loading_text ?? 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const seoData = currentPage === 'article' && articleData
    ? { metaTitle: articleData.title, metaDescription: (articleData.abstract || '').replace(/<[^>]+>/g, '').slice(0, 160), metaKeywords: articleData.keywords }
    : pageData?.seo || siteSettings?.defaultSEO;
  const pageTitle = currentPage === 'article' && articleData
    ? articleData.title
    : currentPage === 'preprints'
      ? (t?.article_preprints ?? 'Preprints')
      : currentPage === 'published'
        ? (t?.article_published ?? 'Published Articles')
        : currentPage === 'search'
          ? (t?.article_search_results ?? 'Search Articles')
          : pageData?.title;

  const hardcodedArticleRoutes = ['preprints', 'published', 'search', 'article'];
  const isHardcodedRoute = hardcodedArticleRoutes.includes(currentPage);
  const cmsTemplate = pageData?.template || 'default';
  const showCmsPublishedRepo =
    pageData && !pageNotFound && !isHardcodedRoute && cmsTemplate === 'published';
  const showCmsPreprintList =
    pageData && !pageNotFound && !isHardcodedRoute && cmsTemplate === 'preprint';
  const showCmsArticlesList =
    pageData && !pageNotFound && !isHardcodedRoute && cmsTemplate === 'articles';
  const articleTemplate = ['published', 'preprint', 'articles'].includes(cmsTemplate);
  const hasCmsSections = (pageData?.sections?.length ?? 0) > 0;
  /** Sidebar + main sections; article-list templates only use this when the page has at least one section (e.g. tag badges). */
  const showDynamicCms =
    pageData &&
    !pageNotFound &&
    !isHardcodedRoute &&
    ((['default', 'contact', 'custom'].includes(cmsTemplate) &&
      (hasCmsSections || (cmsTemplate === 'custom' && pageData.customCSS))) ||
      (articleTemplate && hasCmsSections));

  return (
    <div className="site-shell">
      <SEOHead seo={seoData} siteSettings={siteSettings} pageTitle={pageTitle} article={!!articleData} />
      {/* TOP BAR — buttons on right */}
      <div className="topbar">
        <div className="topbar-actions">
          <div className="topbar-links">
            <a href={`${window.location.origin}${window.location.pathname || '/'}#published`} target="_blank" rel="noopener">{t.topbar_published}</a>
            <a href={`${window.location.origin}${window.location.pathname || '/'}#preprints`} target="_blank" rel="noopener">{t.topbar_preprint}</a>
          </div>
          <div className="lang-switcher">
            {LANG_CODES.map(code => (
              <button key={code} className={`lang-btn ${currentLang === code ? 'active' : ''}`} onClick={() => switchLang(code)}>
                {t[`lang_${code}_label`] ?? code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header>
        <div className="logo-area">
          {siteSettings?.siteLogo && <img className="logo-img" src={siteSettings.siteLogo} alt="" onError={e => e.target.style.display = 'none'} />}
          <div className="journal-title">
            {(t?.journal_title && String(t.journal_title).trim()) || siteSettings?.siteName ? (
              <strong>{(t?.journal_title && String(t.journal_title).trim()) || siteSettings?.siteName}</strong>
            ) : null}
            {siteSettings?.journalMeta?.issn && (
              <span>
                {(t?.journal_issn && String(t.journal_issn).trim()) || siteSettings.journalMeta.issn}
              </span>
            )}
          </div>
        </div>
        <form className="header-search" onSubmit={e => { e.preventDefault(); const q = e.currentTarget.querySelector('input')?.value; showSearch(q); }} style={{ display: 'flex', gap: 4 }}>
          <input type="text" placeholder={t?.search_placeholder ?? 'Search articles...'} name="q" />
          <button type="submit">&#128269;</button>
        </form>
      </header>

      {/* NAV — Dynamic from API */}
      <div className="nav-wrapper">
        <nav className="nav-main">
          <ul>
            {(() => {
              const firstActiveIdx = renderNavItems.findIndex(it => isInternalNav(it.url) && getNavSlug(it.url) === currentPage);
              return renderNavItems.map((item, i) => {
                const slug = getNavSlug(item.url);
                const label = isInternalNav(item.url)
                  ? getTranslatedLabel(slug, item.label || '', t)
                  : (item.label || '');
                const isInternal = isInternalNav(item.url);
                const isActive = isInternal && i === firstActiveIdx;

                if (isInternal) {
                  return (
                    <li key={item._id || i}>
                      <a href="#" className={isActive ? 'active' : ''} onClick={e => { e.preventDefault(); slug === 'search' ? showSearch('') : showPage(slug); }}>{label}</a>
                    </li>
                  );
                }
                return (
                  <li key={item._id || i}>
                    <a href={item.url} target={item.target || '_blank'} rel="noopener">{label}</a>
                  </li>
                );
              });
            })()}
          </ul>
        </nav>
        {/* Metadata bar (ISSN, CiteScore, DOI, Frequency) — managed from Admin Settings */}
        <div className="nav-metadata">
          {siteSettings?.journalMeta?.issn && <span><strong>{t.hero_issn}:</strong> {siteSettings.journalMeta.issn}</span>}
          {siteSettings?.journalMeta?.citeScore && <span><strong>{t.hero_citescore}:</strong> {siteSettings.journalMeta.citeScore}</span>}
          {siteSettings?.journalMeta?.doi && <span><strong>{t.hero_doi}:</strong> {siteSettings.journalMeta.doi}</span>}
          {siteSettings?.journalMeta?.frequency && <span><strong>{t.hero_freq}:</strong> {siteSettings.journalMeta.frequency}</span>}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className={`page active fade-in`}>
        {pageNotFound ? (
          <NotFound t={t} showPage={showPage} siteSettings={siteSettings} />
        ) : pageLoading && currentPage !== 'search' ? (
          <div className="page-loading">
            <div className="spinner" />
          </div>
        ) : currentPage === 'published' ? (
          <PublishedRepositoryPage t={t} showPage={showPage} showArticle={showArticle} siteSettings={siteSettings} />
        ) : currentPage === 'preprints' ? (
          <ArticleList
            articles={Array.isArray(articlesData) ? articlesData : (articlesData?.data ?? [])}
            type={currentPage}
            t={t}
            showArticle={showArticle}
            showPage={showPage}
            siteSettings={siteSettings}
            search={articleFilters.search}
            onSearchChange={q => handleArticleFilterChange({ search: q })}
            filters={articleFilters}
            onFilterChange={handleArticleFilterChange}
            categories={categories}
            pagination={articlesPagination}
            onPageChange={handleArticlePageChange}
            loading={pageLoading}
          />
        ) : currentPage === 'search' ? (
          <SearchResultsPage
            articles={searchResults ?? []}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            pagination={searchPagination}
            onPageChange={handleArticlePageChange}
            t={t}
            showArticle={showArticle}
            loading={searchLoading}
          />
        ) : currentPage === 'article' ? (
          <ArticleDetail article={articleData} t={t} showPage={showPage} showArticle={showArticle} siteSettings={siteSettings} />
        ) : showDynamicCms ? (
          <DynamicPage
            page={pageData}
            currentPage={currentPage}
            t={t}
            showPage={showPage}
            showSearch={showSearch}
            siteSettings={siteSettings}
            sidebarItems={sidebarItems}
            getTranslatedLabel={getTranslatedLabel}
            belowSections={
              showCmsPublishedRepo ? (
                <PublishedRepositoryPage t={t} showPage={showPage} showArticle={showArticle} siteSettings={siteSettings} />
              ) : showCmsPreprintList ? (
                <ArticleList
                  articles={Array.isArray(articlesData) ? articlesData : (articlesData?.data ?? [])}
                  type="preprints"
                  t={t}
                  showArticle={showArticle}
                  showPage={showPage}
                  siteSettings={siteSettings}
                  pageHeading={pageData?.title}
                  search={articleFilters.search}
                  onSearchChange={(q) => handleArticleFilterChange({ search: q })}
                  filters={articleFilters}
                  onFilterChange={handleArticleFilterChange}
                  categories={categories}
                  pagination={articlesPagination}
                  onPageChange={handleArticlePageChange}
                  loading={pageLoading}
                />
              ) : showCmsArticlesList ? (
                <ArticleList
                  articles={Array.isArray(articlesData) ? articlesData : (articlesData?.data ?? [])}
                  type="articles"
                  t={t}
                  showArticle={showArticle}
                  showPage={showPage}
                  siteSettings={siteSettings}
                  pageHeading={pageData?.title}
                  search={articleFilters.search}
                  onSearchChange={(q) => handleArticleFilterChange({ search: q })}
                  filters={articleFilters}
                  onFilterChange={handleArticleFilterChange}
                  categories={categories}
                  pagination={articlesPagination}
                  onPageChange={handleArticlePageChange}
                  loading={pageLoading}
                />
              ) : null
            }
          />
        ) : showCmsPublishedRepo ? (
          <PublishedRepositoryPage t={t} showPage={showPage} showArticle={showArticle} siteSettings={siteSettings} />
        ) : showCmsPreprintList ? (
          <ArticleList
            articles={Array.isArray(articlesData) ? articlesData : (articlesData?.data ?? [])}
            type="preprints"
            t={t}
            showArticle={showArticle}
            showPage={showPage}
            siteSettings={siteSettings}
            pageHeading={pageData?.title}
            search={articleFilters.search}
            onSearchChange={(q) => handleArticleFilterChange({ search: q })}
            filters={articleFilters}
            onFilterChange={handleArticleFilterChange}
            categories={categories}
            pagination={articlesPagination}
            onPageChange={handleArticlePageChange}
            loading={pageLoading}
          />
        ) : showCmsArticlesList ? (
          <ArticleList
            articles={Array.isArray(articlesData) ? articlesData : (articlesData?.data ?? [])}
            type="articles"
            t={t}
            showArticle={showArticle}
            showPage={showPage}
            siteSettings={siteSettings}
            pageHeading={pageData?.title}
            search={articleFilters.search}
            onSearchChange={(q) => handleArticleFilterChange({ search: q })}
            filters={articleFilters}
            onFilterChange={handleArticleFilterChange}
            categories={categories}
            pagination={articlesPagination}
            onPageChange={handleArticlePageChange}
            loading={pageLoading}
          />
        ) : (
          <NoContentMessage msg={t?.no_content_msg} />
        )}
      </div>

      {/* FOOTER — translation footer_text overrides API HTML when set for active language */}
      {(() => {
        const fromT = t?.footer_text && String(t.footer_text).trim();
        const raw = fromT || footerData?.content;
        if (!raw) return null;
        return (
          <footer>
            <span>{String(raw).replace(/@year/g, new Date().getFullYear())}</span>
          </footer>
        );
      })()}
    </div>
  );
}

/* ============================================================
   DYNAMIC PAGE RENDERER
   Renders sections from the CMS API. Sidebar sections share ONE sidebar (no duplicates).
   ============================================================ */
const SIDEBAR_SECTION_TYPES = ['text', 'richtext', 'page_blocks', 'cards', 'stats', 'gallery', 'accordion', 'contact', 'team', 'buttons', 'tag_badges', 'tag_badge'];

function normalizeSectionContent(raw) {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function renderSectionTitle(titleHtml, titleStyle) {
  if (!titleHtml || String(titleHtml).trim() === '') return null;
  const html = normalizeRichTextHtml(String(titleHtml));
  const s = !titleStyle || titleStyle === 'auto' ? 'page_h1' : titleStyle;
  if (s === 'hidden') return null;
  if (s === 'h2_section') return <h2 className="section-heading-h2" dangerouslySetInnerHTML={{ __html: html }} />;
  if (s === 'h1_clean') return <h1 className="section-title-clean" dangerouslySetInnerHTML={{ __html: html }} />;
  return <h1 dangerouslySetInnerHTML={{ __html: html }} />;
}

function resolveBodyTheme(content, section, sectionIndex, firstHomeRichIndex, currentPage, bodyHtml) {
  const raw = content.bodyTheme;
  const isHome = currentPage === 'home' || currentPage === '';
  const isRich = section.type === 'text' || section.type === 'richtext';
  if (!raw || raw === 'auto') {
    if (isRich && isHome && bodyHtml && firstHomeRichIndex >= 0) {
      return sectionIndex === firstHomeRichIndex ? 'callout_left' : 'serif_body';
    }
    return 'plain';
  }
  return raw;
}

/** Undo HTML entity encoding if middleware previously escaped markup (e.g. &lt;p&gt;). */
function normalizeRichTextHtml(raw) {
  if (raw == null) return '';
  if (typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s.includes('&lt;') && !s.includes('&gt;')) return s;
  if (typeof document !== 'undefined') {
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    const decoded = ta.value;
    if (decoded.includes('<') && decoded.trim().startsWith('<')) return decoded;
  }
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function safeShapeColor(value, fallback) {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  if (s.length > 50) return fallback;
  if (/[;{}]|<|url\s*\(|expression|javascript:/i.test(s)) return fallback;
  return s;
}
function safeShapeLength(value, fallback) {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  if (s.length > 16) return fallback;
  if (/^(thin|medium|thick)$/i.test(s)) return s.toLowerCase();
  if (/^\d+(\.\d+)?$/i.test(s)) return `${s}px`;
  if (/^\d+(\.\d+)?(px|rem|em|%)$/i.test(s)) return s;
  if (s === '0') return '0';
  return fallback;
}
function safeShapePadding(value, fallback) {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  if (s.length > 48) return fallback;
  const parts = s.split(/\s+/).filter(Boolean);
  if (!parts.length || parts.length > 4) return fallback;
  const fixed = [];
  for (const p of parts) {
    if (p === '0') {
      fixed.push('0');
      continue;
    }
    if (/^\d+(\.\d+)?$/i.test(p)) {
      fixed.push(`${p}px`);
      continue;
    }
    if (/^\d+(\.\d+)?(px|rem|em|%)$/i.test(p)) {
      fixed.push(p);
      continue;
    }
    return fallback;
  }
  return fixed.join(' ');
}
function shapeBlockBoxStyle(block) {
  return {
    backgroundColor: safeShapeColor(block.backgroundColor, '#f0f7ff'),
    borderColor: safeShapeColor(block.borderColor, '#b8d4eb'),
    borderWidth: safeShapeLength(block.borderWidth, '1px'),
    borderStyle: 'solid',
    borderRadius: safeShapeLength(block.borderRadius, '8px'),
    padding: safeShapePadding(block.padding, '24px'),
    boxSizing: 'border-box',
    maxWidth: '100%'
  };
}

function renderBodyHtml(bodyHtml, theme) {
  if (bodyHtml == null || bodyHtml === '') return null;
  const html = normalizeRichTextHtml(String(bodyHtml));
  if (!html) return null;
  const map = {
    plain: null,
    callout_left: 'home-intro',
    serif_body: 'home-body-text',
    muted_panel: 'section-body-muted',
    quote: 'section-body-quote',
    bordered: 'section-body-bordered',
    highlight_soft: 'section-body-highlight-soft'
  };
  const cls = map[theme] || null;
  return cls ? <div className={cls} dangerouslySetInnerHTML={{ __html: html }} /> : <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function SectionShell({ section, children }) {
  if (children == null) return null;
  const style = {};
  if (section.backgroundColor) style.background = section.backgroundColor;
  if (section.paddingTop) style.paddingTop = section.paddingTop;
  if (section.paddingBottom) style.paddingBottom = section.paddingBottom;
  const anim = section.animation && section.animation !== 'none' ? `anim-${section.animation}` : '';
  const cls = ['section-shell', anim, section.cssClasses || ''].filter(Boolean).join(' ').trim();
  return (
    <div className={cls} style={Object.keys(style).length ? style : undefined}>
      {children}
    </div>
  );
}

function youTubeEmbedFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const u = url.trim();
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\s?]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  if (/^https?:\/\//i.test(u)) return u;
  return '';
}

function renderPageBlockButton(label, url, variant, newTab, showPage) {
  const raw = (url || '#').trim();
  const v = variant || 'primary';
  const external = /^https?:\/\//i.test(raw) || raw.startsWith('mailto:');
  if (external) {
    return (
      <a
        href={raw}
        target={newTab ? '_blank' : '_self'}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className={`cms-btn cms-btn--${v}`}
      >
        {label || 'Button'}
      </a>
    );
  }
  const slug = raw.replace(/^#\/?/, '').replace(/^\/?/, '').replace(/\/$/, '') || 'home';
  return (
    <a
      href="#"
      className={`cms-btn cms-btn--${v}`}
      onClick={(e) => {
        e.preventDefault();
        showPage(slug);
      }}
    >
      {label || 'Button'}
    </a>
  );
}

function RenderPageBlocks({ blocks, showPage }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div className="page-blocks-root">
      {blocks.map((block, idx) => {
        const key = block.id || `pb-${idx}`;
        switch (block.type) {
          case 'heading': {
            const level = block.level === 'h1' || block.level === 'h3' ? block.level : 'h2';
            const Tag = level;
            const align = block.align === 'center' || block.align === 'right' ? block.align : 'left';
            const cls = `pb-heading pb-heading-${level} pb-align-${align}`;
            const rawText = block.text != null && String(block.text).trim() !== ''
              ? String(block.text)
              : String(block.html || '').replace(/<[^>]*>/g, '').trim();
            return (
              <Tag key={key} className={cls}>
                {rawText}
              </Tag>
            );
          }
          case 'paragraph':
            return (
              <div
                key={key}
                className="pb-paragraph"
                dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(block.html || '') }}
              />
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="pb-quote"
                dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(block.html || '') }}
              />
            );
          case 'list':
            return (
              <div
                key={key}
                className="pb-list"
                dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(block.html || '') }}
              />
            );
          case 'image':
            if (!block.src) return null;
            return (
              <figure key={key} className="pb-image-wrap">
                <img src={block.src} alt={block.alt || ''} style={{ maxWidth: block.width || '100%' }} />
              </figure>
            );
          case 'button':
            return (
              <div key={key} className="pb-buttons">
                {renderPageBlockButton(block.label, block.url, block.variant, block.newTab, showPage)}
              </div>
            );
          case 'divider':
            return <hr key={key} className="pb-divider" />;
          case 'columns':
            return (
              <div key={key} className="pb-columns">
                <div className="pb-paragraph" dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(block.col1Html || '') }} />
                <div className="pb-paragraph" dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(block.col2Html || '') }} />
              </div>
            );
          case 'spacer': {
            const h = block.height || '24px';
            return <div key={key} className="pb-spacer" style={{ height: h }} aria-hidden />;
          }
          case 'video': {
            const embed = youTubeEmbedFromUrl(block.url || '');
            if (!embed) return null;
            return (
              <div key={key} className="pb-video">
                <iframe src={embed} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            );
          }
          case 'card':
            return (
              <article key={key} className="pb-card">
                {block.imageSrc ? <img src={block.imageSrc} alt="" /> : null}
                <div className="pb-card-body">
                  {block.title ? <h3 className="pb-card-title">{block.title}</h3> : null}
                  <div className="pb-paragraph" dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(block.bodyHtml || '') }} />
                </div>
              </article>
            );
          case 'profile_heading': {
            const accent = block.accentColor || '#c8102e';
            const title = (block.title || '').trim();
            const subtitle = (block.subtitle || '').trim();
            if (!title && !subtitle) return null;
            return (
              <div key={key} className="pb-profile-heading">
                {title ? (
                  <div className="pb-profile-heading__head">
                    <span className="pb-profile-heading__bar" style={{ backgroundColor: accent }} aria-hidden />
                    <h3 className="pb-profile-heading__title">{title}</h3>
                  </div>
                ) : null}
                {subtitle ? (
                  <p
                    className={
                      title
                        ? 'pb-profile-heading__subtitle'
                        : 'pb-profile-heading__subtitle pb-profile-heading__subtitle--solo'
                    }
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>
            );
          }
          case 'tag_pills': {
            const align = block.align === 'left' || block.align === 'right' ? block.align : 'center';
            const badges = (block.badges || []).filter((b) => b && String(b.label || '').trim());
            const heading = String(block.heading || '').trim();
            if (badges.length === 0 && !heading) return null;
            return (
              <div key={key} className="pb-tag-pills-block">
                {heading ? <h3 className="pb-tag-pills-title">{heading}</h3> : null}
                {badges.length > 0 ? (
                  <div className={`section-tag-badges section-tag-badges--${align}`}>
                    {badges.map((b, i) => {
                      const label = String(b.label || '').trim();
                      const url = String(b.url || '').trim();
                      const external = /^https?:\/\//i.test(url) || url.startsWith('mailto:');
                      const pill = <span className="section-tag-badges__pill">{label}</span>;
                      if (!url) {
                        return (
                          <span key={i} className="section-tag-badges__item">
                            {pill}
                          </span>
                        );
                      }
                      if (external) {
                        return (
                          <a
                            key={i}
                            className="section-tag-badges__item section-tag-badges__link"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {pill}
                          </a>
                        );
                      }
                      const slug = url.replace(/^#\/?/, '').replace(/^\/?/, '').replace(/\/$/, '') || 'home';
                      return (
                        <a
                          key={i}
                          href="#"
                          className="section-tag-badges__item section-tag-badges__link"
                          onClick={(e) => {
                            e.preventDefault();
                            showPage(slug);
                          }}
                        >
                          {pill}
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }
          case 'apc_callout': {
            const label = String(block.label || '').trim();
            const amount = String(block.amount || '').trim();
            const note = String(block.note || '').trim();
            if (!label && !amount && !note) return null;
            return (
              <aside key={key} className="pb-apc-callout" aria-label={label || 'Fee information'}>
                {label ? <div className="pb-apc-callout__label">{label}</div> : null}
                {amount ? <div className="pb-apc-callout__amount">{amount}</div> : null}
                {note ? <div className="pb-apc-callout__note">{note}</div> : null}
              </aside>
            );
          }
          case 'shape': {
            const inner = normalizeRichTextHtml(block.html || '');
            return (
              <div key={key} className="pb-shape" style={shapeBlockBoxStyle(block)}>
                <div className="pb-paragraph" dangerouslySetInnerHTML={{ __html: inner }} />
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

function DynamicSectionRow({
  section,
  sectionIndex,
  firstHomeRichIndex,
  currentPage,
  t,
  showPage,
  showSearch,
  siteSettings
}) {
  const inner = SIDEBAR_SECTION_TYPES.includes(section.type)
    ? SectionContent({
        section,
        sectionIndex,
        firstHomeRichIndex,
        currentPage,
        t,
        showPage,
        showSearch,
        siteSettings
      })
    : SectionRenderer({
        section,
        currentPage,
        t,
        showPage,
        showSearch,
        siteSettings
      });
  if (inner == null) return null;
  return <SectionShell section={section}>{inner}</SectionShell>;
}

function DynamicPage({ page, currentPage, t, showPage, showSearch, siteSettings, sidebarItems, getTranslatedLabel, belowSections = null }) {
  const sections = page.sections || [];
  const firstHomeRichIndex = sections.findIndex(s => s.type === 'text' || s.type === 'richtext');
  const tpl = page.template || 'default';
  const tplClass = tpl && tpl !== 'default' ? ` page-template-${tpl}` : '';
  return (
    <div className={`page-wrapper${currentPage === 'home' ? ' page-home' : ''}${tplClass}`}>
      {tpl === 'custom' && page.customCSS ? (
        <style>{String(page.customCSS)}</style>
      ) : null}
      <Sidebar t={t} showPage={showPage} sidebarItems={sidebarItems} getTranslatedLabel={getTranslatedLabel} />
      <main>
        {sections.map((section, i) => (
          <DynamicSectionRow
            key={section._id || i}
            section={section}
            sectionIndex={i}
            firstHomeRichIndex={firstHomeRichIndex}
            currentPage={currentPage}
            t={t}
            showPage={showPage}
            showSearch={showSearch}
            siteSettings={siteSettings}
          />
        ))}
        {belowSections}
      </main>
    </div>
  );
}

function SectionContent({ section, sectionIndex, firstHomeRichIndex, currentPage, t, showPage, showSearch, siteSettings }) {
  const content = normalizeSectionContent(section.content);
  const title = content.title || content.heading;
  const titleStyle = content.titleStyle;
  switch (section.type) {
    case 'text':
    case 'richtext': {
      const bodyHtml = typeof content === 'string' ? content : (content.html || content.body || content.text || '');
      const theme = resolveBodyTheme(content, section, sectionIndex, firstHomeRichIndex, currentPage, bodyHtml);
      const slug = normalizePageSlugForTranslations(currentPage);
      const useTranslationLayer = sectionIndex === firstHomeRichIndex;
      const merged = useTranslationLayer
        ? mergeSectionTranslationHtml(slug, title || null, bodyHtml, t)
        : { title, html: bodyHtml };
      const displayTitle = merged.title != null && String(merged.title).trim() !== '' ? merged.title : title;
      const displayHtml = merged.html || bodyHtml;
      return (
        <>
          {renderSectionTitle(displayTitle, titleStyle)}
          {renderBodyHtml(displayHtml, theme)}
        </>
      );
    }
    case 'page_blocks':
      return <RenderPageBlocks blocks={content.blocks} showPage={showPage} />;
    case 'tag_badges':
    case 'tag_badge': {
      const align = content.align === 'left' || content.align === 'right' ? content.align : 'center';
      const badges = (content.badges || []).filter((b) => b && String(b.label || '').trim());
      const hasTitle = String(content.heading || content.title || '').trim() !== '';
      if (badges.length === 0 && !hasTitle) return null;
      if (badges.length === 0) {
        return <>{renderSectionTitle(content.heading || content.title, titleStyle)}</>;
      }
      return (
        <>
          {renderSectionTitle(content.heading || content.title, titleStyle)}
          <div className={`section-tag-badges section-tag-badges--${align}`}>
            {badges.map((b, i) => {
              const label = String(b.label || '').trim();
              const url = String(b.url || '').trim();
              const external = /^https?:\/\//i.test(url) || url.startsWith('mailto:');
              const pill = <span className="section-tag-badges__pill">{label}</span>;
              if (!url) {
                return (
                  <span key={i} className="section-tag-badges__item">
                    {pill}
                  </span>
                );
              }
              if (external) {
                return (
                  <a
                    key={i}
                    className="section-tag-badges__item section-tag-badges__link"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pill}
                  </a>
                );
              }
              const slug = url.replace(/^#\/?/, '').replace(/^\/?/, '').replace(/\/$/, '') || 'home';
              return (
                <a
                  key={i}
                  href="#"
                  className="section-tag-badges__item section-tag-badges__link"
                  onClick={(e) => {
                    e.preventDefault();
                    showPage(slug);
                  }}
                >
                  {pill}
                </a>
              );
            })}
          </div>
        </>
      );
    }
    case 'buttons': {
      const align = content.align || 'left';
      const btns = content.buttons || [];
      return (
        <>
          {renderSectionTitle(content.heading || content.title, titleStyle)}
          <div className={`section-buttons section-buttons--${align}`}>
            {btns.map((b, i) => {
              const url = (b.url || '#').trim();
              const external = /^https?:\/\//i.test(url) || url.startsWith('mailto:');
              const variant = b.variant || 'primary';
              const label = b.label || 'Button';
              if (external) {
                return (
                  <a
                    key={i}
                    href={url}
                    target={b.newTab ? '_blank' : '_self'}
                    rel={b.newTab ? 'noopener noreferrer' : undefined}
                    className={`cms-btn cms-btn--${variant}`}
                  >
                    {label}
                  </a>
                );
              }
              const slug = url.replace(/^#\/?/, '').replace(/^\/?/, '').replace(/\/$/, '') || 'home';
              return (
                <a
                  key={i}
                  href="#"
                  className={`cms-btn cms-btn--${variant}`}
                  onClick={(e) => {
                    e.preventDefault();
                    showPage(slug);
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </>
      );
    }
    case 'cards':
      return (
        <>
          {renderSectionTitle(title, titleStyle)}
          <div className={`stats-row stats-row--${content.rowVariant || 'dark'}`}>
            {(content.cards || []).map((card, k) => (
              <div key={k} className="stat-card">
                <div className="stat-val" dangerouslySetInnerHTML={{ __html: card.value || card.title || '' }} />
                <div className="stat-label" dangerouslySetInnerHTML={{ __html: card.label || card.description || '' }} />
              </div>
            ))}
          </div>
        </>
      );
    case 'stats':
      return (
        <>
          {renderSectionTitle(title, titleStyle)}
          <div className={`stats-row stats-row--${content.rowVariant || 'dark'}`}>
            {(content.stats || content.items || []).map((stat, k) => (
              <div key={k} className="stat-card">
                <div className="stat-val" dangerouslySetInnerHTML={{ __html: stat.value ?? '' }} />
                <div className="stat-label" dangerouslySetInnerHTML={{ __html: stat.label ?? '' }} />
              </div>
            ))}
          </div>
        </>
      );
    case 'gallery':
      return (
        <>
          {renderSectionTitle(title, titleStyle)}
          <div className="index-grid">
            {(content.images || []).map((img, k) => (
              <div key={k} className="index-badge" style={{ padding: 0, overflow: 'hidden' }}>
                <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: 'auto' }} />
              </div>
            ))}
          </div>
        </>
      );
    case 'accordion':
      return (
        <>
          {renderSectionTitle(title, titleStyle)}
          {(content.items || []).map((item, k) => (
            <AccordionItem key={k} title={item.title} body={item.body ?? item.content ?? ''} />
          ))}
        </>
      );
    case 'contact':
      return (
        <>
          {renderSectionTitle(title, titleStyle)}
          <div className="contact-box">
            {content.name && <h3>{content.name}</h3>}
            {content.role && <p>{content.role}</p>}
            {content.body && <div dangerouslySetInnerHTML={{ __html: content.body }} />}
            {siteSettings?.contactEmail && (
              <p>
                <strong>{t?.contact_email != null && String(t.contact_email).trim() ? t.contact_email : 'Email'}:</strong>{' '}
                <a href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>
              </p>
            )}
            {siteSettings?.contactPhone && (
              <p>
                <strong>{t?.contact_tel != null && String(t.contact_tel).trim() ? t.contact_tel : 'Phone'}:</strong>{' '}
                {siteSettings.contactPhone}
              </p>
            )}
            {siteSettings?.contactAddress && (
              <p>
                <strong>{t?.contact_address_label != null && String(t.contact_address_label).trim() ? t.contact_address_label : 'Address'}:</strong>{' '}
                {siteSettings.contactAddress}
              </p>
            )}
          </div>
        </>
      );
    case 'team':
      return (
        <>
          {renderSectionTitle(title, titleStyle)}
          {(content.groups || []).map((group, gi) => (
            <div key={gi} className="board-section">
              <h2>{group.title}</h2>
              <ul className="board-list">
                {(group.members || []).map((member, mi) => (
                  <li key={mi}>{member.name}{member.affiliation ? `, ${member.affiliation}` : ''}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      );
    default:
      return null;
  }
}

function SectionRenderer({ section, currentPage, t, showPage, showSearch, siteSettings }) {
  const content = normalizeSectionContent(section.content);

  switch (section.type) {
    case 'hero':
      /* Skip hero on home — ISSN/metadata already in nav bar */
      if (currentPage === 'home' || currentPage === '') return null;
      return (
        <div className="hero-banner">
          <div className="hero-meta">
            {content.title && <h1 style={{ fontSize: 28, marginBottom: 8 }}>{content.title}</h1>}
            {content.subtitle && <p>{content.subtitle}</p>}
            {content.items?.map((item, i) => (
              <span key={i}><strong>{item.label}:</strong> {item.value}</span>
            ))}
          </div>
        </div>
      );

    case 'text':
    case 'richtext':
    case 'page_blocks':
    case 'cards':
    case 'stats':
    case 'buttons':
    case 'tag_badges':
    case 'tag_badge':
      return null;

    case 'image':
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {content.url && <img src={content.url} alt={content.alt || ''} style={{ maxWidth: '100%', height: 'auto' }} />}
          {content.caption && <p style={{ fontSize: 13, color: '#555', marginTop: 8 }}>{content.caption}</p>}
        </div>
      );

    case 'gallery':
    case 'accordion':
    case 'contact':
    case 'team':
      return null;

    case 'cta': {
      const btnUrl = (content.buttonUrl || '').trim();
      const btnLabel = content.buttonLabel;
      const btnVariant = content.buttonVariant || 'primary';
      const renderCtaButton = () => {
        if (!btnLabel || !btnUrl) return null;
        const external = /^https?:\/\//i.test(btnUrl) || btnUrl.startsWith('mailto:');
        if (external) {
          return (
            <a
              href={btnUrl}
              target={content.buttonNewTab ? '_blank' : '_self'}
              rel={content.buttonNewTab ? 'noopener noreferrer' : undefined}
              className={`cms-btn cms-btn--${btnVariant}`}
              style={{ marginTop: 12, display: 'inline-block' }}
            >
              {btnLabel}
            </a>
          );
        }
        const slug = btnUrl.replace(/^#\/?/, '').replace(/^\/?/, '').replace(/\/$/, '') || 'home';
        return (
          <a
            href="#"
            className={`cms-btn cms-btn--${btnVariant}`}
            style={{ marginTop: 12, display: 'inline-block' }}
            onClick={(e) => {
              e.preventDefault();
              showPage(slug);
            }}
          >
            {btnLabel}
          </a>
        );
      };
      return (
        <div className="apc-highlight">
          {content.title && <div>{content.title}</div>}
          {content.value && <div className="price">{content.value}</div>}
          {content.description && <div style={{ fontSize: 13, color: '#555' }}>{content.description}</div>}
          {content.body && <div dangerouslySetInnerHTML={{ __html: content.body }} />}
          {renderCtaButton()}
        </div>
      );
    }

    case 'banner':
      /* Skip banner on home to avoid duplicate nav-like block */
      if (currentPage === 'home' || currentPage === '') return null;
      return (
        <div className="hero-banner">
          <div className="hero-meta">
            {content.title && <h2 style={{ color: '#fff', fontSize: 22 }}>{content.title}</h2>}
            {content.text && <p style={{ color: '#fff' }}>{content.text}</p>}
          </div>
        </div>
      );

    case 'custom_html': {
      const rawHtml = typeof content === 'string' ? content : (content.html || content.body || '');
      return rawHtml ? <div dangerouslySetInnerHTML={{ __html: rawHtml }} /> : null;
    }

    default: {
      const fallbackHtml = typeof content === 'string' ? content : (content.html || content.body || content.text || '');
      if (fallbackHtml) {
        return (
          <div>
            {content.title && <h1 dangerouslySetInnerHTML={{ __html: content.title }} />}
            <div dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
          </div>
        );
      }
      return null;
    }
  }
}

function AccordionItem({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '12px 0', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--primary)',
          fontFamily: 'Arial, sans-serif', textAlign: 'left'
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: title ?? '' }} />
        <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
      </button>
      {open && body && (
        <div style={{ padding: '0 0 14px', fontSize: 14 }} dangerouslySetInnerHTML={{ __html: String(body) }} />
      )}
    </div>
  );
}

function NoContentMessage({ msg }) {
  return (
    <div className="page-wrapper">
      <main>
        <p className="no-content-msg">{msg ?? 'Content not available. Please add content from the admin panel.'}</p>
      </main>
    </div>
  );
}

