import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1/public';

const api = axios.create({ baseURL: API_BASE });

// Maintenance mode: dispatch event so App can show maintenance screen
api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 503 && err?.response?.data?.maintenance) {
      window.dispatchEvent(new CustomEvent('maintenance', { detail: err.response.data.message }));
    }
    return Promise.reject(err);
  }
);

export const publicAPI = {
  getHome: () => api.get('/home'),
  getPage: (slug) => api.get(`/pages/${slug}`),
  getNavigation: (location = 'header') => api.get(`/navigation/${location}`),
  getFooter: () => api.get('/footer'),
  getSettings: () => api.get('/settings'),
  getComponents: () => api.get('/components'),
  getArticles: (params) => api.get('/articles', { params }),
  getVolumes: () => api.get('/articles/volumes'),
  getArticle: (slug) => api.get(`/articles/${slug}`),
  searchArticles: (params) => api.get('/articles/search', { params }),
  getFeaturedArticles: (params) => api.get('/articles/featured', { params }),
  getRelatedArticles: (slug, params) => api.get(`/articles/${slug}/related`, { params }),
  trackDownload: (id) => api.post(`/articles/${id}/download`),
  getCategories: () => api.get('/categories'),
  getRedirects: () => api.get('/redirects')
};

export default api;
