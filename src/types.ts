export type UserRole = 'superadmin' | 'owner' | 'tenant';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  tenantId?: number;
  propertyIds?: number[];
}

export interface Property {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  room_count?: number;
  active_tenants?: number;
  created_at?: string;
}

export interface Bed {
  id: number;
  room_id: number;
  bed_number: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  tenant_id?: number;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_status?: string;
}

export interface Room {
  id: number;
  property_id: number;
  room_number: string;
  floor: number;
  capacity: number;
  rent_per_bed: number;
  room_type: string;
  has_bathroom: number;
  occupied: number;
  vacant: number;
  beds: Bed[];
  created_at?: string;
}

export interface Tenant {
  id: number;
  user_id?: number;
  property_id: number;
  room_id: number;
  bed_id: number;
  name: string;
  phone: string;
  email?: string;
  id_type?: string;
  id_detail?: string;
  emergency_name?: string;
  emergency_phone?: string;
  share_contact: number | boolean;
  rent: number;
  deposit: number;
  joined_date: string;
  checkout_date?: string | null;
  status: 'active' | 'checkedout';
  room_number?: string;
  bed_number?: string;
  current_month_paid?: number;
}

export interface Payment {
  id: number;
  property_id: number;
  tenant_id: number;
  tenant_name?: string;
  tenant_phone?: string;
  room_number?: string;
  bed_number?: string;
  property_name?: string;
  period: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Cash' | 'Bank transfer' | 'Cheque' | 'Other';
  ref: string;
  receipt_no: string;
  status: string;
  created_at?: string;
}

export interface ReminderTenant extends Tenant {
  balance: number;
  isFullyPaid: boolean;
  whatsappUrl: string;
  reminderText: string;
  property_name?: string;
}

export interface Expense {
  id: number;
  property_id: number;
  category: string;
  amount: number;
  date: string;
  note: string;
  created_at?: string;
}

export interface FinancialSummary {
  period: string;
  expectedRent: number;
  collectedRent: number;
  outstandingRent: number;
  totalExpenses: number;
  netCashFlow: number;
  totalDeposits: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  expenseBreakdown: { category: string; cat_total: number }[];
}

export interface Complaint {
  id: number;
  property_id: number;
  tenant_id: number;
  tenant_name?: string;
  tenant_phone?: string;
  room_number?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved';
  resolution_note?: string;
  created_at: string;
  updated_at?: string;
}

export interface Notice {
  id: number;
  property_id: number;
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  details?: string;
  ip?: string;
  created_at: string;
}
