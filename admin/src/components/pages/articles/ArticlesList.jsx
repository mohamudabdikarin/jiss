import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articlesAPI } from '../../../api';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ArticlesList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  const fetchArticles = async () => {
    try {
      const { data } = await articlesAPI.getAll({ search, type, status, page, limit: 15 });
      setArticles(data.data);
      setPagination(data.pagination);
    } catch (err) { toast.error('Failed to load articles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, [search, type, status, page]);

  const handleDuplicate = async (id) => {
    try {
      const { data } = await articlesAPI.duplicate(id);
      toast.success('Article duplicated');
      navigate(`/articles/${data.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Duplicate failed'); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await articlesAPI.delete(id);
      toast.success('Article deleted');
      fetchArticles();
    } catch (err) { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">Manage preprints and published articles</p>
        </div>
        <Link to="/articles/new" className="btn btn-primary"><FiPlus /> New Article</Link>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search articles..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="preprint">Preprint</option>
            <option value="published">Published</option>
          </select>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <h3>No articles found</h3>
            <p>Create your first article to get started</p>
            <Link to="/articles/new" className="btn btn-primary"><FiPlus /> Create Article</Link>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Authors</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article._id}>
                      <td><strong style={{ maxWidth: 300, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{article.title}</strong></td>
                      <td><span className={`badge badge-${article.type}`}>{article.type}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{article.authors?.map(a => a.name).join(', ')}</td>
                      <td><span className={`badge badge-${article.status}`}>{article.status}</span></td>
                      <td>{article.views || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/articles/${article._id}`)} title="Edit"><FiEdit2 /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDuplicate(article._id)} title="Duplicate"><FiCopy /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(article._id, article.title)} style={{ color: 'var(--danger)' }} title="Delete"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="pagination-btn" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
