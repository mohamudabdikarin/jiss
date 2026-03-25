import { useState, useEffect } from 'react';
import { redirectsAPI } from '../../../api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function RedirectManager() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fromPath: '', toPath: '', statusCode: 301 });

  const load = () => {
    redirectsAPI.getAll().then(({ data }) => setRedirects(data.data ?? [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fromPath?.trim() || !form.toPath?.trim()) {
      toast.error('From and To paths are required');
      return;
    }
    try {
      if (editing) {
        await redirectsAPI.update(editing._id, form);
        toast.success('Redirect updated');
      } else {
        await redirectsAPI.create(form);
        toast.success('Redirect created');
      }
      setEditing(null);
      setForm({ fromPath: '', toPath: '', statusCode: 301 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this redirect?')) return;
    try {
      await redirectsAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Redirect Manager</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage 301/302 redirects for moved URLs</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>{editing ? 'Edit Redirect' : 'Add Redirect'}</h3>
        <form onSubmit={handleSave} className="form-row" style={{ gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">From path</label>
            <input className="form-input" placeholder="/old-page" value={form.fromPath} onChange={e => setForm(f => ({ ...f, fromPath: e.target.value }))} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">To path</label>
            <input className="form-input" placeholder="/new-page" value={form.toPath} onChange={e => setForm(f => ({ ...f, toPath: e.target.value }))} />
          </div>
          <div className="form-group" style={{ width: 100 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.statusCode} onChange={e => setForm(f => ({ ...f, statusCode: parseInt(e.target.value, 10) }))}>
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn btn-outline" onClick={() => { setEditing(null); setForm({ fromPath: '', toPath: '', statusCode: 301 }); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? <div className="loading-spinner" /> : (
          <table className="data-table">
            <thead>
              <tr><th>From</th><th>To</th><th>Status</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
              {redirects.map(r => (
                <tr key={r._id}>
                  <td><code>{r.fromPath}</code></td>
                  <td><code>{r.toPath}</code></td>
                  <td>{r.statusCode}</td>
                  <td>{r.isActive !== false ? 'Yes' : 'No'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => { setEditing(r); setForm({ fromPath: r.fromPath, toPath: r.toPath, statusCode: r.statusCode || 301 }); }}><FiEdit2 /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)} style={{ marginLeft: 8 }}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && redirects.length === 0 && <p className="empty-state">No redirects yet. Add one above.</p>}
      </div>
    </div>
  );
}
