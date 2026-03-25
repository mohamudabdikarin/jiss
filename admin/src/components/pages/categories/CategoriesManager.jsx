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
          <>
            <div className="table-container categories-desktop-wrap">
              <table className="data-table data-table--categories">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th className="categories-col-narrow">Order</th>
                    <th className="categories-col-narrow">Active</th>
                    <th className="categories-col-narrow">Articles</th>
                    <th className="categories-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>
                        <code className="categories-slug-code">{c.slug}</code>
                      </td>
                      <td className="categories-col-narrow">{c.order ?? 0}</td>
                      <td className="categories-col-narrow">{c.isActive !== false ? 'Yes' : 'No'}</td>
                      <td className="categories-col-narrow">{c.articleCount ?? 0}</td>
                      <td className="categories-col-actions">
                        <div className="categories-actions-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline categories-action-btn"
                            aria-label={`Edit category ${c.name}`}
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
                            <FiEdit2 aria-hidden />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger categories-action-btn"
                              aria-label={`Delete category ${c.name}`}
                              onClick={() => handleDelete(c._id)}
                            >
                              <FiTrash2 aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="categories-mobile-cards">
              {categories.map((c) => (
                <div key={`m-${c._id}`} className="category-mobile-card">
                  <div className="category-mobile-card-header">
                    <div className="category-mobile-card-title">{c.name}</div>
                    <div className="categories-actions-group">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline categories-action-btn"
                        aria-label={`Edit ${c.name}`}
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
                        <FiEdit2 aria-hidden />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger categories-action-btn"
                          aria-label={`Delete ${c.name}`}
                          onClick={() => handleDelete(c._id)}
                        >
                          <FiTrash2 aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="category-mobile-meta">
                    <div>
                      <span className="category-mobile-label">Slug</span>{' '}
                      <code className="categories-slug-code">{c.slug}</code>
                    </div>
                    <div>
                      <span className="category-mobile-label">Order</span> {c.order ?? 0} ·{' '}
                      <span className="category-mobile-label">Active</span> {c.isActive !== false ? 'Yes' : 'No'} ·{' '}
                      <span className="category-mobile-label">Articles</span> {c.articleCount ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {!loading && categories.length === 0 && <p className="empty-state">No categories yet. Add one above, then pick it in the article editor.</p>}
      </div>
    </div>
  );
}
