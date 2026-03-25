import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articlesAPI, categoriesAPI } from '../../../api';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [article, setArticle] = useState({
    title: '', type: 'preprint', abstract: '', keywords: [], doi: '',
    volume: '', issue: '', pages: '', status: 'draft', isFeatured: false,
    category: '', authors: [{ name: '', affiliation: '', email: '', isCorresponding: false }]
  });

  useEffect(() => {
    categoriesAPI.getAll().then(({ data }) => setCategories(data.data)).catch(() => {});
    if (isEdit) {
      articlesAPI.getById(id).then(({ data }) => setArticle(data.data)).catch(() => toast.error('Article not found'));
    }
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(article).forEach(([key, val]) => {
        if (key === 'authors' || key === 'keywords' || key === 'relatedArticles') {
          formData.append(key, JSON.stringify(val));
        } else if (val !== null && val !== undefined && key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
          formData.append(key, val);
        }
      });
      if (pdfFile) formData.append('pdf', pdfFile);

      if (isEdit) {
        await articlesAPI.update(id, formData);
        toast.success('Article updated');
      } else {
        const { data } = await articlesAPI.create(formData);
        toast.success('Article created');
        navigate(`/articles/${data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const addAuthor = () => setArticle({ ...article, authors: [...article.authors, { name: '', affiliation: '', email: '', isCorresponding: false }] });
  const removeAuthor = (i) => setArticle({ ...article, authors: article.authors.filter((_, idx) => idx !== i) });
  const updateAuthor = (i, field, val) => {
    const updated = [...article.authors];
    updated[i] = { ...updated[i], [field]: val };
    setArticle({ ...article, authors: updated });
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/articles')}><FiArrowLeft /></button>
          <h1 className="page-title">{isEdit ? 'Edit Article' : 'New Article'}</h1>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={article.title} onChange={e => setArticle({ ...article, title: e.target.value })} placeholder="Article title" />
            </div>
            <div className="form-group">
              <label className="form-label">Abstract</label>
              <textarea className="form-textarea" value={article.abstract} onChange={e => setArticle({ ...article, abstract: e.target.value })} placeholder="Article abstract" rows={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Keywords (comma-separated)</label>
              <input className="form-input" value={Array.isArray(article.keywords) ? article.keywords.join(', ') : ''} onChange={e => setArticle({ ...article, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })} placeholder="keyword1, keyword2" />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Authors</h3>
              <button className="btn btn-primary btn-sm" onClick={addAuthor}><FiPlus /> Add Author</button>
            </div>
            {article.authors?.map((author, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <input className="form-input" placeholder="Name" value={author.name} onChange={e => updateAuthor(i, 'name', e.target.value)} />
                  <input className="form-input" placeholder="Affiliation" value={author.affiliation || ''} onChange={e => updateAuthor(i, 'affiliation', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="form-input" placeholder="Email" value={author.email || ''} onChange={e => updateAuthor(i, 'email', e.target.value)} style={{ flex: 1 }} />
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={author.isCorresponding} onChange={e => updateAuthor(i, 'isCorresponding', e.target.checked)} /> Corresponding
                  </label>
                  {article.authors.length > 1 && <button className="btn btn-outline btn-sm" onClick={() => removeAuthor(i)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Publication</h3>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={article.type} onChange={e => setArticle({ ...article, type: e.target.value })}>
                <option value="preprint">Preprint</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={article.status} onChange={e => setArticle({ ...article, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={article.category || ''} onChange={e => setArticle({ ...article, category: e.target.value })}>
                <option value="">No category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">DOI</label><input className="form-input" value={article.doi || ''} onChange={e => setArticle({ ...article, doi: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Volume</label><input className="form-input" value={article.volume || ''} onChange={e => setArticle({ ...article, volume: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Issue</label><input className="form-input" value={article.issue || ''} onChange={e => setArticle({ ...article, issue: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Pages</label><input className="form-input" value={article.pages || ''} onChange={e => setArticle({ ...article, pages: e.target.value })} /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>PDF Upload</h3>
            {article.pdfUrl && <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--success)' }}>✓ PDF uploaded: {article.pdfFileName}</p>}
            <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} style={{ fontSize: 13 }} />
            <p className="form-helper">Max 100MB. PDF files only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
