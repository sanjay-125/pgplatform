import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Building2, ShieldCheck, UserCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('owner@staydesk.in');
  const [password, setPassword] = useState('Owner@123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Welcome to StayDesk!');
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    login(demoEmail, demoPass).catch((err) => {
      showToast(err.message, 'error');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white">
      {/* Brand Header */}
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-600/30 mb-3 border border-brand-400/30">
          S
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">StayDesk</h1>
        <p className="text-xs uppercase tracking-widest text-brand-300 font-bold mt-1">
          Production PG & Hostel Management Platform
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enter your credentials or choose a role below for instant demo testing.
          </p>
        </div>

        {/* Quick Demo Selector */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Demo 1-Click Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@staydesk.in', 'Owner@123')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 transition text-center group"
            >
              <Building2 className="w-4 h-4 mb-1 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">PG Owner</span>
              <span className="text-[9px] text-blue-600/80">Manage PGs</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('arun@staydesk.in', 'Tenant@123')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 transition text-center group"
            >
              <UserCheck className="w-4 h-4 mb-1 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Tenant</span>
              <span className="text-[9px] text-emerald-600/80">My Stay Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin@staydesk.in', 'SuperAdmin@123')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-800 transition text-center group"
            >
              <ShieldCheck className="w-4 h-4 mb-1 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Super Admin</span>
              <span className="text-[9px] text-purple-600/80">Platform View</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                placeholder="name@staydesk.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.99] shadow-lg shadow-brand-600/25 transition disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Signing In...' : 'Sign In to StayDesk'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security & Audit note */}
        <div className="text-[11px] text-slate-400 text-center leading-relaxed border-t border-slate-100 pt-4">
          Protected by bcrypt password hashing and JWT role-based session enforcement. Multi-property data isolation enforced on every query.
        </div>
      </div>
    </div>
  );
};
