import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, ShieldCheck, UserCheck, Home, ChevronDown, User } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, properties, activeProperty, switchProperty, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
            <UserCheck className="w-3.5 h-3.5" /> Tenant
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-8">
      {/* Left side: Brand or Property selector */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Brand logo & name - constant across all portals on mobile and laptop view */}
        <BrandLogo />

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

        {/* User Profile Button with Dropdown (Envelops name card & name; direct email removed) */}
        <div className="relative border-l border-slate-200 pl-3 sm:pl-4" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {/* Avatar Circle ("Name Card") */}
            <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-xs shadow-sm shrink-0">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'}
            </div>

            {/* User Name Only (Email display avoided as requested) */}
            <span className="font-bold text-xs text-slate-800 hidden sm:inline truncate max-w-[130px]">
              {user?.name}
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-brand-600' : ''
              }`}
            />
          </button>

          {/* Profile & Sign Out Dropdown Menu */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3.5 py-1.5 border-b border-slate-100 sm:hidden">
                <p className="font-bold text-xs text-slate-800 truncate">{user?.name}</p>
              </div>

              {/* My Profile Option */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 hover:bg-slate-50 transition text-left"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {/* Sign Out Option (under dropdown) */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </header>
  );
};
