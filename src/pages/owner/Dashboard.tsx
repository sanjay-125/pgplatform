import React, { useEffect, useState } from 'react';
import { Property, FinancialSummary, ReminderTenant, Complaint } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { DashboardSkeleton } from '../../components/LoadingStates';
import { Users, BedDouble, IndianRupee, AlertCircle, Receipt, MessageCircle, UserPlus, Wrench } from 'lucide-react';

// Placeholder values for the check-in request dashboard card until request data is available.
const checkInRequestPreview = {
  awaitingReview: 3,
  oldestRequestAge: '2 days ago',
};

interface DashboardProps {
  property: Property;
  onNavigate: (tab: any) => void;
  onOpenAddExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  property,
  onNavigate,
  onOpenAddExpense,
}) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [reminders, setReminders] = useState<ReminderTenant[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${currentMonth}-01T00:00:00`));

  const loadData = async () => {
    try {
      const [sumData, remData, complaintData] = await Promise.all([
        api.getSummary(property.id, currentMonth),
        api.getReminders(property.id, currentMonth),
        api.getComplaints(property.id).catch((err) => {
          console.error('Error loading maintenance ticket summary:', err);
          return [];
        }),
      ]);
      setSummary(sumData);
      setReminders(remData.filter((r) => r.balance > 0).slice(0, 5));
      setComplaints(complaintData);
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

  const pendingTickets = complaints.filter((complaint) => complaint.status === 'pending').length;
  const inProgressTickets = complaints.filter((complaint) => complaint.status === 'in_progress').length;
  const openTickets = pendingTickets + inProgressTickets;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Property Overview</h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('tenants')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>View Tenant Check-in Requests</span>
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupancy Rate</span>
            <div className="p-2 rounded-xl border bg-brand-50 text-brand-600 border-brand-200">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-2xl bg-brand-50/60 border border-brand-100 text-center">
            <span className="text-3xl font-black text-brand-700 block">
              {summary?.occupancyRate || 0}%
            </span>
            <span className="text-[11px] font-bold text-brand-900 mt-0.5 block">
              {summary?.occupiedBeds || 0} Beds Occupied · {summary?.vacantBeds || 0} Vacant
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('rooms')}
            className="mt-2 inline-flex h-8 w-[88px] self-center items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-[10px] font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            View rooms
          </button>
        </div>

        <StatCard
          label="Rent Collected"
          value={formatCurrency(summary?.collectedRent || 0)}
          subtitle={`For ${currentMonthLabel}`}
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

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maintenance Tickets</span>
              <div className="p-2.5 rounded-xl border bg-brand-50 text-brand-600 border-brand-200">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-brand-100 bg-brand-50">
                <span className="text-2xl font-black leading-none text-brand-700">{openTickets}</span>
                <span className="mt-1 text-[9px] font-extrabold uppercase tracking-wide text-brand-700">Open</span>
              </div>
              <div className="min-w-0 flex flex-1 flex-col justify-center sm:flex-none">
                <div className="flex flex-row items-center justify-center gap-1 sm:flex-col sm:items-start sm:justify-start sm:gap-1.5">
                  <span className="whitespace-nowrap rounded-lg border border-amber-100 bg-amber-50 px-1.5 py-1 text-[9px] font-bold text-amber-700 sm:px-2">
                    {pendingTickets} Pending
                  </span>
                  <span className="whitespace-nowrap rounded-lg border border-blue-100 bg-blue-50 px-1.5 py-1 text-[9px] font-bold text-blue-700 sm:px-2">
                    {inProgressTickets} In progress
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('complaints')}
                className="inline-flex h-8 w-[88px] shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-[10px] font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:hidden"
              >
                View tickets
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('complaints')}
            className="mt-3 hidden h-8 w-[88px] self-center items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-[10px] font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:inline-flex"
          >
            View tickets
          </button>
        </div>
      </div>

      {/* Progress & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection & Cash Flow Health Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Monthly Rent Collection Progress</h2>
              <p className="text-xs text-slate-500">Selected period: {currentMonthLabel}</p>
            </div>
            <button
              onClick={() => onNavigate('rent')}
              className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              View All Payments
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

        {/* Tenant check-in request preview; replace placeholder values when request data is available. */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-slate-900">Tenant Check-in Requests</h2>
            </div>

            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-brand-100 bg-white">
                  <span className="text-3xl font-black leading-none text-brand-700">
                    {checkInRequestPreview.awaitingReview}
                  </span>
                  <span className="mt-1 text-[9px] font-extrabold uppercase tracking-wide text-brand-700">Pending</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Awaiting review</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Tenant check-in requests need your attention.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('tenants')}
            className="mt-4 inline-flex h-[34px] self-center items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <UserPlus className="h-3.5 w-3.5" />
            View requests
          </button>
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
            className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Open Reminders Hub
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
