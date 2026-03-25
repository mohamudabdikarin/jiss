/**
 * GA4 measurement ID (same as gtag in index.html).
 *
 * Country / region: GA4 infers this from each visitor’s IP when processing hits — no extra
 * gtag fields are required. In Analytics: Reports → User → User attributes → Country, or
 * explore templates that include “Country”. Accuracy is typical for analytics (VPNs skew it).
 * If the property is in the EU, review consent / GDPR settings in GA4 Admin.
 */
export const GA_MEASUREMENT_ID = 'G-EBBMD2GVNQ';

/**
 * Virtual path for SPA reporting (not necessarily equal to location.pathname because routing is hash + state).
 */
export function buildAnalyticsPagePath(currentPage, articleSlug, searchQuery) {
  if (currentPage === 'article' && articleSlug) {
    return `/article/${encodeURIComponent(articleSlug)}`;
  }
  if (currentPage === 'search' && searchQuery?.trim()) {
    return `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  }
  if (!currentPage || currentPage === 'home') return '/';
  return `/${currentPage}`;
}

/**
 * Send a page_view via gtag (SPA navigations after initial HTML load).
 */
export function trackGtagPageView(pagePath, pageTitle) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    ...(pageTitle ? { page_title: pageTitle } : {})
  });
}
