import { useState, useEffect, useCallback } from 'react';
import { mediaAPI } from '../../../api';
import {
  FiUpload, FiTrash2, FiSearch, FiGrid, FiList,
  FiImage, FiFile, FiLink, FiExternalLink, FiX, FiCopy, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const PAGE_SIZE = 24;

function formatSize(bytes) {
  if (!bytes) return '—';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function FileIcon({ mimeType, size = 36 }) {
  if (mimeType?.startsWith('image/')) return <FiImage size={size} />;
  if (mimeType?.includes('pdf'))     return <span style={{ fontSize: size }}>📄</span>;
  return <FiFile size={size} />;
}

function MediaCard({ item, selected, onSelect, onDelete }) {
  const isArticlePdf = item.folder === 'articles';
  const isImage = item.mimeType?.startsWith('image/');

  const copyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    toast.success('URL copied!');
  };

  const openUrl = (e) => {
    e.stopPropagation();
    window.open(item.url, '_blank', 'noopener');
  };

  return (
    <div
      className={`media-item ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(item._id)}
      title={item.originalName}
    >
      {/* Thumbnail */}
      <div className="media-thumb" style={{ position: 'relative' }}>
        {isImage ? (
          <img src={item.thumbnailUrl || item.url} alt={item.alt || item.originalName} className="media-thumb-img" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <FileIcon mimeType={item.mimeType} />
          </div>
        )}

        {/* Article PDF badge */}
        {isArticlePdf && (
          <span style={{
            position: 'absolute', top: 4, left: 4,
            background: 'var(--primary)', color: '#fff',
            fontSize: 9, fontWeight: 700, borderRadius: 4,
            padding: '2px 5px', letterSpacing: '0.04em'
          }}>ARTICLE</span>
        )}

        {/* Hover actions */}
        <div className="media-actions" style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-outline" style={{ padding: '3px 6px' }} onClick={copyUrl} title="Copy URL"><FiCopy size={11} /></button>
          <button className="btn btn-sm btn-outline" style={{ padding: '3px 6px' }} onClick={openUrl} title="Open"><FiExternalLink size={11} /></button>
          {!isArticlePdf && (
            <button className="btn btn-sm btn-danger" style={{ padding: '3px 6px' }} onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} title="Delete"><FiX size={11} /></button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="media-info">
        <div className="media-name" title={item.originalName}>{item.originalName || '—'}</div>
        <div className="media-size">{formatSize(item.size)}</div>
      </div>
    </div>
  );
}

function MediaRow({ item, selected, onSelect, onDelete }) {
  const isArticlePdf = item.folder === 'articles';

  const copyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    toast.success('URL copied!');
  };

  return (
    <tr
      onClick={() => onSelect(item._id)}
      style={{ cursor: 'pointer', background: selected ? 'var(--bg-hover)' : undefined }}
    >
      <td style={{ width: 36 }}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(item._id)} onClick={e => e.stopPropagation()} />
      </td>
      <td style={{ width: 42 }}>
        <FileIcon mimeType={item.mimeType} size={20} />
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{item.originalName || '—'}</span>
          {isArticlePdf && (
            <span style={{
              background: 'var(--primary)', color: '#fff',
              fontSize: 9, fontWeight: 700, borderRadius: 4,
              padding: '2px 5px', letterSpacing: '0.04em'
            }}>ARTICLE</span>
          )}
        </div>
      </td>
      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.folder || '—'}</td>
      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.mimeType || '—'}</td>
      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatSize(item.size)}</td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-outline" style={{ padding: '3px 8px' }} onClick={copyUrl} title="Copy URL"><FiCopy size={12} /></button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ padding: '3px 8px' }} onClick={e => e.stopPropagation()} title="Open">
            <FiExternalLink size={12} />
          </a>
          {!isArticlePdf && (
            <button className="btn btn-sm btn-danger" style={{ padding: '3px 8px' }} onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} title="Delete"><FiTrash2 size={12} /></button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function MediaLibrary() {
  const [media, setMedia]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [folder, setFolder]       = useState('');
  const [folders, setFolders]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected]   = useState([]);
  const [viewMode, setViewMode]   = useState('grid');
  const [page, setPage]           = useState(1);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await mediaAPI.getAll({ search, folder, page, limit: PAGE_SIZE });
      setMedia(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [search, folder, page]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  useEffect(() => {
    mediaAPI.getFolders()
      .then(({ data }) => setFolders(data.data || []))
      .catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append('file', files[0]);
        formData.append('folder', folder || 'general');
        await mediaAPI.upload(formData);
      } else {
        for (const file of files) formData.append('files', file);
        formData.append('folder', folder || 'general');
        await mediaAPI.uploadMultiple(formData);
      }
      toast.success(`${files.length} file(s) uploaded`);
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try {
      await mediaAPI.delete(id);
      toast.success('File deleted');
      setSelected(prev => prev.filter(s => s !== id));
      fetchMedia();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    const deletable = selected.filter(id => {
      const item = media.find(m => m._id === id);
      return item && item.folder !== 'articles';
    });
    if (!deletable.length) {
      toast.error('Cannot delete article PDFs from here — manage them in Articles.');
      return;
    }
    if (!confirm(`Delete ${deletable.length} file(s)?`)) return;
    try {
      await mediaAPI.bulkDelete(deletable);
      toast.success(`${deletable.length} files deleted`);
      setSelected([]);
      fetchMedia();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const selectAll = () => setSelected(media.map(m => m._id));
  const clearSelect = () => setSelected([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Media Library</h1>
          <p className="page-subtitle">
            {total} file{total !== 1 ? 's' : ''}
            {folder === 'articles' ? ' — Article PDFs' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.length > 0 && (
            <>
              <button className="btn btn-outline btn-sm" onClick={clearSelect}>
                <FiX /> Deselect ({selected.length})
              </button>
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                <FiTrash2 /> Delete ({selected.length})
              </button>
            </>
          )}
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <FiUpload /> {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <FiSearch />
          <input
            placeholder="Search files…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => { setSearch(''); setPage(1); }}>
              <FiX size={14} />
            </button>
          )}
        </div>
        <div className="filter-group">
          <select
            className="filter-select"
            value={folder}
            onChange={e => { setFolder(e.target.value); setPage(1); setSelected([]); }}
          >
            <option value="">All Files</option>
            {folders.map(f => (
              <option key={f} value={f}>
                {f === 'articles' ? '📄 Article PDFs' : f}
              </option>
            ))}
          </select>

          {/* Select all */}
          {media.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={selected.length === media.length ? clearSelect : selectAll}>
              {selected.length === media.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {/* View toggle */}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            title={viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid'}
          >
            {viewMode === 'grid' ? <FiList /> : <FiGrid />}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : media.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FiImage style={{ fontSize: 48 }} />
            <h3>No files found</h3>
            <p>{folder === 'articles' ? 'No article PDFs uploaded yet. Add articles with PDFs in the Articles section.' : 'Upload images and documents to get started.'}</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="media-grid">
          {media.map(item => (
            <MediaCard
              key={item._id}
              item={item}
              selected={selected.includes(item._id)}
              onSelect={toggleSelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', width: 36 }}></th>
                <th style={{ padding: '10px 12px', width: 42 }}></th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Folder</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Size</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {media.map(item => (
                <MediaRow
                  key={item._id}
                  item={item}
                  selected={selected.includes(item._id)}
                  onSelect={toggleSelect}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <FiChevronLeft /> Prev
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
