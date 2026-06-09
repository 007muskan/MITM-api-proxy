import api from './client';

export const recordingsApi = {
  getSessions: () => api.get('/api/recordings/sessions'),
  getSession: (id) => api.get(`/api/recordings/sessions/${id}`),
  createSession: (data) => api.post('/api/recordings/sessions', data),
  stopSession: (id) => api.post(`/api/recordings/sessions/${id}/stop`),
  deleteSession: (id) => api.delete(`/api/recordings/sessions/${id}`),
  exportSession: (id) => api.get(`/api/recordings/sessions/${id}/export`),
  getState: () => api.get('/api/recordings/state'),
};
