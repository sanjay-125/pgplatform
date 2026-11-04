import React, { useEffect, useState } from 'react';
import { Property, FinancialSummary, ReminderTenant } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Users, BedDouble, IndianRupee, AlertCircle, TrendingUp, UserPlus, CreditCard, Receipt, MessageCircle } from 'lucide-react';

interface DashboardProps {
  property: Property;
  onNavigate: (tab: any) => void;
  onOpenAddTenant: () => void;
  onOpenRecordPayment: () => void;
  onOpenAddExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  property,
  onNavigate,
  onOpenAddTenant,
  onOpenRecordPayment,
  onOpenAddExpense,
}) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [reminders, setReminders] = useState<ReminderTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadData = async () => {
    try {
      const [sumData, remData] = await Promise.all([
        api.getSummary(property.id, currentMonth),
        api.getReminders(property.id, currentMonth),
      ]);
      setSummary(sumData);
      setReminders(remData.filter((r) => r.balance > 0).slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [property.id]);

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">
        Loading property dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-brand-700/60 text-brand-200 text-xs font-bold uppercase tracking-wider inline-block mb-3 border border-brand-500/30">
            {property.name} · {property.code}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Property Overview</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time occupancy tracking, rent collection ledger, and net cash flow for {currentMonth}.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddTenant}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-brand-600" />
            <span>Check-In Tenant</span>
          </button>
          <button
            onClick={onOpenRecordPayment}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 shadow-sm transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 border border-slate-700 shadow-sm transition active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Occupancy Rate"
          value={`${summary?.occupancyRate || 0}%`}
          subtitle={`${summary?.occupiedBeds || 0} occupied of ${summary?.totalBeds || 0} beds (${summary?.vacantBeds || 0} vacant)`}
          icon={BedDouble}
          accentColor="brand"
        />

        <StatCard
          label="Rent Collected"
          value={formatCurrency(summary?.collectedRent || 0)}
          subtitle={`For month of ${currentMonth}`}
          icon={IndianRupee}
          accentColor="emerald"
        />

        <StatCard
          label="Rent Outstanding"
          value={formatCurrency(summary?.outstandingRent || 0)}
          subtitle={`${reminders.length} tenant(s) with dues`}
          icon={AlertCircle}
          accentColor={summary?.outstandingRent ? 'amber' : 'emerald'}
        />

        <StatCard
          label="Net Operating Cash Flow"
          value={formatCurrency(summary?.netCashFlow || 0)}
          subtitle={`Rent less ₹${summary?.totalExpenses || 0} operating costs`}
          icon={TrendingUp}
          accentColor={(summary?.netCashFlow || 0) >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Progress & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection & Cash Flow Health Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Monthly Rent Collection Progress</h2>
              <p className="text-xs text-slate-500">Selected period: {currentMonth}</p>
            </div>
            <button
              onClick={() => onNavigate('rent')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              View All Payments →
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>
                Collected: <strong className="text-emerald-600">{formatCurrency(summary?.collectedRent || 0)}</strong>
              </span>
              <span>
                Expected Total: <strong>{formatCurrency(summary?.expectedRent || 0)}</strong>
              </span>
            </div>
            <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              <div
                className="bg-emerald-500 transition-all duration-500 rounded-full"
                style={{
                  width: `${
                    summary?.expectedRent
                      ? Math.min(100, Math.round((summary.collectedRent / summary.expectedRent) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Key Stat Blocks */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Received Rent</span>
              <span className="text-xl font-black text-emerald-700 block mt-1">
                {formatCurrency(summary?.collectedRent || 0)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Pending Rent</span>
              <span className="text-xl font-black text-amber-700 block mt-1">
                {formatCurrency(summary?.outstandingRent || 0)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-600 uppercase block">Deposits Held</span>
              <span className="text-xl font-black text-slate-800 block mt-1">
                {formatCurrency(summary?.totalDeposits || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Occupancy Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Bed Occupancy</h2>
              <button
                onClick={() => onNavigate('rooms')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View Rooms →
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 text-center">
              <span className="text-4xl font-black text-brand-700 block">
                {summary?.occupancyRate || 0}%
              </span>
              <span className="text-xs font-bold text-brand-900 mt-1 block">
                {summary?.occupiedBeds || 0} Beds Occupied · {summary?.vacantBeds || 0} Vacant
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div className="flex justify-between font-medium">
              <span>Total Capacity:</span>
              <span className="font-bold text-slate-800">{summary?.totalBeds || 0} Beds</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Available for Allocation:</span>
              <span className="font-bold text-emerald-600">{summary?.vacantBeds || 0} Vacant Beds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Rent Attention Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Rent Requiring Attention</h2>
            <p className="text-xs text-slate-500">Tenants with unpaid or partial balances this month</p>
          </div>
          <button
            onClick={() => onNavigate('reminders')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Open Reminders Hub →
          </button>
        </div>

        {reminders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            🎉 All active tenants have cleared their rent for this month!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Tenant</th>
                  <th className="pb-3 px-3">Room / Bed</th>
                  <th className="pb-3 px-3">Rent</th>
                  <th className="pb-3 px-3">Paid</th>
                  <th className="pb-3 px-3">Balance</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reminders.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{t.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      Room {t.room_number || '—'} / Bed {t.bed_number || '—'}
                    </td>
                    <td className="py-3 px-3">{formatCurrency(t.rent)}</td>
                    <td className="py-3 px-3 text-emerald-600 font-semibold">
                      {formatCurrency(t.paid_amount || 0)}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600">{formatCurrency(t.balance)}</td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={t.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Reminder</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
