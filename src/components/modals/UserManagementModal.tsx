import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Search, Phone, Key, User, CheckCircle, AlertCircle, Building2, Edit2, Plus, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { DmsUser, Distributor } from '../../types';

interface UserManagementModalProps {
  onClose: () => void;
  currentUserRole?: string;
  onOpenDistributorMaster?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  onClose,
  currentUserRole,
  onOpenDistributorMaster
}) => {
  const [users, setUsers] = useState<DmsUser[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'salesman' | 'order_booker' | 'accountant' | 'driver'>('salesman');
  const [distributorId, setDistributorId] = useState<string>('1');
  const [password, setPassword] = useState('');

  // Keyboard shortcut: Escape or F3 to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, distRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/distributors')
      ]);

      const usersData = await usersRes.json();
      const distData = await distRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(distData)) {
        setDistributors(distData);
        if (distData.length > 0 && !distributorId) {
          setDistributorId(String(distData[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch users or distributors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditUser = (user: DmsUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setPhone(user.phone);
    setRole(user.role as any);
    setDistributorId(user.distributor_id ? String(user.distributor_id) : (user.role === 'admin' ? 'all' : '1'));
    setPassword('');
    setStatusMessage(null);
  };

  const handleResetForm = () => {
    setEditingUserId(null);
    setName('');
    setPhone('');
    setRole('salesman');
    setDistributorId(distributors.length > 0 ? String(distributors[0].id) : '1');
    setPassword('');
    setStatusMessage(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and Phone number are required' });
      return;
    }

    if (!editingUserId && !password.trim()) {
      setStatusMessage({ type: 'error', text: 'Initial Password is required for new users' });
      return;
    }

    if (role !== 'admin' && (!distributorId || distributorId === 'all')) {
      setStatusMessage({ type: 'error', text: 'You must assign a Distributor for this user role' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        role,
        password: password.trim(),
        distributor_id: distributorId === 'all' || !distributorId ? null : Number(distributorId)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save user account');
      }

      setStatusMessage({
        type: 'success',
        text: editingUserId ? `User ${name} updated successfully` : `User ${name} created and assigned successfully`
      });

      handleResetForm();
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete user');
      }
      setStatusMessage({ type: 'success', text: `User ${userName} removed` });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.distributor_name && u.distributor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.distributor_code && u.distributor_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">User Master & Distributor Access Control</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  T-Code: USR1 / SU01
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign distributors to operators, field salesmen, bookers, and restrict transaction visibility
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenDistributorMaster && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDistributorMaster();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-bold rounded-xl transition-all"
                title="Open Distributor Master Setup (DST01)"
              >
                <Building2 size={14} />
                <span>Distributor Setup (DST01)</span>
                <ExternalLink size={12} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-400 hover:text-white"
              title="Close (F3 / Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`px-6 py-2.5 flex items-center gap-2 text-xs font-bold ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <AlertCircle size={15} className="text-rose-600 shrink-0" />}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body (2 Columns on Large Screens) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Left Column: Create / Edit User Form (5 Cols) */}
          <div className="md:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {editingUserId ? <Edit2 size={17} className="text-indigo-600" /> : <UserPlus size={17} className="text-indigo-600" />}
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {editingUserId ? 'Edit User Credentials' : 'Add New User & Assign Distributor'}
                  </h4>
                </div>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                  >
                    + New User
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveUser} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Phone Number / Login ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 03009876543"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      System Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all font-semibold"
                    >
                      <option value="admin">Super Admin (HQ)</option>
                      <option value="salesman">Salesman (Field Sales)</option>
                      <option value="order_booker">Order Booker</option>
                      <option value="accountant">Accountant</option>
                      <option value="driver">Driver (Logistics)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      {editingUserId ? 'New Password' : 'Password'} {editingUserId ? '' : <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required={!editingUserId}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={editingUserId ? 'Keep existing' : 'e.g. pass123'}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Distributor Assignment Box */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                      <Building2 size={14} className="text-indigo-600" />
                      <span>Assigned Distributor</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    {role === 'admin' && (
                      <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                        HQ / Optional
                      </span>
                    )}
                  </div>

                  <select
                    value={distributorId}
                    onChange={e => setDistributorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:border-indigo-600 focus:outline-none font-bold text-indigo-950 shadow-sm"
                  >
                    {role === 'admin' && (
                      <option value="all">🏢 All Distributors (HQ Global Super Admin)</option>
                    )}
                    {distributors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name} ({d.city || 'Karachi'})
                      </option>
                    ))}
                  </select>

                  <p className="text-[10px] text-indigo-700/80 mt-1.5 leading-relaxed">
                    {distributorId === 'all'
                      ? 'This user has unrestricted global visibility across all distributor branches.'
                      : 'This user will ONLY see, create, and manage orders, shops, deliveries, and stock for this specific distributor.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {editingUserId ? <Edit2 size={15} /> : <UserPlus size={15} />}
                      <span>{editingUserId ? 'Update User & Distributor Access' : 'Create User Account'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-4 text-[11px] text-slate-500">
              Need a new distributor? Press <strong>DST01</strong> or use the top button to open Distributor Master.
            </div>
          </div>

          {/* Right Column: User Accounts List (7 Cols) */}
          <div className="md:col-span-7 p-6 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Active Users ({users.length})
                </h4>
                <p className="text-[11px] text-slate-500">Personnel & their assigned distributor scopes</p>
              </div>

              <div className="relative w-52">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, phone, distributor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
                {filteredUsers.map(u => {
                  const isAdmin = u.role === 'admin';
                  const isBeingEdited = editingUserId === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 bg-white border rounded-xl flex items-center justify-between transition-all group shadow-sm ${
                        isBeingEdited
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">{u.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="font-mono">Phone: {u.phone}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px]">
                              <Building2 size={11} className="text-indigo-600" />
                              <span>{u.distributor_name ? `${u.distributor_code || ''} - ${u.distributor_name}` : (isAdmin ? 'All Distributors (HQ)' : 'Unassigned')}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit User & Distributor"
                        >
                          <Edit2 size={15} />
                        </button>
                        {users.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No matching users found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Security Standard: Multi-Distributor Isolation & Role-Based Access Control</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
          >
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
