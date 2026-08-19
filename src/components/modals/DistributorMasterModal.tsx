import React, { useState, useEffect, FormEvent } from 'react';
import { X, Building2, Plus, Edit, Trash2, Search, Phone, Mail, MapPin, CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Distributor } from '../../types';

interface DistributorMasterModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  onSelectDistributor?: (distributor: Distributor) => void;
}

export const DistributorMasterModal: React.FC<DistributorMasterModalProps> = ({
  onClose,
  onSuccess,
  onSelectDistributor
}) => {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: 'Karachi',
    ntn_number: '',
    strn_number: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/distributors');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDistributors(data);
      }
    } catch (err) {
      console.error('Failed to load distributors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  // Keyboard shortcut: Escape or F3 to close, F2 to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F3') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'F2' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, editingId, onClose]);

  const handleEdit = (dist: Distributor) => {
    setEditingId(dist.id);
    setFormData({
      code: dist.code || '',
      name: dist.name || '',
      contact_person: dist.contact_person || '',
      phone: dist.phone || '',
      email: dist.email || '',
      address: dist.address || '',
      city: dist.city || 'Karachi',
      ntn_number: dist.ntn_number || '',
      strn_number: dist.strn_number || '',
      status: dist.status || 'ACTIVE'
    });
    setStatusMessage(null);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: 'Karachi',
      ntn_number: '',
      strn_number: '',
      status: 'ACTIVE'
    });
    setStatusMessage(null);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Distributor Code and Name are required.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      const url = editingId ? `/api/distributors/${editingId}` : '/api/distributors';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save distributor master record.');
      }

      setStatusMessage({
        type: 'success',
        text: editingId
          ? `Distributor "${formData.name}" updated successfully.`
          : `Distributor "${formData.name}" registered successfully.`
      });

      handleResetForm();
      fetchDistributors();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete distributor "${name}"? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/distributors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete distributor.');
      }

      setStatusMessage({ type: 'success', text: `Distributor "${name}" deleted.` });
      fetchDistributors();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const filteredDistributors = distributors.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.contact_person && d.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.city && d.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.phone && d.phone.includes(searchQuery))
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
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md shadow-blue-500/20">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Distributor Master Setup</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  T-Code: DST01 / DIS01
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maintain regional distribution franchises, logistics hubs, and operating entities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDistributors}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Refresh Records"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Close (F3 / Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`px-6 py-2.5 flex items-center gap-2 text-xs font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
              : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <AlertCircle size={15} className="text-rose-600 shrink-0" />}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Two Column Layout: Left Form, Right List */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* Left Column: Form (5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {editingId ? <Edit size={17} className="text-blue-600" /> : <Plus size={17} className="text-blue-600" />}
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {editingId ? 'Edit Distributor' : 'Register New Distributor'}
                  </h4>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                  >
                    + New Entry
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Distributor Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. DST-001"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      City / Region <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Karachi"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Distributor Legal / Operating Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Karachi Central Logistics & Distribution"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="e.g. Muhammad Tariq"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Contact Phone / Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 021-34567890"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@distributor.pk"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Operating Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none font-bold"
                    >
                      <option value="ACTIVE">ACTIVE (Operational)</option>
                      <option value="INACTIVE">INACTIVE (Suspended)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Warehouse / Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plot #, Street, Sector, Industrial Area..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      NTN Number
                    </label>
                    <input
                      type="text"
                      value={formData.ntn_number}
                      onChange={e => setFormData({ ...formData, ntn_number: e.target.value })}
                      placeholder="1234567-8"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      STRN (Sales Tax No.)
                    </label>
                    <input
                      type="text"
                      value={formData.strn_number}
                      onChange={e => setFormData({ ...formData, strn_number: e.target.value })}
                      placeholder="3277876123456"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {editingId ? <Edit size={15} /> : <Plus size={15} />}
                      <span>{editingId ? 'Update Distributor Record (F2)' : 'Save Distributor Master (F2)'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <Building2 size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Distributor Isolation Note:</strong> Each newly created operator or field salesman must be mapped to one of these distributors in <strong>T-Code: USR1</strong> to scope their data access.
              </span>
            </div>
          </div>

          {/* Right Column: Distributors Directory List (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Distributor Directory ({distributors.length})
                </h4>
                <p className="text-[11px] text-slate-500">Active distribution franchises & entities</p>
              </div>

              <div className="relative w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by code, name, city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                {filteredDistributors.map(dist => {
                  const isActive = dist.status === 'ACTIVE';
                  const isBeingEdited = editingId === dist.id;

                  return (
                    <div
                      key={dist.id}
                      className={`p-4 bg-white border rounded-2xl transition-all shadow-sm flex flex-col justify-between gap-3 ${
                        isBeingEdited
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm">
                            {dist.code.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{dist.name}</span>
                              <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                                {dist.code}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {dist.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                              {dist.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} className="text-slate-400" />
                                  <span>{dist.city}</span>
                                </span>
                              )}
                              {dist.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone size={12} className="text-slate-400" />
                                  <span>{dist.phone}</span>
                                </span>
                              )}
                              {dist.contact_person && (
                                <span>Rep: <strong>{dist.contact_person}</strong></span>
                              )}
                            </div>

                            {dist.address && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                {dist.address}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(dist)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Distributor"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(dist.id, dist.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Distributor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Footer Badges & Linked Counts */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <div className="flex items-center gap-3">
                          <span>Shops: <strong className="text-slate-700">{dist.total_shops ?? 0}</strong></span>
                          <span>Users: <strong className="text-slate-700">{dist.total_users ?? 0}</strong></span>
                          <span>Orders: <strong className="text-slate-700">{dist.total_orders ?? 0}</strong></span>
                        </div>
                        {dist.ntn_number && (
                          <span className="text-[10px] text-slate-400">NTN: {dist.ntn_number}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredDistributors.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    No distributors found matching "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Enterprise Multi-Distributor Tenancy Architecture</span>
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
