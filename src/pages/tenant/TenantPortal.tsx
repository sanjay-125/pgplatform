import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Payment } from '../../types';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ComplaintModal } from '../../components/ComplaintModal';
import { useToast } from '../../components/Toast';
import {
  Home,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Users,
  Printer,
  Wrench,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const TenantPortal: React.FC = () => {
  const { showToast } = useToast();
  const [stay, setStay] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiRef, setUpiRef] = useState('');

  const loadTenantData = async () => {
    try {
      const [stayData, roomData, payData] = await Promise.all([
        api.getTenantMe(),
        api.getTenantRoommates(),
        api.getTenantPayments(),
      ]);
      setStay(stayData);
      setRoommates(roomData);
      setPayments(payData);

      if (stayData?.property_id) {
        const noticeData = await api.getNotices(stayData.property_id);
        setNotices(noticeData);
      }
    } catch (err: any) {
      console.error('Error loading tenant portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, []);

  const handleSimulatePayment = () => {
    if (!upiRef.trim()) {
      showToast('Please enter transaction reference or UTR number', 'error');
      return;
    }
    showToast('Payment submitted for owner verification. Receipt will be generated upon approval.');
    setShowUpiModal(false);
    setUpiRef('');
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-slate-500 font-semibold animate-pulse text-sm">
        Loading your personal tenant portal...
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active stay found for this account. Please contact your PG manager.
      </div>
    );
  }

  const isRentCleared = stay.currentMonthDue === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-brand-700/60 text-brand-200 text-xs font-bold uppercase tracking-wider inline-block mb-3 border border-brand-500/30">
            Resident Tenant Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {stay.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {stay.property_name} · Room {stay.room_number} (Bed {stay.bed_number})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComplaintModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 border border-slate-700 transition"
          >
            <Wrench className="w-4 h-4" />
            <span>Raise Maintenance Ticket</span>
          </button>
        </div>
      </div>

      {/* Stay & Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rent Due Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {stay.currentPeriod} Rent Status
            </span>
            <div className="mt-2 flex items-center gap-2">
              {isRentCleared ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Rent Paid in Full
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Due: {formatCurrency(stay.currentMonthDue)}
                </span>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>Monthly Rent:</span>
                <span className="font-bold text-slate-800">{formatCurrency(stay.rent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid for {stay.currentPeriod}:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(stay.currentMonthPaid)}</span>
              </div>
            </div>
          </div>

          {!isRentCleared && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowUpiModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay Online / UPI QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Stay Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Stay Details
          </span>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Room Number:</span>
              <span className="font-bold text-slate-800">Room {stay.room_number}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Bed Allocation:</span>
              <span className="font-bold text-slate-800">Bed {stay.bed_number}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Room Type:</span>
              <span className="font-bold text-slate-800">{stay.room_type || 'Non-AC'}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Joining Date:</span>
              <span className="font-bold text-slate-800">{stay.joined_date}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span className="font-bold text-slate-800">{formatCurrency(stay.deposit)}</span>
            </div>
          </div>
        </div>

        {/* Roommates Card (Privacy Enforced!) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                My Roommates
              </span>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                Room {stay.room_number}
              </span>
            </div>

            {roommates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No other active roommates in this room.</p>
            ) : (
              <div className="space-y-3">
                {roommates.map((rm) => (
                  <div
                    key={rm.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                        {rm.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{rm.name}</div>
                        <div className="text-[10px] text-slate-400">Bed {rm.bedNumber}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {rm.shareContact && rm.phone ? (
                        <a
                          href={`tel:${rm.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{rm.phone}</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <ShieldAlert className="w-3 h-3 text-slate-400" />
                          <span>Private</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 leading-tight pt-3 border-t border-slate-100">
            🔒 Contact numbers only appear when roommates have explicitly consented to share them.
          </div>
        </div>
      </div>

      {/* Payment History & Printable Receipts */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">My Payment History</h2>
          <p className="text-xs text-slate-500">Official records and receipts for payments made to this PG</p>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Receipt No.</th>
                  <th className="pb-3 px-3">Rent Period</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-brand-700">
                      {p.receipt_no}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.period}</td>
                    <td className="py-3 px-3 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{p.date}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActiveReceipt(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition"
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

      {/* Notices from Management */}
      {notices.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Notices from Management</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">{n.title}</span>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-1">{n.created_at.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal payment={activeReceipt} onClose={() => setActiveReceipt(null)} />

      {/* Complaint Modal */}
      {showComplaintModal && (
        <ComplaintModal
          onClose={() => setShowComplaintModal(false)}
          onSuccess={() => {
            showToast('Maintenance request received');
          }}
        />
      )}

      {/* UPI QR Simulation Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Pay Monthly Rent via UPI</h3>
              <p className="text-xs text-slate-500 mt-1">Scan QR or transfer to PG Account</p>
            </div>

            {/* Simulated QR Box */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="w-36 h-36 bg-white border-2 border-slate-900 p-2 flex items-center justify-center rounded-xl shadow-inner font-mono text-[9px] text-slate-400">
                [ UPI QR CODE SIMULATION ]<br />
                staydesk@upi
              </div>
              <span className="text-xs font-bold text-slate-800 mt-3">UPI ID: staydesk@okaxis</span>
              <span className="text-base font-black text-emerald-600 mt-1">
                {formatCurrency(stay.currentMonthDue)}
              </span>
            </div>

            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Transaction Reference / UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 984719284729"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
