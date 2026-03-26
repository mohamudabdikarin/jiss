import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pagesAPI, sectionsAPI } from '../../../api';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2, FiEye, FiEyeOff, FiEdit2, FiX, FiCopy, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Quill editor with local state. Prevents cursor/space-loss that happens when
 * ReactQuill is fully controlled and the parent state updates on every keystroke.
 * The `html` prop is read only on mount; use `key` to remount when the section changes.
 */
function QuillField({ html, onChange, modules, style }) {
  const [localHtml, setLocalHtml] = useState(html ?? '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const handleChange = useCallback((v) => {
    setLocalHtml(v);
    onChangeRef.current(v);
  }, []);
  return (
    <ReactQuill
      theme="snow"
      value={localHtml}
      onChange={handleChange}
      modules={modules}
      style={style}
    />
  );
}
import toast from 'react-hot-toast';
import PageBlockEditor from './PageBlockEditor';

const SECTION_TYPES = ['hero', 'text', 'richtext', 'page_blocks', 'image', 'gallery', 'cards', 'cta', 'accordion', 'banner', 'contact', 'video', 'stats', 'buttons', 'tag_badges', 'testimonials', 'team', 'timeline', 'custom_html'];

function sectionTypeSelectLabel(type) {
  const labels = {
    hero: 'Hero banner',
    text: 'Plain text',
    richtext: 'Rich text (HTML editor)',
    page_blocks: 'Block page content',
    image: 'Image',
    gallery: 'Gallery',
    cards: 'Highlight cards',
    cta: 'Call-to-action',
    accordion: 'Accordion',
    banner: 'Banner',
    contact: 'Contact box',
    video: 'Video',
    stats: 'Stats row',
    buttons: 'Button row',
    tag_badges: 'Tag badges (indexed in, partners, …)',
    testimonials: 'Testimonials',
    team: 'Team / board',
    timeline: 'Timeline',
    custom_html: 'Custom HTML'
  };
  return labels[type] || type;
}

/** Types you can add from the sections list (page_blocks uses “Add block editor” only). */
const NEW_SECTION_TEMPLATE_TYPES = SECTION_TYPES.filter((t) => t !== 'page_blocks');

function defaultPayloadForNewSection(type) {
  switch (type) {
    case 'text':
      return { content: { body: '<p>Edit this content...</p>' } };
    case 'richtext':
      return { content: { html: '<p>Edit this content...</p>' } };
    case 'tag_badges':
      return {
        content: {
          heading: 'Indexed in',
          align: 'center',
          titleStyle: 'auto',
          badges: [
            { label: 'Scopus', url: '' },
            { label: 'Google Scholar', url: '' },
            { label: '', url: '' }
          ]
        }
      };
    case 'stats':
      return { content: { rowVariant: 'dark', items: [{ value: '', label: '' }] } };
    case 'cards':
      return { content: { rowVariant: 'dark', cards: [{ value: '', label: '' }] } };
    case 'buttons':
      return {
        content: {
          align: 'left',
          titleStyle: 'auto',
          buttons: [{ label: '', url: '', variant: 'primary' }]
        }
      };
    default:
      return { content: {} };
  }
}

const BODY_THEME_OPTIONS = [
  { value: 'auto', label: 'Auto — on Home only: first text block = blue callout; later text = serif body' },
  { value: 'plain', label: 'Plain — no box' },
  { value: 'callout_left', label: 'Callout — light blue panel + vertical accent bar (like intro)' },
  { value: 'serif_body', label: 'Serif body — simple reading column (no box)' },
  { value: 'muted_panel', label: 'Muted panel — soft gray bordered box' },
  { value: 'quote', label: 'Quote — italic, left accent bar' },
  { value: 'bordered', label: 'Bordered box' },
  { value: 'highlight_soft', label: 'Soft highlight — light gradient panel' }
];

const TITLE_STYLE_OPTIONS = [
  { value: 'auto', label: 'Journal default — H1 with blue underline rule' },
  { value: 'h1_clean', label: 'H1 — large title, no underline' },
  { value: 'h2_section', label: 'H2 — smaller section heading + rule' },
  { value: 'hidden', label: 'Hide section title' }
];

const CARD_ROW_VARIANTS = [
  { value: 'dark', label: 'Dark blue cards (default)' },
  { value: 'outline', label: 'Outlined cards' },
  { value: 'soft', label: 'Soft gray-blue cards' }
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'image'],
    ['clean']
  ]
};

export default function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState({
    title: '', slug: '', description: '', status: 'draft', template: 'default',
    isHomePage: false, seo: { metaTitle: '', metaDescription: '', metaKeywords: [] }
  });
  const [sections, setSections] = useState([]);
  /** null = no anchor; -1 = before first section; n = insert after sections[n] */
  const [sectionInsertAfterIndex, setSectionInsertAfterIndex] = useState(null);
  const [newSectionTemplate, setNewSectionTemplate] = useState('richtext');
  const [editingSection, setEditingSection] = useState(null);
  const [sectionDraft, setSectionDraft] = useState(null);
  const sectionEditorRef = useRef(null);
  const blockEditorRef = useRef(null);

  useEffect(() => {
    if (isEdit && id) {
      pagesAPI.getById(id).then(({ data }) => {
        const pageData = data?.data ?? data;
        setPage(pageData);
        setSections(pageData?.sections || []);
      }).catch(() => toast.error('Page not found'));
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (editingSection && sectionEditorRef.current) {
      sectionEditorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingSection]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        if (blockEditorRef.current?.persistBlocks) {
          await blockEditorRef.current.persistBlocks();
        }
        await pagesAPI.update(id, page);
        toast.success('Saved — page and content are up to date');
      } else {
        const { data } = await pagesAPI.create(page);
        toast.success('Page created — add blocks on the next screen');
        navigate(`/pages/${data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  /** insertAfterIndex: -1 = top of page; n = after sections[n] */
  const handleAddSectionAtPosition = async (insertAfterIndex) => {
    if (!isEdit) { toast.error('Save the page first'); return; }
    const idx = insertAfterIndex < -1 ? -1 : insertAfterIndex;
    if (sections.length > 0 && idx >= sections.length) return;
    try {
      const tpl = newSectionTemplate;
      const extra = defaultPayloadForNewSection(tpl);
      const { data } = await sectionsAPI.create({
        page: id,
        name: 'New Section',
        type: tpl,
        ...extra
      });
      const created = data?.data ?? data;
      if (!created?._id) throw new Error('Invalid response');
      const insertAt = idx + 1;
      const next = [...sections];
      next.splice(insertAt, 0, created);
      const payload = next.map((s, i) => ({ _id: s._id, order: i }));
      await sectionsAPI.reorder(payload);
      const { data: refreshed } = await pagesAPI.getById(id);
      const pageData = refreshed?.data ?? refreshed;
      setSections(pageData?.sections || next.map((s, i) => ({ ...s, order: i })));
      setSectionInsertAfterIndex(null);
      toast.success(tpl === 'richtext' || tpl === 'text' ? 'Section added — edit content below' : 'Section added — review fields below');
      openSectionEdit(created);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add section');
    }
  };

  const handleAddSectionAtEnd = () => {
    setSectionInsertAfterIndex(null);
    handleAddSectionAtPosition(sections.length === 0 ? -1 : sections.length - 1);
  };

  const handleAddSectionAfterSelection = () => {
    if (sectionInsertAfterIndex === null) {
      toast.error('Click a section row first to choose where the new section goes');
      return;
    }
    handleAddSectionAtPosition(sectionInsertAfterIndex);
  };

  const handleInitPageBlocks = async () => {
    if (!isEdit) { toast.error('Save the page first'); return; }
    if (sections.some((s) => s.type === 'page_blocks')) {
      toast.error('This page already has block content');
      return;
    }
    try {
      const { data } = await sectionsAPI.create({
        page: id,
        name: 'Page content',
        type: 'page_blocks',
        content: { blocks: [], version: 1 }
      });
      const created = data?.data ?? data;
      if (created) setSections([...sections, created].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      toast.success('Block editor ready — add blocks below');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create block content');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Delete this section?')) return;
    try {
      await sectionsAPI.delete(sectionId);
      setSections(sections.filter(s => s._id !== sectionId));
      toast.success('Section deleted');
    } catch (err) { toast.error('Delete failed'); }
  };

  const handleToggleVisibility = async (sectionId) => {
    try {
      const { data } = await sectionsAPI.toggleVisibility(sectionId);
      setSections(sections.map(s => s._id === sectionId ? data.data : s));
    } catch (err) { toast.error('Toggle failed'); }
  };

  const handleDuplicateSection = async (sectionId) => {
    try {
      const { data } = await sectionsAPI.duplicate(sectionId);
      const newSection = data?.data ?? data;
      if (newSection) setSections([...sections, newSection]);
      toast.success('Section duplicated');
    } catch (err) { toast.error('Duplicate failed'); }
  };

  const handleSectionUpdate = async (sectionId, updates) => {
    try {
      const { data } = await sectionsAPI.update(sectionId, updates);
      setSections(sections.map(s => s._id === sectionId ? data.data : s));
      setEditingSection(null);
      setSectionDraft(null);
      toast.success('Section updated');
    } catch (err) { toast.error('Update failed'); }
  };

  const openSectionEdit = (section) => {
    if (section.type === 'page_blocks') {
      toast('Edit page content in the block editor above', { icon: 'ℹ️' });
      return;
    }
    setEditingSection(section._id);
    setSectionDraft(JSON.parse(JSON.stringify({
      name: section.name,
      type: section.type,
      content: section.content || {},
      order: section.order,
      backgroundColor: section.backgroundColor || '',
      paddingTop: section.paddingTop || '',
      paddingBottom: section.paddingBottom || '',
      cssClasses: section.cssClasses || '',
      animation: section.animation || 'none'
    })));
  };

  const handleMoveSection = async (index, direction) => {
    const next = index + direction;
    if (next < 0 || next >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const payload = reordered.map((s, i) => ({ _id: s._id, order: i }));
    try {
      await sectionsAPI.reorder(payload);
      setSections(reordered.map((s, i) => ({ ...s, order: i })));
      toast.success('Order updated');
    } catch {
      toast.error('Reorder failed');
    }
  };

  const closeSectionEdit = () => {
    setEditingSection(null);
    setSectionDraft(null);
  };

  const updateSectionDraft = (field, value) => {
    setSectionDraft(prev => ({ ...prev, [field]: value }));
  };

  const updateSectionContent = (key, value) => {
    setSectionDraft(prev => ({ ...prev, content: { ...(prev.content || {}), [key]: value } }));
  };

  const updateStatsItem = (idx, field, value) => {
    setSectionDraft(prev => {
      const raw = prev.content?.items;
      const base = Array.isArray(raw) && raw.length > 0 ? raw.map((i) => ({ ...i })) : [{ value: '', label: '' }];
      while (base.length <= idx) base.push({ value: '', label: '' });
      base[idx] = { ...base[idx], [field]: value };
      return { ...prev, content: { ...prev.content, items: base } };
    });
  };

  const addStatsRow = () => {
    setSectionDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        items: [...(prev.content?.items || []), { value: '', label: '' }]
      }
    }));
  };

  const removeStatsRow = (idx) => {
    setSectionDraft(prev => {
      const items = [...(prev.content?.items || [])].filter((_, i) => i !== idx);
      return { ...prev, content: { ...prev.content, items: items.length ? items : [{ value: '', label: '' }] } };
    });
  };

  const updateCardItem = (idx, field, value) => {
    setSectionDraft(prev => {
      const raw = prev.content?.cards;
      const base = Array.isArray(raw) && raw.length > 0 ? raw.map((c) => ({ ...c })) : [{ value: '', label: '' }];
      while (base.length <= idx) base.push({ value: '', label: '' });
      base[idx] = { ...base[idx], [field]: value };
      return { ...prev, content: { ...prev.content, cards: base } };
    });
  };

  const addCardRow = () => {
    setSectionDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        cards: [...(prev.content?.cards || []), { value: '', label: '' }]
      }
    }));
  };

  const removeCardRow = (idx) => {
    setSectionDraft(prev => {
      const cards = [...(prev.content?.cards || [])].filter((_, i) => i !== idx);
      return { ...prev, content: { ...prev.content, cards: cards.length ? cards : [{ value: '', label: '' }] } };
    });
  };

  const updateButtonItem = (idx, field, value) => {
    setSectionDraft(prev => {
      const raw = prev.content?.buttons;
      const base = Array.isArray(raw) && raw.length > 0 ? raw.map((b) => ({ ...b })) : [{ label: '', url: '', variant: 'primary' }];
      while (base.length <= idx) base.push({ label: '', url: '', variant: 'primary' });
      base[idx] = { ...base[idx], [field]: value };
      return { ...prev, content: { ...prev.content, buttons: base } };
    });
  };

  const addButtonRow = () => {
    setSectionDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        buttons: [...(prev.content?.buttons || []), { label: 'Button', url: 'home', variant: 'primary' }]
      }
    }));
  };

  const removeButtonRow = (idx) => {
    setSectionDraft(prev => {
      const buttons = [...(prev.content?.buttons || [])].filter((_, i) => i !== idx);
      return { ...prev, content: { ...prev.content, buttons: buttons.length ? buttons : [{ label: '', url: '', variant: 'primary' }] } };
    });
  };

  const updateBadgeItem = (idx, field, value) => {
    setSectionDraft((prev) => {
      const raw = prev.content?.badges;
      const base = Array.isArray(raw) && raw.length > 0 ? raw.map((b) => ({ ...b })) : [{ label: '', url: '' }];
      while (base.length <= idx) base.push({ label: '', url: '' });
      base[idx] = { ...base[idx], [field]: value };
      return { ...prev, content: { ...prev.content, badges: base } };
    });
  };

  const addBadgeRow = () => {
    setSectionDraft((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        badges: [...(prev.content?.badges || []), { label: '', url: '' }]
      }
    }));
  };

  const removeBadgeRow = (idx) => {
    setSectionDraft((prev) => {
      const badges = [...(prev.content?.badges || [])].filter((_, i) => i !== idx);
      return { ...prev, content: { ...prev.content, badges: badges.length ? badges : [{ label: '', url: '' }] } };
    });
  };

  const saveSectionEdit = () => {
    if (!editingSection || !sectionDraft) return;
    handleSectionUpdate(editingSection, sectionDraft);
  };

  const pageBlockSection = sections.find((s) => s.type === 'page_blocks');
  const legacySections = sections.filter((s) => s.type !== 'page_blocks');
  const noSectionRowToAnchor =
    pageBlockSection ? legacySections.length === 0 : sections.length === 0;

  const onPageBlocksSaved = useCallback((updated) => {
    if (!updated?._id) return;
    setSections((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/pages')}><FiArrowLeft /></button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Page' : 'New Page'}</h1>
            <p className="page-subtitle">
              {isEdit
                ? (sections.some((s) => s.type === 'page_blocks')
                  ? 'Blocks save automatically; use Save for title, slug, template, and page settings.'
                  : page.title)
                : 'Create a new page — you will add text and images on the next step.'}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="page-editor-layout-grid" style={{ gap: 24, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Page Title</label>
              <input className="form-input" value={page.title} onChange={e => setPage({ ...page, title: e.target.value })} placeholder="Enter page title" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input className="form-input" value={page.slug} onChange={e => setPage({ ...page, slug: e.target.value })} placeholder="page-url-slug" />
              </div>
              <div className="form-group">
                <label className="form-label">Template</label>
                <select className="form-select" value={page.template} onChange={e => setPage({ ...page, template: e.target.value })}>
                  <option value="default">Default</option>
                  <option value="articles">Articles</option>
                  <option value="preprint">Preprint</option>
                  <option value="published">Published</option>
                  <option value="contact">Contact</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={page.description || ''} onChange={e => setPage({ ...page, description: e.target.value })} placeholder="Brief description" rows={3} />
            </div>
          </div>

          {isEdit && pageBlockSection && (
            <PageBlockEditor ref={blockEditorRef} section={pageBlockSection} onSectionSaved={onPageBlocksSaved} />
          )}

          {isEdit && !pageBlockSection && (
            <div className="card" style={{ marginBottom: 20, borderStyle: 'dashed' }}>
              <h3 className="card-title" style={{ marginBottom: 8 }}>Page content</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                This page has no block editor yet (older page). One click adds the simple editor: headings, text with a <strong>visible</strong> formatting bar, images, buttons, and more.
              </p>
              <button type="button" className="btn btn-primary" onClick={handleInitPageBlocks}><FiPlus /> Add block editor</button>
            </div>
          )}

          {isEdit && (
            <div className="card">
              <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
                <h3 className="card-title">
                  {`Sections (${pageBlockSection ? legacySections.length : sections.length})`}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddSectionAfterSelection}
                    disabled={noSectionRowToAnchor}
                    title={
                      noSectionRowToAnchor
                        ? 'Add a section using the buttons below first'
                        : sectionInsertAfterIndex === null
                          ? 'Click a section row below to set position'
                          : 'Insert a new section after the highlighted row'
                    }
                  >
                    <FiPlus /> Add section here
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleAddSectionAtEnd} title="Append at end of page">
                    <FiPlus /> Add at end
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
                Click a section row to choose where to insert, then press <strong>Add section here</strong>. Use <strong>Add at end</strong> to append.
              </p>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">New section template</label>
                <select
                  className="form-select"
                  style={{ maxWidth: 420 }}
                  value={newSectionTemplate}
                  onChange={(e) => setNewSectionTemplate(e.target.value)}
                >
                  {NEW_SECTION_TEMPLATE_TYPES.map((t) => (
                    <option key={t} value={t}>{sectionTypeSelectLabel(t)}</option>
                  ))}
                </select>
                <p className="form-helper">Choose the section type, then use the add buttons above.</p>
              </div>
              {!pageBlockSection && sections.length > 0 && (
                <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSectionInsertAfterIndex(-1)}>
                    Select: insert at top
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleAddSectionAtPosition(-1)}>
                    <FiPlus /> Add first at top
                  </button>
                </div>
              )}
              {(pageBlockSection ? legacySections : sections).length === 0 ? (
                <div className="empty-state" style={{ padding: 30, textAlign: 'center' }}>
                  <p>
                    No sections yet. Choose a template and click <strong>Add at end</strong>.
                  </p>
                  {!pageBlockSection ? (
                    <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => handleAddSectionAtPosition(-1)}>
                      <FiPlus /> Add first section
                    </button>
                  ) : null}
                </div>
              ) : (
                (pageBlockSection ? legacySections : sections).map((section) => {
                  const fullIndex = sections.indexOf(section);
                  return (
                    <div
                      key={section._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSectionInsertAfterIndex(fullIndex)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSectionInsertAfterIndex(fullIndex);
                        }
                      }}
                      style={{
                        padding: '14px 12px',
                        margin: '0 -12px',
                        borderBottom: '1px solid var(--card-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                        cursor: 'pointer',
                        borderRadius: 8,
                        outline: 'none',
                        transition: 'box-shadow 0.15s, background 0.15s',
                        boxShadow: sectionInsertAfterIndex === fullIndex ? '0 0 0 2px var(--primary)' : 'none',
                        background: sectionInsertAfterIndex === fullIndex ? 'var(--primary-bg)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                        <div>
                          <strong>{section.name}</strong>
                          <span className={`badge badge-${section.isVisible ? 'published' : 'draft'}`} style={{ marginLeft: 8 }}>{section.type}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            {sectionInsertAfterIndex === fullIndex ? 'Selected — click “Add section here” above' : 'Click row to insert after this section'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn btn-outline btn-sm" disabled={fullIndex <= 0} onClick={() => handleMoveSection(fullIndex, -1)} title="Move up"><FiArrowUp /></button>
                        <button type="button" className="btn btn-outline btn-sm" disabled={fullIndex < 0 || fullIndex >= sections.length - 1} onClick={() => handleMoveSection(fullIndex, 1)} title="Move down"><FiArrowDown /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => openSectionEdit(section)} title="Edit section"><FiEdit2 /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDuplicateSection(section._id)} title="Duplicate"><FiCopy /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleToggleVisibility(section._id)} title={section.isVisible ? 'Hide' : 'Show'}>
                          {section.isVisible ? <FiEye /> : <FiEyeOff />}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDeleteSection(section._id)} style={{ color: 'var(--danger)' }} title="Delete"><FiTrash2 /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          </div>

          <div style={{ minWidth: 0 }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Settings</h3>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={page.status} onChange={e => setPage({ ...page, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={page.isHomePage || false} onChange={e => setPage({ ...page, isHomePage: e.target.checked })} />
                Set as Home Page
              </label>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>SEO</h3>
            <div className="form-group">
              <label className="form-label">Meta Title</label>
              <input className="form-input" value={page.seo?.metaTitle || ''} onChange={e => setPage({ ...page, seo: { ...page.seo, metaTitle: e.target.value } })} />
            </div>
            <div className="form-group">
              <label className="form-label">Meta Description</label>
              <textarea className="form-textarea" rows={3} value={page.seo?.metaDescription || ''} onChange={e => setPage({ ...page, seo: { ...page.seo, metaDescription: e.target.value } })} />
            </div>
          </div>
          </div>
        </div>

          {editingSection && sectionDraft && (
            <div
              ref={sectionEditorRef}
              className="card"
              style={{ borderColor: 'var(--primary)', borderWidth: 2, width: '100%', maxWidth: '100%' }}
            >
              <div className="card-header" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h3 className="card-title" style={{ margin: 0 }}>Edit section</h3>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{sectionDraft.name || 'Untitled'} · {sectionDraft.type}</span>
                </div>
                <div className="section-editor-actions" style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={saveSectionEdit}><FiSave /> Save section</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={closeSectionEdit}><FiX /> Cancel</button>
                </div>
              </div>
              <div className="page-editor-section-edit-grid" style={{ gap: 28, padding: '8px 4px 28px 8px' }}>
                <div style={{ minWidth: 0 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Section Name</label>
                    <input className="form-input" value={sectionDraft.name || ''} onChange={e => updateSectionDraft('name', e.target.value)} placeholder="Section name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={sectionDraft.type || 'richtext'} onChange={e => updateSectionDraft('type', e.target.value)}>
                      {SECTION_TYPES.map((t) => (
                        <option key={t} value={t}>{sectionTypeSelectLabel(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(sectionDraft.type === 'richtext' || sectionDraft.type === 'text') && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Section heading (optional)</label>
                        <input
                          className="form-input"
                          value={sectionDraft.content?.heading ?? sectionDraft.content?.title ?? ''}
                          onChange={e => updateSectionContent('heading', e.target.value)}
                          placeholder="e.g. Welcome to IJCDS"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Title style</label>
                        <select
                          className="form-select"
                          value={sectionDraft.content?.titleStyle || 'auto'}
                          onChange={e => updateSectionContent('titleStyle', e.target.value)}
                        >
                          {TITLE_STYLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Content box style</label>
                      <select
                        className="form-select"
                        value={sectionDraft.content?.bodyTheme || 'auto'}
                        onChange={e => updateSectionContent('bodyTheme', e.target.value)}
                      >
                        {BODY_THEME_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Body (use toolbar for bold, underline, headings)</label>
                      <QuillField
                        key={editingSection}
                        html={sectionDraft.content?.html ?? sectionDraft.content?.body ?? ''}
                        onChange={v => updateSectionContent(sectionDraft.type === 'text' ? 'body' : 'html', v)}
                        modules={QUILL_MODULES}
                        style={{ minHeight: 200, marginBottom: 60 }}
                      />
                    </div>
                  </>
                )}

                {sectionDraft.type === 'stats' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Card row style</label>
                      <select
                        className="form-select"
                        value={sectionDraft.content?.rowVariant || 'dark'}
                        onChange={e => updateSectionContent('rowVariant', e.target.value)}
                      >
                        {CARD_ROW_VARIANTS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section title (optional)</label>
                      <input
                        className="form-input"
                        value={sectionDraft.content?.heading ?? sectionDraft.content?.title ?? ''}
                        onChange={e => updateSectionContent('heading', e.target.value)}
                        placeholder="Optional heading above cards"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Title style</label>
                      <select
                        className="form-select"
                        value={sectionDraft.content?.titleStyle || 'auto'}
                        onChange={e => updateSectionContent('titleStyle', e.target.value)}
                      >
                        {TITLE_STYLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <label className="form-label">Highlight cards</label>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Large value on top, caption below (caption is uppercased on the site). Same layout as your home page stats row.
                    </p>
                    {(Array.isArray(sectionDraft.content?.items) && sectionDraft.content.items.length > 0
                      ? sectionDraft.content.items
                      : [{ value: '', label: '' }]
                    ).map((row, idx) => (
                      <div key={idx} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 8, gap: 8 }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Value (large)</label>
                          <input className="form-input" value={row.value ?? ''} onChange={e => updateStatsItem(idx, 'value', e.target.value)} placeholder="2012" />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Label (caption)</label>
                          <input className="form-input" value={row.label ?? ''} onChange={e => updateStatsItem(idx, 'label', e.target.value)} placeholder="Founded" />
                        </div>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => removeStatsRow(idx)} disabled={((sectionDraft.content?.items?.length) || 1) <= 1} title="Remove row"><FiTrash2 /></button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={addStatsRow} style={{ marginTop: 4 }}><FiPlus /> Add card</button>
                  </div>
                )}

                {sectionDraft.type === 'cards' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Card row style</label>
                      <select
                        className="form-select"
                        value={sectionDraft.content?.rowVariant || 'dark'}
                        onChange={e => updateSectionContent('rowVariant', e.target.value)}
                      >
                        {CARD_ROW_VARIANTS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section title (optional)</label>
                      <input
                        className="form-input"
                        value={sectionDraft.content?.heading ?? sectionDraft.content?.title ?? ''}
                        onChange={e => updateSectionContent('heading', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Title style</label>
                      <select
                        className="form-select"
                        value={sectionDraft.content?.titleStyle || 'auto'}
                        onChange={e => updateSectionContent('titleStyle', e.target.value)}
                      >
                        {TITLE_STYLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <label className="form-label">Cards (same look as Stats)</label>
                    {(Array.isArray(sectionDraft.content?.cards) && sectionDraft.content.cards.length > 0
                      ? sectionDraft.content.cards
                      : [{ value: '', label: '' }]
                    ).map((row, idx) => (
                      <div key={idx} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 8, gap: 8 }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Value (large)</label>
                          <input className="form-input" value={row.value ?? row.title ?? ''} onChange={e => updateCardItem(idx, 'value', e.target.value)} placeholder="2012" />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Label</label>
                          <input className="form-input" value={row.label ?? row.description ?? ''} onChange={e => updateCardItem(idx, 'label', e.target.value)} placeholder="Founded" />
                        </div>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => removeCardRow(idx)} disabled={((sectionDraft.content?.cards?.length) || 1) <= 1} title="Remove"><FiTrash2 /></button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={addCardRow} style={{ marginTop: 4 }}><FiPlus /> Add card</button>
                  </div>
                )}

                {sectionDraft.type === 'buttons' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Section title (optional)</label>
                      <input
                        className="form-input"
                        value={sectionDraft.content?.heading ?? sectionDraft.content?.title ?? ''}
                        onChange={e => updateSectionContent('heading', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Title style</label>
                        <select
                          className="form-select"
                          value={sectionDraft.content?.titleStyle || 'auto'}
                          onChange={e => updateSectionContent('titleStyle', e.target.value)}
                        >
                          {TITLE_STYLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Alignment</label>
                        <select
                          className="form-select"
                          value={sectionDraft.content?.align || 'left'}
                          onChange={e => updateSectionContent('align', e.target.value)}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                    <label className="form-label">Buttons</label>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Internal links: use page slug only (e.g. <code>published</code>, <code>contact</code>). External: full URL (<code>https://...</code>).
                    </p>
                    {(Array.isArray(sectionDraft.content?.buttons) && sectionDraft.content.buttons.length > 0
                      ? sectionDraft.content.buttons
                      : [{ label: '', url: '', variant: 'primary' }]
                    ).map((row, idx) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, border: '1px solid var(--card-border)', borderRadius: 8 }}>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Label</label>
                            <input className="form-input" value={row.label ?? ''} onChange={e => updateButtonItem(idx, 'label', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">URL or slug</label>
                            <input className="form-input" value={row.url ?? ''} onChange={e => updateButtonItem(idx, 'url', e.target.value)} placeholder="published or https://..." />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Style</label>
                            <select className="form-select" value={row.variant || 'primary'} onChange={e => updateButtonItem(idx, 'variant', e.target.value)}>
                              <option value="primary">Primary (navy)</option>
                              <option value="accent">Accent (blue)</option>
                              <option value="outline">Outline</option>
                              <option value="ghost">Ghost / link</option>
                            </select>
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input type="checkbox" checked={!!row.newTab} onChange={e => updateButtonItem(idx, 'newTab', e.target.checked)} />
                          Open in new tab (external links)
                        </label>
                        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => removeButtonRow(idx)} disabled={((sectionDraft.content?.buttons?.length) || 1) <= 1}><FiTrash2 /> Remove button</button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={addButtonRow}><FiPlus /> Add button</button>
                  </div>
                )}

                {sectionDraft.type === 'tag_badges' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Section title (optional)</label>
                      <input
                        className="form-input"
                        value={sectionDraft.content?.heading ?? sectionDraft.content?.title ?? ''}
                        onChange={(e) => updateSectionContent('heading', e.target.value)}
                        placeholder="e.g. Indexed in"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Title style</label>
                        <select
                          className="form-select"
                          value={sectionDraft.content?.titleStyle || 'auto'}
                          onChange={(e) => updateSectionContent('titleStyle', e.target.value)}
                        >
                          {TITLE_STYLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Alignment</label>
                        <select
                          className="form-select"
                          value={sectionDraft.content?.align || 'center'}
                          onChange={(e) => updateSectionContent('align', e.target.value)}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                    <label className="form-label">Tags</label>
                    <p className="form-helper" style={{ marginBottom: 10 }}>
                      Navy pills with white text. Leave URL empty for plain text, or add a link (e.g. database profile).
                    </p>
                    {(Array.isArray(sectionDraft.content?.badges) && sectionDraft.content.badges.length > 0
                      ? sectionDraft.content.badges
                      : [{ label: '', url: '' }]
                    ).map((row, idx) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 12, border: '1px solid var(--card-border)', borderRadius: 8 }}>
                        <div className="form-row">
                          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">Label</label>
                            <input
                              className="form-input"
                              value={row.label ?? ''}
                              onChange={(e) => updateBadgeItem(idx, 'label', e.target.value)}
                              placeholder="Scopus"
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">URL (optional)</label>
                            <input
                              className="form-input"
                              value={row.url ?? ''}
                              onChange={(e) => updateBadgeItem(idx, 'url', e.target.value)}
                              placeholder="https://…"
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ alignSelf: 'flex-end' }}
                            onClick={() => removeBadgeRow(idx)}
                            disabled={((sectionDraft.content?.badges?.length) || 1) <= 1}
                            title="Remove"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={addBadgeRow} style={{ marginTop: 4 }}>
                      <FiPlus /> Add tag
                    </button>
                  </div>
                )}

                {sectionDraft.type === 'custom_html' && (
                  <div className="form-group">
                    <label className="form-label">HTML Content</label>
                    <textarea className="form-textarea" rows={12} value={sectionDraft.content?.html ?? sectionDraft.content?.body ?? ''} onChange={e => updateSectionContent('html', e.target.value)} placeholder="<div>Your HTML...</div>" />
                  </div>
                )}

                {sectionDraft.type === 'hero' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Title / Heading</label>
                      <input className="form-input" value={sectionDraft.content?.title ?? sectionDraft.content?.heading ?? ''} onChange={e => updateSectionContent('title', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subtitle</label>
                      <input className="form-input" value={sectionDraft.content?.subtitle ?? sectionDraft.content?.subheading ?? ''} onChange={e => updateSectionContent('subtitle', e.target.value)} />
                    </div>
                  </>
                )}

                {sectionDraft.type === 'banner' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input className="form-input" value={sectionDraft.content?.title ?? ''} onChange={e => updateSectionContent('title', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Text</label>
                      <textarea className="form-textarea" rows={3} value={sectionDraft.content?.text ?? ''} onChange={e => updateSectionContent('text', e.target.value)} />
                    </div>
                  </>
                )}

                {sectionDraft.type === 'contact' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Heading</label>
                      <input className="form-input" value={sectionDraft.content?.heading ?? ''} onChange={e => updateSectionContent('heading', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" rows={2} value={sectionDraft.content?.description ?? ''} onChange={e => updateSectionContent('description', e.target.value)} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={sectionDraft.content?.email ?? ''} onChange={e => updateSectionContent('email', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input className="form-input" value={sectionDraft.content?.phone ?? ''} onChange={e => updateSectionContent('phone', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input className="form-input" value={sectionDraft.content?.address ?? ''} onChange={e => updateSectionContent('address', e.target.value)} />
                    </div>
                  </>
                )}

                {sectionDraft.type === 'cta' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input className="form-input" value={sectionDraft.content?.title ?? ''} onChange={e => updateSectionContent('title', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Value / Price</label>
                      <input className="form-input" value={sectionDraft.content?.value ?? ''} onChange={e => updateSectionContent('value', e.target.value)} placeholder="e.g. 265 USD" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" rows={2} value={sectionDraft.content?.description ?? ''} onChange={e => updateSectionContent('description', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Body (HTML)</label>
                      <QuillField
                        key={editingSection}
                        html={sectionDraft.content?.body ?? ''}
                        onChange={v => updateSectionContent('body', v)}
                        modules={QUILL_MODULES}
                        style={{ minHeight: 120, marginBottom: 48 }}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Action button label</label>
                        <input className="form-input" value={sectionDraft.content?.buttonLabel ?? ''} onChange={e => updateSectionContent('buttonLabel', e.target.value)} placeholder="e.g. Submit manuscript" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Action button URL / slug</label>
                        <input className="form-input" value={sectionDraft.content?.buttonUrl ?? ''} onChange={e => updateSectionContent('buttonUrl', e.target.value)} placeholder="authors or https://..." />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Button style</label>
                        <select className="form-select" value={sectionDraft.content?.buttonVariant || 'primary'} onChange={e => updateSectionContent('buttonVariant', e.target.value)}>
                          <option value="primary">Primary</option>
                          <option value="accent">Accent</option>
                          <option value="outline">Outline</option>
                          <option value="ghost">Ghost</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={!!sectionDraft.content?.buttonNewTab} onChange={e => updateSectionContent('buttonNewTab', e.target.checked)} />
                          New tab (external)
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {['image', 'gallery', 'accordion', 'team', 'video', 'testimonials', 'timeline'].includes(sectionDraft.type) && (
                  <div className="form-group">
                    <label className="form-label">Content (JSON)</label>
                    <textarea className="form-textarea" rows={12} value={typeof sectionDraft.content === 'object' ? JSON.stringify(sectionDraft.content, null, 2) : '{}'} onChange={e => { try { const parsed = JSON.parse(e.target.value || '{}'); setSectionDraft(prev => ({ ...prev, content: parsed })); } catch {} }} placeholder='{"key": "value"}' style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 200 }} />
                  </div>
                )}
                </div>

                <div style={{
                  position: 'sticky',
                  top: 16,
                  alignSelf: 'start',
                  padding: '18px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--card-border)',
                  background: 'var(--surface-muted)',
                  maxHeight: 'min(85vh, 800px)',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Appearance on site</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.45 }}>Background, spacing, animation, and extra CSS classes for this section only.</p>
                  <div className="form-group">
                    <label className="form-label">Background color</label>
                    <input className="form-input" value={sectionDraft.backgroundColor || ''} onChange={e => updateSectionDraft('backgroundColor', e.target.value)} placeholder="#f5f7fa or empty" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Animation</label>
                    <select className="form-select" value={sectionDraft.animation || 'none'} onChange={e => updateSectionDraft('animation', e.target.value)}>
                      <option value="none">None</option>
                      <option value="fadeIn">Fade in</option>
                      <option value="slideUp">Slide up</option>
                      <option value="slideLeft">Slide left</option>
                      <option value="slideRight">Slide right</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Padding top</label>
                    <input className="form-input" value={sectionDraft.paddingTop || ''} onChange={e => updateSectionDraft('paddingTop', e.target.value)} placeholder="e.g. 24px" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Padding bottom</label>
                    <input className="form-input" value={sectionDraft.paddingBottom || ''} onChange={e => updateSectionDraft('paddingBottom', e.target.value)} placeholder="e.g. 32px" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Extra CSS classes</label>
                    <input className="form-input" value={sectionDraft.cssClasses || ''} onChange={e => updateSectionDraft('cssClasses', e.target.value)} placeholder="my-class" />
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
