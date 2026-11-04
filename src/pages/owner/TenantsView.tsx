import React, { useState, useEffect } from 'react';
import { Property, Tenant } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Search, Plus, Edit2, LogOut, RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react';

interface TenantsViewProps {
  property: Property;
  onOpenAddTenant: () => void;
  onEditTenant: (tenant: Tenant) => void;
}

export const TenantsView: React.FC<TenantsViewProps> = ({
  property,
  onOpenAddTenant,
  onEditTenant,
}) => {
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'checkedout' | 'all'>('active');
  const [search, setSearch] = useState('');

  const loadTenants = async () => {
    try {
      const data = await api.getTenants(property.id, statusFilter, search);
      setTenants(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [property.id, statusFilter, search]);

  const handleCheckout = async (tenant: Tenant) => {
    if (
      !confirm(
        `Check out ${tenant.name}? This will free Bed ${tenant.bed_number} in Room ${tenant.room_number}. Their financial and stay records will be permanently retained.`
      )
    ) {
      return;
    }
    try {
      await api.checkoutTenant(tenant.id);
      showToast(`${tenant.name} has been checked out. Bed is now available.`);
      loadTenants();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRestore = async (tenant: Tenant) => {
    if (!confirm(`Restore ${tenant.name} to active status? (Requires original bed to be vacant)`)) {
      return;
    }
    try {
      await api.restoreTenant(tenant.id);
      showToast(`${tenant.name} restored to active status!`);
      loadTenants();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tenant Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Resident profiles, stay agreements, security deposits, and emergency contact details.
          </p>
        </div>
        <button
          onClick={onOpenAddTenant}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Check-In New Tenant</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Residents
          </button>
          <button
            onClick={() => setStatusFilter('checkedout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'checkedout' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Checked Out History
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tenants
          </button>
        </div>

        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, room, ID..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-sm">
            Loading tenant records...
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No tenants found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Room / Bed</th>
                  <th className="py-3 px-4">Rent</th>
                  <th className="py-3 px-4">Deposit</th>
                  <th className="py-3 px-4">Stay Period</th>
                  <th className="py-3 px-4">Privacy / Sharing</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tenants.map((t) => {
                  const isActive = t.status === 'active';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200">
                            {t.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{t.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{t.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="font-bold text-slate-800">
                            Room {t.room_number || '—'} / Bed {t.bed_number || '—'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Checked Out</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">{formatCurrency(t.rent)}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{formatCurrency(t.deposit)}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <div>Joined: {t.joined_date}</div>
                        {t.checkout_date && <div className="text-rose-600">Left: {t.checkout_date}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        {t.share_contact ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Shared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            <ShieldAlert className="w-3 h-3" /> Private
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {t.emergency_name ? (
                          <div>
                            <span className="font-bold text-slate-800">{t.emergency_name}</span>
                            <div className="text-slate-400 font-mono">{t.emergency_phone || '—'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? 'Active' : 'Checked Out'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditTenant(t)}
                            title="Edit Tenant"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isActive ? (
                            <button
                              onClick={() => handleCheckout(t)}
                              title="Check Out Tenant"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(t)}
                              title="Restore Tenant"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
