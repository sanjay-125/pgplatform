import React, { useState } from 'react';
import { X, ClipboardList, Calendar, Sparkles } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';
import { StyledSelect } from './StyledSelect';
import { ButtonSpinner } from './LoadingStates';
import { StayRequestType } from '../types';

interface RaiseRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RaiseRequestModal: React.FC<RaiseRequestModalProps> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<{
    request_type: StayRequestType;
    title: string;
    description: string;
    target_date: string;
  }>({
    request_type: 'Room Change',
    title: '',
    description: '',
    target_date: '',
  });

  const getDynamicPlaceholders = (type: StayRequestType) => {
    switch (type) {
      case 'Bed Change':
        return {
          title: 'e.g. Shift to Bed A near the window',
          dateLabel: 'Preferred Bed Switch Date',
          description: 'Mention the specific bed or reason for switching beds in your room...',
        };
      case 'Room Change':
        return {
          title: 'e.g. Request to move to Room 204 (single sharing)',
          dateLabel: 'Preferred Moving Date',
          description: 'Specify preferred floor, room type (Single/Double), or reason for relocation...',
        };
      case 'Visitor':
        return {
          title: 'e.g. Weekend visitor pass for friend / family',
          dateLabel: 'Visitor Arrival Date',
          description: 'Provide visitor full name, contact number, relation, duration of stay, etc...',
        };
      case 'Move Out':
        return {
          title: 'e.g. Move out notice for end of this month',
          dateLabel: 'Planned Move Out Date',
          description: 'Provide your reason for vacating, notice period details, and bank account for deposit settlement...',
        };
      default:
        return {
          title: 'Enter request title',
          dateLabel: 'Preferred Date',
          description: 'Provide details regarding your request...',
        };
    }
  };

  const dynamicInfo = getDynamicPlaceholders(form.request_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      showToast('Title and details are required', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.submitTenantStayRequest({
        request_type: form.request_type,
        title: form.title.trim(),
        description: form.description.trim(),
        target_date: form.target_date || undefined,
      });
      showToast('Stay request submitted to management!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="raise-request-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-sm">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 id="raise-request-title" className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                Raise Stay Request
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Submit a request to property management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/70 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" aria-busy={loading}>
          {/* Request Type Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Request Type *
            </label>
            <StyledSelect
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              value={form.request_type}
              onValueChange={(val) => setForm({ ...form, request_type: val as StayRequestType })}
            >
              <option value="Bed Change">Bed Change</option>
              <option value="Room Change">Room Change</option>
              <option value="Visitor">Visitor</option>
              <option value="Move Out">Move Out</option>
            </StyledSelect>
          </div>

          {/* Request Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Request Title / Subject *
            </label>
            <input
              type="text"
              required
              placeholder={dynamicInfo.title}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Preferred / Target Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {dynamicInfo.dateLabel} (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              />
            </div>
          </div>

          {/* Detailed Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Details & Reason *
            </label>
            <textarea
              required
              rows={4}
              placeholder={dynamicInfo.description}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {loading ? <ButtonSpinner label="Submitting..." /> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
