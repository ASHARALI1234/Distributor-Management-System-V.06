import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, User, AlertCircle, ArrowRight, UserCheck, CheckCircle2, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string; role: string; phone: string; distributor_id?: number; distributor_name?: string }>>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableUsers(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your Username / Name / Phone and Password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: identifier.trim(), 
          phone: identifier.trim(),
          password: password.trim() 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userLoginId: string, quickPass: string) => {
    setIdentifier(userLoginId);
    setPassword(quickPass);
    setError(null);
    setLoading(true);
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identifier: userLoginId, 
        phone: userLoginId, 
        password: quickPass 
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          onLoginSuccess(data.user);
        } else {
          setError(data.error || 'Login failed');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const adminUser = availableUsers.find(u => u.role === 'admin') || { name: 'Admin Karachi', phone: '03001234567', distributor_name: 'All Distributors' };
  const centralUser = availableUsers.find(u => u.distributor_id === 1 && u.role !== 'admin') || availableUsers.find(u => u.role !== 'admin') || { name: 'Salman', phone: '03007654321', distributor_name: 'Karachi Central' };
  const southUser = availableUsers.find(u => u.distributor_id === 2) || { name: 'Tariq Mahmood', phone: '03005551234', distributor_name: 'South Zone FMCG' };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative z-10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 border border-indigo-400/30">
            <Shield className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono font-bold rounded-full mb-2 tracking-wider uppercase">
            Enterprise Distribution Platform
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Karachi DMS</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in with your Name, Username, or Phone</p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Username / Full Name / Phone No
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. Salman or Tariq Mahmood"
                disabled={loading}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Credentials Box */}
        <div className="mt-7 pt-5 border-t border-slate-700/60">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Quick 1-Click Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin(adminUser.name, 'admin123')}
              disabled={loading}
              className="p-2.5 bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    Admin
                  </span>
                  <UserCheck size={11} className="text-indigo-400 shrink-0" />
                </div>
                <p className="text-[9px] text-slate-400 truncate">HQ Master</p>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 font-semibold mt-1.5">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin(centralUser.name, 'Salman123')}
              disabled={loading}
              className="p-2.5 bg-slate-900/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {centralUser.name}
                  </span>
                  <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                </div>
                <p className="text-[9px] text-slate-400 truncate">Central Zone</p>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold mt-1.5">Salman123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin(southUser.name, 'south123')}
              disabled={loading}
              className="p-2.5 bg-slate-900/80 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-500/50 rounded-xl text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {southUser.name.split(' ')[0]}
                  </span>
                  <Building2 size={11} className="text-amber-400 shrink-0" />
                </div>
                <p className="text-[9px] text-slate-400 truncate">South Zone</p>
              </div>
              <span className="text-[9px] font-mono text-amber-400 font-semibold mt-1.5">south123</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <p className="text-xs text-slate-500 mt-6 text-center">
        Karachi DMS Security Layer • T-Codes: <span className="font-mono text-slate-400">USR1</span>, <span className="font-mono text-slate-400">SU01</span>, <span className="font-mono text-slate-400">TC01</span>
      </p>
    </div>
  );
};

