/** Session-scoped refresh token for admin when cross-site httpOnly cookies are unreliable. */
export const ADMIN_REFRESH_KEY = 'ijcds_admin_refresh_token';

export function getStoredRefreshToken() {
  try {
    return sessionStorage.getItem(ADMIN_REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token) {
  try {
    if (token) sessionStorage.setItem(ADMIN_REFRESH_KEY, token);
    else sessionStorage.removeItem(ADMIN_REFRESH_KEY);
  } catch {
    /* private mode / quota */
  }
}
