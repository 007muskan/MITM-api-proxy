import api from './client';

export const trafficApi = {
  getAll: (params) => api.get('/api/traffic', { params }),
  clear: () => api.delete('/api/traffic'),
};
