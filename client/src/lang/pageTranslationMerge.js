/**
 * Maps CMS page slugs to Translation Manager keys (Site Settings → translations).
 * When the admin fills these for the active language, they override the first
 * main text/richtext section on that page (CMS body/title used as fallback).
 */

export const PAGE_TRANSLATION_SPECS = {
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

export function normalizePageSlugForTranslations(currentPage) {
  if (!currentPage || currentPage === '' || currentPage === 'home') return 'home';
  return currentPage;
}

/**
 * @param {string} slug
 * @param {string|null|undefined} sectionTitle
 * @param {string} bodyHtml from CMS
 * @param {Record<string, string>} t merged translations for active language
 * @returns {{ title: string|null, html: string }}
 */
export function mergeSectionTranslationHtml(slug, sectionTitle, bodyHtml, t) {
  if (!t || typeof t !== 'object') return { title: sectionTitle ?? null, html: bodyHtml || '' };
  const spec = PAGE_TRANSLATION_SPECS[slug];
  if (!spec) return { title: sectionTitle ?? null, html: bodyHtml || '' };

  const tTitle = spec.titleKey && t[spec.titleKey] != null ? String(t[spec.titleKey]).trim() : '';
  const tParts = (spec.bodyKeys || [])
    .map((k) => t[k])
    .filter((s) => s != null && String(s).trim() !== '');
  const tHtml = tParts.length ? tParts.join('') : '';

  return {
    title: tTitle || sectionTitle || null,
    html: tHtml || bodyHtml || ''
  };
}

export function hasTranslationSpec(slug) {
  return Boolean(PAGE_TRANSLATION_SPECS[slug]);
}
