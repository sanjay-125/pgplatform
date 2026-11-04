import React, { useState, useEffect } from 'react';
import { Property, Payment } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Plus, Search, Printer, Calendar } from 'lucide-react';

interface RentPaymentsViewProps {
  property: Property;
  onOpenRecordPayment: () => void;
  onViewReceipt: (payment: Payment) => void;
}

export const RentPaymentsView: React.FC<RentPaymentsViewProps> = ({
  property,
  onOpenRecordPayment,
  onViewReceipt,
}) => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');

  const loadPayments = async () => {
    try {
      const data = await api.getPayments(property.id, period || undefined);
      setPayments(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [property.id, period]);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.tenant_name && p.tenant_name.toLowerCase().includes(q)) ||
      (p.ref && p.ref.toLowerCase().includes(q)) ||
      (p.receipt_no && p.receipt_no.toLowerCase().includes(q)) ||
      (p.method && p.method.toLowerCase().includes(q))
    );
  });

  const totalCollectedInView = filtered.reduce((s, p) => s + p.amount, 0);

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rent & Payments Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track rent receipts, partial payments, payment methods, and transaction references.
          </p>
        </div>
        <button
          onClick={onOpenRecordPayment}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Period Selector & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-700 uppercase">Rent Month:</span>
          <input
            type="month"
            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          {period && (
            <button
              onClick={() => setPeriod('')}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-800 ml-1"
            >
              (Show All)
            </button>
          )}
        </div>

        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tenant, receipt, txn ref..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs">
        <span className="font-bold text-emerald-900">
          Total Collected in View: <strong className="text-base font-black">{formatCurrency(totalCollectedInView)}</strong>
        </span>
        <span className="text-emerald-700 font-semibold">{filtered.length} Recorded Payment(s)</span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-sm">
            Loading payment records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No payments recorded for this period. Click &quot;Record New Payment&quot; to log one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt No.</th>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Room / Bed</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Txn Reference</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-brand-700">
                      {p.receipt_no}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.tenant_name || 'Tenant'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      Room {p.room_number || '—'} / Bed {p.bed_number || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">{p.period}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{p.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{p.ref || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
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
