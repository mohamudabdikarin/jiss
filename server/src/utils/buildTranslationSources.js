/**
 * Flat map of translation keys → strings derived from live CMS (pages, settings, nav).
 * Used to prefill Translation Manager when the translations DB has no value yet.
 */

const Page = require('../models/Page');
const SiteSettings = require('../models/SiteSettings');
const Footer = require('../models/Footer');
const Navigation = require('../models/Navigation');

/** Mirrors client PAGE_TRANSLATION_SPECS (slug → keys). */
const PAGE_TRANSLATION_SPECS = {
  home: {
    titleKey: 'home_h1',
    bodyKeys: ['home_intro', 'home_p1', 'home_p2']
  },
  aims: {
    titleKey: 'aims_h1',
    bodyKeys: ['aims_p', 'aims_scope_h', 'aims_closing']
  },
  editorial: {
    titleKey: 'editorial_h1',
    bodyKeys: ['editorial_eic', 'editorial_me', 'editorial_advisory', 'editorial_board']
  },
  authors: {
    titleKey: 'authors_h1',
    bodyKeys: [
      'authors_speed_h', 'authors_speed1', 'authors_speed2', 'authors_speed3',
      'authors_prep_h', 'authors_prep_p', 'authors_template_h', 'authors_template_p',
      'authors_submit_h', 'authors_submit_p', 'authors_accept_h', 'authors_accept_p',
      'authors_words_h', 'authors_words_p', 'authors_plag_h', 'authors_plag_p',
      'authors_copy_h', 'authors_copy_p', 'authors_copy_p2'
    ]
  },
  reviewers: {
    titleKey: 'reviewers_h1',
    bodyKeys: [
      'reviewers_p1', 'reviewers_p2', 'reviewers_steps_h', 'reviewers_steps_p',
      'reviewers_type_h', 'reviewers_type_p', 'reviewers_formal_h', 'reviewers_formal_p'
    ]
  },
  indexing: {
    titleKey: 'indexing_h1',
    bodyKeys: ['indexing_p']
  },
  ethics: {
    titleKey: 'ethics_h1',
    bodyKeys: [
      'ethics_intro', 'ethics_pub_h', 'ethics_editors_h', 'ethics_reviewers_h',
      'ethics_authors_h', 'ethics_publisher_h'
    ]
  },
  apc: {
    titleKey: 'apc_h1',
    bodyKeys: ['apc_label', 'apc_note', 'apc_p1', 'apc_p2', 'apc_p3', 'apc_p4']
  },
  contact: {
    titleKey: 'contact_h1',
    bodyKeys: ['contact_intro', 'contact_dean', 'contact_university', 'contact_address']
  }
};

function stripTags(html) {
  if (html == null) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sectionBody(content) {
  if (!content || typeof content !== 'object') return '';
  return content.html || content.body || content.text || '';
}

function sectionHeading(content) {
  if (!content || typeof content !== 'object') return '';
  return String(content.heading || content.title || '').trim();
}

function extractH1InnerHtml(html) {
  const m = String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].trim() : '';
}

function extractH1Text(html) {
  const inner = extractH1InnerHtml(html);
  return inner ? stripTags(inner) : '';
}

function stripFirstH1(html) {
  return String(html).replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '').trim();
}

function slugFromNavUrl(url) {
  if (!url) return null;
  const u = String(url).trim();
  if (u === '/' || u === '' || u === '#/home' || u === '#home') return 'home';
  const m = u.match(/#?\/?([a-z0-9-]+)\/?$/i);
  if (m) {
    const s = m[1].toLowerCase();
    if (s === 'home') return 'home';
    return s;
  }
  return null;
}

const HEADER_NAV_KEY = {
  home: 'nav_home',
  aims: 'nav_aims',
  editorial: 'nav_editorial',
  authors: 'nav_authors',
  reviewers: 'nav_reviewers',
  indexing: 'nav_indexing',
  ethics: 'nav_ethics',
  apc: 'nav_apc',
  contact: 'nav_contact',
  preprints: 'nav_preprints',
  published: 'nav_published',
  search: 'nav_search'
};

function applyNavigationSources(
  sources,
  items,
  {
    includeHeaderNavKeys = true,
    includeSidebarKeys = true,
    includeTopbarKeys = false
  } = {}
) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item.isVisible === false) continue;
    const slug = slugFromNavUrl(item.url);
    if (!slug) continue;
    const navKey = HEADER_NAV_KEY[slug];
    // Dynamic header nav key: allows translating custom nav items (e.g. slug "test" => nav_test)
    if (includeHeaderNavKeys && item.label) {
      sources[`nav_${slug}`] = item.label;
    }

    if (includeHeaderNavKeys && navKey && item.label) sources[navKey] = item.label;
    if (includeSidebarKeys && slug === 'published' && item.label) {
      sources.sb_published = item.label;
    }
    if (includeSidebarKeys && slug === 'preprints' && item.label) {
      sources.sb_preprint = item.label;
    }
    if (includeTopbarKeys && slug === 'published' && item.label) {
      sources.topbar_published = item.label;
    }
    if (includeTopbarKeys && slug === 'preprints' && item.label) {
      sources.topbar_preprint = item.label;
    }
  }
}

function extractStatsForHome(section, out) {
  const c = section.content || {};
  const items = c.items || c.stats || [];
  if (!items.length) return;
  const s0 = items[0] || {};
  const s1 = items[1] || {};
  const s2 = items[2] || {};
  const s3 = items[3] || {};
  if (s0.label != null && String(s0.label).trim()) out.stat_founded = String(s0.label).trim();
  if (s1.label != null && String(s1.label).trim()) out.stat_citescore = String(s1.label).trim();
  if (s2.value != null && String(s2.value).trim()) out.stat_access = String(s2.value).trim();
  if (s2.label != null && String(s2.label).trim()) out.stat_access_sub = String(s2.label).trim();
  if (s3.value != null && String(s3.value).trim()) out.stat_scopus = String(s3.value).trim();
  if (s3.label != null && String(s3.label).trim()) out.stat_scopus_sub = String(s3.label).trim();
}

function extractTeamEditorial(section, out, spec) {
  const c = section.content || {};
  const heading = sectionHeading(c);
  if (heading && spec.titleKey) out[spec.titleKey] = heading;

  let members = [];
  if (Array.isArray(c.members) && c.members.length) members = c.members;
  else if (Array.isArray(c.groups)) {
    for (const g of c.groups) {
      (g.members || []).forEach((m) => {
        members.push({ ...m, _group: g.title || '' });
      });
    }
  }

  const formatMember = (m) => {
    const name = m.name || '';
    const line = [name, m.bio || m.affiliation || ''].filter(Boolean).join(', ');
    return line;
  };

  const eic = members.find((m) => /editor-in-chief|chief editor/i.test(m.role || ''));
  const me = members.find((m) => /managing editor/i.test(m.role || ''));
  const rest = members.filter((m) => m !== eic && m !== me);

  const keys = spec.bodyKeys || [];
  if (eic && keys[0]) out[keys[0]] = formatMember(eic);
  if (me && keys[1]) out[keys[1]] = formatMember(me);
  if (keys[2]) {
    const advisory = rest.filter((m) => /advisory/i.test(m._group || m.role || ''));
    const lines = (advisory.length ? advisory : []).map(formatMember).join('\n');
    if (lines) out[keys[2]] = lines;
  }
  if (keys[3] && rest.length) {
    out[keys[3]] = rest.map(formatMember).join('\n');
  }
}

function extractContactSection(section, out, spec) {
  const c = section.content || {};
  const h = sectionHeading(c);
  if (h && spec.titleKey) out[spec.titleKey] = h;
  const keys = spec.bodyKeys || [];
  if (c.description && keys[0]) out[keys[0]] = String(c.description).trim();
  if (c.name && keys[1]) out[keys[1]] = String(c.name).trim();
  if (c.role && keys[2]) out[keys[2]] = String(c.role).trim();
  if (c.address && keys[3]) out[keys[3]] = `<p>${String(c.address).trim()}</p>`;
}

function mergeContactFromSettings(sources, settings) {
  if (!settings) return;
  const addr = settings.contactAddress;
  if (addr && String(addr).trim() && (!sources.contact_address || !String(sources.contact_address).trim())) {
    sources.contact_address = `<p>${String(addr).trim()}</p>`;
  }
}

/**
 * Split HTML by top-level h2 blocks; returns [introBeforeFirstH2, ...h2SectionsHtml].
 */
function splitByH2(html) {
  const s = String(html).trim();
  if (!s) return [''];
  const parts = s.split(/(?=<h2\b[^>]*>)/i);
  return parts.map((p) => p.trim()).filter((p) => p.length);
}

function extractRichtextPage(sections, spec) {
  const out = {};
  const rich = (sections || []).filter((s) => s.type === 'text' || s.type === 'richtext');
  if (!rich.length) return out;

  const keys = spec.bodyKeys || [];
  const first = rich[0];
  const c0 = first.content || {};
  const html0 = sectionBody(c0);
  const head0 = sectionHeading(c0);

  const h1Text = extractH1Text(html0);
  const title = h1Text || head0;
  if (spec.titleKey && title) out[spec.titleKey] = title;

  const afterH1 = stripFirstH1(html0) || html0;
  const h2Parts = splitByH2(afterH1);

  if (keys.length === 0) return out;

  if (h2Parts.length <= 1) {
    out[keys[0]] = afterH1;
    for (let i = 1; i < rich.length && i < keys.length; i++) {
      const body = sectionBody(rich[i].content || {});
      if (body) out[keys[i]] = body;
    }
    return out;
  }

  // intro before first h2
  const intro = h2Parts[0] || '';
  if (keys[0]) out[keys[0]] = intro;

  // Pair h2 sections with remaining keys: heading-only keys alternate with body keys for ethics-like pages
  let ki = 1;
  for (let pi = 1; pi < h2Parts.length && ki < keys.length; pi++) {
    const block = h2Parts[pi];
    const h2m = block.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (h2m) {
      const h2Text = stripTags(h2m[1]).trim();
      const afterH2 = block.slice(h2m[0].length).trim();
      if (keys[ki]) out[keys[ki]] = h2Text;
      ki++;
      if (afterH2 && keys[ki]) {
        out[keys[ki]] = afterH2;
        ki++;
      }
    } else if (keys[ki]) {
      out[keys[ki]] = block;
      ki++;
    }
  }

  // Remaining richtext sections → next free keys
  let ri = 1;
  while (ri < rich.length && ki < keys.length) {
    const b = sectionBody(rich[ri].content || {});
    if (b) out[keys[ki]] = b;
    ki++;
    ri++;
  }

  return out;
}

function extractPageSources(slug, page) {
  const spec = PAGE_TRANSLATION_SPECS[slug];
  if (!spec || !page) return {};
  const sections = (page.sections || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const out = {};

  if (slug === 'home') {
    const rich = sections.filter((s) => s.type === 'text' || s.type === 'richtext');
    if (rich[0]) {
      const c = rich[0].content || {};
      if (spec.titleKey) out[spec.titleKey] = sectionHeading(c) || extractH1Text(sectionBody(c));
      if (spec.bodyKeys[0]) out[spec.bodyKeys[0]] = sectionBody(c);
    }
    if (rich[1] && spec.bodyKeys[1]) out[spec.bodyKeys[1]] = sectionBody(rich[1].content || {});
    if (rich[2] && spec.bodyKeys[2]) out[spec.bodyKeys[2]] = sectionBody(rich[2].content || {});
    const statsSec = sections.find((s) => s.type === 'stats');
    if (statsSec) extractStatsForHome(statsSec, out);
    return out;
  }

  if (slug === 'editorial') {
    const team = sections.find((s) => s.type === 'team');
    if (team) {
      extractTeamEditorial(team, out, spec);
      return out;
    }
    return extractRichtextPage(sections, spec);
  }

  if (slug === 'contact') {
    const contactSec = sections.find((s) => s.type === 'contact');
    if (contactSec) {
      extractContactSection(contactSec, out, spec);
      return out;
    }
  }

  return extractRichtextPage(sections, spec);
}

async function buildTranslationSources() {
  const sources = {};

  const slugs = Object.keys(PAGE_TRANSLATION_SPECS);
  const pages = await Page.find({ slug: { $in: slugs }, status: 'published' })
    .populate({ path: 'sections', options: { sort: { order: 1 } } })
    .lean();

  for (const slug of slugs) {
    const page = pages.find((p) => p.slug === slug);
    if (!page) continue;
    Object.assign(sources, extractPageSources(slug, page));
  }

  const settings = await SiteSettings.findOne().lean();
  if (settings) {
    if (settings.siteName) sources.journal_title = settings.siteName;
    const jm = settings.journalMeta || {};
    if (jm.issn) sources.journal_issn = jm.issn;
    if (jm.frequency) sources.hero_freq_val = jm.frequency;
    mergeContactFromSettings(sources, settings);
  }

  const footer = await Footer.findOne().lean();
  if (footer?.content) sources.footer_text = footer.content;

  const headerNav = await Navigation.findOne({ location: 'header', isActive: true }).lean();
  if (headerNav?.items) {
    applyNavigationSources(sources, headerNav.items, {
      includeHeaderNavKeys: true,
      includeSidebarKeys: false,
      includeTopbarKeys: true
    });
  }

  const sidebarNav = await Navigation.findOne({ location: 'sidebar', isActive: true }).lean();
  if (sidebarNav?.items) {
    // Important: sidebar should never overwrite header nav / topbar translation source labels.
    applyNavigationSources(sources, sidebarNav.items, {
      includeHeaderNavKeys: false,
      includeSidebarKeys: true,
      includeTopbarKeys: false
    });
  }

  return sources;
}

module.exports = { buildTranslationSources, PAGE_TRANSLATION_SPECS };
