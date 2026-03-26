import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';

// ─── Base Axios Instance (Backend) ────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── AI Engine Axios Instance ─────────────────────────────
const aiClient: AxiosInstance = axios.create({
  baseURL: `${AI_ENGINE_URL}/api/v1`,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach JWT from localStorage ───
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('propel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

aiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('propel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor — error normalisation ───────────
const handleResponseError = (error: AxiosError<{ message: string; errors?: Record<string, string[]> }>) => {
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  const status = error.response?.status;
  if (status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('propel_token');
    localStorage.removeItem('propel_user');
    localStorage.removeItem('propel_company');
    window.location.href = '/auth/login';
  }
  return Promise.reject(new Error(message));
};

apiClient.interceptors.response.use((response) => response.data, handleResponseError);
aiClient.interceptors.response.use((response) => response.data, handleResponseError);

// ─── API Modules ──────────────────────────────────────────
export const propertiesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/properties', { params }),
  getById: (id: string) => apiClient.get(`/properties/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/properties', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/properties/${id}`, data),
  delete: (id: string) => apiClient.delete(`/properties/${id}`),
  getUnits: (id: string, params?: Record<string, unknown>) => apiClient.get(`/properties/${id}/units`, { params }),
  getKpis: () => apiClient.get('/properties/summary/kpis'),
};

export const leasingApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/leasing', { params }),
  getById: (id: string) => apiClient.get(`/leasing/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/leasing', data),
  renew: (id: string, data: Record<string, unknown>) => apiClient.post(`/leasing/${id}/renew`, data),
  terminate: (id: string, data: Record<string, unknown>) => apiClient.post(`/leasing/${id}/terminate`, data),
  getDueRenewals: () => apiClient.get('/leasing/due-renewals'),
};

export const financeApi = {
  getVouchers: (params?: Record<string, unknown>) => apiClient.get('/finance/vouchers', { params }),
  createVoucher: (data: Record<string, unknown>) => apiClient.post('/finance/vouchers', data),
  approveVoucher: (id: string) => apiClient.post(`/finance/vouchers/${id}/approve`),
  rejectVoucher: (id: string, reason: string) => apiClient.post(`/finance/vouchers/${id}/reject`, { reason }),
  getTrialBalance: (params?: Record<string, unknown>) => apiClient.get('/finance/trial-balance', { params }),
  getKpis: (params?: Record<string, unknown>) => apiClient.get('/finance/kpis', { params }),
  getAccounts: () => apiClient.get('/finance/accounts'),
  getInvoices: (params?: Record<string, unknown>) => apiClient.get('/finance/invoices', { params }),
};

export const hrApi = {
  getEmployees: (params?: Record<string, unknown>) => apiClient.get('/hr/employees', { params }),
  getEmployee: (id: string) => apiClient.get(`/hr/employees/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/hr/employees', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/hr/employees/${id}`, data),
  getAttendance: (params?: Record<string, unknown>) => apiClient.get('/hr/attendance', { params }),
  runPayroll: (data: Record<string, unknown>) => apiClient.post('/hr/payroll/run', data),
};

export const maintenanceApi = {
  getWorkOrders: (params?: Record<string, unknown>) => apiClient.get('/maintenance/work-orders', { params }),
  createWorkOrder: (data: Record<string, unknown>) => apiClient.post('/maintenance/work-orders', data),
  updateStatus: (id: string, data: Record<string, unknown>) => apiClient.patch(`/maintenance/work-orders/${id}/status`, data),
  getKpis: () => apiClient.get('/maintenance/kpis'),
};

export const aiApi = {
  getRevenueForecast: () => aiClient.get('/revenue-forecast'),
  getChurnRisks: () => aiClient.get('/churn-risks'),
  getMaintenancePredictions: () => aiClient.get('/maintenance-predictions'),
  chat: (message: string, history: Array<{ role: string; content: string }>) => {
    const companyData = typeof window !== 'undefined' ? localStorage.getItem('propel_company') : null;
    const company = companyData ? JSON.parse(companyData) : { id: 'default' };
    return aiClient.post('/chat', { message, history, company_id: company.id });
  },
  analyseContract: (documentId: string) => aiClient.post('/analyse-contract', { documentId }),
  getPropertyValuation: (propertyId: string) => aiClient.get(`/valuation/${propertyId}`),
  getDashboardInsights: () => aiClient.get('/dashboard-insights'),
};

export const crmApi = {
  getLeads: (params?: Record<string, unknown>) => apiClient.get('/crm/leads', { params }),
  createLead: (data: Record<string, unknown>) => apiClient.post('/crm/leads', data),
  updateStage: (id: string, stage: string) => apiClient.patch(`/crm/leads/${id}/stage`, { stage }),
  getContacts: (params?: Record<string, unknown>) => apiClient.get('/crm/contacts', { params }),
  createContact: (data: Record<string, unknown>) => apiClient.post('/crm/contacts', data),
};

export const reportsApi = {
  getRentalCollection: (params?: Record<string, unknown>) => apiClient.get('/reports/rental-collection', { params }),
  getOccupancy: (params?: Record<string, unknown>) => apiClient.get('/reports/occupancy', { params }),
  getPnL: (params?: Record<string, unknown>) => apiClient.get('/reports/pnl', { params }),
  getLeaseExpiry: (params?: Record<string, unknown>) => apiClient.get('/reports/lease-expiry', { params }),
  generatePdf: (reportType: string, params?: Record<string, unknown>) =>
    apiClient.post('/reports/generate-pdf', { reportType, params }, { responseType: 'blob' }),
  getExecutiveSummary: () => apiClient.get('/reports/executive-summary'),
};

export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/notifications', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
};

export const usersApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/users', { params }),
  create: (data: Record<string, unknown>) => apiClient.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/users/${id}`, data),
  getRoles: () => apiClient.get('/users/roles'),
  createRole: (data: Record<string, unknown>) => apiClient.post('/users/roles', data),
};

export const workflowApi = {
  getDefinitions: () => apiClient.get('/workflow/definitions'),
  create: (data: Record<string, unknown>) => apiClient.post('/workflow/definitions', data),
  getInstances: (params?: Record<string, unknown>) => apiClient.get('/workflow/instances', { params }),
};

export default apiClient;
