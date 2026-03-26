import { useState, useEffect } from 'react';
import { navigationAPI } from '../../../api';
import { FiPlus, FiTrash2, FiSave, FiMenu } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NavigationManager() {
  const [navs, setNavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const renumberItems = (items = []) =>
    (Array.isArray(items) ? items : []).map((it, idx) => ({ ...it, order: idx }));

  useEffect(() => {
    navigationAPI.getAll()
      .then(({ data }) => {
        const list = data.data ?? data ?? [];
        setNavs(
          Array.isArray(list)
            ? list.map((nav) => ({
              ...nav,
              items: renumberItems(
                (nav.items || []).slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
              )
            }))
            : []
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (nav) => {
    try {
      if (nav._id) {
        await navigationAPI.update(nav._id, nav);
        toast.success('Navigation updated');
      } else {
        const { data } = await navigationAPI.create(nav);
        setNavs([...navs, data.data]);
        toast.success('Navigation created');
      }
      setEditing(null);
      navigationAPI.getAll().then(({ data }) => setNavs(data.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleAddItem = (nav) => {
    const newItem = {
      label: 'New Link',
      url: '/',
      order: nav.items?.length || 0,
      isVisible: true,
      target: '_self',
      children: [],
      ...(nav.location === 'sidebar' && { sidebarSection: 'journalinfo' })
    };
    const updated = { ...nav, items: [...(nav.items || []), newItem] };
    setEditing({ ...updated, items: renumberItems(updated.items) });
  };

  const handleRemoveItem = (nav, index) => {
    const updatedItems = (nav.items || []).filter((_, i) => i !== index);
    const updated = { ...nav, items: renumberItems(updatedItems) };
    setEditing(updated);
  };

  const handleUpdateItem = (nav, index, field, value) => {
    const items = [...nav.items];
    items[index] = { ...items[index], [field]: value };
    setEditing({ ...nav, items: renumberItems(items) });
  };

  const moveItem = (fromIndex, toIndex, navOverride) => {
    const navForMove = navOverride || editing || navs.find((n) => n.location === 'header') || navs[0];
    if (!navForMove) return;
    if (fromIndex === toIndex) return;
    const items = [...(navForMove.items || [])];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    setEditing({ ...navForMove, items: renumberItems(items) });
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const currentNav = editing || navs.find(n => n.location === 'header') || navs[0];
  const currentItems = (currentNav?.items || []).slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Navigation</h1>
          <p className="page-subtitle">Manage website menu items</p>
        </div>
        {editing && <button className="btn btn-primary" onClick={() => handleSave(editing)}><FiSave /> Save</button>}
      </div>

      <div className="toolbar">
        {['header', 'sidebar'].map(loc => {
          const nav = navs.find(n => n.location === loc);
          return (
            <button key={loc} className={`btn ${editing?.location === loc || (!editing && currentNav?.location === loc) ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setEditing(nav || { location: loc, items: [], isActive: true })}>
              <FiMenu /> {loc.charAt(0).toUpperCase() + loc.slice(1)} {nav ? `(${nav.items?.length || 0})` : '(new)'}
            </button>
          );
        })}
      </div>

      <div className="card">
        {!currentNav ? (
          <div className="empty-state"><h3>Select a navigation location</h3></div>
        ) : (
          <>
            <div className="card-header">
              <h3 className="card-title">{(editing || currentNav).location} Navigation ({(editing || currentNav).items?.length || 0} items)</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleAddItem(editing || currentNav)}><FiPlus /> Add Item</button>
            </div>
            {((editing || currentNav).location === 'header') && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Drag the handle to reorder menu items (the site uses the `order` field).
              </p>
            )}
            {currentItems?.map((item, i) => (
              <div
                key={item._id || i}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--card-border)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  background: i === dragOverIndex ? 'rgba(0,102,204,0.08)' : 'transparent',
                  boxShadow: i === dragOverIndex ? '0 0 0 2px rgba(0,102,204,0.35) inset' : undefined,
                  borderRadius: i === dragOverIndex ? 8 : undefined
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverIndex(i)}
                onDragLeave={(e) => {
                  // Only clear if we actually left the row; avoids flicker when moving between children.
                  if (!e.currentTarget.contains(e.relatedTarget)) setDragOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('text/nav-index'));
                  if (!Number.isNaN(from)) {
                    const to = i;
                    moveItem(from, to, editing || currentNav);
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }
                }}
              >
                <span
                  style={{ color: 'var(--text-muted)', fontSize: 12, width: 20 }}
                >
                  {i + 1}
                </span>
                <span
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/nav-index', String(i));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingIndex(i);
                    setDragOverIndex(i);
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    cursor: 'grab',
                    color: 'var(--text-muted)'
                  }}
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                >
                  <FiMenu />
                </span>
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 120 }}
                  value={item.label}
                  onChange={(e) => handleUpdateItem(editing || currentNav, i, 'label', e.target.value)}
                  placeholder="Label"
                />
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 120 }}
                  value={item.url}
                  onChange={(e) => handleUpdateItem(editing || currentNav, i, 'url', e.target.value)}
                  placeholder="URL"
                />
                {(editing || currentNav).location === 'sidebar' && (
                  <select className="form-select" style={{ width: 150 }} value={item.sidebarSection || 'journalinfo'} onChange={e => handleUpdateItem(editing || currentNav, i, 'sidebarSection', e.target.value)} title="Position on client sidebar">
                    <option value="quicklinks">Quick Links</option>
                    <option value="journalinfo">Journal Info</option>
                  </select>
                )}
                <select className="form-select" style={{ width: 100 }} value={item.target} onChange={e => handleUpdateItem(editing || currentNav, i, 'target', e.target.value)}>
                  <option value="_self">Same tab</option>
                  <option value="_blank">New tab</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => handleRemoveItem(editing || currentNav, i)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
              </div>
            ))}
            {!editing && <div style={{ marginTop: 16 }}><button className="btn btn-outline" onClick={() => setEditing(currentNav)}>Edit Navigation</button></div>}
          </>
        )}
      </div>
    </div>
  );
}
