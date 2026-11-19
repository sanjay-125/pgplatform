import React from 'react';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  Grid,
  Users,
  IndianRupee,
  BellRing,
  PieChart,
  Wrench,
  Megaphone,
  Download,
  Building,
} from 'lucide-react';

export type OwnerTab =
  | 'dashboard'
  | 'rooms'
  | 'tenants'
  | 'rent'
  | 'reminders'
  | 'expenses'
  | 'complaints'
  | 'notices'
  | 'backup';

interface SidebarProps {
  currentTab: OwnerTab;
  onTabChange: (tab: OwnerTab) => void;
  propertyName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, propertyName }) => {
  const navItems = [
    { id: 'dashboard' as OwnerTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms' as OwnerTab, label: 'Rooms & Beds', icon: Grid },
    { id: 'tenants' as OwnerTab, label: 'Tenants', icon: Users },
    { id: 'rent' as OwnerTab, label: 'Rent & Payments', icon: IndianRupee },
    { id: 'reminders' as OwnerTab, label: 'Reminders & Receipts', icon: BellRing },
    { id: 'expenses' as OwnerTab, label: 'Expenses & Cash Flow', icon: PieChart },
    { id: 'complaints' as OwnerTab, label: 'Maintenance Tickets', icon: Wrench },
    { id: 'notices' as OwnerTab, label: 'Notices & Board', icon: Megaphone },
    { id: 'backup' as OwnerTab, label: 'Backup & Export', icon: Download },
  ];

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:self-start md:overflow-y-auto flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <BrandLogo
          iconClassName="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
          textClassName="font-extrabold text-white tracking-tight text-base block"
        />
      </div>

      {/* Property banner */}
      {propertyName && (
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
          <Building className="w-4 h-4 text-brand-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block tracking-wider">Assigned PG</span>
            <span className="text-xs font-bold text-white truncate block">{propertyName}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
