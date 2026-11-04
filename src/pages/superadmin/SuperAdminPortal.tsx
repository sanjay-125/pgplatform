import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Property, AuditLog } from '../../types';
import { useToast } from '../../components/Toast';
import { StatCard } from '../../components/StatCard';
import {
  Building2,
  Users,
  ShieldCheck,
  BedDouble,
  Plus,
  History,
  X,
} from 'lucide-react';

export const SuperAdminPortal: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [propForm, setPropForm] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Vellore',
  });

  const loadData = async () => {
    try {
      const [statsData, propsData, logsData] = await Promise.all([
        api.getSuperAdminStats(),
        api.getProperties(),
        api.getAuditLogs(),
      ]);
      setStats(statsData);
      setProperties(propsData);
      setAuditLogs(logsData);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propForm.name.trim() || !propForm.code.trim()) {
      showToast('Name and unique code are required', 'error');
      return;
    }

    try {
      await api.createProperty({
        name: propForm.name.trim(),
        code: propForm.code.trim().toUpperCase(),
        address: propForm.address.trim(),
        city: propForm.city.trim(),
      });
      showToast(`Property ${propForm.name} created successfully!`);
      setShowAddPropertyModal(false);
      setPropForm({ name: '', code: '', address: '', city: 'Vellore' });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-sm">
        Loading platform administrator dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-800/60 text-purple-200 text-xs font-bold uppercase tracking-wider inline-block mb-3 border border-purple-500/30">
            Platform Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Super Admin Control Center
          </h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-xl">
            Multi-property management, tenant ecosystem metrics, and security audit logging.
          </p>
        </div>

        <button
          onClick={() => setShowAddPropertyModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Property</span>
        </button>
      </div>

      {/* Platform Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Properties"
          value={stats?.totalProperties || 0}
          subtitle="Active PG facilities"
          icon={Building2}
          accentColor="purple"
        />

        <StatCard
          label="PG Owners / Managers"
          value={stats?.totalOwners || 0}
          subtitle="Assigned administrators"
          icon={ShieldCheck}
          accentColor="brand"
        />

        <StatCard
          label="Total Active Tenants"
          value={stats?.activeTenants || 0}
          subtitle="Enrolled residents"
          icon={Users}
          accentColor="emerald"
        />

        <StatCard
          label="Platform Occupancy"
          value={`${stats?.occupancyRate || 0}%`}
          subtitle={`${stats?.occupiedBeds || 0} / ${stats?.totalBeds || 0} beds`}
          icon={BedDouble}
          accentColor="brand"
        />
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Properties (PG Facilities)</h2>
            <p className="text-xs text-slate-500">All registered PG properties and assigned owner administrators</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">Property Name</th>
                <th className="pb-3 px-3">Code</th>
                <th className="pb-3 px-3">Assigned Owner</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Rooms</th>
                <th className="pb-3 px-3">Active Tenants</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.address}</div>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-xs text-purple-700">
                    {p.code}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-800">{p.owner_name || 'Owner'}</span>
                    <div className="text-xs text-slate-400">{p.owner_email}</div>
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-600">{p.city || '—'}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">{p.room_count || 0}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-600">{p.active_tenants || 0}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Platform Security Audit Log</h2>
            <p className="text-xs text-slate-500">Real-time log of sensitive administrative operations</p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-2 px-3">Timestamp</th>
                <th className="pb-2 px-3">User</th>
                <th className="pb-2 px-3">Role</th>
                <th className="pb-2 px-3">Action</th>
                <th className="pb-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                    {log.created_at.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{log.user_name || 'System'}</td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-extrabold text-slate-500">
                    {log.user_role || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-brand-700">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-700">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-800">Add New PG Property</h3>
              </div>
              <button
                onClick={() => setShowAddPropertyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. StayDesk Silicon Valley PG"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                  value={propForm.name}
                  onChange={(e) => setPropForm({ ...propForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unique Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PG-SILICON"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 uppercase focus:ring-2 focus:ring-purple-500"
                    value={propForm.code}
                    onChange={(e) => setPropForm({ ...propForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                    value={propForm.city}
                    onChange={(e) => setPropForm({ ...propForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Landmark / Area"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                  value={propForm.address}
                  onChange={(e) => setPropForm({ ...propForm, address: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
                >
                  Create Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
