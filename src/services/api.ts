import {
  User,
  Property,
  Room,
  Tenant,
  Payment,
  ReminderTenant,
  Expense,
  FinancialSummary,
  Complaint,
  Notice,
  AuditLog,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('staydesk_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const data = await res.json();
      errMessage = data.error || data.message || errMessage;
    } catch {
      errMessage = `HTTP error ${res.status}`;
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User; tenantDetails: any; properties: Property[] }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Properties
  async getProperties(): Promise<Property[]> {
    const res = await fetch(`${API_BASE}/properties`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createProperty(data: { name: string; code: string; address?: string; city?: string; ownerId?: number }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Rooms & Beds
  async getRooms(propertyId: number): Promise<Room[]> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/rooms`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createRoom(propertyId: number, data: { roomNumber: string; floor: number; capacity: number; rentPerBed: number; roomType: string; hasBathroom: boolean }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteRoom(roomId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Tenants
  async getTenants(propertyId: number, status: string = 'all', query?: string): Promise<Tenant[]> {
    let url = `${API_BASE}/properties/${propertyId}/tenants?status=${status}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async addTenant(propertyId: number, data: Partial<Tenant> & { roomId: number; bedId: number; joinedDate: string; createPortalAccount?: boolean }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateTenant(tenantId: number, data: Partial<Tenant>): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async checkoutTenant(tenantId: number, checkoutDate?: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ checkoutDate }),
    });
    return handleResponse(res);
  },

  async restoreTenant(tenantId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/restore`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Payments
  async getPayments(propertyId: number, period?: string): Promise<Payment[]> {
    let url = `${API_BASE}/properties/${propertyId}/payments`;
    if (period) url += `?period=${encodeURIComponent(period)}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async recordPayment(propertyId: number, data: { tenantId: number; period: string; amount: number; date: string; method: string; ref?: string }): Promise<{ id: number; receiptNo: string }> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getReceipt(paymentId: number): Promise<Payment> {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/receipt`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Reminders
  async getReminders(propertyId: number, period?: string): Promise<ReminderTenant[]> {
    let url = `${API_BASE}/properties/${propertyId}/reminders`;
    if (period) url += `?period=${encodeURIComponent(period)}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Expenses
  async getExpenses(propertyId: number, period?: string): Promise<Expense[]> {
    let url = `${API_BASE}/properties/${propertyId}/expenses`;
    if (period) url += `?period=${encodeURIComponent(period)}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async addExpense(propertyId: number, data: { category: string; amount: number; date: string; note: string }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteExpense(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Financial Reports
  async getSummary(propertyId: number, period?: string): Promise<FinancialSummary> {
    let url = `${API_BASE}/properties/${propertyId}/reports/summary`;
    if (period) url += `?period=${encodeURIComponent(period)}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Complaints
  async getComplaints(propertyId: number): Promise<Complaint[]> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/complaints`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async updateComplaintStatus(complaintId: number, status: string, resolutionNote?: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status, resolutionNote }),
    });
    return handleResponse(res);
  },

  // Notices
  async getNotices(propertyId: number): Promise<Notice[]> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/notices`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async addNotice(propertyId: number, data: { title: string; message: string; priority: string }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Tenant Portal
  async getTenantMe(): Promise<any> {
    const res = await fetch(`${API_BASE}/tenant/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getTenantRoommates(): Promise<{ id: number; name: string; bedNumber: string; shareContact: boolean; phone: string | null }[]> {
    const res = await fetch(`${API_BASE}/tenant/roommates`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getTenantPayments(): Promise<Payment[]> {
    const res = await fetch(`${API_BASE}/tenant/payments`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async submitTenantComplaint(data: { title: string; description: string; category?: string; priority?: string }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/tenant/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Super Admin
  async getSuperAdminStats(): Promise<{
    totalProperties: number;
    totalOwners: number;
    activeTenants: number;
    totalBeds: number;
    occupiedBeds: number;
    occupancyRate: number;
  }> {
    const res = await fetch(`${API_BASE}/superadmin/stats`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/superadmin/audit`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Backup Export
  getBackupExportUrl(propertyId?: number): string {
    return `${API_BASE}/backup/export${propertyId ? `?propertyId=${propertyId}` : ''}`;
  },
};
