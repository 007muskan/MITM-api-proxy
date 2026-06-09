import api from './client';

export const mocksApi = {
  getAll: () => api.get('/api/mocks'),
  getById: (id) => api.get(`/api/mocks/${id}`),
  create: (data) => api.post('/api/mocks', data),
  update: (id, data) => api.put(`/api/mocks/${id}`, data),
  delete: (id) => api.delete(`/api/mocks/${id}`),
  toggle: (id, enabled) => api.patch(`/api/mocks/${id}/toggle`, { enabled }),
};
