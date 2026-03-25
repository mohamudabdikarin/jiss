/**
 * GA4: measurement ID comes from CMS (Site settings → Analytics) or VITE_GA_MEASUREMENT_ID.
 * Admin “Google Analytics” sidebar link only opens the GA dashboard — it does not install tags.
 */

const ID_PATTERN = /^G-[A-Z0-9]+$/i;

/**
 * Load gtag.js and configure measurement ID (idempotent).
 * @returns {boolean} true if an ID was applied
 */
export function initGtag(measurementId) {
  const id = (measurementId || '').trim();
  if (!id || !ID_PATTERN.test(id)) return false;
  if (window.__GA4_MEASUREMENT_ID === id) return true;
  window.__GA4_MEASUREMENT_ID = id;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  const marker = `script[data-ga4-id="${id}"]`;
  if (!document.querySelector(marker)) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    s.setAttribute('data-ga4-id', id);
    document.head.appendChild(s);
  }

  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });
  return true;
}

export function getGaMeasurementId() {
  return typeof window !== 'undefined' ? window.__GA4_MEASUREMENT_ID : undefined;
}

/**
 * Virtual path for SPA reporting (hash router + state).
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
 * Send page_view via gtag (SPA navigations).
 */
export function trackGtagPageView(pagePath, pageTitle) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const mid = getGaMeasurementId();
  if (!mid) return;
  window.gtag('config', mid, {
    page_path: pagePath,
    ...(pageTitle ? { page_title: pageTitle } : {})
  });
}
