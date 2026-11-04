import React, { useState, useEffect } from 'react';
import { Property, ReminderTenant, Payment } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { MessageCircle, CheckCircle2, Calendar, Printer } from 'lucide-react';

interface RemindersViewProps {
  property: Property;
  onViewReceipt: (payment: Payment) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ property, onViewReceipt }) => {
  const { showToast } = useToast();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [reminders, setReminders] = useState<ReminderTenant[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [remData, payData] = await Promise.all([
        api.getReminders(property.id, period),
        api.getPayments(property.id),
      ]);
      setReminders(remData);
      setRecentPayments(payData.slice(0, 10));
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [property.id, period]);

  const pendingReminders = reminders.filter((r) => r.balance > 0);
  const fullyPaidReminders = reminders.filter((r) => r.balance === 0);

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reminders & Recent Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Send WhatsApp rent reminders with pre-composed messages and reprint official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-700 uppercase">Billing Month:</span>
          <input
            type="month"
            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>

      {/* Outstanding Rent Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Outstanding Rent Balances ({pendingReminders.length} Pending)
            </h2>
            <p className="text-xs text-slate-500">
              Tenants who have not yet cleared their monthly rent for {period}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600">
            {fullyPaidReminders.length} Residents Fully Paid
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 font-semibold animate-pulse text-sm">
            Calculating balances...
          </div>
        ) : pendingReminders.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All residents have paid their rent for {period}! No pending dues.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Resident</th>
                  <th className="pb-3 px-3">Room / Bed</th>
                  <th className="pb-3 px-3">Rent Due</th>
                  <th className="pb-3 px-3">Amount Paid</th>
                  <th className="pb-3 px-3">Balance</th>
                  <th className="pb-3 px-3 text-right">Send Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pendingReminders.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{t.phone}</div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      Room {t.room_number || '—'} / Bed {t.bed_number || '—'}
                    </td>
                    <td className="py-3.5 px-3">{formatCurrency(t.rent)}</td>
                    <td className="py-3.5 px-3 text-emerald-600 font-semibold">
                      {formatCurrency(t.paid_amount || 0)}
                    </td>
                    <td className="py-3.5 px-3 font-black text-rose-600">
                      {formatCurrency(t.balance)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <a
                        href={t.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Receipts List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Recent Payment Receipts</h2>
          <p className="text-xs text-slate-500">Quickly reprint any recently recorded rent receipt</p>
        </div>

        {recentPayments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No receipts generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Receipt No.</th>
                  <th className="pb-3 px-3">Resident</th>
                  <th className="pb-3 px-3">Period</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-brand-700">
                      {p.receipt_no}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.tenant_name || 'Resident'}</td>
                    <td className="py-3 px-3 text-xs text-slate-600">{p.period}</td>
                    <td className="py-3 px-3 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{p.date}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onViewReceipt(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-bold text-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
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
