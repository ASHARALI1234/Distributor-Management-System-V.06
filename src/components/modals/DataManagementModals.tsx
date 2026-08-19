import React, { useState, useEffect, FormEvent } from 'react';
import { X, Save, Trash2, Edit, Store, Package, Plus, Trash, Factory, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop, Product, Unit, MaterialGroup, Supplier } from '../../types';

export const RegisterSupplierModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ name: '', address: '', contact_person: '', phone: '', email: '', registration_date: new Date().toISOString().split('T')[0] });
      }
    } catch (err) {
      console.error("Failed to register supplier", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-lg">
                <Factory size={20} className="text-white" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Register New Supplier</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Supplier Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. MSK Company"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contact Person</label>
            <input 
              required
              type="text" 
              value={formData.contact_person}
              onChange={e => setFormData({...formData, contact_person: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Saleem Ahmed"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. 03444444444"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
            <textarea 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all min-h-[80px]"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="e.g. SITE Area, Karachi"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              Close (F3)
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register (F2 / CTRL+S)'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const SupplierMasterModal = ({ 
  onClose, 
  onSuccess,
  suppliers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  suppliers: Supplier[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, editingId]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ name: '', contact_person: '', phone: '', address: '' });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save supplier", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else alert( (await res.json()).error );
    } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-lg">
                <Factory size={20} className="text-white" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Manage Suppliers Master Data</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Supplier Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. MSK Company"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Contact Person</label>
                <input 
                  required
                  type="text" 
                  value={formData.contact_person}
                  onChange={e => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Phone</label>
                <input 
                  required
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 021-3456789"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Address</label>
                <textarea 
                  required
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all resize-none"
                  placeholder="Street, Area, City"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Close (F3)
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Add (F2 / CTRL+S)'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => { setEditingId(null); setFormData({name:'', contact_person:'', phone:'', address:''}); }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                    title="Cancel Edit"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 flex flex-col overflow-hidden max-h-[600px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registered Suppliers ({filteredSuppliers.length})</h4>
                <p className="text-[10px] text-slate-500">Search and manage vendor master data</p>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text"
                  placeholder="Search suppliers..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none shadow-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Edit size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Vendor Info</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredSuppliers.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                    <p className="text-[10px] text-slate-500">{s.address}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-xs text-slate-700">{s.contact_person}</p>
                                    <p className="text-[10px] text-slate-500">{s.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => { setEditingId(s.id); setFormData({...s}); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                            <Edit size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const RegisterShopModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    location: '',
    phone: '',
    credit_limit: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subareas, setSubareas] = useState<{ id: number; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch Subareas for Google-Search-Style Autocomplete
  useEffect(() => {
    const fetchSubareas = async () => {
      try {
        const res = await fetch('/api/locations/subareas');
        if (res.ok) {
          const data = await res.json();
          setSubareas(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch subareas", err);
      }
    };
    fetchSubareas();
  }, []);

  const filteredSubareas = subareas.filter(sa =>
    (sa.name || '').toLowerCase().includes((formData.location || '').toLowerCase())
  ).slice(0, 10);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          credit_limit: parseFloat(formData.credit_limit)
        })
      });
      if (res.ok) {
        onSuccess();
        setFormData({ shop_name: '', location: '', owner_name: '', phone: '', credit_limit: '0', registration_date: new Date().toISOString().split('T')[0] });
      }
    } catch (err) {
      console.error("Failed to register shop", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-lg font-bold text-slate-900">Register New Shop</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Shop Name</label>
            <input 
              required
              type="text" 
              value={formData.shop_name}
              onChange={e => setFormData({...formData, shop_name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Bismillah General Store"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Owner Name</label>
            <input 
              required
              type="text" 
              value={formData.owner_name}
              onChange={e => setFormData({...formData, owner_name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Ahmed Ali"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-1">Sub-area (Location)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin size={18} />
              </div>
              <input 
                required
                type="text" 
                value={formData.location}
                onChange={e => {
                  setFormData({...formData, location: e.target.value});
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all focus:bg-white shadow-sm"
                placeholder="Search sub-areas e.g. UC-7 Gulistan-e-Jauhar..."
              />
              {formData.location && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, location: ''})}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showDropdown && filteredSubareas.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-50">
                {filteredSubareas.map(sa => (
                  <button
                    key={sa.id}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, location: sa.name});
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-left transition-all group"
                  >
                    <MapPin size={16} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 transition-colors block leading-tight">{sa.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block mt-0.5">Sub-area Master Data</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. 03001234567"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Credit Limit (PKR)</label>
            <input 
              required
              type="number" 
              value={formData.credit_limit}
              onChange={e => setFormData({...formData, credit_limit: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="0"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              Close (F3)
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Shop (F2 / CTRL+S)'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const ShopMasterModal = ({ 
  onClose, 
  onSuccess,
  shops 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  shops: Shop[]
}) => {
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    location: '',
    phone: '',
    credit_limit: 0,
    category: 'Retailer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subareas, setSubareas] = useState<{ id: number; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch Subareas for Google-Search-Style Autocomplete
  useEffect(() => {
    const fetchSubareas = async () => {
      try {
        const res = await fetch('/api/locations/subareas');
        if (res.ok) {
          const data = await res.json();
          setSubareas(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch subareas", err);
      }
    };
    fetchSubareas();
  }, []);

  const filteredSubareas = subareas.filter(sa =>
    (sa.name || '').toLowerCase().includes((formData.location || '').toLowerCase())
  ).slice(0, 10);

  const filteredShops = shops.filter(s => 
    s.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, editingId]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/shops/${editingId}` : '/api/shops';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          shop_name: '', 
          owner_name: '', 
          location: '', 
          phone: '', 
          credit_limit: 0,
          category: 'Retailer'
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save shop", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shop?")) return;
    try {
      const res = await fetch(`/api/shops/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete shop", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Store size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Manage Shops Master Data</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Shop' : 'Add New Shop'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Shop Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.shop_name}
                  onChange={e => setFormData({...formData, shop_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Al-Madina Mart"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Owner Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.owner_name}
                  onChange={e => setFormData({...formData, owner_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Ahmed"
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Sub-area (Location)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={e => {
                      setFormData({...formData, location: e.target.value});
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all focus:bg-white shadow-sm"
                    placeholder="Search sub-areas e.g. UC-7..."
                  />
                  {formData.location && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, location: ''})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {showDropdown && filteredSubareas.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-50">
                    {filteredSubareas.map(sa => (
                      <button
                        key={sa.id}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, location: sa.name});
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 text-left transition-all group"
                      >
                        <MapPin size={14} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors block leading-snug">{sa.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase block mt-0.5">Sub-area Master Data</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Phone</label>
                <input 
                  required
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Credit Limit (PKR)</label>
                <input 
                  required
                  type="number" 
                  value={formData.credit_limit}
                  onChange={e => setFormData({...formData, credit_limit: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Category</label>
                <select 
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                >
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Mart">Mart</option>
                  <option value="General Store">General Store</option>
                  <option value="Pharmacy">Pharmacy</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Close (F3)
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Add Shop (F2 / CTRL+S)'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ 
                      shop_name: '', 
                      owner_name: '', 
                      location: '', 
                      phone: '', 
                      credit_limit: 0,
                      category: 'Retailer'
                    });
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                    title="Cancel Edit"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 flex flex-col overflow-hidden max-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registered Shops ({filteredShops.length})</h4>
                <p className="text-[10px] text-slate-500">Search and manage customer master data</p>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text"
                  placeholder="Search shops..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none shadow-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Edit size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Shop Info</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Location / Contact</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Credit</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredShops.map(shop => (
                            <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-bold text-slate-900">{shop.shop_name}</p>
                                    <p className="text-[10px] text-slate-500">{shop.owner_name}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                        shop.category === 'Wholesaler' ? "bg-purple-100 text-purple-700" :
                                        shop.category === 'Mart' ? "bg-amber-100 text-amber-700" :
                                        "bg-blue-100 text-blue-700"
                                    )}>
                                        {shop.category || 'Retailer'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-xs text-slate-700">{shop.location}</p>
                                    <p className="text-[10px] text-slate-500">{shop.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-right text-xs font-bold text-indigo-600">
                                    {shop.credit_limit}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button 
                                            onClick={() => {
                                                setEditingId(shop.id);
                                                setFormData({
                                                    shop_name: shop.shop_name,
                                                    owner_name: shop.owner_name,
                                                    location: shop.location,
                                                    phone: shop.phone,
                                                    credit_limit: shop.credit_limit,
                                                    category: shop.category || 'Retailer'
                                                });
                                            }}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(shop.id)}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const UnitModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    unit_code: '',
    name: '',
    short_name: '',
    status: 1
  });

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      if (res.ok) setUnits(await res.json());
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, editingId]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.unit_code || !formData.name) return;

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/units/${editingId}` : '/api/units';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        fetchUnits();
        setFormData({ unit_code: '', name: '', short_name: '', status: 1 });
        setEditingId(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save unit");
      }
    } catch (err) {
      console.error("Failed to save unit", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this unit record? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUnits();
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const filteredUnits = units.filter(u => 
    u.unit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.short_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Units Master Data (UN01)</h3>
              <p className="text-xs text-slate-500">Manage measurement units and scales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Form Section */}
            <div className="w-full md:w-80 p-6 border-r border-slate-100 overflow-y-auto bg-white">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                        {editingId ? 'Edit Unit' : 'New Unit Entry'}
                    </h4>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Unit Code (Key)</label>
                        <input 
                            required
                            type="text" 
                            disabled={!!editingId}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 font-mono focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                            value={formData.unit_code}
                            onChange={e => setFormData({...formData, unit_code: e.target.value.toUpperCase()})}
                            placeholder="e.g. KG"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Full Text</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Kilogram"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Short Text</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            value={formData.short_name}
                            onChange={e => setFormData({...formData, short_name: e.target.value})}
                            placeholder="e.g. KGS"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 py-2">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, status: formData.status === 1 ? 0 : 1})}
                            className={`w-10 h-5 rounded-full transition-colors relative ${formData.status === 1 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.status === 1 ? 'left-6' : 'left-1'}`} />
                        </button>
                        <span className="text-xs font-bold text-slate-600">
                            {formData.status === 1 ? 'Active Unit' : 'Inactive'}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                        >
                            Close (F3)
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-50 shadow-lg shadow-amber-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Save size={16} />
                            {isSubmitting ? 'Saving...' : editingId ? 'Update Unit (F2 / CTRL+S)' : 'Save Unit Record (F2 / CTRL+S)'}
                        </button>
                    </div>
                        
                        {editingId && (
                            <button 
                                type="button"
                                onClick={() => { setEditingId(null); setFormData({unit_code: '', name: '', short_name: '', status:1}); }}
                                className="w-full mt-2 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                            >
                                Abort Edit
                            </button>
                        )}
                </form>
            </div>

            {/* List Section */}
            <div className="flex-1 p-6 bg-slate-50 flex flex-col">
                <div className="mb-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Master Repository</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                            {filteredUnits.length} Units Found
                        </span>
                    </div>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Locate unit via code or name..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Package size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {filteredUnits.length > 0 ? (
                        filteredUnits.map(u => (
                            <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${u.status === 1 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'}`}>
                                        {u.unit_code}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            {u.name}
                                            {u.status === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">INACTIVE</span>}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-50 rounded italic">{u.short_name}</span>
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className="text-[10px] text-slate-300 font-mono uppercase">ID: {u.id.toString().padStart(4, '0')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => { 
                                            setEditingId(u.id); 
                                            setFormData({unit_code: u.unit_code, name: u.name, short_name: u.short_name, status: u.status}); 
                                        }} 
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                        title="Edit Record"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id)} 
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="p-4 bg-slate-50 rounded-full mb-4">
                                <Package size={32} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">No units match your search</p>
                            <p className="text-xs text-slate-300 mt-1 pb-4">Try a different keyword or create a new unit</p>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="text-xs text-indigo-600 font-bold hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ProductMasterDataModal = ({ 
  onClose, 
  onSuccess,
  products,
  materialGroups,
  units 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  products: Product[],
  materialGroups: MaterialGroup[],
  units: Unit[]
}) => {
    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        material_group_id: '',
        brand: '',
        unit: '',
        conversion_value: 1,
        trade_price: 0,
        retail_price: 0,
        purchase_price: 0,
        stock_quantity: 0,
        opening_stock: 0,
        min_stock_level: 0,
        reorder_level: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'F3') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData, editingId]);

    const filteredProducts = products.filter(p => 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                onSuccess();
                setFormData({
                    product_id: '',
                    product_name: '',
                    material_group_id: '',
                    brand: '',
                    unit: '',
                    conversion_value: 1,
                    trade_price: 0,
                    retail_price: 0,
                    purchase_price: 0,
                    stock_quantity: 0,
                    opening_stock: 0,
                    min_stock_level: 0,
                    reorder_level: 0
                });
                setEditingId(null);
            }
        } catch (err) {
            console.error("Failed to save product", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete product?")) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) onSuccess();
            else alert( (await res.json()).error );
        } catch (err) { console.error(err); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Package size={20} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Manage Products Master Data</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                    {/* Form Section */}
                    <div className="p-6 border-r border-slate-100 overflow-y-auto">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                            {editingId ? <Edit size={16}/> : <Plus size={16}/>}
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Code (ID)</label>
                                    <input 
                                        required
                                        disabled={!!editingId}
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                                        value={formData.product_id}
                                        onChange={e => setFormData({...formData, product_id: e.target.value})}
                                        placeholder="e.g. PROD001"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                                        value={formData.product_name}
                                        onChange={e => setFormData({...formData, product_name: e.target.value})}
                                        placeholder="e.g. Master Oil 1L"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Brand</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.brand}
                                        onChange={e => setFormData({...formData, brand: e.target.value})}
                                        placeholder="Brand"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Material Group</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.material_group_id}
                                        onChange={e => setFormData({...formData, material_group_id: e.target.value})}
                                    >
                                        <option value="">Select Group</option>
                                        {materialGroups.map(gp => <option key={gp.mat_gp} value={gp.mat_gp}>{gp.mat_description}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.unit}
                                        onChange={e => setFormData({...formData, unit: e.target.value})}
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map(u => <option key={u.id} value={u.unit_code}>{u.unit_code} - {u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TP (Trade Price)</label>
                                    <input 
                                        required
                                        type="number" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.trade_price}
                                        onChange={e => setFormData({...formData, trade_price: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">RP (Retail Price)</label>
                                    <input 
                                        required
                                        type="number" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.retail_price}
                                        onChange={e => setFormData({...formData, retail_price: parseFloat(e.target.value)})}
                                    />
                                </div>
                                {editingId ? (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Opening Stock</label>
                                            <input 
                                                required
                                                type="number" 
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                                value={formData.opening_stock}
                                                onChange={e => setFormData({...formData, opening_stock: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Stock (Read Only)</label>
                                            <input 
                                                disabled
                                                type="number" 
                                                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none opacity-70"
                                                value={formData.stock_quantity}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Opening Stock</label>
                                        <input 
                                            required
                                            type="number" 
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                            value={formData.opening_stock}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setFormData({...formData, opening_stock: val, stock_quantity: val});
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all text-center"
                                >
                                    Close (F3)
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18}/>
                                    {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Save (F2 / CTRL+S)'}
                                </button>
                                {editingId && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({
                                                product_id: '',
                                                product_name: '',
                                                material_group_id: '',
                                                brand: '',
                                                unit: '',
                                                conversion_value: 1,
                                                trade_price: 0,
                                                retail_price: 0,
                                                purchase_price: 0,
                                                stock_quantity: 0,
                                                opening_stock: 0,
                                                min_stock_level: 0,
                                                reorder_level: 0
                                            });
                                        }}
                                        className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100 flex items-center justify-center"
                                        title="Cancel Edit"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </form>
            </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 bg-slate-50 p-6 overflow-hidden flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Product Repository ({filteredProducts.length})</h4>
                                <p className="text-[10px] text-slate-500">Search and manage existing SKU master data</p>
                            </div>
                            <div className="relative w-full md:w-64">
                                <input 
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none shadow-sm transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Edit size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Product Details</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Brand/Group</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">TP / RP</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Stock</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredProducts.map(p => (
                                        <tr key={p.product_id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900 leading-tight">{p.product_name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.product_id}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-slate-600 font-medium">{p.brand}</p>
                                                <p className="text-[10px] text-slate-400">{materialGroups.find(g => g.mat_gp === p.material_group_id)?.mat_description || p.material_group_id}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <p className="text-indigo-600 font-bold">{p.trade_price}</p>
                                                <p className="text-[10px] text-slate-400">{p.retail_price}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                                    p.stock_quantity <= 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                )}>
                                                    {p.stock_quantity} {p.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(p.product_id);
                                                            setFormData({
                                                                ...p,
                                                                opening_stock: p.opening_stock || 0
                                                            });
                                                        }}
                                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.product_id)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                                <Package size={40} className="mx-auto mb-3 opacity-20"/>
                                                <p>No products in master data</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
