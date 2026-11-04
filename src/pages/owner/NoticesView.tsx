import React, { useState, useEffect } from 'react';
import { Property, Notice } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Plus, Megaphone, Calendar, AlertTriangle } from 'lucide-react';

interface NoticesViewProps {
  property: Property;
  onOpenAddNotice: () => void;
}

export const NoticesView: React.FC<NoticesViewProps> = ({ property, onOpenAddNotice }) => {
  const { showToast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotices = async () => {
    try {
      const data = await api.getNotices(property.id);
      setNotices(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [property.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notice Board</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish PG announcements, rules, and maintenance schedules visible to resident tenants.
          </p>
        </div>
        <button
          onClick={onOpenAddNotice}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-sm">
          Loading announcements...
        </div>
      ) : notices.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium text-xs">
          No notices posted yet. Click &quot;Post Announcement&quot; to publish one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                n.priority === 'urgent'
                  ? 'bg-rose-50/70 border-rose-200'
                  : n.priority === 'high'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Megaphone
                    className={`w-4 h-4 ${
                      n.priority === 'urgent'
                        ? 'text-rose-600'
                        : n.priority === 'high'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <h3 className="font-extrabold text-slate-900 text-base">{n.title}</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                    n.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-800'
                      : n.priority === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {n.priority}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">{n.message}</p>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Posted on {n.created_at.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
