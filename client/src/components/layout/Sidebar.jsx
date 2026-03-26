/** Journal sidebar: Quick Links + Journal Info + CMS sidebar navigation */
export default function Sidebar({ t, showPage, sidebarItems = [], getTranslatedLabel }) {
  const getSlug = (url) => {
    if (!url) return 'home';
    const slug = url.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
    return slug || 'home';
  };
  const isInternal = (url) => {
    if (!url || url.startsWith('http://') || url.startsWith('https://')) return false;
    return true;
  };

  const quickLinkLabel = (slug, fallback) => {
    if (slug === 'published') return t?.sb_published ?? fallback;
    if (slug === 'preprints') return t?.sb_preprint ?? fallback;
    return fallback;
  };

  const renderApiLink = (item, i) => {
    const slug = getSlug(item.url);
    const section = item.sidebarSection || 'journalinfo';
    const label =
      isInternal(item.url) && section === 'quicklinks'
        ? quickLinkLabel(slug, item.label || '')
        : isInternal(item.url) && typeof getTranslatedLabel === 'function'
        ? getTranslatedLabel(slug, item.label || '', t)
        : item.label || '';
    if (isInternal(item.url)) {
      return (
        <li key={`api-${i}`}>
          <a href="#" onClick={e => { e.preventDefault(); showPage(slug); }}>{label}</a>
        </li>
      );
    }
    return (
      <li key={`api-${i}`}>
        <a href={item.url} target={item.target || '_self'} rel="noopener">{label}</a>
      </li>
    );
  };

  const apiQuickLinks = (sidebarItems || []).filter(i => (i.sidebarSection || 'journalinfo') === 'quicklinks');
  const apiJournalInfo = (sidebarItems || []).filter(i => (i.sidebarSection || 'journalinfo') === 'journalinfo');

  const defaultQuickLinks = [
    { page: 'published', label: t?.sb_published ?? 'Published Articles' },
    { page: 'preprints', label: t?.sb_preprint ?? 'Preprint' }
  ];
  const defaultJournalInfo = [
    { slug: 'aims', labelKey: 'nav_aims' },
    { slug: 'editorial', labelKey: 'nav_editorial' },
    { slug: 'indexing', labelKey: 'nav_indexing' },
    { slug: 'apc', labelKey: 'nav_apc' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">{t?.sidebar_quicklinks ?? 'Quick Links'}</div>
        <ul>
          {apiQuickLinks.length === 0 && defaultQuickLinks.map((item, i) => (
            <li key={i}>
              <a href="#" onClick={e => { e.preventDefault(); showPage(item.page); }}>{item.label}</a>
            </li>
          ))}
          {apiQuickLinks.map((item, i) => renderApiLink(item, i))}
        </ul>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-title">{t?.sidebar_journalinfo ?? 'Journal Info'}</div>
        <ul>
          {apiJournalInfo.length === 0 && defaultJournalInfo.map((item, i) => (
            <li key={i}>
              <a href="#" onClick={e => { e.preventDefault(); showPage(item.slug); }}>{t?.[item.labelKey] ?? item.slug}</a>
            </li>
          ))}
          {apiJournalInfo.map((item, i) => renderApiLink(item, i))}
        </ul>
      </div>
    </aside>
  );
}
