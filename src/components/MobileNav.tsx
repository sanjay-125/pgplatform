import React from 'react';
import { LayoutDashboard, Grid, Users, IndianRupee, PieChart, Menu } from 'lucide-react';
import { OwnerTab } from './Sidebar';

interface MobileNavProps {
  currentTab: OwnerTab;
  onTabChange: (tab: OwnerTab) => void;
  onOpenMore: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onTabChange, onOpenMore }) => {
  const quickTabs: { id: OwnerTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms', icon: Grid },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'rent', label: 'Rent', icon: IndianRupee },
    { id: 'expenses', label: 'Cash Flow', icon: PieChart },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {quickTabs.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">More</span>
      </button>
    </nav>
  );
};
