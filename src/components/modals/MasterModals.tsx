import React, { useState, useEffect, FormEvent } from 'react';
import { X, Save, Trash2, Edit, Users, Phone, Clock, Plus, Search, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Supplier, MaterialGroup, Driver, OrderBooker, Salesman } from '../../types';
import { TCODES } from '../../constants/tcodes';

const cn = (...classes: (any)[]) => classes.filter(Boolean).join(' ');

export const DriverModal = ({ 
  onClose, 
  onSuccess,
  drivers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  drivers: Driver[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.father_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.cell_no.toLowerCase().includes(searchQuery.toLowerCase())
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
      const url = editingId ? `/api/drivers/${editingId}` : '/api/drivers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save driver", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete driver", err);
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
          <h3 className="text-lg font-bold text-slate-900">Drivers Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Driver' : 'Add New Driver'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Driver Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Junaid Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Abdul Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-1234567-1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
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
                  {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Add Driver (F2 / CTRL+S)'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        name: '', 
                        father_name: '', 
                        cell_no: '', 
                        cnic_no: '', 
                        joining_date: new Date().toISOString().split('T')[0] 
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

          <div className="p-6 bg-slate-50 lg:col-span-2 flex flex-col overflow-hidden max-h-[600px]">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
               <div>
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Driver List ({filteredDrivers.length})</h4>
                 <p className="text-[10px] text-slate-500">Search and manage delivery personnel</p>
               </div>
               <div className="relative w-full md:w-64">
                 <input 
                   type="text"
                   placeholder="Search drivers..."
                   className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none shadow-sm transition-all"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
               </div>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 overflow-y-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-white z-10">
                   <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name / Father</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact / CNIC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{driver.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                        <p className="text-[10px] text-slate-500">{driver.father_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{driver.cell_no}</p>
                        <p className="text-[10px] text-slate-500">{driver.cnic_no}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{driver.joining_date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(driver.id);
                              setFormData({ 
                                name: driver.name, 
                                father_name: driver.father_name, 
                                cell_no: driver.cell_no, 
                                cnic_no: driver.cnic_no, 
                                joining_date: driver.joining_date 
                              });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} className="rotate-180" /> {/* Reusing trash for edit icon shape if needed, but actually Edit is imported */}
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(driver.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No drivers found</td>
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

export const SalesmanModal = ({ 
  onClose, 
  onSuccess,
  salesmen 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  salesmen: Salesman[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSalesmen = salesmen.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cell_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cnic_no.toLowerCase().includes(searchQuery.toLowerCase())
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
      const url = editingId ? `/api/salesmen/${editingId}` : '/api/salesmen';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save salesman", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salesman?")) return;
    try {
      const res = await fetch(`/api/salesmen/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete salesman", err);
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
          <h3 className="text-lg font-bold text-slate-900">Salesmen Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Salesman' : 'Add New Salesman'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Salesman Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Asif Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Muhammad Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03111234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-2222222-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
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
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Save (F2 / CTRL+S)'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', father_name: '', cell_no: '', cnic_no: '', joining_date: new Date().toISOString().split('T')[0] });
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
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registered Salesmen ({filteredSalesmen.length})</h4>
                <p className="text-[10px] text-slate-500">Search and manage sales personnel</p>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text"
                  placeholder="Search salesmen..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none shadow-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {filteredSalesmen.map(salesman => (
                <div key={salesman.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{salesman.name}</p>
                      <div className="flex gap-3 mt-1">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {salesman.cell_no}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> Joined: {new Date(salesman.joining_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(salesman.id);
                        setFormData({
                          name: salesman.name,
                          father_name: salesman.father_name,
                          cell_no: salesman.cell_no,
                          cnic_no: salesman.cnic_no,
                          joining_date: salesman.joining_date
                        });
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(salesman.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {salesmen.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Users size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-slate-500 text-sm">No salesmen registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const OrderBookerModal = ({ 
  onClose, 
  onSuccess,
  orderBookers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  orderBookers: OrderBooker[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrderBookers = orderBookers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cell_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cnic_no.toLowerCase().includes(searchQuery.toLowerCase())
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
      const url = editingId ? `/api/order-bookers/${editingId}` : '/api/order-bookers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save order booker", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order booker?")) return;
    try {
      const res = await fetch(`/api/order-bookers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete order booker", err);
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
          <h3 className="text-lg font-bold text-slate-900">Order Bookers Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Booker' : 'Add New Booker'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Booker Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Zeeshan Ahmed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Ahmed Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-1111111-1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
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
                  {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Add Booker (F2 / CTRL+S)'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        name: '', 
                        father_name: '', 
                        cell_no: '', 
                        cnic_no: '', 
                        joining_date: new Date().toISOString().split('T')[0] 
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

          <div className="p-6 bg-slate-50 lg:col-span-2 flex flex-col overflow-hidden max-h-[600px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Booker List ({filteredOrderBookers.length})</h4>
                <p className="text-[10px] text-slate-500">Search and manage booking agents</p>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text"
                  placeholder="Search bookers..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none shadow-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name / Father</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact / CNIC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrderBookers.map(booker => (
                    <tr key={booker.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{booker.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{booker.name}</p>
                        <p className="text-[10px] text-slate-500">{booker.father_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{booker.cell_no}</p>
                        <p className="text-[10px] text-slate-500">{booker.cnic_no}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{booker.joining_date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(booker.id);
                              setFormData({ 
                                name: booker.name, 
                                father_name: booker.father_name, 
                                cell_no: booker.cell_no, 
                                cnic_no: booker.cnic_no, 
                                joining_date: booker.joining_date 
                              });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(booker.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orderBookers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No bookers found</td>
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

export const MaterialGroupModal = ({ 
  onClose, 
  onSuccess,
  materialGroups 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  materialGroups: MaterialGroup[]
}) => {
  const [formData, setFormData] = useState({
    mat_gp: '',
    mat_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = materialGroups.filter(g => 
    g.mat_gp.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.mat_description.toLowerCase().includes(searchQuery.toLowerCase())
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
      const url = editingId ? `/api/material-groups/${editingId}` : '/api/material-groups';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ mat_gp: '', mat_description: '' });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save material group", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material group?")) return;
    try {
      const res = await fetch(`/api/material-groups/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete material group", err);
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
          <h3 className="text-lg font-bold text-slate-900">Manage Material Groups</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 border-r border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Group' : 'Add New Group'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Group ID (MatGP)</label>
                <input 
                  required
                  disabled={!!editingId}
                  type="text" 
                  value={formData.mat_gp}
                  onChange={e => setFormData({...formData, mat_gp: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                  placeholder="e.g. 00001"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Description</label>
                <input 
                  required
                  type="text" 
                  value={formData.mat_description}
                  onChange={e => setFormData({...formData, mat_description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. OIL"
                />
              </div>
              <div className="flex gap-2">
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
                  {isSubmitting ? 'Saving...' : editingId ? 'Update (F2 / CTRL+S)' : 'Add Group (F2 / CTRL+S)'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ mat_gp: '', mat_description: '' });
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

          <div className="p-6 bg-slate-50 flex flex-col overflow-hidden max-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Groups ({filteredGroups.length})</h4>
              <div className="relative w-40">
                <input 
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-indigo-600 outline-none shadow-sm transition-all text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
              {filteredGroups.map(group => (
                <div key={group.mat_gp} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{group.mat_gp}</p>
                    <p className="text-sm font-bold text-slate-900">{group.mat_description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(group.mat_gp);
                        setFormData({ mat_gp: group.mat_gp, mat_description: group.mat_description });
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(group.mat_gp)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {materialGroups.length === 0 && (
                <p className="text-center py-8 text-slate-500 text-sm">No groups found</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const TCodeMasterModal = ({ 
  onClose 
}: { 
  onClose: () => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTCodes = TCODES.filter(t => 
    t.tCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.transactionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">TCODE Info (Master Data)</h3>
              <p className="text-xs text-indigo-200">Granular mapping of functional modules to transaction codes for role-based maintenance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by TCode, Transaction Name, or Module..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">TCode</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Parent Module</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Transaction Name</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Action Type</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Role association</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTCodes.map(t => (
                <tr key={t.tCode} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {t.tCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.parentModule}</p>
                    <p className="text-sm font-medium text-slate-600">{t.module}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.transactionName}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{t.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                      t.actionType === 'Create' ? 'bg-emerald-100 text-emerald-700' :
                      t.actionType === 'Change' ? 'bg-amber-100 text-amber-700' :
                      t.actionType === 'Delete' ? 'bg-rose-100 text-rose-700' :
                      t.actionType === 'Manage' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-slate-400" />
                      <span className="font-mono text-xs text-slate-500">{t.roleAssociation}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTCodes.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Shield size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium tracking-tight text-lg">No Transaction Codes found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search query</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Total Codes: <span className="font-bold text-slate-900">{TCODES.length}</span>
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const LocationMasterModal = ({ 
  onClose 
}: { 
  onClose: () => void 
}) => {
  const [activeLevel, setActiveLevel] = useState<'countries' | 'provinces' | 'cities' | 'towns' | 'areas' | 'subareas'>('countries');
  const [selection, setSelection] = useState<Record<string, { id: number, name: string } | null>>({
    countries: null,
    provinces: null,
    cities: null,
    towns: null,
    areas: null,
    subareas: null
  });
  
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        // Since this modal has multiple states, we target the "Plus" save only if "name" is present
        // or just handle whichever button is type="submit"
        const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitBtn) submitBtn.click();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, activeLevel, selection]);

  const filteredList = list.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levels = [
    { key: 'countries', label: 'Country', parent: null },
    { key: 'provinces', label: 'Province', parent: 'countries' },
    { key: 'cities', label: 'City', parent: 'provinces' },
    { key: 'towns', label: 'Town', parent: 'cities' },
    { key: 'areas', label: 'Area', parent: 'towns' },
    { key: 'subareas', label: 'Subarea', parent: 'areas' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeLevel, selection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const levelObj = levels.find(l => l.key === activeLevel);
      let url = `/api/locations/${activeLevel}`;
      
      if (levelObj?.parent) {
        const parentId = selection[levelObj.parent]?.id;
        if (parentId) url += `?parentId=${parentId}`;
        else {
          setList([]);
          setLoading(false);
          return;
        }
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setIsSubmitting(true);
    try {
      const levelObj = levels.find(l => l.key === activeLevel);
      const parentId = levelObj?.parent ? selection[levelObj.parent]?.id : null;
      
      const res = await fetch(`/api/locations/${activeLevel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      });
      
      if (res.ok) {
        setName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${activeLevel.slice(0, -1)}?`)) return;
    try {
      const res = await fetch(`/api/locations/${activeLevel}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const selectItem = (item: any) => {
    const newSelection = { ...selection, [activeLevel]: item };
    // Clear children
    const levelIndex = levels.findIndex(l => l.key === activeLevel);
    for (let i = levelIndex + 1; i < levels.length; i++) {
      newSelection[levels[i].key] = null;
    }
    setSelection(newSelection);
    
    // Move to next level if exists
    if (levelIndex < levels.length - 1) {
      setActiveLevel(levels[levelIndex + 1].key as any);
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
          <div>
            <h3 className="text-lg font-bold text-slate-900">Manage Location Hierarchy</h3>
            <p className="text-xs text-slate-500">Configure Country, Province, City, Town, Area, and Subarea Master Data</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
          {levels.map((level, idx) => (
            <button
              key={level.key}
              onClick={() => setActiveLevel(level.key as any)}
              className={cn(
                "px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap min-w-[150px]",
                activeLevel === level.key 
                  ? "text-indigo-600 border-indigo-600 bg-white shadow-sm" 
                  : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-100/50"
              )}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-[10px] flex items-center justify-center text-slate-500">
                    {idx + 1}
                  </span>
                  {level.label}
                </span>
                <span className="text-[10px] font-medium text-indigo-500/80 normal-case italic truncate w-full text-left">
                  {selection[level.key]?.name || 'Not Selected'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-x divide-slate-100">
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Select {levels.find(l => l.key === activeLevel)?.label}
                  {activeLevel !== 'countries' && selection[levels.find(l => l.key === activeLevel)?.parent!] && (
                    <span className="text-slate-400 font-medium ml-1">in {selection[levels.find(l => l.key === activeLevel)?.parent!]?.name}</span>
                  )}
                </h4>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text"
                  placeholder={`Search ${activeLevel}...`}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition-all bg-white shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <p className="text-xs font-bold text-slate-900 animate-pulse">Synchronizing hierarchy...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                  <Search size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold mb-1">
                  {searchQuery ? 'No matching records found' : `No ${activeLevel} records found`}
                </p>
                <p className="text-slate-500 text-xs max-w-xs mx-auto mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : activeLevel !== 'countries' && !selection[levels.find(l => l.key === activeLevel)?.parent!] 
                      ? `To view ${activeLevel}, please select a ${levels.find(l => l.key === activeLevel)?.parent.slice(0, -1)} first.`
                      : `Start by adding a new ${activeLevel.slice(0, -1)} using the form on the right.`}
                </p>
                {activeLevel !== 'countries' && !selection[levels.find(l => l.key === activeLevel)?.parent!] && (
                   <button 
                    onClick={() => setActiveLevel(levels.find(l => l.key === activeLevel)?.parent as any)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                   >
                     Go to {levels.find(l => l.key === activeLevel)?.parent.slice(0, -1)} Selection
                   </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredList.map(item => (
                  <div 
                    key={item.id}
                    className={cn(
                      "group p-4 rounded-2xl border-2 flex justify-between items-center transition-all cursor-pointer relative overflow-hidden",
                      selection[activeLevel]?.id === item.id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50"
                    )}
                    onClick={() => selectItem(item)}
                  >
                    <div className="flex items-center gap-3">
                       <span className={cn(
                         "w-2 h-2 rounded-full",
                         selection[activeLevel]?.id === item.id ? "bg-white" : "bg-indigo-400"
                       )}></span>
                       <span className="text-sm font-bold truncate pr-8">{item.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          selection[activeLevel]?.id === item.id 
                            ? "hover:bg-white/20 text-white" 
                            : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-80 bg-slate-50 p-6 flex flex-col">
            <div className="flex-1">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
                <h4 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                  <div className="bg-indigo-600 w-2 h-4 rounded-full"></div>
                  New {levels.find(l => l.key === activeLevel)?.label}
                </h4>
                <form onSubmit={handleCreate} className="space-y-6">
                  {activeLevel !== 'countries' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relational Parent</label>
                      <p className={cn(
                        "text-sm font-bold truncate",
                        selection[levels.find(l => l.key === activeLevel)?.parent!] ? "text-indigo-600" : "text-rose-400 italic"
                      )}>
                        {selection[levels.find(l => l.key === activeLevel)?.parent!]?.name || `Select ${levels.find(l => l.key === activeLevel)?.parent.slice(0, -1)} first`}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{levels.find(l => l.key === activeLevel)?.label} Name</label>
                    <input 
                      required
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={activeLevel !== 'countries' && !selection[levels.find(l => l.key === activeLevel)?.parent!] || isSubmitting}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all disabled:opacity-50 shadow-inner"
                      placeholder={`Enter ${activeLevel.slice(0, -1)}...`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || (activeLevel !== 'countries' && !selection[levels.find(l => l.key === activeLevel)?.parent!])}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                  >
                    <Plus size={18} />
                    <span>{isSubmitting ? 'Processing...' : 'Save Record (F2 / CTRL+S)'}</span>
                  </button>
                </form>
              </div>

              <div className="p-6 bg-indigo-900 rounded-3xl text-white shadow-2xl shadow-indigo-100 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Shield size={12} />
                  Selected Path
                </h5>
                <div className="space-y-3 relative z-10">
                  {levels.map((l, i) => (
                    <div key={l.key} className="flex justify-between items-center text-[11px]">
                      <span className="text-indigo-300 font-medium">Level {i+1}:</span>
                      <span className={cn(
                        "font-black truncate max-w-[120px]",
                        selection[l.key] ? "text-white" : "text-indigo-400/50"
                      )}>{selection[l.key]?.name || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
