import { useState, useEffect } from 'react';
import { mediaAPI } from '../../../api';
import { FiUpload, FiTrash2, FiSearch, FiGrid, FiList, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);

  const fetchMedia = async () => {
    try {
      const { data } = await mediaAPI.getAll({ search, folder, page, limit: 24 });
      setMedia(data.data);
    } catch (err) { toast.error('Failed to load media'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, [search, folder, page]);
  useEffect(() => { mediaAPI.getFolders().then(({ data }) => setFolders(data.data)).catch(() => {}); }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('folder', folder || 'general');
        await mediaAPI.upload(formData);
      } else {
        const formData = new FormData();
        for (const file of files) formData.append('files', file);
        formData.append('folder', folder || 'general');
        await mediaAPI.uploadMultiple(formData);
      }
      toast.success(`${files.length} file(s) uploaded`);
      fetchMedia();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try {
      await mediaAPI.delete(id);
      toast.success('File deleted');
      fetchMedia();
    } catch (err) { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} files?`)) return;
    try {
      await mediaAPI.bulkDelete(selected);
      toast.success(`${selected.length} files deleted`);
      setSelected([]);
      fetchMedia();
    } catch (err) { toast.error('Bulk delete failed'); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Media Library</h1>
          <p className="page-subtitle">{media.length} files</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.length > 0 && <button className="btn btn-danger" onClick={handleBulkDelete}><FiTrash2 /> Delete ({selected.length})</button>}
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={folder} onChange={e => setFolder(e.target.value)}>
            <option value="">All Folders</option>
            {folders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button className={`btn btn-outline btn-sm ${viewMode === 'grid' ? '' : ''}`} onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <FiList /> : <FiGrid />}
          </button>
        </div>
      </div>

      {loading ? <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div> : media.length === 0 ? (
        <div className="card"><div className="empty-state"><FiImage style={{ fontSize: 48 }} /><h3>No media files</h3><p>Upload images and documents</p></div></div>
      ) : (
        <div className="media-grid">
          {media.map(item => (
            <div key={item._id} className={`media-item ${selected.includes(item._id) ? 'selected' : ''}`} onClick={() => toggleSelect(item._id)}>
              {item.mimeType?.startsWith('image/') ? (
                <img src={item.thumbnailUrl || item.url} alt={item.alt || item.originalName} className="media-thumb" />
              ) : (
                <div className="media-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--text-muted)' }}>
                  {item.mimeType?.includes('pdf') ? '📄' : '📁'}
                </div>
              )}
              <div className="media-info">
                <div className="media-name">{item.originalName}</div>
                <div className="media-size">{formatSize(item.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
