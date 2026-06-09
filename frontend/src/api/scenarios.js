import api from './client';

export const scenariosApi = {
  getAll: () => api.get('/api/scenarios'),
  getById: (id) => api.get(`/api/scenarios/${id}`),
  create: (data) => api.post('/api/scenarios', data),
  update: (id, data) => api.put(`/api/scenarios/${id}`, data),
  delete: (id) => api.delete(`/api/scenarios/${id}`),
  toggle: (id, enabled) => api.patch(`/api/scenarios/${id}/toggle`, { enabled }),
};
