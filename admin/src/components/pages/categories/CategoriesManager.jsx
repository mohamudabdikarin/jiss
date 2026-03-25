import { useState, useEffect } from 'react';
import { categoriesAPI } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const emptyForm = {
  name: '',
  description: '',
  order: 0,
  isActive: true,
  parentCategory: ''
};

export default function CategoriesManager() {
  const { user } = useAuth();
  const canDelete = user?.role === 'superadmin' || user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    categoriesAPI
      .getAll()
      .then(({ data }) => setCategories(data.data ?? []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      order: Number(form.order) || 0,
      isActive: !!form.isActive,
      parentCategory: form.parentCategory || null
    };
    try {
      if (editing) {
        await categoriesAPI.update(editing._id, payload);
        toast.success('Category updated');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Category created');
      }
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    if (!confirm('Delete this category? Articles must be reassigned or uncategorized first.')) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Deleted');
      if (editing?._id === id) {
        setEditing(null);
        setForm(emptyForm);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const parentOptions = categories.filter((c) => !editing || String(c._id) !== String(editing._id));

  return (
    <div>
      <div className="page-header">
        <h1>Article categories</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Groups articles for filtering on the public site. Assign a category when editing an article.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>{editing ? 'Edit category' : 'Add category'}</h3>
        <form onSubmit={handleSave} className="form-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label className="form-label">Name</label>
            <input
              className="form-input"
              placeholder="e.g. Original Research"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label className="form-label">Parent (optional)</label>
            <select
              className="form-select"
              value={form.parentCategory || ''}
              onChange={(e) => setForm((f) => ({ ...f, parentCategory: e.target.value }))}
            >
              <option value="">None</option>
              {parentOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ width: 100 }}>
            <label className="form-label">Order</label>
            <input
              type="number"
              className="form-input"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              Active
            </label>
          </div>
          <div className="form-group" style={{ flex: '1 1 100%' }}>
            <label className="form-label">Description (optional)</label>
            <input
              className="form-input"
              placeholder="Short description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flex: '1 1 100%' }}>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update' : 'Add'}
            </button>
            {editing && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Active</th>
                <th>Articles</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>
                    <code>{c.slug}</code>
                  </td>
                  <td>{c.order ?? 0}</td>
                  <td>{c.isActive !== false ? 'Yes' : 'No'}</td>
                  <td>{c.articleCount ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setEditing(c);
                        setForm({
                          name: c.name || '',
                          description: c.description || '',
                          order: c.order ?? 0,
                          isActive: c.isActive !== false,
                          parentCategory: c.parentCategory ? String(c.parentCategory) : ''
                        });
                      }}
                    >
                      <FiEdit2 />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(c._id)}
                        style={{ marginLeft: 8 }}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {!loading && categories.length === 0 && <p className="empty-state">No categories yet. Add one above, then pick it in the article editor.</p>}
      </div>
    </div>
  );
}
