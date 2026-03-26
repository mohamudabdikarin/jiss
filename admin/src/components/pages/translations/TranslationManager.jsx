import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../api/axios';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇧🇭' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'zh', label: '中文', flag: '🇨🇳' }
];

// All translatable keys grouped by section
const TRANSLATION_SECTIONS = [
  { section: 'Navigation', keys: [
    { key: 'nav_home', label: 'Home' }, { key: 'nav_aims', label: 'Aims & Scope' },
    { key: 'nav_editorial', label: 'Editorial Board' }, { key: 'nav_authors', label: 'For Authors' },
    { key: 'nav_reviewers', label: 'For Reviewers' }, { key: 'nav_indexing', label: 'Indexing' },
    { key: 'nav_ethics', label: 'Ethics & Policies' }, { key: 'nav_apc', label: 'APC Charges' },
    { key: 'nav_contact', label: 'Contact' },
    { key: 'nav_preprints', label: 'Preprints' },
    { key: 'nav_published', label: 'Published' },
    { key: 'nav_search', label: 'Search' }
  ]},
  { section: 'Top Bar', keys: [
    { key: 'topbar_published', label: 'Published Articles' }, { key: 'topbar_preprint', label: 'Preprint' }
  ]},
  { section: 'Header', keys: [
    { key: 'journal_title', label: 'Journal Title' }, { key: 'journal_issn', label: 'ISSN Text' },
    { key: 'search_placeholder', label: 'Search Placeholder' }
  ]},
  { section: 'Hero Banner', keys: [
    { key: 'hero_issn', label: 'ISSN Label' }, { key: 'hero_citescore', label: 'CiteScore Label' },
    { key: 'hero_doi', label: 'DOI Label' }, { key: 'hero_freq', label: 'Frequency Label' },
    { key: 'hero_freq_val', label: 'Frequency Value' }
  ]},
  { section: 'Sidebar', keys: [
    { key: 'sidebar_quicklinks', label: 'Quick Links Title' }, { key: 'sidebar_journalinfo', label: 'Journal Info Title' },
    { key: 'sidebar_navigation', label: 'Navigation Title' }, { key: 'sidebar_templates', label: 'Templates Title' },
    { key: 'sb_published', label: 'Published Articles Link' }, { key: 'sb_preprint', label: 'Preprint Link' },
    { key: 'sb_submit', label: 'Submit an Article' },
    { key: 'sb_latex', label: 'LaTeX Template Link' }, { key: 'sb_pdf', label: 'Template PDF Link' },
    { key: 'sb_copyright', label: 'Copyright Form Link' }
  ]},
  { section: 'Home Page', keys: [
    { key: 'home_h1', label: 'Home Title' },
    { key: 'home_intro', label: 'Home Introduction (HTML)', type: 'textarea' },
    { key: 'stat_founded', label: 'Stat: Founded' }, { key: 'stat_citescore', label: 'Stat: CiteScore' },
    { key: 'stat_access', label: 'Stat: Access' }, { key: 'stat_access_sub', label: 'Stat: Access Sub' },
    { key: 'stat_scopus', label: 'Stat: Scopus' }, { key: 'stat_scopus_sub', label: 'Stat: Scopus Sub' },
    { key: 'home_p1', label: 'Home Paragraph 1 (HTML)', type: 'textarea' },
    { key: 'home_p2', label: 'Home Paragraph 2 (HTML)', type: 'textarea' }
  ]},
  { section: 'Aims & Scope', keys: [
    { key: 'aims_h1', label: 'Title' }, { key: 'aims_p', label: 'Introduction', type: 'textarea' },
    { key: 'aims_scope_h', label: 'Scope Heading' }, { key: 'aims_closing', label: 'Closing', type: 'textarea' }
  ]},
  { section: 'Editorial Board', keys: [
    { key: 'editorial_h1', label: 'Title' }, { key: 'editorial_eic', label: 'Editor-in-Chief' },
    { key: 'editorial_me', label: 'Managing Editor' }, { key: 'editorial_advisory', label: 'Advisory Board' },
    { key: 'editorial_board', label: 'Editorial Board' }
  ]},
  { section: 'For Authors', keys: [
    { key: 'authors_h1', label: 'Title' }, { key: 'authors_speed_h', label: 'Responsiveness Heading' },
    { key: 'authors_speed1', label: 'Speed Point 1 (HTML)' }, { key: 'authors_speed2', label: 'Speed Point 2 (HTML)' },
    { key: 'authors_speed3', label: 'Speed Point 3 (HTML)' },
    { key: 'authors_prep_h', label: 'Preparing Heading' }, { key: 'authors_prep_p', label: 'Preparing Text (HTML)', type: 'textarea' },
    { key: 'authors_template_h', label: 'Template Heading' }, { key: 'authors_template_p', label: 'Template Text (HTML)', type: 'textarea' },
    { key: 'authors_submit_h', label: 'Submit Heading' }, { key: 'authors_submit_p', label: 'Submit Text (HTML)', type: 'textarea' },
    { key: 'authors_accept_h', label: 'Acceptance Heading' }, { key: 'authors_accept_p', label: 'Acceptance Text', type: 'textarea' },
    { key: 'authors_words_h', label: 'Word Limits Heading' }, { key: 'authors_words_p', label: 'Word Limits Text (HTML)' },
    { key: 'authors_plag_h', label: 'Plagiarism Heading' }, { key: 'authors_plag_p', label: 'Plagiarism Text (HTML)' },
    { key: 'authors_copy_h', label: 'Copyright Heading' },
    { key: 'authors_copy_p', label: 'Copyright Text (HTML)', type: 'textarea' },
    { key: 'authors_copy_p2', label: 'Copyright Text 2 (HTML)' }
  ]},
  { section: 'For Reviewers', keys: [
    { key: 'reviewers_h1', label: 'Title' },
    { key: 'reviewers_p1', label: 'Intro 1', type: 'textarea' },
    { key: 'reviewers_p2', label: 'Intro 2', type: 'textarea' },
    { key: 'reviewers_steps_h', label: 'Steps Heading' }, { key: 'reviewers_steps_p', label: 'Steps Text', type: 'textarea' },
    { key: 'reviewers_type_h', label: 'Peer Review Type Heading' }, { key: 'reviewers_type_p', label: 'Peer Review Type (HTML)' },
    { key: 'reviewers_formal_h', label: 'Formal Conditions Heading' }, { key: 'reviewers_formal_p', label: 'Formal Conditions (HTML)' }
  ]},
  { section: 'Indexing', keys: [
    { key: 'indexing_h1', label: 'Title' }, { key: 'indexing_p', label: 'Description' }
  ]},
  { section: 'Ethics & Policies', keys: [
    { key: 'ethics_h1', label: 'Title' }, { key: 'ethics_intro', label: 'Introduction', type: 'textarea' },
    { key: 'ethics_pub_h', label: 'Publication Ethics Heading' },
    { key: 'ethics_editors_h', label: 'Editors Duties Heading' },
    { key: 'ethics_reviewers_h', label: 'Reviewers Duties Heading' },
    { key: 'ethics_authors_h', label: 'Authors Duties Heading' },
    { key: 'ethics_publisher_h', label: 'Publisher Duties Heading' }
  ]},
  { section: 'APC Charges', keys: [
    { key: 'apc_h1', label: 'Title' }, { key: 'apc_label', label: 'APC Label' },
    { key: 'apc_note', label: 'APC Note' },
    { key: 'apc_p1', label: 'Paragraph 1 (HTML)', type: 'textarea' },
    { key: 'apc_p2', label: 'Paragraph 2 (HTML)', type: 'textarea' },
    { key: 'apc_p3', label: 'Paragraph 3 (HTML)', type: 'textarea' },
    { key: 'apc_p4', label: 'Paragraph 4 (HTML)', type: 'textarea' }
  ]},
  { section: 'Contact', keys: [
    { key: 'contact_h1', label: 'Title' }, { key: 'contact_intro', label: 'Intro' },
    { key: 'contact_dean', label: 'Dean Title' }, { key: 'contact_university', label: 'University Name' },
    { key: 'contact_address', label: 'Address (HTML)', type: 'textarea' },
    { key: 'contact_tel', label: 'Tel Label' }, { key: 'contact_fax', label: 'Fax Label' },
    { key: 'contact_email', label: 'Email Label' },
    { key: 'contact_address_label', label: 'Address line label (contact box)' }
  ]},
  { section: 'Footer', keys: [
    { key: 'footer_text', label: 'Footer Text' }
  ]},
  { section: 'Repository (Published)', keys: [
    { key: 'repo_volume_title', label: 'Volume title / link (use placeholder {volume})' },
    { key: 'repo_no_preprints', label: 'Empty state: no preprints' },
    { key: 'repo_no_volume_articles', label: 'Empty state: no articles in volume' },
    { key: 'repo_no_volumes', label: 'Empty state: no volumes' }
  ]},
  { section: 'UI Strings', keys: [
    { key: 'lang_en_label', label: 'Language button: English' },
    { key: 'lang_ar_label', label: 'Language button: Arabic' },
    { key: 'lang_ms_label', label: 'Language button: Malay' },
    { key: 'lang_zh_label', label: 'Language button: Chinese' },
    { key: 'loading_text', label: 'Loading message' },
    { key: 'no_content_msg', label: 'Empty page message' },
    { key: 'pagination_summary', label: 'Pagination: Page X of Y (use {current} and {total})' },
    { key: 'pagination_aria', label: 'Pagination nav (accessibility label)' },
    { key: 'dir', label: 'Text direction (ltr/rtl)' },
    { key: 'fontClass', label: 'Font CSS class' }
  ]},
  { section: 'Articles', keys: [
    { key: 'article_authors', label: 'Authors label' },
    { key: 'article_abstract', label: 'Abstract label' },
    { key: 'article_keywords', label: 'Keywords label' },
    { key: 'article_download_pdf', label: 'Download PDF button' },
    { key: 'article_related', label: 'Related Articles heading' },
    { key: 'article_back', label: 'Back to list button' },
    { key: 'article_preprints', label: 'Preprints page title' },
    { key: 'article_published', label: 'Published Articles page title' },
    { key: 'article_vol_abbr', label: 'Article metadata: Volume abbreviation (before number)' },
    { key: 'article_issue_label', label: 'Article metadata: Issue label' },
    { key: 'article_not_found', label: 'Article detail: not found message' }
  ]}
];

const ALL_TRANSLATION_KEYS = TRANSLATION_SECTIONS.flatMap((s) => s.keys.map((k) => k.key));

function hasSavedTranslation(persisted, lang, key) {
  const v = persisted[lang]?.[key];
  return v != null && String(v).trim() !== '';
}

/** Merge saved DB translations with CMS sources for any empty key (all languages). */
function buildDraftFromPersistedAndSources(persisted, sources, extraKeys = []) {
  const draft = {};
  const keys = Array.from(new Set([...ALL_TRANSLATION_KEYS, ...(extraKeys || [])]));
  for (const { code } of LANGUAGES) {
    draft[code] = { ...(persisted[code] || {}) };
    for (const key of keys) {
      const saved = draft[code][key];
      const hasSaved = saved != null && String(saved).trim() !== '';
      if (hasSaved) continue;
      const src = sources[key];
      if (src != null && String(src).trim() !== '') draft[code][key] = String(src);
    }
  }
  return draft;
}

export default function TranslationManager() {
  const [translations, setTranslations] = useState({});
  const [persisted, setPersisted] = useState({});
  const [cmsSources, setCmsSources] = useState({});
  const [activeSection, setActiveSection] = useState(TRANSLATION_SECTIONS[0].section);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reloadLive = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, sourcesRes] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/translation-sources')
      ]);

      const raw = settingsRes.data.data?.translations || {};
      const persistedCopy = JSON.parse(JSON.stringify(raw));
      const sources = sourcesRes.data.data?.sources || {};

      setPersisted(persistedCopy);
      setCmsSources(sources);
      const dynamicNavKeys = Object.keys(sources).filter((k) => k.startsWith('nav_'));
      setTranslations(buildDraftFromPersistedAndSources(persistedCopy, sources, dynamicNavKeys));
    } catch {
      toast.error('Failed to reload live keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadLive();
  }, []);

  const handleChange = useCallback((langCode, key, value) => {
    setTranslations(prev => ({
      ...prev,
      [langCode]: { ...(prev[langCode] || {}), [key]: value }
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { translations });

      // Reload live sources + persisted translations so the UI adapts if pages/nav were changed elsewhere.
      await reloadLive();

      toast.success('Translations saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  const cmsHasKey = (key) => cmsSources && cmsSources[key] != null && String(cmsSources[key]).trim() !== '';

  const navigationSection = TRANSLATION_SECTIONS.find((s) => s.section === 'Navigation');
  const standardNavKeys = (navigationSection?.keys || []).map((k) => k.key);
  const standardNavKeySet = new Set(standardNavKeys);

  const dynamicNavKeys = Object.keys(cmsSources || {}).filter((k) => k.startsWith('nav_') && cmsHasKey(k));

  const navKeysSorted = [
    ...standardNavKeys.filter((k) => dynamicNavKeys.includes(k)),
    ...dynamicNavKeys.filter((k) => !standardNavKeySet.has(k)).sort((a, b) => a.localeCompare(b))
  ];

  // These are the "page-title" keys that exist only when the CMS page is published.
  // If a page is not published, we hide its translation section entirely.
  const PAGE_SECTION_TITLE_KEY = {
    'Home Page': 'home_h1',
    'Aims & Scope': 'aims_h1',
    'Editorial Board': 'editorial_h1',
    'For Authors': 'authors_h1',
    'For Reviewers': 'reviewers_h1',
    'Indexing': 'indexing_h1',
    'Ethics & Policies': 'ethics_h1',
    'APC Charges': 'apc_h1',
    'Contact': 'contact_h1'
  };

  const visibleSections = TRANSLATION_SECTIONS.filter((s) => {
    if (s.section === 'Navigation') {
      return navKeysSorted.length > 0;
    }
    if (s.section === 'Top Bar') {
      return s.keys.some((k) => k.key.startsWith('topbar_') && cmsHasKey(k.key));
    }
    const pageTitleKey = PAGE_SECTION_TITLE_KEY[s.section];
    if (pageTitleKey) return cmsHasKey(pageTitleKey);
    return true; // UI-centric sections remain editable even if CMS pages aren't published
  });

  const resolvedActiveSection =
    visibleSections.some((s) => s.section === activeSection)
      ? activeSection
      : (visibleSections[0]?.section || TRANSLATION_SECTIONS[0].section);

  const currentSection = visibleSections.find(s => s.section === resolvedActiveSection) || visibleSections[0];

  const keysToRender = (currentSection?.keys || []).filter(({ key }) => {
    if (currentSection.section === 'Navigation') return key.startsWith('nav_') && cmsHasKey(key);
    if (currentSection.section === 'Top Bar') return key.startsWith('topbar_') && cmsHasKey(key);
    if (currentSection.section === 'Sidebar') {
      if (key === 'sb_published' || key === 'sb_preprint') return cmsHasKey(key);
      return true;
    }
    return true;
  });

  const navItems = currentSection?.section === 'Navigation'
    ? navKeysSorted.map((key) => {
      const standard = (navigationSection?.keys || []).find((k) => k.key === key);
      const slug = key.replace(/^nav_/, '');
      const label =
        standard?.label ||
        slug
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (m) => m.toUpperCase());
      return { key, label, type: standard?.type };
    })
    : [];

  return (
    <div>
      <div className="page-header">
        <h1>🌐 Translation Manager</h1>
        
      </div>

      {/* Section Picker (no tabs, keeps UI simple) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>Section</label>
        <select
          className="form-select"
          value={resolvedActiveSection}
          onChange={(e) => setActiveSection(e.target.value)}
          style={{ maxWidth: 420 }}
        >
          {visibleSections.map((s) => (
            <option key={s.section} value={s.section}>
              {s.section}
            </option>
          ))}
        </select>
      </div>

      {/* Translation Fields */}
      <div className="card">
        <div className="card-header">
          <h2>{resolvedActiveSection}</h2>
        </div>
        <div className="card-body">
          {(currentSection?.section === 'Navigation' ? navItems : keysToRender).map(({ key, label, type }) => (
            <div
              key={key}
              style={{
                marginBottom: 14,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                background: '#fff'
              }}
            >
              <div>
                <div style={{ fontWeight: 650, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  {label}
                </div>
                <code style={{ fontSize: 11, color: '#9ca3af' }}>{key}</code>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                  marginTop: 10
                }}
              >
                {LANGUAGES.map((lang) => {
                  const val = translations[lang.code]?.[key] || '';
                  const isAr = lang.code === 'ar';
                  const commonStyle = {
                    width: '100%',
                    padding: 10,
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: isAr ? '"Segoe UI",Arial,Tahoma,serif' : 'inherit',
                    direction: isAr ? 'rtl' : 'ltr',
                    boxSizing: 'border-box'
                  };
                  return (
                    <div key={lang.code}>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>
                        {lang.flag} {lang.code.toUpperCase()}
                      </div>
                      {type === 'textarea' ? (
                        <textarea
                          value={val}
                          onChange={(e) => handleChange(lang.code, key, e.target.value)}
                          rows={3}
                          style={commonStyle}
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleChange(lang.code, key, e.target.value)}
                          style={commonStyle}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 32px', fontSize: 15 }}>
          {saving ? 'Saving...' : '💾 Save All Translations'}
        </button>
      </div>
    </div>
  );
}
