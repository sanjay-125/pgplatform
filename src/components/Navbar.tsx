import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, ShieldCheck, UserCheck, Home, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, properties, activeProperty, switchProperty, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
          </span>
        );
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <Building2 className="w-3.5 h-3.5" /> PG Owner
          </span>
        );
      case 'tenant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5" /> Resident Tenant
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-8">
      {/* Left side: Brand or Property selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            S
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">StayDesk</span>
        </div>

        {/* Property Selector for Owners with 1+ properties */}
        {user?.role === 'owner' && properties.length > 0 && (
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm cursor-pointer transition">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <select
                aria-label="Select Property"
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer pr-1"
                value={activeProperty?.id || ''}
                onChange={(e) => switchProperty(Number(e.target.value))}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {user?.role === 'tenant' && activeProperty && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>{activeProperty.name}</span>
          </div>
        )}
      </div>

      {/* Right side: User Profile, Role Badge, Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {getRoleBadge(user?.role)}

        <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-xs">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U'}
          </div>
          <div className="text-left text-xs leading-tight">
            <p className="font-bold text-slate-800">{user?.name}</p>
            <p className="text-slate-400 font-normal">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out of StayDesk"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};
