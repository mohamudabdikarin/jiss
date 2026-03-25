// filepath: server/src/utils/constants.js

module.exports = {
  ROLES: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    EDITOR: 'editor'
  },
  PAGE_STATUS: {
    PUBLISHED: 'published',
    DRAFT: 'draft',
    ARCHIVED: 'archived'
  },
  ARTICLE_TYPES: {
    PREPRINT: 'preprint',
    PUBLISHED: 'published'
  },
  SECTION_TYPES: [
    'hero', 'text', 'richtext', 'image', 'gallery', 'cards',
    'cta', 'accordion', 'banner', 'contact', 'video',
    'stats', 'testimonials', 'team', 'timeline', 'custom_html', 'tag_badges'
  ],
  PAGE_TEMPLATES: ['default', 'articles', 'preprint', 'published', 'contact', 'custom'],
  NAV_LOCATIONS: ['header', 'footer', 'sidebar'],
  FOOTER_COLUMN_TYPES: ['links', 'text', 'contact', 'social', 'newsletter', 'logo'],
  COMPONENT_TYPES: ['announcement_bar', 'cta_block', 'sidebar_widget', 'popup', 'banner'],
  AUDIT_ACTIONS: ['create', 'update', 'delete', 'login', 'logout', 'upload', 'backup', 'restore', 'settings_change'],
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  ALLOWED_DOCUMENT_MIMES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_PDF_SIZE: 100 * 1024 * 1024,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: {
    SHORT: 120,
    MEDIUM: 300,
    LONG: 600
  }
};
