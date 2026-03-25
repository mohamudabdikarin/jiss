import { useState, useEffect, useRef } from 'react';
import { settingsAPI } from '../../../api';
import { FiSave, FiUpload, FiTrash2, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    settingsAPI
      .get()
      .then(({ data }) => {
        const s = data.data;
        if (s && !String(s.siteDescription || '').trim() && s.defaultSEO?.metaDescription) {
          setSettings({ ...s, siteDescription: s.defaultSEO.metaDescription });
        } else {
          setSettings(s);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Could not load settings');
        setSettings({});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings?.siteName?.trim()) {
      toast.error('Site name is required');
      return;
    }
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await settingsAPI.uploadLogo(formData);
      setSettings(data.data);
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;
    setUploading(true);
    try {
      const { data } = await settingsAPI.removeLogo();
      setSettings(data.data);
      toast.success('Logo removed');
    } catch (err) {
      toast.error('Failed to remove logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Settings</h1>
          <p className="page-subtitle">Configure global site settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ===== Branding Card ===== */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Branding</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            {/* Logo preview */}
            <div style={{
              width: 160, height: 160, borderRadius: 12,
              border: '2px dashed var(--border-color, #333)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', background: 'var(--bg-tertiary, #1a1a2e)',
              flexShrink: 0
            }}>
              {settings?.siteLogo ? (
                <img src={settings.siteLogo} alt="Site Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted, #666)' }}>
                  <FiImage size={32} />
                  <p style={{ fontSize: 12, marginTop: 8 }}>No logo uploaded</p>
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #999)', marginBottom: 12 }}>
                Upload your website logo. Recommended size: 200×200px or larger. Supported formats: PNG, JPG, SVG, WebP.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                id="logo-upload-input"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FiUpload /> {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                {settings?.siteLogo && (
                  <button
                    className="btn btn-danger"
                    onClick={handleLogoRemove}
                    disabled={uploading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <FiTrash2 /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>General</h3>
          <div className="form-group"><label className="form-label">Site Name</label><input className="form-input" value={settings?.siteName || ''} onChange={e => setSettings({ ...settings, siteName: e.target.value })} /></div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <p style={{ fontSize: 12, color: 'var(--text-muted, #666)', margin: '0 0 8px' }}>Short summary of the site. Used for search engines and social previews (single field).</p>
            <textarea className="form-textarea" value={settings?.siteDescription || ''} onChange={e => setSettings({ ...settings, siteDescription: e.target.value })} rows={4} />
          </div>
          <div className="form-group"><label className="form-label">Site URL</label><input className="form-input" value={settings?.siteUrl || ''} onChange={e => setSettings({ ...settings, siteUrl: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Articles Per Page</label><input className="form-input" type="number" value={settings?.articlesPerPage || 10} onChange={e => setSettings({ ...settings, articlesPerPage: parseInt(e.target.value) })} /></div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Contact (appears on Contact page)</h3>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={settings?.contactEmail || ''} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={settings?.contactPhone || ''} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" value={settings?.contactAddress || ''} onChange={e => setSettings({ ...settings, contactAddress: e.target.value })} rows={3} /></div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Journal Metadata (nav bar)</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginBottom: 12 }}>
            Shown in the bar below the main navigation on the client site.
          </p>
          <div className="form-group"><label className="form-label">ISSN</label><input className="form-input" value={settings?.journalMeta?.issn || ''} onChange={e => setSettings({ ...settings, journalMeta: { ...(settings?.journalMeta || {}), issn: e.target.value } })} placeholder="2535-9886 (Print) / 2210-142X (Online)" /></div>
          <div className="form-group"><label className="form-label">CiteScore</label><input className="form-input" value={settings?.journalMeta?.citeScore || ''} onChange={e => setSettings({ ...settings, journalMeta: { ...(settings?.journalMeta || {}), citeScore: e.target.value } })} placeholder="1.7" /></div>
          <div className="form-group"><label className="form-label">DOI</label><input className="form-input" value={settings?.journalMeta?.doi || ''} onChange={e => setSettings({ ...settings, journalMeta: { ...(settings?.journalMeta || {}), doi: e.target.value } })} placeholder="dx.doi.org/10.12785/ijcds" /></div>
          <div className="form-group"><label className="form-label">Frequency</label><input className="form-input" value={settings?.journalMeta?.frequency || ''} onChange={e => setSettings({ ...settings, journalMeta: { ...(settings?.journalMeta || {}), frequency: e.target.value } })} placeholder="Biannual (Continuous Volume)" /></div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Custom 404 Page</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginBottom: 12 }}>
            Override the default 404 page title and message. Leave empty to use translations.
          </p>
          <div className="form-group"><label className="form-label">404 Title</label><input className="form-input" value={settings?.custom404?.title || ''} onChange={e => setSettings({ ...settings, custom404: { ...(settings?.custom404 || {}), title: e.target.value } })} placeholder="Page not found" /></div>
          <div className="form-group"><label className="form-label">404 Message</label><textarea className="form-textarea" value={settings?.custom404?.message || ''} onChange={e => setSettings({ ...settings, custom404: { ...(settings?.custom404 || {}), message: e.target.value } })} rows={2} placeholder="The page you're looking for doesn't exist..." /></div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Default SEO</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginBottom: 12 }}>Default meta description comes from <strong>General → Description</strong> above.</p>
          <div className="form-group"><label className="form-label">Meta Title</label><input className="form-input" value={settings?.defaultSEO?.metaTitle || ''} onChange={e => setSettings({ ...settings, defaultSEO: { ...(settings?.defaultSEO || {}), metaTitle: e.target.value } })} /></div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Analytics</h3>
          <div className="form-group"><label className="form-label">Google Analytics ID</label><input className="form-input" value={settings?.analytics?.googleAnalyticsId || ''} onChange={e => setSettings({ ...settings, analytics: { ...(settings?.analytics || {}), googleAnalyticsId: e.target.value } })} placeholder="G-XXXXXXXXXX" /></div>
          <div className="form-group"><label className="form-label">Google Tag Manager ID</label><input className="form-input" value={settings?.analytics?.googleTagManagerId || ''} onChange={e => setSettings({ ...settings, analytics: { ...(settings?.analytics || {}), googleTagManagerId: e.target.value } })} placeholder="GTM-XXXXXXX" /></div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Maintenance Mode</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginBottom: 12 }}>
            When enabled, the public site will show a maintenance message. Admin panel remains accessible.
          </p>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={settings?.maintenanceMode?.isEnabled || false} onChange={e => setSettings({ ...settings, maintenanceMode: { ...(settings?.maintenanceMode || {}), isEnabled: e.target.checked } })} />
              Enable Maintenance Mode
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Message (optional)</label>
            <textarea className="form-textarea" value={settings?.maintenanceMode?.message || ''} onChange={e => setSettings({ ...settings, maintenanceMode: { ...(settings?.maintenanceMode || {}), message: e.target.value } })} rows={2} placeholder="Site is currently under maintenance. Please check back soon." />
          </div>
          <div className="form-group">
            <label className="form-label">Allowed IPs (comma-separated)</label>
            <input className="form-input" value={(settings?.maintenanceMode?.allowedIPs || []).join(', ')} onChange={e => setSettings({ ...settings, maintenanceMode: { ...(settings?.maintenanceMode || {}), allowedIPs: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="1.2.3.4, 192.168.1.1" />
          </div>
        </div>
      </div>
    </div>
  );
}
