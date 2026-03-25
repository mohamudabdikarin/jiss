const { env } = require('../config/env');

/**
 * Options for the httpOnly refresh-token cookie.
 *
 * Admin SPA on a different origin than the API (e.g. Vercel + Railway) requires
 * SameSite=None and Secure so the browser sends the cookie on credentialed XHR/fetch.
 * Set REFRESH_COOKIE_CROSS_SITE=true on the API in that setup.
 */
function getRefreshTokenCookieOptions() {
  if (env.refreshCookieCrossSite) {
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
    secure: env.isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

/** Match set options so clearCookie works in the browser. */
function getClearRefreshCookieOptions() {
  if (env.refreshCookieCrossSite) {
    return { path: '/', sameSite: 'none', secure: true };
  }
  return { path: '/', sameSite: 'strict', secure: env.isProd };
}

module.exports = { getRefreshTokenCookieOptions, getClearRefreshCookieOptions };
