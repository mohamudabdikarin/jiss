import { useState, useEffect, useLayoutEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Quill editor with local state. Prevents cursor-reset / lost-space bug that
 * occurs when ReactQuill is fully controlled and the parent re-renders on every
 * keystroke. The `html` prop is only read on mount; after that the component
 * drives Quill from its own state and only notifies the parent via onChange.
 * Use `key={block.id}` on the parent so this remounts if the block is replaced.
 */
function QuillBlockField({ html, onChange, modules, formats, placeholder }) {
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
      formats={formats}
      placeholder={placeholder}
    />
  );
}
import { sectionsAPI } from '../../../api';
import {
  FiMenu,
  FiTrash2,
  FiCopy,
  FiArrowUp,
  FiArrowDown,
  FiPlus,
  FiChevronDown,
  FiMoreVertical
} from 'react-icons/fi';
import './PageBlockEditor.css';

/** Debounced background save — no toast (see PageEditor top Save for full page). */
const AUTO_SAVE_DELAY_MS = 2500;

function buildAutosaveFingerprint(blocks, appear) {
  return JSON.stringify({
    blocks,
    appear: {
      backgroundColor: appear?.backgroundColor || '',
      paddingTop: appear?.paddingTop || '',
      paddingBottom: appear?.paddingBottom || '',
      animation: appear?.animation || 'none',
      cssClasses: appear?.cssClasses || ''
    }
  });
}

const SNOW_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean']
  ]
};

const SNOW_FORMATS = [
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'link',
  'list', 'bullet',
  'align'
];

const ADD_OPTIONS = [
  { type: 'heading', label: 'Heading', hint: 'Large title — type in the box' },
  { type: 'paragraph', label: 'Paragraph', hint: 'Use the bar above the text to format' },
  { type: 'image', label: 'Image', hint: 'URL + alt text' },
  { type: 'list', label: 'List', hint: 'Bullets or numbers' },
  { type: 'quote', label: 'Quote', hint: 'Blockquote style' },
  { type: 'button', label: 'Button', hint: 'CTA with link' },
  { type: 'divider', label: 'Divider', hint: 'Horizontal line' },
  { type: 'columns', label: 'Columns', hint: 'Two columns side by side' },
  { type: 'spacer', label: 'Spacer', hint: 'Vertical space' },
  { type: 'video', label: 'Video', hint: 'YouTube or embed URL' },
  { type: 'card', label: 'Card', hint: 'Image + title + text' },
  { type: 'profile_heading', label: 'Role / board line', hint: 'Bold title + red bar + names & affiliations (multiple lines)' },
  { type: 'tag_pills', label: 'Tag badges', hint: 'Navy pills — indexed in, partners, databases (like site section)' },
  {
    type: 'apc_callout',
    label: 'Fee / APC box',
    hint: 'Cream panel — label, large amount, small note (e.g. article processing charge)'
  },
  {
    type: 'shape',
    label: 'Shape',
    hint: 'Styled box — set background, border, padding; format text inside (e.g. contact card)'
  }
];

function newBlockId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Safe inline-style fragments for shape blocks (mirrors client RenderPageBlocks). */
function safeShapeColor(value, fallback) {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  if (s.length > 50) return fallback;
  if (/[;{}]|<|url\s*\(|expression|javascript:/i.test(s)) return fallback;
  return s;
}
function safeShapeLength(value, fallback) {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  if (s.length > 16) return fallback;
  if (/^(thin|medium|thick)$/i.test(s)) return s.toLowerCase();
  if (/^\d+(\.\d+)?$/i.test(s)) return `${s}px`;
  if (/^\d+(\.\d+)?(px|rem|em|%)$/i.test(s)) return s;
  if (s === '0') return '0';
  return fallback;
}
function safeShapePadding(value, fallback) {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  if (s.length > 48) return fallback;
  const parts = s.split(/\s+/).filter(Boolean);
  if (!parts.length || parts.length > 4) return fallback;
  const fixed = [];
  for (const p of parts) {
    if (p === '0') {
      fixed.push('0');
      continue;
    }
    if (/^\d+(\.\d+)?$/i.test(p)) {
      fixed.push(`${p}px`);
      continue;
    }
    if (/^\d+(\.\d+)?(px|rem|em|%)$/i.test(p)) {
      fixed.push(p);
      continue;
    }
    return fallback;
  }
  return fixed.join(' ');
}
function shapeBoxStyle(block) {
  return {
    backgroundColor: safeShapeColor(block.backgroundColor, '#f0f7ff'),
    borderColor: safeShapeColor(block.borderColor, '#b8d4eb'),
    borderWidth: safeShapeLength(block.borderWidth, '1px'),
    borderStyle: 'solid',
    borderRadius: safeShapeLength(block.borderRadius, '8px'),
    padding: safeShapePadding(block.padding, '24px')
  };
}

function migrateBlockFromServer(b) {
  if (!b || typeof b !== 'object') return b;
  const x = { ...b };
  if (x.type === 'heading' && (x.text == null || String(x.text).trim() === '') && x.html) {
    x.text = String(x.html).replace(/<[^>]*>/g, '').trim();
  }
  return x;
}

function createBlock(type) {
  const id = newBlockId();
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 'h2', text: '', align: 'left' };
    case 'paragraph':
      return { id, type: 'paragraph', html: '<p><br></p>' };
    case 'image':
      return { id, type: 'image', src: '', alt: '', width: '100%' };
    case 'list':
      return { id, type: 'list', ordered: false, html: '<ul><li><br></li></ul>' };
    case 'quote':
      return { id, type: 'quote', html: '<p><br></p>' };
    case 'button':
      return { id, type: 'button', label: 'Learn more', url: 'home', variant: 'primary', newTab: false };
    case 'divider':
      return { id, type: 'divider' };
    case 'columns':
      return { id, type: 'columns', col1Html: '<p><br></p>', col2Html: '<p><br></p>' };
    case 'spacer':
      return { id, type: 'spacer', height: '32px' };
    case 'video':
      return { id, type: 'video', url: '' };
    case 'card':
      return { id, type: 'card', imageSrc: '', title: '', bodyHtml: '<p><br></p>' };
    case 'profile_heading':
      return { id, type: 'profile_heading', title: '', subtitle: '', accentColor: '#c8102e' };
    case 'tag_pills':
      return {
        id,
        type: 'tag_pills',
        heading: '',
        align: 'center',
        badges: [
          { label: 'Scopus', url: '' },
          { label: 'Google Scholar', url: '' },
          { label: '', url: '' }
        ]
      };
    case 'apc_callout':
      return {
        id,
        type: 'apc_callout',
        label: 'Article Processing Charge (APC)',
        amount: '265 USD',
        note: 'For all accepted manuscripts (effective from July 1, 2023)'
      };
    case 'shape':
      return {
        id,
        type: 'shape',
        html: '<p><br></p>',
        backgroundColor: '#f0f7ff',
        borderColor: '#b8d4eb',
        borderWidth: '1px',
        borderRadius: '8px',
        padding: '24px'
      };
    default:
      return { id, type: 'paragraph', html: '<p><br></p>' };
  }
}

function BlockRow({
  index,
  total,
  children,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragging,
  onDup,
  onDel,
  onUp,
  onDown,
  isInsertAnchor,
  onSelectInsertAfter
}) {
  const isQuillActive = () => {
    const ae = typeof document !== 'undefined' ? document.activeElement : null;
    if (!ae || !(ae instanceof Element)) return false;
    return Boolean(
      ae.closest('.ql-editor, .ql-container, [contenteditable="true"]') ||
      ae.classList.contains('ql-editor')
    );
  };

  const onRowClick = (e) => {
    if (!onSelectInsertAfter) return;
    const target = e.target;
    if (target instanceof Element && target.closest('button, input, textarea, select, .ql-editor, [contenteditable="true"], a, summary')) return;
    onSelectInsertAfter(index);
  };

  return (
    <div
      className={`pb-block${dragging ? ' pb-block--dragging' : ''}${isInsertAnchor ? ' pb-block--insert-anchor' : ''}`}
      onClick={onRowClick}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      role={onSelectInsertAfter ? 'button' : undefined}
      tabIndex={onSelectInsertAfter ? 0 : undefined}
      onKeyDown={
        onSelectInsertAfter
          ? (e) => {
              if (isQuillActive()) return;
              const target = e.target;
              if (target instanceof Element && target.closest('button, input, textarea, select, .ql-editor, [contenteditable="true"], a, summary')) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectInsertAfter(index);
              }
            }
          : undefined
      }
    >
      <button
        type="button"
        className="pb-block-grip"
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <FiMenu size={18} />
      </button>
      <div className="pb-block-body">{children}</div>
      <details className="pb-block-menu">
        <summary className="pb-block-menu-btn" aria-label="Block actions">
          <FiMoreVertical size={18} />
        </summary>
        <div className="pb-block-menu-panel">
          <button type="button" disabled={index === 0} onClick={() => { onUp(index); document.activeElement?.blur?.(); }}>Move up</button>
          <button type="button" disabled={index >= total - 1} onClick={() => { onDown(index); document.activeElement?.blur?.(); }}>Move down</button>
          <button type="button" onClick={() => { onDup(index); document.activeElement?.blur?.(); }}>Duplicate</button>
          <button type="button" className="pb-block-menu-danger" onClick={() => { onDel(index); document.activeElement?.blur?.(); }}>Delete</button>
        </div>
      </details>
    </div>
  );
}

function renderBlockFields(block, index, updateBlockField) {
  const setField = (key, value) => updateBlockField(index, key, value);

  switch (block.type) {
    case 'heading':
      return (
        <>
          <div className="pb-heading-row">
            <select className="form-select" style={{ width: 'auto' }} value={block.level || 'h2'} onChange={(e) => setField('level', e.target.value)}>
              <option value="h1">H1 — main title</option>
              <option value="h2">H2 — section</option>
              <option value="h3">H3 — smaller</option>
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={block.align || 'left'} onChange={(e) => setField('align', e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <input
            className="form-input"
            style={{ fontSize: '1.2rem', fontWeight: 700 }}
            value={block.text ?? ''}
            onChange={(e) => setField('text', e.target.value)}
            placeholder="Type the heading"
          />
        </>
      );
    case 'paragraph':
    case 'quote':
      return (
        <div className="pb-quill">
          <QuillBlockField
            html={block.html || ''}
            onChange={(html) => setField('html', html)}
            modules={SNOW_MODULES}
            formats={SNOW_FORMATS}
            placeholder={block.type === 'quote' ? 'Quote text…' : 'Type here — formatting bar is above'}
          />
        </div>
      );
    case 'list':
      return (
        <>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">List style</label>
            <select className="form-select" value={block.ordered ? 'ol' : 'ul'} onChange={(e) => setField('ordered', e.target.value === 'ol')}>
              <option value="ul">Bulleted</option>
              <option value="ol">Numbered</option>
            </select>
          </div>
          <div className="pb-quill">
            <QuillBlockField
              html={block.html || ''}
              onChange={(html) => setField('html', html)}
              modules={SNOW_MODULES}
              formats={SNOW_FORMATS}
              placeholder="Use the list buttons in the toolbar above"
            />
          </div>
        </>
      );
    case 'image':
      return (
        <>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input className="form-input" value={block.src || ''} onChange={(e) => setField('src', e.target.value)} placeholder="https://…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Alt text</label>
              <input className="form-input" value={block.alt || ''} onChange={(e) => setField('alt', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Max width</label>
              <input className="form-input" value={block.width || '100%'} onChange={(e) => setField('width', e.target.value)} placeholder="100%" />
            </div>
          </div>
        </>
      );
    case 'button':
      return (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Label</label>
              <input className="form-input" value={block.label || ''} onChange={(e) => setField('label', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">URL / slug</label>
              <input className="form-input" value={block.url || ''} onChange={(e) => setField('url', e.target.value)} placeholder="home or https://…" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Style</label>
              <select className="form-select" value={block.variant || 'primary'} onChange={(e) => setField('variant', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="accent">Accent</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={!!block.newTab} onChange={(e) => setField('newTab', e.target.checked)} />
                Open in new tab (external links)
              </label>
            </div>
          </div>
        </>
      );
    case 'divider':
      return <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Horizontal rule — no options.</p>;
    case 'columns':
      return (
        <div className="pb-columns-row">
          <div>
            <div className="pb-meta-label">Column 1</div>
            <div className="pb-quill">
              <QuillBlockField
                html={block.col1Html || ''}
                onChange={(html) => setField('col1Html', html)}
                modules={SNOW_MODULES}
                formats={SNOW_FORMATS}
              />
            </div>
          </div>
          <div>
            <div className="pb-meta-label">Column 2</div>
            <div className="pb-quill">
              <QuillBlockField
                html={block.col2Html || ''}
                onChange={(html) => setField('col2Html', html)}
                modules={SNOW_MODULES}
                formats={SNOW_FORMATS}
              />
            </div>
          </div>
        </div>
      );
    case 'spacer':
      return (
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Height (CSS)</label>
          <input className="form-input" value={block.height || '32px'} onChange={(e) => setField('height', e.target.value)} placeholder="32px" style={{ maxWidth: 160 }} />
        </div>
      );
    case 'video':
      return (
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">YouTube or embed URL</label>
          <input className="form-input" value={block.url || ''} onChange={(e) => setField('url', e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
        </div>
      );
    case 'card':
      return (
        <>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input className="form-input" value={block.imageSrc || ''} onChange={(e) => setField('imageSrc', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={block.title || ''} onChange={(e) => setField('title', e.target.value)} />
          </div>
          <div className="pb-meta-label">Body</div>
          <div className="pb-quill">
            <QuillBlockField
              html={block.bodyHtml || ''}
              onChange={(html) => setField('bodyHtml', html)}
              modules={SNOW_MODULES}
              formats={SNOW_FORMATS}
            />
          </div>
        </>
      );
    case 'profile_heading':
      return (
        <>
          <div className="form-group">
            <label className="form-label">Role / title</label>
            <input
              className="form-input"
              value={block.title || ''}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Editor-in-Chief"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Names &amp; affiliations</label>
            <textarea
              className="form-textarea"
              rows={6}
              value={block.subtitle || ''}
              onChange={(e) => setField('subtitle', e.target.value)}
              placeholder={'One or more lines, e.g.\nMazen Ali, University of Bahrain, Bahrain\nJane Doe, MIT, USA'}
            />
            <p className="form-helper">Use line breaks for extra people, institutions, or paragraphs.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Accent bar color</label>
            <input
              className="form-input"
              type="color"
              value={block.accentColor || '#c8102e'}
              onChange={(e) => setField('accentColor', e.target.value)}
              style={{ maxWidth: 120, height: 40, padding: 4, cursor: 'pointer' }}
            />
          </div>
          <div className="pb-profile-preview-wrap">
            <div className="pb-meta-label" style={{ marginBottom: 8 }}>Preview</div>
            <div className="pb-profile-heading">
              <div className="pb-profile-heading__head">
                <span
                  className="pb-profile-heading__bar"
                  style={{ backgroundColor: block.accentColor || '#c8102e' }}
                  aria-hidden
                />
                <h3 className="pb-profile-heading__title">{block.title || 'Role title'}</h3>
              </div>
              {block.subtitle ? <p className="pb-profile-heading__subtitle">{block.subtitle}</p> : null}
            </div>
          </div>
        </>
      );
    case 'tag_pills': {
      const badges =
        Array.isArray(block.badges) && block.badges.length > 0
          ? block.badges
          : [{ label: '', url: '' }];
      const setBadges = (next) => updateBlockField(index, 'badges', next);
      const patchBadge = (bi, field, val) => {
        const next = badges.map((b, i) => (i === bi ? { ...b, [field]: val } : b));
        setBadges(next);
      };
      const addBadge = () => setBadges([...badges, { label: '', url: '' }]);
      const removeBadge = (bi) => {
        const next = badges.filter((_, i) => i !== bi);
        setBadges(next.length ? next : [{ label: '', url: '' }]);
      };
      const visible = badges.filter((b) => b && String(b.label || '').trim());
      const align = block.align === 'left' || block.align === 'right' ? block.align : 'center';
      return (
        <>
          <div className="form-group">
            <label className="form-label">Optional title above pills</label>
            <input
              className="form-input"
              value={block.heading || ''}
              onChange={(e) => updateBlockField(index, 'heading', e.target.value)}
              placeholder="e.g. Indexed in"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Alignment</label>
            <select
              className="form-select"
              style={{ maxWidth: 200 }}
              value={block.align || 'center'}
              onChange={(e) => updateBlockField(index, 'align', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="pb-meta-label">Tags</div>
          <p className="form-helper" style={{ marginBottom: 10 }}>
            Leave URL empty for plain text. Use a full URL or a page slug for links.
          </p>
          {badges.map((row, bi) => (
            <div
              key={bi}
              style={{ marginBottom: 10, padding: 10, border: '1px solid var(--card-border)', borderRadius: 8 }}
            >
              <div className="form-row" style={{ gap: 8, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Label</label>
                  <input
                    className="form-input"
                    value={row.label ?? ''}
                    onChange={(e) => patchBadge(bi, 'label', e.target.value)}
                    placeholder="DOAJ"
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">URL (optional)</label>
                  <input
                    className="form-input"
                    value={row.url ?? ''}
                    onChange={(e) => patchBadge(bi, 'url', e.target.value)}
                    placeholder="https://… or indexing"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => removeBadge(bi)}
                  disabled={badges.length <= 1}
                  title="Remove"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addBadge}>
            <FiPlus /> Add tag
          </button>
          <div className="pb-tag-pills-preview-wrap">
            <div className="pb-meta-label" style={{ marginBottom: 8 }}>Preview</div>
            {block.heading ? <div className="pb-tag-pills-preview-title">{block.heading}</div> : null}
            <div className={`section-tag-badges section-tag-badges--${align} pb-tag-pills-preview-inner`}>
              {(visible.length ? visible : [{ label: 'Preview tag', url: '' }]).map((b, i) => (
                <span key={i} className="section-tag-badges__item">
                  <span className="section-tag-badges__pill">{b.label || 'Tag'}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      );
    }
    case 'apc_callout':
      return (
        <>
          <div className="form-group">
            <label className="form-label">Top line (label)</label>
            <input
              className="form-input"
              value={block.label || ''}
              onChange={(e) => updateBlockField(index, 'label', e.target.value)}
              placeholder="Article Processing Charge (APC)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Amount / headline</label>
            <input
              className="form-input"
              style={{ fontSize: '1.15rem', fontWeight: 700 }}
              value={block.amount || ''}
              onChange={(e) => updateBlockField(index, 'amount', e.target.value)}
              placeholder="265 USD"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Note (small text below)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={block.note || ''}
              onChange={(e) => updateBlockField(index, 'note', e.target.value)}
              placeholder="For all accepted manuscripts…"
            />
          </div>
          <div className="pb-apc-callout-preview-wrap">
            <div className="pb-meta-label" style={{ marginBottom: 8 }}>Preview</div>
            <div className="pb-apc-callout pb-apc-callout--preview">
              {block.label ? <div className="pb-apc-callout__label">{block.label}</div> : null}
              {block.amount ? <div className="pb-apc-callout__amount">{block.amount}</div> : null}
              {block.note ? <div className="pb-apc-callout__note">{block.note}</div> : null}
            </div>
          </div>
        </>
      );
    case 'shape': {
      const boxStyle = shapeBoxStyle(block);
      return (
        <>
          <div className="form-row" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Background</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(String(block.backgroundColor || '').trim()) ? block.backgroundColor.trim() : '#f0f7ff'}
                  onChange={(e) => setField('backgroundColor', e.target.value)}
                  style={{ width: 44, height: 36, padding: 2, cursor: 'pointer', border: '1px solid var(--card-border)', borderRadius: 6 }}
                  aria-label="Background color"
                />
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 100 }}
                  value={block.backgroundColor || ''}
                  onChange={(e) => setField('backgroundColor', e.target.value)}
                  placeholder="#f0f7ff"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Border color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(String(block.borderColor || '').trim()) ? block.borderColor.trim() : '#b8d4eb'}
                  onChange={(e) => setField('borderColor', e.target.value)}
                  style={{ width: 44, height: 36, padding: 2, cursor: 'pointer', border: '1px solid var(--card-border)', borderRadius: 6 }}
                  aria-label="Border color"
                />
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 100 }}
                  value={block.borderColor || ''}
                  onChange={(e) => setField('borderColor', e.target.value)}
                  placeholder="#b8d4eb"
                />
              </div>
            </div>
          </div>
          <div className="form-row" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="form-group" style={{ flex: 1, minWidth: 100, marginBottom: 0 }}>
              <label className="form-label">Border width</label>
              <input
                className="form-input"
                value={block.borderWidth || ''}
                onChange={(e) => setField('borderWidth', e.target.value)}
                placeholder="1px"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 100, marginBottom: 0 }}>
              <label className="form-label">Corner radius</label>
              <input
                className="form-input"
                value={block.borderRadius || ''}
                onChange={(e) => setField('borderRadius', e.target.value)}
                placeholder="8px"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
              <label className="form-label">Inner padding</label>
              <input
                className="form-input"
                value={block.padding || ''}
                onChange={(e) => setField('padding', e.target.value)}
                placeholder="24px or 20px 28px"
              />
            </div>
          </div>
          <p className="form-helper" style={{ marginTop: 0, marginBottom: 10 }}>
            Use the editor below for contact lines, bold labels, links, and colors. Numbers without a unit become px.
          </p>
          <div className="pb-quill">
            <QuillBlockField
              html={block.html || ''}
              onChange={(html) => setField('html', html)}
              modules={SNOW_MODULES}
              formats={SNOW_FORMATS}
              placeholder="Type inside the shape — name, title, address, links…"
            />
          </div>
          <div className="pb-shape-preview-wrap">
            <div className="pb-meta-label" style={{ marginBottom: 8 }}>Preview</div>
            <div className="pb-shape pb-shape--editor-preview" style={boxStyle}>
              <div
                className="pb-paragraph"
                dangerouslySetInnerHTML={{ __html: block.html || '' }}
              />
            </div>
          </div>
        </>
      );
    }
    default:
      return <p style={{ color: 'var(--danger)' }}>Unknown block type</p>;
  }
}

function AddBlockSlot({ wrapId, anchorIndex, addMenu, onToggle, onPickType, label, className = '' }) {
  const isOpen = addMenu.open && addMenu.wrapId === wrapId;
  return (
    <div className={`pb-add-wrap pb-inline-add ${className}`.trim()} data-pb-add-wrap={wrapId}>
      <button
        type="button"
        className="btn btn-primary btn-sm pb-inline-add-btn"
        aria-expanded={isOpen}
        onClick={() => onToggle(wrapId, anchorIndex)}
      >
        <FiPlus style={{ marginRight: 6 }} />
        {label}
        <FiChevronDown style={{ marginLeft: 6, opacity: 0.85 }} aria-hidden />
      </button>
      {isOpen && (
        <div className="pb-add-menu pb-add-menu--inline" role="menu">
          {ADD_OPTIONS.map((opt) => (
            <button key={opt.type} type="button" role="menuitem" onClick={() => onPickType(opt.type)}>
              <strong>{opt.label}</strong>
              <span className="pb-add-hint" style={{ display: 'block', fontSize: 11, fontWeight: 400 }}>{opt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default forwardRef(function PageBlockEditor({ section, onSectionSaved }, ref) {
  const [blocks, setBlocks] = useState([]);
  const [appear, setAppear] = useState({
    backgroundColor: '',
    paddingTop: '',
    paddingBottom: '',
    animation: 'none',
    cssClasses: ''
  });
  const [addMenu, setAddMenu] = useState({ open: false, wrapId: null });
  /** null = append at end; -1 = before first block; n = after blocks[n] */
  const [blockInsertAfterIndex, setBlockInsertAfterIndex] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const activeInsertRef = useRef(null);
  const blocksRef = useRef(blocks);
  const appearRef = useRef(appear);
  const sectionRef = useRef(section);
  const blockInsertAfterRef = useRef(null);
  blockInsertAfterRef.current = blockInsertAfterIndex;

  const lastSavedFingerprintRef = useRef('');
  const autoSaveTimerRef = useRef(null);
  const hydratedRef = useRef(false);
  const prevSectionIdRef = useRef(null);

  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  useEffect(() => { appearRef.current = appear; }, [appear]);
  useEffect(() => { sectionRef.current = section; }, [section]);

  /** Hydrate from server before paint so auto-save never runs against an empty initial state. */
  useLayoutEffect(() => {
    if (!section) {
      hydratedRef.current = false;
      return;
    }
    const prevId = prevSectionIdRef.current;
    const switchedSection = prevId != null && prevId !== section._id;
    prevSectionIdRef.current = section._id;

    const b = section.content?.blocks;
    const nextBlocks = Array.isArray(b) ? b.map((x) => migrateBlockFromServer({ ...x })) : [];
    const nextAppear = {
      backgroundColor: section.backgroundColor || '',
      paddingTop: section.paddingTop || '',
      paddingBottom: section.paddingBottom || '',
      animation: section.animation || 'none',
      cssClasses: section.cssClasses || ''
    };

    setBlocks((prev) => (JSON.stringify(prev) === JSON.stringify(nextBlocks) ? prev : nextBlocks));
    setAppear((prev) => (JSON.stringify(prev) === JSON.stringify(nextAppear) ? prev : nextAppear));

    lastSavedFingerprintRef.current = buildAutosaveFingerprint(nextBlocks, nextAppear);
    hydratedRef.current = true;

    if (switchedSection) {
      setBlockInsertAfterIndex(null);
      setAddMenu({ open: false, wrapId: null });
    }
  }, [section]);

  const closeAddMenu = useCallback(() => setAddMenu({ open: false, wrapId: null }), []);

  const selectInsertAnchor = useCallback((idx) => {
    setAddMenu({ open: false, wrapId: null });
    setBlockInsertAfterIndex(idx);
  }, []);

  const toggleAddMenu = useCallback((wrapId, anchorIndex) => {
    setBlockInsertAfterIndex(anchorIndex);
    setAddMenu((m) => (m.open && m.wrapId === wrapId ? { open: false, wrapId: null } : { open: true, wrapId }));
  }, []);

  useEffect(() => {
    if (!addMenu.open || !addMenu.wrapId) return;
    const onDoc = (e) => {
      const shell = document.querySelector(`[data-pb-add-wrap="${addMenu.wrapId}"]`);
      if (shell && !shell.contains(e.target)) closeAddMenu();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [addMenu.open, addMenu.wrapId, closeAddMenu]);

  useEffect(() => {
    if (!addMenu.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeAddMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [addMenu.open, closeAddMenu]);

  useEffect(() => {
    if (blockInsertAfterIndex === null) return;
    const id = requestAnimationFrame(() => {
      activeInsertRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [blockInsertAfterIndex]);

  const updateBlockField = (idx, key, value) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: value } : b)));
  };

  const addBlock = (type) => {
    const block = createBlock(type);
    const anchor = blockInsertAfterRef.current;
    setBlocks((prev) => {
      if (anchor === null) return [...prev, block];
      const at = anchor < 0 ? 0 : Math.min(anchor + 1, prev.length);
      const next = [...prev];
      next.splice(at, 0, block);
      return next;
    });
    closeAddMenu();
    setBlockInsertAfterIndex(null);
  };

  const removeBlock = (idx) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
    setBlockInsertAfterIndex((cur) => {
      if (cur === null) return null;
      if (cur === idx) return null;
      if (cur > idx) return cur - 1;
      return cur;
    });
  };

  const dupBlock = (idx) => {
    setBlocks((prev) => {
      const copy = JSON.parse(JSON.stringify(prev[idx]));
      copy.id = newBlockId();
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const moveBlock = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const onDragStart = (e, idx) => {
    closeAddMenu();
    setBlockInsertAfterIndex(null);
    setDragFrom(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const onDrop = (e, toIdx) => {
    e.preventDefault();
    setDragFrom(null);
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(fromIdx) || fromIdx === toIdx) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
      next.splice(insertAt, 0, item);
      return next;
    });
  };

  const runPersistBlocks = useCallback(async () => {
    const s = sectionRef.current;
    if (!s?._id) return;
    const b = blocksRef.current;
    const a = appearRef.current;
    const { data } = await sectionsAPI.update(s._id, {
      content: { ...(s.content || {}), blocks: b, version: 1 },
      backgroundColor: a.backgroundColor || undefined,
      paddingTop: a.paddingTop || undefined,
      paddingBottom: a.paddingBottom || undefined,
      animation: a.animation || 'none',
      cssClasses: a.cssClasses || undefined
    });
    lastSavedFingerprintRef.current = buildAutosaveFingerprint(b, a);
    onSectionSaved?.(data?.data ?? data);
  }, [onSectionSaved]);

  const persistBlocks = useCallback(async () => {
    await runPersistBlocks();
  }, [runPersistBlocks]);

  useImperativeHandle(ref, () => ({ persistBlocks }), [persistBlocks]);

  useEffect(() => {
    const sectionId = section?._id;
    if (!sectionId || !hydratedRef.current) return;

    const fp = buildAutosaveFingerprint(blocks, appear);
    if (fp === lastSavedFingerprintRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      const curFp = buildAutosaveFingerprint(blocksRef.current, appearRef.current);
      if (curFp === lastSavedFingerprintRef.current) return;
      (async () => {
        try {
          await runPersistBlocks();
        } catch (e) {
          console.warn('[PageBlockEditor] Auto-save failed', e);
        }
      })();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [blocks, appear, section?._id, runPersistBlocks]);

  if (!section) return null;

  return (
    <div className="pb-editor card" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Your page</h3>
          <p className="pb-editor-intro" style={{ margin: '6px 0 0' }}>
            Click a block to select it — the <strong>Add block</strong> control appears <strong>right there</strong>. Format with the toolbar above the text, drag ⋮⋮ to reorder. Blocks <strong>save automatically</strong> in the background (~{Math.round(AUTO_SAVE_DELAY_MS / 1000)}s after you stop editing); use <strong>Save</strong> at the top for title, slug, and other page fields.
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 20px 24px' }}>
        {blocks.length === 0 ? (
          <div
            ref={activeInsertRef}
            className="pb-empty-add-shell"
          >
            <p className="pb-empty-add-title">No blocks yet</p>
            <AddBlockSlot
              wrapId="empty"
              anchorIndex={null}
              addMenu={addMenu}
              onToggle={toggleAddMenu}
              onPickType={addBlock}
              label="Add block"
              className="pb-inline-add--hero"
            />
          </div>
        ) : (
          <div className="pb-block-list">
            {blockInsertAfterIndex === -1 ? (
              <div ref={activeInsertRef} className="pb-inline-add-row">
                <span className="pb-inline-add-label">Insert at top</span>
                <AddBlockSlot
                  wrapId="prepend"
                  anchorIndex={-1}
                  addMenu={addMenu}
                  onToggle={toggleAddMenu}
                  onPickType={addBlock}
                  label="Add block here"
                />
              </div>
            ) : null}
            {blocks.map((block, index) => (
              <div key={block.id || index} className="pb-block-stack">
                <BlockRow
                  index={index}
                  total={blocks.length}
                  dragging={dragFrom === index}
                  onDragStart={onDragStart}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onDragEnd={() => setDragFrom(null)}
                  onDup={dupBlock}
                  onDel={removeBlock}
                  onUp={(i) => moveBlock(i, -1)}
                  onDown={(i) => moveBlock(i, 1)}
                  isInsertAnchor={blockInsertAfterIndex === index}
                  onSelectInsertAfter={selectInsertAnchor}
                >
                  <div className="pb-meta-label">{ADD_OPTIONS.find((o) => o.type === block.type)?.label || block.type}</div>
                  {renderBlockFields(block, index, updateBlockField)}
                </BlockRow>
                {blockInsertAfterIndex === index ? (
                  <div ref={activeInsertRef} className="pb-inline-add-row pb-inline-add-row--after">
                    <span className="pb-inline-add-label">After this block</span>
                    <AddBlockSlot
                      wrapId={`after-${index}`}
                      anchorIndex={index}
                      addMenu={addMenu}
                      onToggle={toggleAddMenu}
                      onPickType={addBlock}
                      label="Add block here"
                    />
                  </div>
                ) : null}
              </div>
            ))}
            {blockInsertAfterIndex === null ? (
              <div ref={activeInsertRef} className="pb-inline-add-row pb-inline-add-row--append">
                <span className="pb-inline-add-label">End of page</span>
                <AddBlockSlot
                  wrapId="append"
                  anchorIndex={null}
                  addMenu={addMenu}
                  onToggle={toggleAddMenu}
                  onPickType={addBlock}
                  label="Add block here"
                />
              </div>
            ) : null}
          </div>
        )}

        <details className="pb-appearance-details">
          <summary className="pb-appearance-summary">Background & spacing (optional)</summary>
          <div className="pb-appearance">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Background</label>
                <input className="form-input" value={appear.backgroundColor} onChange={(e) => setAppear((a) => ({ ...a, backgroundColor: e.target.value }))} placeholder="#f5f7fa" />
              </div>
              <div className="form-group">
                <label className="form-label">Animation</label>
                <select className="form-select" value={appear.animation} onChange={(e) => setAppear((a) => ({ ...a, animation: e.target.value }))}>
                  <option value="none">None</option>
                  <option value="fadeIn">Fade in</option>
                  <option value="slideUp">Slide up</option>
                  <option value="slideLeft">Slide left</option>
                  <option value="slideRight">Slide right</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Padding top</label>
                <input className="form-input" value={appear.paddingTop} onChange={(e) => setAppear((a) => ({ ...a, paddingTop: e.target.value }))} placeholder="24px" />
              </div>
              <div className="form-group">
                <label className="form-label">Padding bottom</label>
                <input className="form-input" value={appear.paddingBottom} onChange={(e) => setAppear((a) => ({ ...a, paddingBottom: e.target.value }))} placeholder="32px" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Extra CSS classes</label>
              <input className="form-input" value={appear.cssClasses} onChange={(e) => setAppear((a) => ({ ...a, cssClasses: e.target.value }))} placeholder="optional" />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
});
