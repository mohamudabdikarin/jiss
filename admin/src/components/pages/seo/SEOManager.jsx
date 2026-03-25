import { useState, useEffect } from 'react';
import { seoAPI } from '../../../api';
import { FiSearch, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SEOManager() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seoAPI.getOverview().then(({ data }) => { setOverview(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const score = overview?.totalPages ? Math.round((overview.pagesWithSEO / overview.totalPages) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">SEO Management</h1>
          <p className="page-subtitle">Monitor and improve your site's SEO</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><FiSearch /></div>
          <div>
            <div className="stat-value">{overview?.totalPages || 0}</div>
            <div className="stat-label">Total Pages</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiCheckCircle /></div>
          <div>
            <div className="stat-value">{overview?.pagesWithSEO || 0}</div>
            <div className="stat-label">Pages with SEO</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiAlertCircle /></div>
          <div>
            <div className="stat-value">{overview?.issues?.length || 0}</div>
            <div className="stat-label">SEO Issues</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><FiSearch /></div>
          <div>
            <div className="stat-value">{score}%</div>
            <div className="stat-label">SEO Score</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">SEO Issues</h3>
        </div>
        {overview?.issues?.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <FiCheckCircle style={{ fontSize: 48, color: 'var(--success)' }} />
            <h3>All pages have SEO data!</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Page</th><th>Slug</th><th>Issue</th></tr></thead>
              <tbody>
                {overview?.issues?.map((issue, i) => (
                  <tr key={i}>
                    <td><strong>{issue.page}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>/{issue.slug}</td>
                    <td><span style={{ color: 'var(--warning)' }}><FiAlertCircle style={{ marginRight: 4 }} />{issue.issue}</span></td>
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
