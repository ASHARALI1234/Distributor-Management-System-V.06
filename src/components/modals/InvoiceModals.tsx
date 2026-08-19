import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Printer, CheckCircle2, ChevronRight, AlertCircle, ShoppingCart, Search, PlusCircle, Hash, RotateCcw, Package, Truck, Calendar, User, Layers, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Delivery, InvoiceItem, DeliveryItem } from '../../types';
import { cn } from '../../lib/utils';

interface InvoiceTransactionModalProps {
  onClose: () => void;
  shops: Shop[];
  onSuccess: () => void;
  formatPKR: (amt: number) => string;
  onOpenDisplayInvoice?: (invoiceId?: number | string) => void;
}

export const InvoiceTransactionModal = ({ 
  onClose, 
  shops, 
  onSuccess, 
  formatPKR,
  onOpenDisplayInvoice 
}: InvoiceTransactionModalProps) => {
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<string[]>(['', '', '', '', '']);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const selectedShop = shops.find(s => s.id === selectedShopId);

  // Fetch pending deliveries for a shop
  useEffect(() => {
    if (selectedShopId) {
      setErrorStatus(null);
      fetch(`/api/shops/${selectedShopId}/pending-deliveries`)
        .then(res => {
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          setPendingDeliveries(data);
          setSelectedDeliveryIds([]);
          setInvoiceItems([]);
        })
        .catch(err => {
          console.error(err);
          setErrorStatus(err.message);
        });
    } else {
      setPendingDeliveries([]);
      setSelectedDeliveryIds([]);
      setInvoiceItems([]);
    }
  }, [selectedShopId]);

  // Fetch items when deliveries are selected
  useEffect(() => {
    if (selectedDeliveryIds.length > 0) {
      const fetchItems = async () => {
        try {
          const allItems: any[] = [];
          for (const dId of selectedDeliveryIds) {
            const res = await fetch(`/api/deliveries/${dId}/items`);
            const items = await res.json();
            allItems.push(...items.map((it: any) => ({
              ...it,
              delivery_id: dId,
              // Use net_qty (Delivered - Returned) for invoicing as per ERP rules
              quantity: it.net_qty, 
              original_delivery_qty: it.quantity,
              return_qty: it.return_qty,
              trade_discount_pct: it.discount_pct || 0,
              tax_pct: it.sales_tax_pct || 0,
              additional_tax_pct: it.additional_tax_pct || 0,
              special_discount_pct: it.extra_discount_pct || 0,
              unit_price: it.price,
              net_amount: calculateLineNet(it.net_qty, it.price, (it.discount_pct || 0) + (it.extra_discount_pct || 0), (it.sales_tax_pct || 0) + (it.additional_tax_pct || 0))
            })));
          }
          setInvoiceItems(allItems);
        } catch (err) {
          console.error(err);
        }
      };
      fetchItems();
    } else {
      setInvoiceItems([]);
    }
  }, [selectedDeliveryIds]);

  const calculateLineNet = (qty: number, price: number, discTotalPct: number, taxPct: number) => {
    const gross = qty * price;
    const discAmount = (gross * discTotalPct / 100);
    const taxAmount = (gross * taxPct / 100);
    const net = gross - discAmount + taxAmount;
    return Math.round(net * 100) / 100;
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShopSearch(shop.shop_name);
    setShowShopDropdown(false);
    setDeliverySlots(['', '', '', '', '']);
  };

  const syncSlotsWithIds = (ids: number[]) => {
    const newSlots = [...deliverySlots];
    ids.forEach((id, i) => {
      if (i < 5) newSlots[i] = id.toString();
    });
    setDeliverySlots(newSlots);
  };

  const handleSlotChange = (idx: number, value: string) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = value;
    setDeliverySlots(newSlots);

    // If it's a direct ID match from pending
    const match = pendingDeliveries.find(d => d.id.toString() === value || `#DEL-${d.id.toString().padStart(4, '0')}` === value);
    if (match) {
      updateSelectedIdsFromSlots(newSlots);
    }
  };

  const updateSelectedIdsFromSlots = (slotsArr: string[]) => {
    const ids: number[] = [];
    slotsArr.forEach(s => {
      const clean = s.replace('#DEL-', '').trim();
      const id = parseInt(clean);
      if (!isNaN(id) && pendingDeliveries.some(d => d.id === id)) {
        if (!ids.includes(id)) ids.push(id);
      }
    });
    setSelectedDeliveryIds(ids);
  };

  const selectFromSearch = (idx: number, delivery: Delivery) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = `#DEL-${delivery.id.toString().padStart(4, '0')}`;
    setDeliverySlots(newSlots);
    updateSelectedIdsFromSlots(newSlots);
    setActiveSlotIdx(null);
  };

  const clearSlot = (idx: number) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = '';
    setDeliverySlots(newSlots);
    updateSelectedIdsFromSlots(newSlots);
  };

  const toggleDelivery = (id: number) => {
    setSelectedDeliveryIds(prev => {
      const next = prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id];
      // Sync slots back
      const newSlots = ['', '', '', '', ''];
      next.forEach((nid, i) => { if(i < 5) newSlots[i] = `#DEL-${nid.toString().padStart(4, '0')}`; });
      setDeliverySlots(newSlots);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedShopId || invoiceItems.length === 0) {
      setErrorStatus("Please select a shop and at least one delivery.");
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);

    const payload = {
      shop_id: selectedShopId,
      invoice_date: invoiceDate,
      delivery_ids: selectedDeliveryIds,
      items: invoiceItems.map(it => ({
        delivery_id: it.delivery_id,
        delivery_item_id: it.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        trade_discount_pct: it.trade_discount_pct,
        tax_pct: it.tax_pct,
        additional_tax_pct: it.additional_tax_pct,
        special_discount_pct: it.special_discount_pct,
        net_amount: it.net_amount
      }))
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
        // Removed onClose() to stay on screen
      } else {
        const data = await res.json();
        setErrorStatus(data.error || "Failed to create invoice");
      }
    } catch (err) {
      setErrorStatus("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItemField = (idx: number, field: string, val: number) => {
    const updated = [...invoiceItems];
    updated[idx][field] = val;
    
    const item = updated[idx];
    item.net_amount = calculateLineNet(
      item.quantity, 
      item.unit_price, 
      (item.trade_discount_pct || 0) + (item.special_discount_pct || 0), 
      (item.tax_pct || 0) + (item.additional_tax_pct || 0)
    );
    
    setInvoiceItems(updated);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShopId, invoiceItems, selectedDeliveryIds, invoiceDate, isSubmitting]);

  const totals = invoiceItems.reduce((acc, it) => {
    const gross = it.quantity * it.unit_price;
    const disc = gross * ((it.trade_discount_pct || 0) + (it.special_discount_pct || 0)) / 100;
    const tax = gross * ((it.tax_pct || 0) + (it.additional_tax_pct || 0)) / 100;
    
    acc.gross += gross;
    acc.discount += disc;
    acc.tax += tax;
    acc.net += it.net_amount;
    return acc;
  }, { gross: 0, discount: 0, tax: 0, net: 0 });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">
              Invoice Management (INV01)
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Live Posting</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenDisplayInvoice && (
              <button 
                type="button"
                onClick={() => onOpenDisplayInvoice()}
                className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200"
                title="Switch to Display Invoice (VF03)"
              >
                <FileText size={16} />
                <span>Display Invoice (VF03)</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorStatus && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{errorStatus}</p>
            </div>
          )}

          {/* Header Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Retailer</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Type shop name or location..."
                  value={shopSearch}
                  onFocus={() => setShowShopDropdown(true)}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShowShopDropdown(true);
                  }}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
                
                <AnimatePresence>
                  {showShopDropdown && shopSearch.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto">
                        {shops
                          .filter(s => s.shop_name.toLowerCase().includes(shopSearch.toLowerCase()) || s.location.toLowerCase().includes(shopSearch.toLowerCase()))
                          .map(shop => (
                            <button
                              key={shop.id}
                              onClick={() => handleShopSelect(shop)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                            >
                              <div>
                                <span className="text-sm font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{shop.shop_name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{shop.location}</span>
                              </div>
                              <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Billing Date</label>
              <input 
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-medium"
              />
            </div>
            <div className="flex items-end">
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl w-full text-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Available Deliveries</span>
                <span className="text-lg font-black text-indigo-600">{pendingDeliveries.length}</span>
              </div>
            </div>
          </div>

          {/* Delivery Slots Selection */}
          {selectedShopId && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 uppercase">Input Delivery Refs</label>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} className="relative">
                    <input 
                      type="text"
                      placeholder={`Slot ${idx + 1}...`}
                      value={deliverySlots[idx]}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      onFocus={() => setActiveSlotIdx(idx)}
                      onBlur={() => setTimeout(() => setActiveSlotIdx(null), 200)}
                      className={cn(
                        "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold transition-all outline-none",
                        deliverySlots[idx] 
                          ? "border-indigo-400 text-indigo-700 bg-white" 
                          : "text-slate-900 placeholder:text-slate-400 focus:border-indigo-400"
                      )}
                    />
                    <AnimatePresence>
                      {activeSlotIdx === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto"
                        >
                          {pendingDeliveries
                            .filter(d => {
                              const q = deliverySlots[idx].toLowerCase().replace('#del-', '');
                              return d.id.toString().includes(q) || d.delivery_date.includes(q);
                            })
                            .map(d => (
                              <button
                                key={d.id}
                                onClick={() => selectFromSearch(idx, d)}
                                disabled={selectedDeliveryIds.includes(d.id)}
                                className={cn(
                                  "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between group rounded transition-colors",
                                  selectedDeliveryIds.includes(d.id) && "opacity-40 cursor-not-allowed"
                                )}
                              >
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block italic">#DEL-{d.id.toString().padStart(4, '0')}</span>
                                  <span className="text-[10px] text-slate-400 block font-medium">Rs.{d.total_amount.toLocaleString()}</span>
                                </div>
                              </button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Batch Ref</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Delivered</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Returned</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-indigo-600 uppercase text-center">Billable</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Unit Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">Add. Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Disc (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">E. Disc (%)</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider italic">{item.product_id}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200/50 font-mono italic">#DEL-{item.delivery_id}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-slate-500">{item.original_delivery_qty}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-rose-500">{item.return_qty || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className="text-sm font-black text-indigo-600">{item.quantity}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.uom || 'EACH'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input 
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold outline-none focus:border-indigo-600 transition-all"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.tax_pct}
                        onChange={e => updateItemField(idx, 'tax_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.additional_tax_pct}
                        onChange={e => updateItemField(idx, 'additional_tax_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.trade_discount_pct}
                        onChange={e => updateItemField(idx, 'trade_discount_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.special_discount_pct}
                        onChange={e => updateItemField(idx, 'special_discount_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                      {formatPKR(item.net_amount)}
                    </td>
                  </tr>
                ))}
                {invoiceItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                      <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-medium">Awaiting Line Items Selection</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* New ORDER Style Summary Bar */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Gross Total</p>
                <p className="text-lg font-bold">{formatPKR(totals.gross)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Discounts</p>
                <p className="text-lg font-bold text-rose-200">-{formatPKR(totals.discount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Tax Total</p>
                <p className="text-lg font-bold text-emerald-200">+{formatPKR(totals.tax)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Net Payable</p>
                <p className="text-2xl font-black">{formatPKR(totals.net)}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-4 text-white font-bold opacity-70 hover:opacity-100 transition-opacity uppercase text-xs tracking-widest"
              >
                Discard
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || invoiceItems.length === 0}
                className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : (
                  <>
                    <Save size={18} />
                    <span>Post Invoice (F2)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface DisplayInvoiceModalProps {
  onClose: () => void;
  formatPKR: (amt: number) => string;
  initialInvoiceId?: string | number | null;
  onOpenCreateInvoice?: () => void;
}

export const DisplayInvoiceModal = ({ 
  onClose, 
  formatPKR, 
  initialInvoiceId,
  onOpenCreateInvoice 
}: DisplayInvoiceModalProps) => {
  const [invoiceIdInput, setInvoiceIdInput] = useState(
    initialInvoiceId ? String(initialInvoiceId) : ''
  );
  const [invoice, setInvoice] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrintWarning, setShowPrintWarning] = useState(false);

  const handlePrint = () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      setShowPrintWarning(true);
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn("Iframe blocked window.print()", e);
      }
    } else {
      window.focus();
      window.print();
    }
  };

  const fetchInvoice = async (id: string | number) => {
    if (!id || !id.toString().trim()) return;
    setLoading(true);
    setError(null);
    setInvoice(null);
    setItems([]);

    const cleanId = id.toString().toUpperCase().replace(/[^0-9]/g, '').trim();
    if (!cleanId) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/invoices/${cleanId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error(`Invoice #${cleanId} not found`);
        throw new Error("Failed to fetch invoice");
      }
      const data = await res.json();
      setInvoice(data);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialInvoiceId) {
      setInvoiceIdInput(String(initialInvoiceId));
      fetchInvoice(String(initialInvoiceId));
    }
  }, [initialInvoiceId]);

  // Keyboard shortcut F3 to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoice(invoiceIdInput);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Display Invoice (VF03)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Document Multi-View</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenCreateInvoice && (
              <button 
                type="button"
                onClick={onOpenCreateInvoice}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-200"
                title="Create New Invoice (INV01)"
              >
                <PlusCircle size={16} />
                <span>Create Invoice (INV01)</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Close (F3)">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Enter Invoice Number (e.g. 10)..."
                value={invoiceIdInput}
                onChange={e => setInvoiceIdInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-600 outline-none shadow-sm transition-all"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !invoiceIdInput.trim()}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              {loading ? <RotateCcw className="animate-spin" size={18} /> : <Search size={18} />}
              Display
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{error}</p>
                <p className="text-sm text-slate-500">Please check the ID and try again.</p>
              </div>
            </div>
          )}

          {!invoice && !error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Search size={64} className="text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting Invoice Reference</p>
            </div>
          )}

          {invoice && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print-receipt-only">
              {/* Receipt Print Header (Only visible on print) */}
              <div className="hidden print:block text-center border-b-2 border-dashed border-slate-900 pb-4 mb-6">
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">KARACHI DMS</h2>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-700">Distribution Management System</p>
                <p className="text-[10px] text-slate-500 mt-1">Karachi, Sindh, Pakistan • Support: +92 21 111-K-DMS</p>
                <div className="flex justify-between items-center text-[10px] text-slate-600 mt-4 px-2">
                  <span>PRINTED: {new Date().toLocaleString()}</span>
                  <span className="font-bold">OFFICIAL INVOICE</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      Retailer Info
                    </p>
                    <p className="text-sm font-black text-slate-900 leading-snug">{invoice.shop_name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{invoice.location}</p>
                  </div>
                  {invoice.phone && (
                    <p className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-200/60">{invoice.phone}</p>
                  )}
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <FileText size={12} className="text-slate-400" />
                      Invoice Document
                    </p>
                    <p className="text-base font-black text-slate-900">#INV-{invoice.id.toString().padStart(4, '0')}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                      invoice.status === 'cancelled' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {invoice.status || 'Posted'}
                    </span>
                  </div>
                </div>

                {/* Source Deliveries Card */}
                <div className="p-5 bg-indigo-50/70 rounded-2xl border border-indigo-100/80 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Truck size={13} className="text-indigo-600" />
                      Source Delivery #(s)
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(invoice.delivery_numbers && invoice.delivery_numbers.length > 0) ? (
                        invoice.delivery_numbers.map((dNum: string, idx: number) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-700 font-black text-xs rounded-lg border border-indigo-200 shadow-sm"
                          >
                            <Truck size={11} className="text-indigo-500" />
                            {dNum}
                          </span>
                        ))
                      ) : invoice.deliveries && invoice.deliveries.length > 0 ? (
                        invoice.deliveries.map((d: any, idx: number) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-700 font-black text-xs rounded-lg border border-indigo-200 shadow-sm"
                          >
                            <Truck size={11} className="text-indigo-500" />
                            #DEL-{d.id.toString().padStart(4, '0')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No linked deliveries recorded</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-2 pt-2 border-t border-indigo-100">
                    {(invoice.delivery_numbers?.length || invoice.deliveries?.length || 0)} Delivery document(s) billed
                  </p>
                </div>

                {/* Net Amount Card */}
                <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-indigo-200 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Net Invoice Value</p>
                    <p className="text-2xl font-black">{formatPKR(invoice.net_amount ?? invoice.total_amount ?? 0)}</p>
                  </div>
                  <div className="text-[10px] text-indigo-200 font-medium mt-2 pt-2 border-t border-indigo-500/50 flex justify-between">
                    <span>Gross: {formatPKR(invoice.gross_amount || 0)}</span>
                    <span>Tax: +{formatPKR(invoice.total_tax || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Linked Deliveries Breakdown Section */}
              {invoice.deliveries && invoice.deliveries.length > 0 && (
                <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Truck size={15} className="text-indigo-600" />
                      Deliveries Billed in this Invoice ({invoice.deliveries.length})
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Lineage</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {invoice.deliveries.map((del: any) => (
                      <div 
                        key={del.id} 
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-lg border border-indigo-100 flex items-center gap-1.5 w-fit">
                              <Truck size={12} className="text-indigo-600" />
                              #DEL-{del.id.toString().padStart(4, '0')}
                            </span>
                            {del.order_refs && (
                              <p className="text-[11px] text-slate-500 font-bold mt-1.5">
                                Orders: <span className="text-slate-800 font-mono">{del.order_refs}</span>
                              </p>
                            )}
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                            del.status === 'billed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-600"
                          )}>
                            {del.status || 'billed'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5 pt-2 border-t border-slate-100">
                          {del.delivery_date && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Delivery Date:</span>
                              <span className="font-semibold text-slate-700">{new Date(del.delivery_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {del.salesman_name && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Salesman:</span>
                              <span className="font-semibold text-slate-700">{del.salesman_name}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold pt-1 text-slate-900 border-t border-slate-50">
                            <span>Delivery Total:</span>
                            <span className="text-indigo-600">{formatPKR(del.total_amount || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} className="text-indigo-600" />
                    Invoice Line Items ({items.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Consolidated Item Level Breakdown</span>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] whitespace-nowrap">Delivery Ref</th>
                        <th className="px-6 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px]">Product</th>
                        <th className="px-3 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px] text-center">UOM</th>
                        <th className="px-4 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px] text-center">Qty</th>
                        <th className="px-4 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px] text-right">Price</th>
                        <th className="px-4 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px] text-center">Tax</th>
                        <th className="px-4 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px] text-center">Disc</th>
                        <th className="px-6 py-3 font-bold text-slate-500 opacity-70 uppercase text-[10px] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            {item.delivery_id ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-md border border-indigo-100">
                                <Truck size={10} className="text-indigo-500" />
                                #DEL-{Number(item.delivery_id).toString().padStart(4, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{item.product_name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono italic">#{item.product_id}</span>
                          </td>
                          <td className="px-3 py-4 text-center font-bold text-slate-400 text-xs uppercase">{item.uom || 'CTN'}</td>
                          <td className="px-4 py-4 text-center font-black text-slate-800">{item.quantity}</td>
                          <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatPKR(item.unit_price)}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">
                              +{(item.tax_pct || 0) + (item.additional_tax_pct || 0)}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
                              -{(item.trade_discount_pct || 0) + (item.special_discount_pct || 0)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">{formatPKR(item.net_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receipt Print Footer (Only visible on print) */}
              <div className="hidden print:block text-center border-t border-dashed border-slate-900 pt-6 mt-8">
                {invoice.delivery_numbers && (
                  <p className="text-[11px] font-bold text-slate-800 uppercase mb-2">
                    Source Deliveries: {invoice.delivery_numbers.join(', ')}
                  </p>
                )}
                <p className="text-xs font-black text-slate-950 uppercase tracking-wider">Thank you for your business!</p>
                <p className="text-[10px] text-slate-500 mt-1">This is an electronically generated invoice under Karachi distribution records.</p>
                <p className="text-[9px] text-slate-400 font-mono mt-2">Powered by Karachi DMS Distribution Suite v7.0</p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col items-end gap-3 pt-4 no-print">
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={handlePrint}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Print Document
                  </button>
                </div>

                {showPrintWarning && (
                  <div className="w-full max-w-md p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 animate-in fade-in slide-in-from-top-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">Preview Frame Print Restriction</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-700">
                      Browser printing is blocked inside embedded iframe previews. Click below to open Karachi DMS in a new tab where you can print directly.
                    </p>
                    <div className="flex gap-2 mt-1">
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Open in New Tab
                      </a>
                      <button 
                        onClick={() => setShowPrintWarning(false)}
                        className="text-[10px] font-bold text-amber-900 hover:underline px-2 py-1.5"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
