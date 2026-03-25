import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './components/pages/LoginPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import Dashboard from './components/pages/dashboard/Dashboard';
import PagesList from './components/pages/pages/PagesList';
import PageEditor from './components/pages/pages/PageEditor';
import ArticlesList from './components/pages/articles/ArticlesList';
import ArticleEditor from './components/pages/articles/ArticleEditor';
import MediaLibrary from './components/pages/media/MediaLibrary';
import NavigationManager from './components/pages/navigation/NavigationManager';
import FooterManager from './components/pages/footer/FooterManager';
import SEOManager from './components/pages/seo/SEOManager';
import SettingsPage from './components/pages/settings/SettingsPage';
import BackupManager from './components/pages/backup/BackupManager';
import RedirectManager from './components/pages/redirects/RedirectManager';
import ProfilePage from './components/pages/profile/ProfilePage';
import TranslationManager from './components/pages/translations/TranslationManager';
import CategoriesManager from './components/pages/categories/CategoriesManager';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pages" element={<PagesList />} />
        <Route path="pages/new" element={<PageEditor />} />
        <Route path="pages/:id" element={<PageEditor />} />
        <Route path="articles" element={<ArticlesList />} />
        <Route path="articles/new" element={<ArticleEditor />} />
        <Route path="articles/:id" element={<ArticleEditor />} />
        <Route path="categories" element={<CategoriesManager />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="navigation" element={<NavigationManager />} />
        <Route path="footer" element={<FooterManager />} />
        <Route path="seo" element={<SEOManager />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="redirects" element={<RedirectManager />} />
        <Route path="backups" element={<BackupManager />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="translations" element={<TranslationManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#1e1e2e', color: '#cdd6f4', fontSize: '14px' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
