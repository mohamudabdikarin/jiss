const { env } = require('../config/env');

/**
 * Cross-origin admin (e.g. Vercel) → API (e.g. Railway) requires SameSite=None; Secure
 * or the refresh cookie is never sent on XHR. In production we default to that unless
 * REFRESH_COOKIE_STRICT=true (same-site-only legacy setups).
 */
function useCrossSiteRefreshCookie() {
  if (process.env.REFRESH_COOKIE_STRICT === 'true') return false;
  if (env.refreshCookieCrossSite) return true;
  return env.isProd;
}

function getRefreshTokenCookieOptions() {
  if (useCrossSiteRefreshCookie()) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    };
  }
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

function getClearRefreshCookieOptions() {
  if (useCrossSiteRefreshCookie()) {
    return { path: '/', sameSite: 'none', secure: true };
  }
  return { path: '/', sameSite: 'lax', secure: false };
}

module.exports = { getRefreshTokenCookieOptions, getClearRefreshCookieOptions };
