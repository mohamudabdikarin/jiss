import { useState, useEffect } from 'react';
import { backupsAPI } from '../../../api';
import { FiDatabase, FiDownload, FiTrash2, FiRefreshCw, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BackupManager() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    try {
      const { data } = await backupsAPI.getAll();
      setBackups(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await backupsAPI.create();
      toast.success('Backup created');
      fetchBackups();
    } catch (err) { toast.error('Backup failed'); }
    finally { setCreating(false); }
  };

  const handleRestore = async (key) => {
    if (!confirm('⚠️ This will overwrite ALL current data. Are you sure?')) return;
    try {
      await backupsAPI.restore(key);
      toast.success('Backup restored');
    } catch (err) { toast.error('Restore failed'); }
  };

  const handleDelete = async (key) => {
    if (!confirm('Delete this backup?')) return;
    try {
      await backupsAPI.delete(key);
      toast.success('Backup deleted');
      fetchBackups();
    } catch (err) { toast.error('Delete failed'); }
  };

  const handleDownload = async (key) => {
    try {
      const { data } = await backupsAPI.download(key);
      // R2: response is JSON with downloadUrl
      if (data instanceof Blob) {
        const text = await data.text();
        try {
          const json = JSON.parse(text);
          if (json?.data?.downloadUrl) {
            window.open(json.data.downloadUrl, '_blank');
            return;
          }
        } catch (_) {}
      }
      // Local backup: data is the file blob
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = (key || '').replace(/^local\//, '') || 'backup.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error('Download failed'); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const k = 1024, sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Backups</h1><p className="page-subtitle">Manage database backups</p></div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
          <FiUploadCloud /> {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className="card">
        {backups.length === 0 ? (
          <div className="empty-state"><FiDatabase style={{ fontSize: 48 }} /><h3>No backups yet</h3><p>Create your first backup to protect your data</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Key</th><th>Size</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {backups.map((backup, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{backup.key}</td>
                    <td>{formatSize(backup.size)}</td>
                    <td>{backup.lastModified ? new Date(backup.lastModified).toLocaleString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDownload(backup.key)}><FiDownload /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleRestore(backup.key)}><FiRefreshCw /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(backup.key)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
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
