import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../api';
import {
  FiFileText,
  FiBook,
  FiImage,
  FiEye,
  FiDownload,
  FiRefreshCw,
  FiTag,
  FiLayers,
  FiCornerDownRight,
  FiBox,
  FiMenu
} from 'react-icons/fi';
import { useCountUp } from '../../../hooks/useCountUp';

function AnimatedStatCard({ icon: Icon, iconClass, value, label, sublabel }) {
  const animatedValue = useCountUp(value, 900, value != null);
  return (
    <div className="stat-card stat-card-hover">
      <div className={`stat-icon ${iconClass}`}><Icon /></div>
      <div className="stat-body">
        <div className="stat-value">{animatedValue}</div>
        <div className="stat-label">{label}</div>
        {sublabel && <div className="stat-sublabel">{sublabel}</div>}
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, iconColor, value, label }) {
  const animatedValue = useCountUp(value, 900, value != null);
  return (
    <div className="quick-stat-item">
      <Icon style={{ fontSize: 28, color: iconColor }} />
      <div className="quick-stat-value">{animatedValue}</div>
      <div className="quick-stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const drafts = (stats?.articles?.total || 0) - (stats?.articles?.published || 0) - (stats?.articles?.preprints || 0);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your IJCDS journal content</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        <AnimatedStatCard
          icon={FiFileText}
          iconClass="primary"
          value={stats?.pages?.total || 0}
          label="Total Pages"
          sublabel={`${stats?.pages?.published || 0} published`}
        />
        <AnimatedStatCard
          icon={FiBook}
          iconClass="success"
          value={stats?.articles?.total || 0}
          label="Articles"
          sublabel={`${stats?.articles?.published || 0} published · ${stats?.articles?.preprints || 0} preprints${drafts > 0 ? ` · ${drafts} drafts` : ''}`}
        />
        <AnimatedStatCard
          icon={FiImage}
          iconClass="warning"
          value={stats?.media?.total || 0}
          label="Media Files"
        />
        <AnimatedStatCard
          icon={FiEye}
          iconClass="info"
          value={stats?.views || 0}
          label="Article Views"
        />
      </div>

      <div className="dashboard-quick-stats-wrap">
        <div className="card card-hover">
          <div className="card-header">
            <h3 className="card-title">Quick Stats</h3>
          </div>
          <div className="quick-stats-grid">
            <QuickStat icon={FiDownload} iconColor="var(--success)" value={stats?.downloads ?? 0} label="PDF downloads" />
            <QuickStat icon={FiTag} iconColor="var(--primary)" value={stats?.categories?.total ?? 0} label="Article categories" />
            <QuickStat icon={FiLayers} iconColor="#7c3aed" value={stats?.sections?.total ?? 0} label="CMS sections" />
            <QuickStat icon={FiCornerDownRight} iconColor="var(--warning)" value={stats?.redirects?.total ?? 0} label="Redirects" />
            <QuickStat icon={FiBox} iconColor="#0891b2" value={stats?.components?.total ?? 0} label="Site components" />
            <QuickStat icon={FiMenu} iconColor="var(--text-secondary)" value={stats?.navigations?.total ?? 0} label="Navigation menus" />
          </div>
        </div>
      </div>
    </div>
  );
}
