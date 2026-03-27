import { useState } from 'react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'ms', label: 'Melayu', dir: 'ltr' },
  { code: 'zh', label: '中文', dir: 'ltr' }
];

export default function LanguageTabs({ value, onChange, renderField, blockType }) {
  const [activeLang, setActiveLang] = useState('en');
  
  // Get the current language value without fallback to English
  const currentValue = (value && typeof value === 'object') ? (value[activeLang] || '') : '';
  
  const handleChange = (newValue) => {
    const updated = { ...(value || {}), [activeLang]: newValue };
    onChange(updated);
  };

  const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === activeLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="lang-tabs-wrapper">
      <div className="lang-tabs">
        {SUPPORTED_LANGUAGES.map(lang => (
          <button
            key={lang.code}
            type="button"
            className={`lang-tab ${activeLang === lang.code ? 'active' : ''}`}
            onClick={() => setActiveLang(lang.code)}
          >
            {lang.label}
          </button>
        ))}
      </div>
      <div className="lang-tab-content" key={activeLang} style={{ direction: currentLangConfig.dir }}>
        {renderField(currentValue, handleChange, activeLang)}
      </div>
    </div>
  );
}
