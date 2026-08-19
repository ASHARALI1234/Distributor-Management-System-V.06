import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Users, 
  Key, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Layers, 
  FileText, 
  Filter, 
  RefreshCw,
  Lock,
  ChevronRight,
  Eye,
  Settings2,
  FolderTree,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DmsUser, Role, TCodeMaster, Distributor } from '../types';

interface AdminTabProps {
  distributors: Distributor[];
  currentUserRole?: string;
  onRefreshData?: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  distributors,
  currentUserRole,
  onRefreshData
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'users' | 'roles' | 'tcodeinfo'>('users');
  
  // Data States
  const [users, setUsers] = useState<DmsUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tcodes, setTCodes] = useState<TCodeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Active Edit States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isTCodeModalOpen, setIsTCodeModalOpen] = useState(false);
  const [isAssignTCodesModalOpen, setIsAssignTCodesModalOpen] = useState(false);
  const [inspectUserTCodes, setInspectUserTCodes] = useState<DmsUser | null>(null);

  // User Form State
  const [userForm, setUserForm] = useState<{
    id?: number;
    name: string;
    phone: string;
    role: string;
    password: string;
    distributor_id: string;
    role_ids: number[];
  }>({
    name: '',
    phone: '',
    role: 'salesman',
    password: '',
    distributor_id: '1',
    role_ids: []
  });

  // Role Form State
  const [roleForm, setRoleForm] = useState<{
    id?: number;
    name: string;
    description: string;
    tcodes: string[];
  }>({
    name: '',
    description: '',
    tcodes: []
  });

  // TCode Form State
  const [tcodeForm, setTcodeForm] = useState<{
    tcode: string;
    transaction_name: string;
    module: string;
    parent_module: string;
    action_type: 'Create' | 'Change' | 'Display' | 'Manage' | 'Delete' | 'Report';
    role_association: string;
    description: string;
    isEditing?: boolean;
  }>({
    tcode: '',
    transaction_name: '',
    module: 'Order Management',
    parent_module: 'Transactions',
    action_type: 'Manage',
    role_association: '',
    description: '',
    isEditing: false
  });

  // Role TCode Assignment Modal Target
  const [selectedRoleForTCodes, setSelectedRoleForTCodes] = useState<Role | null>(null);
  const [selectedTCodesForRole, setSelectedTCodesForRole] = useState<string[]>([]);
  const [tcodeSearchInModal, setTcodeSearchInModal] = useState('');
  const [tcodeFilterModuleInModal, setTcodeFilterModuleInModal] = useState('ALL');

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userDistFilter, setUserDistFilter] = useState('ALL');

  const [roleSearch, setRoleSearch] = useState('');

  const [tcodeSearch, setTcodeSearch] = useState('');
  const [tcodeModuleFilter, setTcodeModuleFilter] = useState('ALL');
  const [tcodeActionFilter, setTcodeActionFilter] = useState('ALL');

  // Load all initial data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, tcodesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/tcodeinfo')
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const tcodesData = await tcodesRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(rolesData)) setRoles(rolesData);
      if (Array.isArray(tcodesData)) setTCodes(tcodesData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setStatusMessage({ type: 'error', text: 'Error loading admin data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Quick auto-dismiss for status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Unique Modules for filters
  const uniqueModules = useMemo(() => {
    const modules = new Set<string>();
    tcodes.forEach(tc => {
      if (tc.module) modules.add(tc.module);
    });
    return Array.from(modules).sort();
  }, [tcodes]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !userSearch || 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.roles && u.roles.some(r => r.name.toLowerCase().includes(userSearch.toLowerCase())));
      
      const matchesRole = userRoleFilter === 'ALL' || 
        u.role === userRoleFilter || 
        (u.roles && u.roles.some(r => r.name === userRoleFilter));
      
      const matchesDist = userDistFilter === 'ALL' || 
        (userDistFilter === 'none' && !u.distributor_id) ||
        (String(u.distributor_id) === userDistFilter);

      return matchesSearch && matchesRole && matchesDist;
    });
  }, [users, userSearch, userRoleFilter, userDistFilter]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      return !roleSearch || 
        r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(roleSearch.toLowerCase()));
    });
  }, [roles, roleSearch]);

  // Filtered TCodes
  const filteredTCodes = useMemo(() => {
    return tcodes.filter(t => {
      const matchesSearch = !tcodeSearch ||
        t.tcode.toLowerCase().includes(tcodeSearch.toLowerCase()) ||
        t.transaction_name.toLowerCase().includes(tcodeSearch.toLowerCase()) ||
        t.module.toLowerCase().includes(tcodeSearch.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(tcodeSearch.toLowerCase()));

      const matchesModule = tcodeModuleFilter === 'ALL' || t.module === tcodeModuleFilter;
      const matchesAction = tcodeActionFilter === 'ALL' || t.action_type === tcodeActionFilter;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [tcodes, tcodeSearch, tcodeModuleFilter, tcodeActionFilter]);

  // -------------------------------------------------------------
  // USER HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateUser = () => {
    setUserForm({
      name: '',
      phone: '',
      role: 'salesman',
      password: '',
      distributor_id: distributors.length > 0 ? String(distributors[0].id) : '1',
      role_ids: []
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: DmsUser) => {
    setUserForm({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      password: '',
      distributor_id: user.distributor_id ? String(user.distributor_id) : (user.role === 'admin' ? 'all' : '1'),
      role_ids: user.role_ids || (user.roles ? user.roles.map(r => r.id) : [])
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and Phone number are required' });
      return;
    }
    if (!userForm.id && !userForm.password.trim()) {
      setStatusMessage({ type: 'error', text: 'Password is required when creating a new user' });
      return;
    }
    if (userForm.role !== 'admin' && (!userForm.distributor_id || userForm.distributor_id === 'all')) {
      setStatusMessage({ type: 'error', text: 'Please assign a distributor to non-admin users' });
      return;
    }

    try {
      const url = userForm.id ? `/api/users/${userForm.id}` : '/api/users';
      const method = userForm.id ? 'PUT' : 'POST';

      const payload = {
        name: userForm.name.trim(),
        phone: userForm.phone.trim(),
        role: userForm.role,
        password: userForm.password ? userForm.password.trim() : undefined,
        distributor_id: userForm.distributor_id === 'all' || !userForm.distributor_id ? null : Number(userForm.distributor_id),
        role_ids: userForm.role_ids
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');

      setStatusMessage({
        type: 'success',
        text: userForm.id ? `User ${userForm.name} updated successfully` : `User ${userForm.name} created successfully`
      });

      setIsUserModalOpen(false);
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (user: DmsUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setStatusMessage({ type: 'success', text: `User ${user.name} removed successfully` });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const toggleUserRole = (roleId: number) => {
    setUserForm(prev => {
      const exists = prev.role_ids.includes(roleId);
      return {
        ...prev,
        role_ids: exists ? prev.role_ids.filter(id => id !== roleId) : [...prev.role_ids, roleId]
      };
    });
  };

  // -------------------------------------------------------------
  // ROLE HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateRole = () => {
    setRoleForm({
      name: '',
      description: '',
      tcodes: []
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || '',
      tcodes: role.tcodes || []
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Role Name is required' });
      return;
    }

    try {
      const url = roleForm.id ? `/api/roles/${roleForm.id}` : '/api/roles';
      const method = roleForm.id ? 'PUT' : 'POST';

      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        tcodes: roleForm.tcodes
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role');

      setStatusMessage({
        type: 'success',
        text: roleForm.id ? `Role ${roleForm.name} updated successfully` : `Role ${roleForm.name} created successfully`
      });

      setIsRoleModalOpen(false);
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.id === 1 || role.name === 'SUPER_ADMIN') {
      alert('Cannot delete the primary SUPER_ADMIN system role.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"? Users with this role will lose its assigned T-Codes.`)) return;

    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');

      setStatusMessage({ type: 'success', text: `Role ${role.name} deleted` });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // -------------------------------------------------------------
  // T-CODE TO ROLE ASSIGNMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenAssignTCodes = (role: Role) => {
    setSelectedRoleForTCodes(role);
    setSelectedTCodesForRole(role.tcodes || []);
    setTcodeSearchInModal('');
    setTcodeFilterModuleInModal('ALL');
    setIsAssignTCodesModalOpen(true);
  };

  const toggleTCodeInRole = (tcode: string) => {
    const code = tcode.toUpperCase();
    setSelectedTCodesForRole(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const selectAllTCodesInModule = (moduleName: string) => {
    const moduleCodes = tcodes.filter(t => t.module === moduleName).map(t => t.tcode.toUpperCase());
    setSelectedTCodesForRole(prev => {
      const combined = new Set([...prev, ...moduleCodes]);
      return Array.from(combined);
    });
  };

  const unselectAllTCodesInModule = (moduleName: string) => {
    const moduleCodes = new Set(tcodes.filter(t => t.module === moduleName).map(t => t.tcode.toUpperCase()));
    setSelectedTCodesForRole(prev => prev.filter(c => !moduleCodes.has(c)));
  };

  const handleSaveRoleTCodes = async () => {
    if (!selectedRoleForTCodes) return;

    try {
      const res = await fetch(`/api/roles/${selectedRoleForTCodes.id}/tcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tcodes: selectedTCodesForRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role permissions');

      setStatusMessage({
        type: 'success',
        text: `Permissions updated for ${selectedRoleForTCodes.name} (${selectedTCodesForRole.length} T-Codes assigned)`
      });

      setIsAssignTCodesModalOpen(false);
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // -------------------------------------------------------------
  // T-CODE MASTER HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateTCode = () => {
    setTcodeForm({
      tcode: '',
      transaction_name: '',
      module: 'Order Management',
      parent_module: 'Transactions',
      action_type: 'Manage',
      role_association: '',
      description: '',
      isEditing: false
    });
    setIsTCodeModalOpen(true);
  };

  const handleOpenEditTCode = (tcode: TCodeMaster) => {
    setTcodeForm({
      tcode: tcode.tcode,
      transaction_name: tcode.transaction_name,
      module: tcode.module,
      parent_module: tcode.parent_module,
      action_type: tcode.action_type,
      role_association: tcode.role_association || '',
      description: tcode.description || '',
      isEditing: true
    });
    setIsTCodeModalOpen(true);
  };

  const handleSaveTCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcodeForm.tcode.trim() || !tcodeForm.transaction_name.trim() || !tcodeForm.module.trim()) {
      setStatusMessage({ type: 'error', text: 'T-Code, Transaction Name, and Module are required' });
      return;
    }

    try {
      const url = tcodeForm.isEditing ? `/api/tcodeinfo/${tcodeForm.tcode.trim().toUpperCase()}` : '/api/tcodeinfo';
      const method = tcodeForm.isEditing ? 'PUT' : 'POST';

      const payload = {
        tcode: tcodeForm.tcode.trim().toUpperCase(),
        transaction_name: tcodeForm.transaction_name.trim(),
        module: tcodeForm.module.trim(),
        parent_module: tcodeForm.parent_module ? tcodeForm.parent_module.trim() : 'Transactions',
        action_type: tcodeForm.action_type,
        role_association: tcodeForm.role_association ? tcodeForm.role_association.trim() : undefined,
        description: tcodeForm.description ? tcodeForm.description.trim() : undefined
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save T-Code metadata');

      setStatusMessage({
        type: 'success',
        text: `T-Code ${tcodeForm.tcode.toUpperCase()} successfully saved`
      });

      setIsTCodeModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTCode = async (tcode: TCodeMaster) => {
    if (!window.confirm(`Are you sure you want to delete T-Code ${tcode.tcode}? It will also be detached from all roles.`)) return;

    try {
      const res = await fetch(`/api/tcodeinfo/${tcode.tcode}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete T-Code');

      setStatusMessage({ type: 'success', text: `T-Code ${tcode.tcode} deleted` });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast status alert */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-rose-600 shrink-0" size={20} />
              )}
              <span className="text-sm font-semibold">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-1 hover:bg-black/5 rounded">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Administration & Access Control Portal</h2>
              <p className="text-xs text-slate-500">
                Maintain Users, Roles, and Granular SAP-Style Transaction Code (T-Code) Permissions
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Users</span>
            <span className="text-base font-black text-slate-800">{users.length}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Configured Roles</span>
            <span className="text-base font-black text-indigo-600">{roles.length}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">T-Codes Catalog</span>
            <span className="text-base font-black text-emerald-600">{tcodes.length}</span>
          </div>
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh Admin Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setAdminSubTab('users')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            adminSubTab === 'users'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Users size={18} />
          <span>User Accounts & Role Assignment</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200/80 font-mono">{users.length}</span>
        </button>

        <button
          onClick={() => setAdminSubTab('roles')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            adminSubTab === 'roles'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Shield size={18} />
          <span>Roles & T-Code Mapping</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200/80 font-mono">{roles.length}</span>
        </button>

        <button
          onClick={() => setAdminSubTab('tcodeinfo')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            adminSubTab === 'tcodeinfo'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Key size={18} />
          <span>T-Code Information Master (Dictionary)</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200/80 font-mono">{tcodes.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. USERS SUB-TAB */}
      {/* ========================================================================= */}
      {adminSubTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative min-w-[240px] flex-1 md:flex-initial">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">System Admin</option>
                <option value="salesman">Salesman</option>
                <option value="order_booker">Order Booker</option>
                <option value="accountant">Accountant</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>

              {/* Distributor filter */}
              <select
                value={userDistFilter}
                onChange={(e) => setUserDistFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ALL">All Distributors</option>
                <option value="none">Super Admin (All Domains)</option>
                {distributors.map(d => (
                  <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 whitespace-nowrap w-full md:w-auto justify-center"
            >
              <Plus size={16} />
              <span>Create New User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">System Role</th>
                    <th className="py-3.5 px-4">Assigned Roles (RBAC)</th>
                    <th className="py-3.5 px-4">Assigned Distributor</th>
                    <th className="py-3.5 px-4">T-Codes Permitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isSuper = user.role === 'admin' || (user.roles && user.roles.some(r => r.name === 'SUPER_ADMIN'));
                      const tcodeCount = isSuper ? tcodes.length : (user.permitted_tcodes?.length || 0);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                isSuper ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
                              }`}>
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{user.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{user.phone}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'admin' 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                : user.role === 'salesman'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map(r => (
                                  <span key={r.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold">
                                    {r.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Default ({user.role})</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {user.distributor_name ? (
                              <div>
                                <p className="font-semibold text-slate-700">{user.distributor_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{user.distributor_code}</p>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Super Admin (All Hubs)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => setInspectUserTCodes(user)}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-mono text-[11px] font-bold transition-all"
                            >
                              <Key size={12} />
                              <span>{tcodeCount} T-Codes</span>
                              <Eye size={12} className="ml-0.5 text-slate-400" />
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(user)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit User & Roles"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete User"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ROLES SUB-TAB */}
      {/* ========================================================================= */}
      {adminSubTab === 'roles' && (
        <div className="space-y-4">
          {/* Top action bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative min-w-[260px] w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              onClick={handleOpenCreateRole}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <Plus size={16} />
              <span>Create New Role</span>
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(role => {
              const isSuper = role.name === 'SUPER_ADMIN';

              return (
                <div
                  key={role.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isSuper ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'}`}>
                          <Shield size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm font-mono">{role.name}</h3>
                          <span className="text-[10px] font-bold text-slate-400">ID #{role.id}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditRole(role)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit Role Name/Desc"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!isSuper && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Role"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">
                      {role.description || 'No description provided for this role.'}
                    </p>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400" />
                        <span>{role.user_count || 0} Users</span>
                      </div>
                      <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 flex items-center gap-1.5 font-mono">
                        <Key size={12} className="text-indigo-500" />
                        <span>{role.tcode_count || role.tcodes?.length || 0} T-Codes</span>
                      </div>
                    </div>

                    {/* Assigned TCode Preview Chips */}
                    <div className="mb-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                        Assigned T-Codes Sample
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {role.tcodes && role.tcodes.length > 0 ? (
                          role.tcodes.slice(0, 8).map(tc => (
                            <span key={tc} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[10px] font-bold">
                              {tc}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No T-Codes assigned yet</span>
                        )}
                        {role.tcodes && role.tcodes.length > 8 && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-mono rounded text-[10px] font-bold">
                            +{role.tcodes.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAssignTCodes(role)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-indigo-600 flex items-center justify-center gap-2"
                  >
                    <Settings2 size={14} />
                    <span>Assign & Manage T-Codes</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TCODE INFO SUB-TAB */}
      {/* ========================================================================= */}
      {adminSubTab === 'tcodeinfo' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative min-w-[240px] flex-1 md:flex-initial">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search T-Code or transaction name..."
                  value={tcodeSearch}
                  onChange={(e) => setTcodeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Module Filter */}
              <select
                value={tcodeModuleFilter}
                onChange={(e) => setTcodeModuleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ALL">All Modules</option>
                {uniqueModules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Action Filter */}
              <select
                value={tcodeActionFilter}
                onChange={(e) => setTcodeActionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ALL">All Action Types</option>
                <option value="Create">Create</option>
                <option value="Change">Change</option>
                <option value="Display">Display</option>
                <option value="Manage">Manage</option>
                <option value="Delete">Delete</option>
                <option value="Report">Report</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreateTCode}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 whitespace-nowrap w-full md:w-auto justify-center"
            >
              <Plus size={16} />
              <span>Register New T-Code</span>
            </button>
          </div>

          {/* T-Codes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">T-Code</th>
                    <th className="py-3.5 px-4">Transaction Name</th>
                    <th className="py-3.5 px-4">Module & Category</th>
                    <th className="py-3.5 px-4">Action Type</th>
                    <th className="py-3.5 px-4">Assigned Roles</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTCodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No T-Codes found matching current query.
                      </td>
                    </tr>
                  ) : (
                    filteredTCodes.map(tc => {
                      return (
                        <tr key={tc.tcode} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                              {tc.tcode}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {tc.transaction_name}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-700 block">{tc.module}</span>
                              <span className="text-[10px] text-slate-400 block">{tc.parent_module || 'Transactions'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              tc.action_type === 'Create' ? 'bg-emerald-50 text-emerald-800' :
                              tc.action_type === 'Change' ? 'bg-amber-50 text-amber-800' :
                              tc.action_type === 'Display' ? 'bg-blue-50 text-blue-800' :
                              tc.action_type === 'Report' ? 'bg-purple-50 text-purple-800' :
                              tc.action_type === 'Delete' ? 'bg-rose-50 text-rose-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {tc.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px] font-bold">
                              {tc.role_count || 0} Roles
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={tc.description}>
                            {tc.description || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditTCode(tc)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit T-Code Definition"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteTCode(tc)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete T-Code"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT USER */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {userForm.id ? 'Edit User Credentials & Roles' : 'Create New User Account'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure login, scopes, and multiple role assignments</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone / Login ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0300-1234567"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {userForm.id ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    placeholder={userForm.id ? '••••••••' : 'Enter login password'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">System Legacy Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="salesman">Salesman / Field Driver</option>
                    <option value="order_booker">Order Booker</option>
                    <option value="accountant">Accountant / Auditor</option>
                    <option value="admin">System Administrator (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Distributor Franchise Assignment</label>
                <select
                  value={userForm.distributor_id}
                  onChange={(e) => setUserForm({ ...userForm, distributor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="all">Global / Super Admin (Unrestricted across all distributors)</option>
                  {distributors.map(d => (
                    <option key={d.id} value={String(d.id)}>
                      {d.code} - {d.name} ({d.city || 'Karachi'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Non-admin staff will be restricted exclusively to their assigned distributor's transactions and master data.
                </p>
              </div>

              {/* RBAC: Multi-Role Selection */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Assign Roles (Multi-Role Support)
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    {userForm.role_ids.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {roles.map(r => {
                    const isChecked = userForm.role_ids.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        onClick={() => toggleUserRole(r.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border text-xs font-semibold ${
                          isChecked 
                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by label click
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{r.tcode_count || 0} T-Codes</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200"
                >
                  {userForm.id ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT ROLE */}
      {/* ========================================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {roleForm.id ? 'Edit Role Details' : 'Create New Security Role'}
                  </h3>
                  <p className="text-xs text-slate-500">Define role identifier and description</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Identifier (Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WAREHOUSE_SUPERVISOR"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono uppercase focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describe functional duties and responsibilities assigned to this role..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200"
                >
                  {roleForm.id ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN T-CODES TO ROLE */}
      {/* ========================================================================= */}
      {isAssignTCodesModalOpen && selectedRoleForTCodes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Assign T-Codes to Role: <span className="font-mono text-indigo-600">{selectedRoleForTCodes.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant or revoke transaction execution permissions for this role
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssignTCodesModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Filter & Selection Toolbar */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search T-Code or title..."
                    value={tcodeSearchInModal}
                    onChange={(e) => setTcodeSearchInModal(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <select
                  value={tcodeFilterModuleInModal}
                  onChange={(e) => setTcodeFilterModuleInModal(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="ALL">All Modules</option>
                  {uniqueModules.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-mono">
                  {selectedTCodesForRole.length} / {tcodes.length} Assigned
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTCodesForRole(tcodes.map(t => t.tcode.toUpperCase()))}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTCodesForRole([])}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Grouped T-Codes List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {uniqueModules
                .filter(mod => tcodeFilterModuleInModal === 'ALL' || mod === tcodeFilterModuleInModal)
                .map(moduleName => {
                  const moduleTCodes = tcodes.filter(t => {
                    const matchesMod = t.module === moduleName;
                    const matchesQuery = !tcodeSearchInModal || 
                      t.tcode.toLowerCase().includes(tcodeSearchInModal.toLowerCase()) ||
                      t.transaction_name.toLowerCase().includes(tcodeSearchInModal.toLowerCase());
                    return matchesMod && matchesQuery;
                  });

                  if (moduleTCodes.length === 0) return null;

                  const allModuleCodesSelected = moduleTCodes.every(t => selectedTCodesForRole.includes(t.tcode.toUpperCase()));

                  return (
                    <div key={moduleName} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <FolderTree size={15} className="text-indigo-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{moduleName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">({moduleTCodes.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => allModuleCodesSelected ? unselectAllTCodesInModule(moduleName) : selectAllTCodesInModule(moduleName)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline"
                          >
                            {allModuleCodesSelected ? 'Unselect Module' : 'Select Module'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {moduleTCodes.map(tc => {
                          const isChecked = selectedTCodesForRole.includes(tc.tcode.toUpperCase());

                          return (
                            <div
                              key={tc.tcode}
                              onClick={() => toggleTCodeInRole(tc.tcode)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 text-xs ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="pt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Handled by container onClick
                                  className="rounded text-indigo-600 focus:ring-0"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-black text-indigo-700 text-xs">{tc.tcode}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-200/60 rounded text-slate-600">
                                    {tc.action_type}
                                  </span>
                                </div>
                                <p className="font-bold text-[11px] text-slate-800 truncate mt-0.5">{tc.transaction_name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{tc.description || '—'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Changes will take effect on next user login or command execution.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignTCodesModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoleTCodes}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>Save Role Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT T-CODE DEFINITION */}
      {/* ========================================================================= */}
      {isTCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {tcodeForm.isEditing ? 'Edit T-Code Definition' : 'Register New Transaction Code (T-Code)'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure SAP-style transaction code metadata</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTCodeModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">T-Code (Identifier) *</label>
                  <input
                    type="text"
                    required
                    disabled={tcodeForm.isEditing}
                    placeholder="e.g. VA01 or ORD02"
                    value={tcodeForm.tcode}
                    onChange={(e) => setTcodeForm({ ...tcodeForm, tcode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono uppercase focus:ring-2 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Action Type *</label>
                  <select
                    value={tcodeForm.action_type}
                    onChange={(e) => setTcodeForm({ ...tcodeForm, action_type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Manage">Manage</option>
                    <option value="Create">Create</option>
                    <option value="Change">Change</option>
                    <option value="Display">Display</option>
                    <option value="Report">Report</option>
                    <option value="Delete">Delete</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transaction Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Orders Hub & Booking"
                  value={tcodeForm.transaction_name}
                  onChange={(e) => setTcodeForm({ ...tcodeForm, transaction_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Functional Module *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order Management"
                    value={tcodeForm.module}
                    onChange={(e) => setTcodeForm({ ...tcodeForm, module: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Parent Hierarchy</label>
                  <select
                    value={tcodeForm.parent_module}
                    onChange={(e) => setTcodeForm({ ...tcodeForm, parent_module: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Transactions">Transactions</option>
                    <option value="Master Data">Master Data</option>
                    <option value="MIS - Reports">MIS - Reports</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain the functional purpose of this transaction..."
                  value={tcodeForm.description}
                  onChange={(e) => setTcodeForm({ ...tcodeForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTCodeModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200"
                >
                  {tcodeForm.isEditing ? 'Save Changes' : 'Register T-Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT USER PERMITTED T-CODES */}
      {/* ========================================================================= */}
      {inspectUserTCodes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Permitted T-Codes for: <span className="text-indigo-600">{inspectUserTCodes.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated dynamically from assigned roles: {inspectUserTCodes.roles?.map(r => r.name).join(', ') || inspectUserTCodes.role}
                </p>
              </div>
              <button 
                onClick={() => setInspectUserTCodes(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {inspectUserTCodes.role === 'admin' || (inspectUserTCodes.roles && inspectUserTCodes.roles.some(r => r.name === 'SUPER_ADMIN')) ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl mb-4">
                  <p className="text-xs font-bold text-emerald-900">👑 Super Administrator Full Access</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    This user holds unrestricted execution authority for all {tcodes.length} system transaction codes.
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(inspectUserTCodes.role === 'admin' || (inspectUserTCodes.roles && inspectUserTCodes.roles.some(r => r.name === 'SUPER_ADMIN')) 
                  ? tcodes.map(t => t.tcode) 
                  : (inspectUserTCodes.permitted_tcodes || [])
                ).map(tc => {
                  const meta = tcodes.find(t => t.tcode.toUpperCase() === tc.toUpperCase());
                  return (
                    <div key={tc} className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="font-mono font-black text-indigo-700 text-xs">{tc}</span>
                      <p className="text-[10px] text-slate-600 font-semibold truncate">{meta?.transaction_name || 'Transaction'}</p>
                    </div>
                  );
                })}
              </div>

              {(!inspectUserTCodes.permitted_tcodes || inspectUserTCodes.permitted_tcodes.length === 0) && inspectUserTCodes.role !== 'admin' && (
                <p className="text-center py-8 text-slate-400 text-xs">
                  No T-Codes currently assigned to this user. Assign roles in the Users tab.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setInspectUserTCodes(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
