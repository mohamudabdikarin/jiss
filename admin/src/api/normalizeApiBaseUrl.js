/**
 * Vite-only env must be an absolute URL in production. Values like `api.example.com`
 * (no scheme) resolve as relative paths in the browser and break requests.
 * @param {string|undefined} raw - import.meta.env.VITE_API_URL
 * @param {string} defaultPath - e.g. '/api/v1' (admin) or '/api/v1/public' (client)
 */
export function normalizeApiBaseUrl(raw, defaultPath) {
  if (raw == null || String(raw).trim() === '') return defaultPath;

  let s = String(raw).trim();

  // Dev: use Vite proxy
  if (s.startsWith('/')) return s.replace(/\/+$/, '') || defaultPath;

  s = s.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s.replace(/^\/+/, '')}`;
  }

  try {
    const u = new URL(s);
    const p = (u.pathname || '').replace(/\/+$/, '');
    if (!p || p === '/') {
      u.pathname = defaultPath;
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return defaultPath;
  }
}
