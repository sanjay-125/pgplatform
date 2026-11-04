import React, { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';
import { Tenant, Payment } from '../types';

interface PaymentModalProps {
  propertyId: number;
  tenants: Tenant[];
  presetTenantId?: number;
  defaultPeriod?: string;
  onClose: () => void;
  onSuccess: (newPaymentReceipt?: Payment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  propertyId,
  tenants,
  presetTenantId,
  defaultPeriod,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const activeTenants = tenants.filter((t) => t.status === 'active');
  const initialTenantId = presetTenantId || activeTenants[0]?.id || 0;

  const [form, setForm] = useState({
    tenantId: initialTenantId,
    period: defaultPeriod || new Date().toISOString().slice(0, 7),
    amount: 6500,
    date: new Date().toISOString().slice(0, 10),
    method: 'UPI' as 'UPI' | 'Cash' | 'Bank transfer' | 'Cheque' | 'Other',
    ref: '',
  });

  useEffect(() => {
    const t = activeTenants.find((item) => item.id === form.tenantId);
    if (t?.rent) {
      setForm((prev) => ({ ...prev, amount: t.rent }));
    }
  }, [form.tenantId, activeTenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId) {
      showToast('Please select a tenant', 'error');
      return;
    }
    if (form.amount <= 0) {
      showToast('Amount must be greater than zero', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.recordPayment(propertyId, {
        tenantId: Number(form.tenantId),
        period: form.period,
        amount: Number(form.amount),
        date: form.date,
        method: form.method,
        ref: form.ref.trim(),
      });
      showToast(`Payment of ₹${form.amount} recorded! Receipt: ${res.receiptNo}`);

      // Fetch the full receipt to pop up receipt modal
      try {
        const fullReceipt = await api.getReceipt(res.id);
        onSuccess(fullReceipt);
      } catch {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-800">Record Rent Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Tenant *
            </label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: Number(e.target.value) })}
            >
              {activeTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Room {t.room_number || '—'} / Bed {t.bed_number || '—'} · ₹{t.rent}/mo)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rent Period *
              </label>
              <input
                type="month"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="100"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Method *
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as any })}
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Bank transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Transaction Reference / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / Bank UTR / Cash receipt tag"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
              value={form.ref}
              onChange={(e) => setForm({ ...form, ref: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment & Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
