import { useRef, useEffect, useState } from 'react';
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiLink, 
  FiList, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight 
} from 'react-icons/fi';
import './RichTextEditor.css';

export default function RichTextEditor({ value, onChange, placeholder, style }) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const setColor = (e) => {
    execCommand('foreColor', e.target.value);
  };

  const setBackgroundColor = (e) => {
    execCommand('backColor', e.target.value);
  };

  return (
    <div className={`rte-wrapper ${isFocused ? 'rte-wrapper--focused' : ''}`} style={style}>
      <div className="rte-toolbar">
        <button type="button" onClick={() => execCommand('bold')} title="Bold" className="rte-btn">
          <FiBold />
        </button>
        <button type="button" onClick={() => execCommand('italic')} title="Italic" className="rte-btn">
          <FiItalic />
        </button>
        <button type="button" onClick={() => execCommand('underline')} title="Underline" className="rte-btn">
          <FiUnderline />
        </button>
        <button type="button" onClick={() => execCommand('strikeThrough')} title="Strikethrough" className="rte-btn">
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
        <div className="rte-separator" />
        <label className="rte-color-btn" title="Text color">
          <span style={{ fontSize: '16px' }}>A</span>
          <input type="color" onChange={setColor} />
        </label>
        <label className="rte-color-btn" title="Background color">
          <span style={{ fontSize: '14px' }}>◼</span>
          <input type="color" onChange={setBackgroundColor} />
        </label>
        <div className="rte-separator" />
        <button type="button" onClick={insertLink} title="Insert link" className="rte-btn">
          <FiLink />
        </button>
        <div className="rte-separator" />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet list" className="rte-btn">
          <FiList />
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered list" className="rte-btn">
          <span style={{ fontWeight: 'bold' }}>1.</span>
        </button>
        <div className="rte-separator" />
        <button type="button" onClick={() => execCommand('justifyLeft')} title="Align left" className="rte-btn">
          <FiAlignLeft />
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} title="Align center" className="rte-btn">
          <FiAlignCenter />
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} title="Align right" className="rte-btn">
          <FiAlignRight />
        </button>
        <div className="rte-separator" />
        <button type="button" onClick={() => execCommand('removeFormat')} title="Clear formatting" className="rte-btn">
          ✕
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
