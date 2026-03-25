import api from './axios';

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAuditLogs: (params) => api.get('/dashboard/audit-logs', { params }),
  globalSearch: (q) => api.get('/dashboard/search', { params: { q } })
};

// Redirects
export const redirectsAPI = {
  getAll: () => api.get('/redirects'),
  create: (data) => api.post('/redirects', data),
  update: (id, data) => api.put(`/redirects/${id}`, data),
  delete: (id) => api.delete(`/redirects/${id}`)
};

// Pages
export const pagesAPI = {
  getAll: (params) => api.get('/pages', { params }),
  getById: (id) => api.get(`/pages/${id}`),
  create: (data) => api.post('/pages', data),
  update: (id, data) => api.put(`/pages/${id}`, data),
  delete: (id) => api.delete(`/pages/${id}`),
  reorder: (pages) => api.post('/pages/reorder', { pages }),
  duplicate: (id) => api.post(`/pages/${id}/duplicate`)
};

// Sections
export const sectionsAPI = {
  getByPage: (pageId) => api.get(`/sections/page/${pageId}`),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
  delete: (id) => api.delete(`/sections/${id}`),
  reorder: (sections) => api.post('/sections/reorder', { sections }),
  toggleVisibility: (id) => api.patch(`/sections/${id}/toggle-visibility`),
  duplicate: (id) => api.post(`/sections/${id}/duplicate`),
};

// Articles
export const articlesAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getById: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/articles/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/articles/${id}`),
  duplicate: (id) => api.post(`/articles/${id}/duplicate`),
  bulkDelete: (ids) => api.post('/articles/bulk-delete', { ids }),
  bulkStatus: (ids, status) => api.post('/articles/bulk-status', { ids, status })
};

// Media
export const mediaAPI = {
  getAll: (params) => api.get('/media', { params }),
  upload: (formData) => api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadMultiple: (formData) => api.post('/media/upload-multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
  bulkDelete: (ids) => api.post('/media/bulk-delete', { ids }),
  getFolders: () => api.get('/media/folders')
};

// Navigation
export const navigationAPI = {
  getAll: (params) => api.get('/navigation', { params }),
  create: (data) => api.post('/navigation', data),
  update: (id, data) => api.put(`/navigation/${id}`, data),
  delete: (id) => api.delete(`/navigation/${id}`)
};

// Footer
export const footerAPI = {
  getAll: () => api.get('/footer'),
  create: (data) => api.post('/footer', data),
  update: (id, data) => api.put(`/footer/${id}`, data),
  delete: (id) => api.delete(`/footer/${id}`)
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.put('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeLogo: () => api.delete('/settings/logo')
};

// SEO
export const seoAPI = {
  getOverview: () => api.get('/seo/overview'),
  updatePageSEO: (id, data) => api.put(`/seo/page/${id}`, data)
};

// Backups
export const backupsAPI = {
  create: () => api.post('/public/backups'),
  getAll: () => api.get('/public/backups'),
  restore: (key) => api.post('/public/backups/restore', { key }),
  delete: (key) => api.delete('/public/backups', { data: { key } }),
  download: (key) => api.get('/public/backups/download', { params: { key }, responseType: 'blob' })
};
