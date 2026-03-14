import api from './client'

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email: string, password: string) =>
    api.post('/api/v1/auth/login',  { email, password }),
  signup: (data: any) =>
    api.post('/api/v1/auth/signup', data),
  logout: () =>
    api.post('/api/v1/auth/logout'),
}

// ── QUOTES ────────────────────────────────────────────────────────────────────
export const quotesApi = {
  list:      (status?: string) =>
    api.get('/api/v1/quotes/', { params: status ? { status } : {} }),
  get:       (id: string) =>
    api.get(`/api/v1/quotes/${id}`),
  create:    (data: any) =>
    api.post('/api/v1/quotes/', data),
  update:    (id: string, data: any) =>
    api.patch(`/api/v1/quotes/${id}`, data),
  delete:    (id: string) =>
    api.delete(`/api/v1/quotes/${id}`),
  send:      (id: string, method: string) =>
    api.post(`/api/v1/quotes/${id}/send`, { method }),
  approve:   (id: string) =>
    api.post(`/api/v1/quotes/${id}/approve`),
}

// ── CLIENTS ───────────────────────────────────────────────────────────────────
export const clientsApi = {
  list:   () =>    api.get('/api/v1/clients/'),
  get:    (id: string) => api.get(`/api/v1/clients/${id}`),
  create: (data: any) => api.post('/api/v1/clients/', data),
  update: (id: string, data: any) => api.patch(`/api/v1/clients/${id}`, data),
}

// ── COMPANY ───────────────────────────────────────────────────────────────────
export const companyApi = {
  get:          () =>  api.get('/api/v1/company/'),
  update:       (data: any) => api.patch('/api/v1/company/', data),
  getPrices:    () =>  api.get('/api/v1/company/prices'),
  updatePrices: (prices: any[]) => api.put('/api/v1/company/prices', prices),
  getTeam:      () =>  api.get('/api/v1/company/team'),
  getStats:     () =>  api.get('/api/v1/company/stats'),
}

// ── RENDERS ───────────────────────────────────────────────────────────────────
export const rendersApi = {
  request: (data: any) => api.post('/api/v1/renders/', data),
  status:  (quoteId: string) => api.get(`/api/v1/renders/${quoteId}/status`),
}
