import React from 'react';
import { Property } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Download, ShieldCheck, Database, HardDriveDownload } from 'lucide-react';

interface BackupViewProps {
  property: Property;
}

export const BackupView: React.FC<BackupViewProps> = ({ property }) => {
  const { showToast } = useToast();

  const handleExport = () => {
    try {
      const url = api.getBackupExportUrl(property.id);
      window.open(url, '_blank');
      showToast('Export downloaded successfully!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Backup & Export</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export your complete property records into standard JSON format for offsite archiving or compliance.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Export Property Dataset</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Downloads a timestamped snapshot of all rooms, beds, resident profiles, rent transactions, receipts, and expense ledgers for <strong>{property.name}</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Production Data Security</span>
          </div>
          <p className="leading-relaxed">
            The generated backup contains operational tenant data. Store the file securely and restrict access to authorized personnel only. Full ID references are minimized according to data privacy guidelines.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition active:scale-95"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>Download JSON Backup Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
