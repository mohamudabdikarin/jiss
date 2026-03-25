import { useEffect } from 'react';

/**
 * Injects SEO meta into document head.
 * Uses document.title and meta elements (no extra deps).
 * @param {{ title?: string, description?: string, keywords?: string[], ogImage?: string, canonicalUrl?: string, noIndex?: boolean }} seo
 * @param {{ siteDescription?: string, defaultSEO?: { metaTitle?: string, metaDescription?: string, metaKeywords?: string[], ogImage?: string } }} siteSettings
 */
export default function SEOHead({ seo, siteSettings, pageTitle, article }) {
  const title = seo?.metaTitle || pageTitle || siteSettings?.defaultSEO?.metaTitle || siteSettings?.siteName || 'IJCDS';
  const description =
    seo?.metaDescription ||
    siteSettings?.siteDescription ||
    siteSettings?.defaultSEO?.metaDescription ||
    '';
  const keywords = seo?.metaKeywords || siteSettings?.defaultSEO?.metaKeywords || [];
  const ogImage = seo?.ogImage || siteSettings?.defaultSEO?.ogImage || siteSettings?.siteLogo || '';
  const canonicalUrl = seo?.canonicalUrl || '';
  const noIndex = seo?.noIndex === true;

  useEffect(() => {
    document.title = title;

    const setMeta = (name, content, attr = 'name') => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setMetaProperty = (prop, content) => setMeta(prop, content, 'property');

    setMeta('description', description);
    setMeta('keywords', Array.isArray(keywords) ? keywords.join(', ') : (keywords || ''));
    setMetaProperty('og:title', title);
    setMetaProperty('og:description', description);
    setMetaProperty('og:image', ogImage);
    setMetaProperty('og:type', article ? 'article' : 'website');

    if (noIndex) setMeta('robots', 'noindex, nofollow');

    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }
  }, [title, description, keywords, ogImage, canonicalUrl, noIndex, article]);

  return null;
}
