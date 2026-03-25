import { useState, useEffect } from 'react';
import { footerAPI } from '../../../api';
import { FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FooterManager() {
  const [footer, setFooter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    footerAPI.getAll().then(({ data }) => {
      const f = data.data?.[0];
      setFooter(f ? { _id: f._id, content: f.content || f.copyrightText || '' } : { content: '' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { content: footer?.content || '' };
      if (footer?._id) {
        await footerAPI.update(footer._id, payload);
      } else {
        const { data } = await footerAPI.create(payload);
        setFooter(data.data);
      }
      toast.success('Footer saved');
    } catch (err) { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Footer</h1>
          <p className="page-subtitle">Edit the footer content (copyright, credits, etc.)</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Footer Content</label>
          <textarea
            className="form-textarea"
            value={footer?.content || ''}
            onChange={e => setFooter({ ...footer, content: e.target.value })}
            rows={4}
            placeholder="© 2023 IJCDS | International Journal of Computing and Digital Systems | University of Bahrain"
          />
        </div>
      </div>
    </div>
  );
}
