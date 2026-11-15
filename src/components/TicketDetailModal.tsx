import React, { useEffect } from 'react';
import { Complaint } from '../types';
import { X, Wrench, Clock, CheckCircle2, AlertCircle, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { formatIndianDate } from '../utils/validation';

interface TicketDetailModalProps {
  ticket: Complaint | null;
  onClose: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ticket) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            In Progress
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            {priority === 'urgent' ? 'Urgent Priority' : 'High Priority'}
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Medium Priority
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-sm">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 id="ticket-detail-title" className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                Maintenance Ticket Details
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Ticket #{ticket.id} · Raised on {formatIndianDate(ticket.created_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Issue Title Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Issue Title
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-1">
              {ticket.title}
            </h4>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Category */}
            <div className="p-2.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Category
              </span>
              <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-800">
                <Tag className="w-3 h-3 text-brand-600 shrink-0" />
                <span className="truncate">{ticket.category}</span>
              </div>
            </div>

            {/* Status */}
            <div className="p-2.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Status
              </span>
              <div className="mt-1">{getStatusBadge(ticket.status)}</div>
            </div>

            {/* Priority */}
            <div className="p-2.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Priority
              </span>
              <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
            </div>

            {/* Raised Date */}
            <div className="p-2.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Raised Date
              </span>
              <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-800">
                <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                <span>{formatIndianDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Issue Description
            </span>
            <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[90px]">
              {ticket.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Resolution Note if available */}
          {ticket.resolution_note && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Resolution Note from Management
              </span>
              <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                {ticket.resolution_note}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
