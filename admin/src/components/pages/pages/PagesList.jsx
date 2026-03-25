import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pagesAPI } from '../../../api';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiSearch, FiHome, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PagesList() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const fetchPages = async () => {
    try {
      const { data } = await pagesAPI.getAll({ search, status, limit: 50, sort: 'order' });
      setPages(data.data);
    } catch (err) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, [search, status]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This will also delete all its sections.`)) return;
    try {
      await pagesAPI.delete(id);
      toast.success('Page deleted');
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await pagesAPI.duplicate(id);
      toast.success('Page duplicated');
      fetchPages();
    } catch (err) {
      toast.error('Duplicate failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pages</h1>
          <p className="page-subtitle">Manage website pages and their content sections</p>
        </div>
        <Link to="/pages/new" className="btn btn-primary"><FiPlus /> New Page</Link>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <FiFileText style={{ fontSize: 48 }} />
            <h3>No pages yet</h3>
            <p>Create your first page to get started</p>
            <Link to="/pages/new" className="btn btn-primary"><FiPlus /> Create Page</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Sections</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {page.isHomePage && <FiHome style={{ color: 'var(--primary)' }} title="Home Page" />}
                        <strong>{page.title}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>/{page.slug}</td>
                    <td>{page.template}</td>
                    <td><span className={`badge badge-${page.status}`}>{page.status}</span></td>
                    <td>{page.sections?.length || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/pages/${page._id}`)}><FiEdit2 /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDuplicate(page._id)}><FiCopy /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(page._id, page.title)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
