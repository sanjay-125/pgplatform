import React, { useState, useEffect } from 'react';
import { Property, Complaint } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ComplaintsViewProps {
  property: Property;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({ property }) => {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

  const loadComplaints = async () => {
    try {
      const data = await api.getComplaints(property.id);
      setComplaints(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [property.id]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateComplaintStatus(id, status);
      showToast(`Ticket status updated to ${status.replace('_', ' ')}`);
      loadComplaints();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filtered = complaints.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Maintenance & Complaints</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, assign and resolve maintenance tickets raised by resident tenants.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center p-1 bg-slate-200/70 rounded-xl w-fit">
        {(['all', 'pending', 'in_progress', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
              filter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-sm">
          Loading tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium text-xs">
          No maintenance tickets in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Raised by <strong className="text-slate-700">{item.tenant_name}</strong> · Room{' '}
                      {item.room_number || '—'} ({item.tenant_phone})
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      item.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 my-4 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">{item.created_at.slice(0, 10)}</span>

                <div className="flex items-center gap-2">
                  {item.status !== 'in_progress' && item.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {item.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition"
                    >
                      Mark Resolved ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
