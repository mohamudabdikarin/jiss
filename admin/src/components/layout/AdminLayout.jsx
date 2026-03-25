import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiFileText, FiBook, FiImage, FiMenu, FiGrid, FiSearch, FiSettings, FiDatabase, FiUser, FiLogOut, FiChevronDown, FiStar, FiShield, FiCornerDownRight, FiChevronLeft, FiChevronRight, FiBarChart2 } from 'react-icons/fi';
import { useState, useEffect, useMemo } from 'react';
import GlobalSearch from './GlobalSearch';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

/** Greeting clock: Asia/Bangkok (unchanged year-round). */
const ADMIN_GREETING_TIMEZONE = 'Asia/Bangkok';

function hourInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    hour12: false
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour');
  return h ? parseInt(h.value, 10) : 0;
}

function greetingPhraseForHour(h) {
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function buildAdminGreetingParts(displayName, date) {
  const hour = hourInTimeZone(date, ADMIN_GREETING_TIMEZONE);
  const phrase = greetingPhraseForHour(hour);
  const firstName = (displayName || '').trim().split(/\s+/)[0] || 'there';
  return { phrase, firstName };
}

/** Opens GA4; set VITE_GA_DASHBOARD_URL in admin `.env` to your property home or a saved report URL. */
const GA_DASHBOARD_URL = import.meta.env.VITE_GA_DASHBOARD_URL || 'https://analytics.google.com/';

const navItems = [
  { label: 'MAIN', type: 'section' },
  { path: '/', icon: <FiHome />, label: 'Dashboard', end: true },
  { path: '/pages', icon: <FiFileText />, label: 'Pages' },
  { path: '/articles', icon: <FiBook />, label: 'Articles' },
  { path: '/media', icon: <FiImage />, label: 'Media Library' },
  { label: 'STRUCTURE', type: 'section' },
  { path: '/navigation', icon: <FiMenu />, label: 'Navigation' },
  { path: '/footer', icon: <FiGrid />, label: 'Footer' },
  { label: 'CONTENT', type: 'section' },
  { path: '/translations', icon: <FiStar />, label: 'Translations' },
  { label: 'OPTIMIZATION', type: 'section' },
  { path: '/seo', icon: <FiSearch />, label: 'SEO' },
  {
    external: true,
    href: GA_DASHBOARD_URL,
    icon: <FiBarChart2 />,
    label: 'Google Analytics'
  },
  { label: 'SYSTEM', type: 'section' },
  { path: '/redirects', icon: <FiCornerDownRight />, label: 'Redirects' },
  { path: '/settings', icon: <FiSettings />, label: 'Settings' },
  { path: '/backups', icon: <FiDatabase />, label: 'Backups' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [greetingTick, setGreetingTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setGreetingTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const adminGreetingParts = useMemo(
    () => buildAdminGreetingParts(user?.name, new Date(greetingTick)),
    [user?.name, greetingTick]
  );

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  const toggleSidebarCollapse = () => setSidebarCollapsed(prev => !prev);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const item = navItems.find(n => n.path && path.startsWith(n.path) && n.path !== '/');
    return item?.label || 'Page';
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">IJ</div>
            <div className="sidebar-logo-text-wrap">
              <div className="sidebar-logo-text">JISS Admin</div>
              <span className="sidebar-logo-sub">Content Management</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleSidebarCollapse}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.type === 'section') {
              return <div key={i} className="sidebar-section-label">{item.label}</div>;
            }
            if (item.external) {
              return (
                <a
                  key={`ext-${item.label}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-link"
                  title="Visitor stats on the public site (opens in a new tab)"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="sidebar-link-label">{item.label}</span>
                </a>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
              <div className="sidebar-user-role">{user?.role || 'admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-btn mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu />
            </button>
            <div className="topbar-left-text">
              <p className="topbar-greeting">
                <span className="topbar-greeting-phrase">{adminGreetingParts.phrase},</span>{' '}
                <span className="topbar-greeting-name">{adminGreetingParts.firstName}</span>
              </p>
              <div className="topbar-breadcrumb">
                {location.pathname === '/' ? (
                  'Admin'
                ) : (
                  <>
                    Admin / <span>{getPageTitle()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <GlobalSearch />
            <NavLink to="/profile" className="topbar-btn"><FiUser /> Profile</NavLink>
            <button className="topbar-btn" onClick={logout}><FiLogOut /> Logout</button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
