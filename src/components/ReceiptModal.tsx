import React from 'react';
import { Payment } from '../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header (No Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-800">Rent Payment Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-8 space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-brand-600 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                  S
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900">StayDesk</h1>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PG & Hostel Management</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                {payment.property_name || 'StayDesk PG Platform'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded-md border border-brand-200">
                {payment.receipt_no}
              </span>
              <p className="text-xs text-slate-500 mt-1.5">Date: <strong className="text-slate-800">{payment.date}</strong></p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3 text-sm">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Received From:</span>
              <span className="font-bold text-slate-900">{payment.tenant_name || 'Tenant'}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Room / Bed:</span>
              <span className="font-semibold text-slate-800">Room {payment.room_number || '—'} / Bed {payment.bed_number || '—'}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Rent Period:</span>
              <span className="font-semibold text-slate-800">{payment.period}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-800">{payment.method}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Transaction Reference:</span>
              <span className="font-mono text-xs text-slate-700">{payment.ref}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-slate-700 text-base">Amount Received:</span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>

          {/* Disclaimer & Footer */}
          <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
            <p>
              This is an official computer-generated receipt from StayDesk PG Management. It validates receipt of rent dues recorded by property management.
            </p>
          </div>
        </div>

        {/* Modal Actions (No Print) */}
        <div className="no-print flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
};
