import React, { useState, useEffect } from 'react';
import { 
  X, Save, FileText, Printer, CheckCircle2, ChevronRight, AlertCircle, 
  ShoppingCart, Search, PlusCircle, Hash, RotateCcw, Package, Truck, 
  Calendar, User, Layers, ArrowRight, Edit3, Lock, ShieldCheck, Check, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Delivery } from '../../types';
import { cn } from '../../lib/utils';

// ==========================================
// 1. INVOICE TRANSACTION MODAL (INV01 / VF01)
// ==========================================

interface InvoiceTransactionModalProps {
  onClose: () => void;
  shops: Shop[];
  onSuccess: () => void;
  formatPKR: (amt: number) => string;
  onOpenDisplayInvoice?: (invoiceId?: number | string) => void;
  onOpenEditInvoice?: (invoiceId?: number | string) => void;
}

export const InvoiceTransactionModal = ({ 
  onClose, 
  shops, 
  onSuccess, 
  formatPKR,
  onOpenDisplayInvoice,
  onOpenEditInvoice 
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
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Fetch pending deliveries for a shop
  useEffect(() => {
    if (selectedShopId) {
      setErrorStatus(null);
      setSuccessNotice(null);
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
            allItems.push(...items.map((it: any) => {
              const maxDeliveryQty = it.net_qty !== undefined ? it.net_qty : (it.quantity - (it.return_qty || 0));
              return {
                ...it,
                delivery_id: dId,
                max_delivery_qty: maxDeliveryQty,
                quantity: maxDeliveryQty, // default to maximum billable
                original_delivery_qty: it.quantity,
                return_qty: it.return_qty || 0,
                trade_discount_pct: it.discount_pct || 0,
                tax_pct: it.sales_tax_pct || 0,
                additional_tax_pct: it.additional_tax_pct || 0,
                special_discount_pct: it.extra_discount_pct || 0,
                unit_price: it.price,
                net_amount: calculateLineNet(
                  maxDeliveryQty, 
                  it.price, 
                  (it.discount_pct || 0) + (it.extra_discount_pct || 0), 
                  (it.sales_tax_pct || 0) + (it.additional_tax_pct || 0)
                )
              };
            }));
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
    const gross = (qty || 0) * (price || 0);
    const discAmount = (gross * (discTotalPct || 0) / 100);
    const taxAmount = (gross * (taxPct || 0) / 100);
    const net = gross - discAmount + taxAmount;
    return Math.round(net * 100) / 100;
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShopSearch(shop.shop_name);
    setShowShopDropdown(false);
    setDeliverySlots(['', '', '', '', '']);
  };

  const handleSlotChange = (idx: number, value: string) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = value;
    setDeliverySlots(newSlots);

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

  const validateItems = (): string | null => {
    if (!selectedShopId || invoiceItems.length === 0) {
      return "Please select a shop and at least one delivery.";
    }
    for (let i = 0; i < invoiceItems.length; i++) {
      const it = invoiceItems[i];
      if (it.quantity <= 0) {
        return `Item "${it.product_name}" quantity must be greater than 0.`;
      }
      const maxAllowed = it.max_delivery_qty !== undefined ? it.max_delivery_qty : it.original_delivery_qty;
      if (it.quantity > maxAllowed) {
        return `Item "${it.product_name}" quantity (${it.quantity}) cannot exceed delivered quantity (${maxAllowed}).`;
      }
    }
    return null;
  };

  const handleSubmit = async (postStatus: 'draft' | 'posted' = 'posted') => {
    const validationError = validateItems();
    if (validationError) {
      setErrorStatus(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);
    setSuccessNotice(null);

    const payload = {
      shop_id: selectedShopId,
      invoice_date: invoiceDate,
      status: postStatus,
      delivery_ids: selectedDeliveryIds,
      items: invoiceItems.map(it => ({
        delivery_id: it.delivery_id,
        delivery_item_id: it.id,
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        trade_discount_pct: Number(it.trade_discount_pct || 0),
        tax_pct: Number(it.tax_pct || 0),
        additional_tax_pct: Number(it.additional_tax_pct || 0),
        special_discount_pct: Number(it.special_discount_pct || 0),
        net_amount: Number(it.net_amount)
      }))
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        const invNo = `#INV-${(data.id || data.invoice_id || '').toString().padStart(4, '0')}`;
        setSuccessNotice(
          postStatus === 'posted'
            ? `Invoice ${invNo} successfully POSTED and finalized! It is now available in the Sales Tax Invoice report (STI01).`
            : `Invoice ${invNo} saved as DRAFT. You can edit and post it anytime via VF02 or Display Invoice.`
        );
        onSuccess();
        // Reset form for next invoice
        setSelectedDeliveryIds([]);
        setDeliverySlots(['', '', '', '', '']);
        setInvoiceItems([]);
        if (selectedShopId) {
          fetch(`/api/shops/${selectedShopId}/pending-deliveries`)
            .then(r => r.json())
            .then(d => setPendingDeliveries(d))
            .catch(() => {});
        }
      } else {
        setErrorStatus(data.error || "Failed to create invoice");
      }
    } catch (err: any) {
      setErrorStatus("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleSubmit('posted');
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShopId, invoiceItems, selectedDeliveryIds, invoiceDate, isSubmitting]);

  const totals = invoiceItems.reduce((acc, it) => {
    const gross = (it.quantity || 0) * (it.unit_price || 0);
    const disc = gross * ((it.trade_discount_pct || 0) + (it.special_discount_pct || 0)) / 100;
    const tax = gross * ((it.tax_pct || 0) + (it.additional_tax_pct || 0)) / 100;
    
    acc.gross += gross;
    acc.discount += disc;
    acc.tax += tax;
    acc.net += (it.net_amount || 0);
    return acc;
  }, { gross: 0, discount: 0, tax: 0, net: 0 });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full max-w-7xl max-h-[96vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Create Invoice (INV01 / VF01)
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                  Posting Workflow Active
                </span>
              </div>
              <p className="text-xs text-slate-500">Bill delivered stock • Post directly or save as draft for subsequent review</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenEditInvoice && (
              <button 
                type="button"
                onClick={() => onOpenEditInvoice()}
                className="px-4 py-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200"
                title="Edit Existing Invoice (VF02)"
              >
                <Edit3 size={15} />
                <span>Edit Invoice (VF02)</span>
              </button>
            )}
            {onOpenDisplayInvoice && (
              <button 
                type="button"
                onClick={() => onOpenDisplayInvoice()}
                className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200"
                title="Display Invoice (VF03)"
              >
                <FileText size={15} />
                <span>Display (VF03)</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-bold">{successNotice}</p>
              </div>
              <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800 p-1">
                <X size={16} />
              </button>
            </div>
          )}

          {errorStatus && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold">{errorStatus}</p>
            </div>
          )}

          {/* Header Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Retailer / Customer</label>
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
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-medium"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-medium"
              />
            </div>
            <div className="flex items-end">
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl w-full text-center">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Available Deliveries</span>
                <span className="text-lg font-black text-indigo-600">{pendingDeliveries.length}</span>
              </div>
            </div>
          </div>

          {/* Delivery Slots Selection */}
          {selectedShopId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                  <Truck size={14} className="text-indigo-600" />
                  Select Source Deliveries ({pendingDeliveries.length} available)
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Select up to 5 delivery notes to consolidate</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} className="relative">
                    <input 
                      type="text"
                      placeholder={`Delivery Ref ${idx + 1}...`}
                      value={deliverySlots[idx]}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      onFocus={() => setActiveSlotIdx(idx)}
                      onBlur={() => setTimeout(() => setActiveSlotIdx(null), 250)}
                      className={cn(
                        "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all outline-none",
                        deliverySlots[idx] 
                          ? "border-indigo-400 text-indigo-700 bg-indigo-50/30" 
                          : "text-slate-900 placeholder:text-slate-400 focus:border-indigo-400"
                      )}
                    />
                    <AnimatePresence>
                      {activeSlotIdx === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto"
                        >
                          {pendingDeliveries.length === 0 ? (
                            <div className="p-3 text-[11px] text-slate-400 text-center">No pending deliveries</div>
                          ) : (
                            pendingDeliveries
                              .filter(d => {
                                const q = (deliverySlots[idx] || '').toLowerCase().replace('#del-', '');
                                return d.id.toString().includes(q) || d.delivery_date.includes(q);
                              })
                              .map(d => (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => selectFromSearch(idx, d)}
                                  disabled={selectedDeliveryIds.includes(d.id)}
                                  className={cn(
                                    "w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0",
                                    selectedDeliveryIds.includes(d.id) && "opacity-40 cursor-not-allowed bg-slate-50"
                                  )}
                                >
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 block font-mono">#DEL-{d.id.toString().padStart(4, '0')}</span>
                                    <span className="text-[10px] text-slate-400 block">{new Date(d.delivery_date).toLocaleDateString()}</span>
                                  </div>
                                  <span className="text-xs font-bold text-indigo-600">{formatPKR(d.total_amount)}</span>
                                </button>
                              ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                <Package size={14} className="text-indigo-600" />
                Line Items (Quantity can be edited ≤ Delivered Quantity)
              </span>
              {invoiceItems.length > 0 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {invoiceItems.length} line item(s) loaded
                </span>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Product</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Delivery Ref</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Delivered</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Returned</th>
                    <th className="px-4 py-3 font-black text-indigo-700 uppercase text-[10px] text-center bg-indigo-50/50">Invoice Qty</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Unit Price</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Tax %</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Add. Tax %</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Disc %</th>
                    <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">E. Disc %</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Net Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.map((item, idx) => {
                    const maxQty = item.max_delivery_qty !== undefined ? item.max_delivery_qty : item.original_delivery_qty;
                    const isQtyExceeded = item.quantity > maxQty;
                    const isQtyInvalid = item.quantity <= 0;

                    return (
                      <tr key={idx} className={cn("hover:bg-slate-50/60 transition-colors", (isQtyExceeded || isQtyInvalid) && "bg-rose-50/40")}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-900">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono italic">#{item.product_id}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            #DEL-{item.delivery_id}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-600">
                          {item.original_delivery_qty}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-rose-500">
                          {item.return_qty || 0}
                        </td>
                        <td className="px-4 py-3 text-center bg-indigo-50/30">
                          <div className="flex flex-col items-center gap-1">
                            <input 
                              type="number"
                              min="1"
                              max={maxQty}
                              value={item.quantity}
                              onChange={e => updateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className={cn(
                                "w-16 text-center font-black text-xs px-2 py-1 rounded-lg border outline-none transition-all",
                                isQtyExceeded || isQtyInvalid
                                  ? "border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-600"
                                  : "border-indigo-300 bg-white text-indigo-700 focus:border-indigo-600"
                              )}
                            />
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Max: {maxQty}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            type="number"
                            value={item.unit_price}
                            onChange={e => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold outline-none focus:border-indigo-600 transition-all"
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input 
                            type="number"
                            value={item.tax_pct}
                            onChange={e => updateItemField(idx, 'tax_pct', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input 
                            type="number"
                            value={item.additional_tax_pct}
                            onChange={e => updateItemField(idx, 'additional_tax_pct', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input 
                            type="number"
                            value={item.trade_discount_pct}
                            onChange={e => updateItemField(idx, 'trade_discount_pct', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input 
                            type="number"
                            value={item.special_discount_pct}
                            onChange={e => updateItemField(idx, 'special_discount_pct', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          {formatPKR(item.net_amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {invoiceItems.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center text-slate-400">
                        <ShoppingCart size={40} className="mx-auto mb-3 opacity-20 text-slate-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Awaiting Retailer & Delivery Selection</p>
                        <p className="text-[11px] text-slate-400 mt-1">Select a shop above and choose pending delivery notes to bill</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary and Posting Action Bar */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Gross Total</p>
                <p className="text-base font-bold text-slate-100">{formatPKR(totals.gross)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300 mb-0.5">Total Discounts</p>
                <p className="text-base font-bold text-rose-300">-{formatPKR(totals.discount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-0.5">Total Sales Tax</p>
                <p className="text-base font-bold text-emerald-300">+{formatPKR(totals.tax)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-0.5">Net Payable</p>
                <p className="text-xl font-black text-white">{formatPKR(totals.net)}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-slate-400 hover:text-white font-bold transition-colors uppercase text-xs tracking-widest"
              >
                Discard
              </button>
              
              {/* Save as Draft Option */}
              <button 
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting || invoiceItems.length === 0}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3 rounded-xl font-bold text-xs transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50"
                title="Save without posting (editable later)"
              >
                <Edit3 size={15} />
                <span>Save as Draft</span>
              </button>

              {/* Final Post Option */}
              <button 
                type="button"
                onClick={() => handleSubmit('posted')}
                disabled={isSubmitting || invoiceItems.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                title="Post and finalize invoice (F2)"
              >
                {isSubmitting ? 'Posting...' : (
                  <>
                    <ShieldCheck size={16} />
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


// ==========================================
// 2. EDIT INVOICE MODAL (VF02)
// ==========================================

interface EditInvoiceModalProps {
  onClose: () => void;
  formatPKR: (amt: number) => string;
  initialInvoiceId?: string | number | null;
  onSuccess: () => void;
  onOpenDisplayInvoice?: (invoiceId?: number | string) => void;
}

export const EditInvoiceModal = ({
  onClose,
  formatPKR,
  initialInvoiceId,
  onSuccess,
  onOpenDisplayInvoice
}: EditInvoiceModalProps) => {
  const [invoiceIdInput, setInvoiceIdInput] = useState(
    initialInvoiceId ? String(initialInvoiceId) : ''
  );
  const [invoice, setInvoice] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchInvoice = async (id: string | number) => {
    if (!id || !id.toString().trim()) return;
    setLoading(true);
    setError(null);
    setSuccessNotice(null);
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
      
      const loadedItems = (data.items || []).map((it: any) => {
        const maxDeliveryQty = it.max_delivery_qty !== undefined 
          ? it.max_delivery_qty 
          : (it.delivery_quantity !== undefined ? it.delivery_quantity - (it.return_qty || 0) : it.quantity);
        return {
          ...it,
          max_delivery_qty: maxDeliveryQty,
          original_delivery_qty: it.delivery_quantity || it.quantity,
          return_qty: it.return_qty || 0,
          quantity: it.quantity,
          unit_price: it.unit_price,
          trade_discount_pct: it.trade_discount_pct || 0,
          tax_pct: it.tax_pct || 0,
          additional_tax_pct: it.additional_tax_pct || 0,
          special_discount_pct: it.special_discount_pct || 0,
          net_amount: it.net_amount
        };
      });
      setItems(loadedItems);
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

  const calculateLineNet = (qty: number, price: number, discTotalPct: number, taxPct: number) => {
    const gross = (qty || 0) * (price || 0);
    const discAmount = (gross * (discTotalPct || 0) / 100);
    const taxAmount = (gross * (taxPct || 0) / 100);
    const net = gross - discAmount + taxAmount;
    return Math.round(net * 100) / 100;
  };

  const updateItemField = (idx: number, field: string, val: number) => {
    const updated = [...items];
    updated[idx][field] = val;
    
    const item = updated[idx];
    item.net_amount = calculateLineNet(
      item.quantity, 
      item.unit_price, 
      (item.trade_discount_pct || 0) + (item.special_discount_pct || 0), 
      (item.tax_pct || 0) + (item.additional_tax_pct || 0)
    );
    
    setItems(updated);
  };

  const validateItems = (): string | null => {
    if (items.length === 0) {
      return "Invoice contains no line items.";
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.quantity <= 0) {
        return `Item "${it.product_name}" quantity must be greater than 0.`;
      }
      const maxAllowed = it.max_delivery_qty !== undefined ? it.max_delivery_qty : it.original_delivery_qty;
      if (it.quantity > maxAllowed) {
        return `Item "${it.product_name}" quantity (${it.quantity}) cannot exceed delivered quantity (${maxAllowed}).`;
      }
    }
    return null;
  };

  const handleSave = async (postStatus: 'draft' | 'posted') => {
    if (!invoice) return;

    // Check if already posted
    if (invoice.status === 'posted' || invoice.status === 'paid') {
      setError("This invoice is already posted and cannot be modified.");
      return;
    }

    const validationErr = validateItems();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessNotice(null);

    const payload = {
      status: postStatus,
      items: items.map(it => ({
        id: it.id,
        product_id: it.product_id,
        delivery_id: it.delivery_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        trade_discount_pct: Number(it.trade_discount_pct || 0),
        tax_pct: Number(it.tax_pct || 0),
        additional_tax_pct: Number(it.additional_tax_pct || 0),
        special_discount_pct: Number(it.special_discount_pct || 0),
        net_amount: Number(it.net_amount)
      }))
    };

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessNotice(
          postStatus === 'posted'
            ? `Invoice #${invoice.id} was successfully POSTED and is now official!`
            : `Invoice #${invoice.id} changes saved as DRAFT.`
        );
        onSuccess();
        fetchInvoice(invoice.id);
      } else {
        setError(data.error || "Failed to update invoice");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save invoice changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDirectPost = async () => {
    if (!invoice) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice(`Invoice #${invoice.id} has been posted successfully!`);
        onSuccess();
        fetchInvoice(invoice.id);
      } else {
        setError(data.error || "Failed to post invoice");
      }
    } catch (err: any) {
      setError(err.message || "Failed to post invoice");
    } finally {
      setSaving(false);
    }
  };

  const totals = items.reduce((acc, it) => {
    const gross = (it.quantity || 0) * (it.unit_price || 0);
    const disc = gross * ((it.trade_discount_pct || 0) + (it.special_discount_pct || 0)) / 100;
    const tax = gross * ((it.tax_pct || 0) + (it.additional_tax_pct || 0)) / 100;
    
    acc.gross += gross;
    acc.discount += disc;
    acc.tax += tax;
    acc.net += (it.net_amount || 0);
    return acc;
  }, { gross: 0, discount: 0, tax: 0, net: 0 });

  const isLocked = invoice && (invoice.status === 'posted' || invoice.status === 'paid');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Edit3 className="text-amber-600" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Edit Invoice (VF02)</h3>
                {invoice && (
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    isLocked ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {invoice.status || 'Draft'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Modify invoice quantities & pricing before final posting</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenDisplayInvoice && invoice && (
              <button 
                type="button"
                onClick={() => onOpenDisplayInvoice(invoice.id)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-200"
                title="Display Invoice (VF03)"
              >
                <FileText size={15} />
                <span>Display (VF03)</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Close">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Search Header if no invoice loaded */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <form onSubmit={(e) => { e.preventDefault(); fetchInvoice(invoiceIdInput); }} className="flex gap-3">
            <div className="flex-1 relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Enter Invoice Number to Edit (e.g. 10)..."
                value={invoiceIdInput}
                onChange={e => setInvoiceIdInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-600 outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !invoiceIdInput.trim()}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 text-xs flex items-center gap-2"
            >
              {loading ? <RotateCcw className="animate-spin" size={14} /> : <Search size={14} />}
              Load Invoice
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {successNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-bold">{successNotice}</p>
              </div>
              <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {isLocked && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <Lock className="text-amber-600 mt-0.5 shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase">Invoice Locked Against Modification</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  This invoice is already <strong>POSTED</strong> (Official document). In accordance with accounting controls, posted invoices cannot be edited. You may view or print it in Display Invoice (VF03).
                </p>
              </div>
            </div>
          )}

          {invoice && (
            <div className="space-y-6">
              {/* Invoice Meta Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Retailer / Customer</p>
                  <p className="text-sm font-black text-slate-900">{invoice.shop_name}</p>
                  <p className="text-xs text-slate-500">{invoice.location}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Document</p>
                  <p className="text-sm font-black text-slate-900">#INV-{invoice.id.toString().padStart(4, '0')}</p>
                  <p className="text-xs text-slate-500">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Net Invoice Value</p>
                  <p className="text-lg font-black text-indigo-700">{formatPKR(totals.net)}</p>
                  <p className="text-[10px] text-indigo-500">Gross: {formatPKR(totals.gross)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Package size={14} className="text-indigo-600" />
                    Invoice Items ({items.length})
                  </h4>
                  {!isLocked && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Edit quantity ≤ Delivered Qty
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Product</th>
                        <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Delivery Ref</th>
                        <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Delivered</th>
                        <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Returned</th>
                        <th className="px-4 py-3 font-black text-indigo-700 uppercase text-[10px] text-center bg-indigo-50/50">Invoice Qty</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Unit Price</th>
                        <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Tax %</th>
                        <th className="px-3 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Disc %</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Net Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const maxQty = item.max_delivery_qty !== undefined ? item.max_delivery_qty : item.original_delivery_qty;
                        const isExceeded = item.quantity > maxQty;

                        return (
                          <tr key={idx} className={cn("hover:bg-slate-50/60 transition-colors", isExceeded && "bg-rose-50/50")}>
                            <td className="px-4 py-3">
                              <p className="text-xs font-bold text-slate-900">{item.product_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono italic">#{item.product_id}</p>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                #DEL-{item.delivery_id}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-slate-600">
                              {item.original_delivery_qty}
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-rose-500">
                              {item.return_qty || 0}
                            </td>
                            <td className="px-4 py-3 text-center bg-indigo-50/30">
                              {isLocked ? (
                                <span className="font-black text-indigo-700">{item.quantity}</span>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <input 
                                    type="number"
                                    min="1"
                                    max={maxQty}
                                    value={item.quantity}
                                    onChange={e => updateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                    className={cn(
                                      "w-16 text-center font-black text-xs px-2 py-1 rounded-lg border outline-none transition-all",
                                      isExceeded
                                        ? "border-rose-400 bg-rose-50 text-rose-700"
                                        : "border-indigo-300 bg-white text-indigo-700 focus:border-indigo-600"
                                    )}
                                  />
                                  <span className="text-[9px] text-slate-400">Max: {maxQty}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isLocked ? (
                                <span className="font-bold text-slate-700">{formatPKR(item.unit_price)}</span>
                              ) : (
                                <input 
                                  type="number"
                                  value={item.unit_price}
                                  onChange={e => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold outline-none focus:border-indigo-600"
                                />
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isLocked ? (
                                <span className="text-emerald-700 font-bold">{(item.tax_pct || 0) + (item.additional_tax_pct || 0)}%</span>
                              ) : (
                                <input 
                                  type="number"
                                  value={item.tax_pct}
                                  onChange={e => updateItemField(idx, 'tax_pct', parseFloat(e.target.value) || 0)}
                                  className="w-12 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                                />
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isLocked ? (
                                <span className="text-rose-700 font-bold">{(item.trade_discount_pct || 0) + (item.special_discount_pct || 0)}%</span>
                              ) : (
                                <input 
                                  type="number"
                                  value={item.trade_discount_pct}
                                  onChange={e => updateItemField(idx, 'trade_discount_pct', parseFloat(e.target.value) || 0)}
                                  className="w-12 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">
                              {formatPKR(item.net_amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Bottom Actions */}
              {!isLocked && (
                <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Updated Net Total</span>
                    <span className="text-xl font-black text-white">{formatPKR(totals.net)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                    >
                      <Save size={14} />
                      <span>Save Draft Changes</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSave('posted')}
                      disabled={saving}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                      <ShieldCheck size={15} />
                      <span>Save & Post Invoice</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!invoice && !loading && !error && (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center">
              <Search size={48} className="opacity-20 mb-3 text-slate-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Enter Invoice Number Above</p>
              <p className="text-[11px] text-slate-400 mt-1">Load an existing draft invoice to modify line quantities or post it.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};


// ==========================================
// 3. DISPLAY INVOICE MODAL (VF03)
// ==========================================

interface DisplayInvoiceModalProps {
  onClose: () => void;
  formatPKR: (amt: number) => string;
  initialInvoiceId?: string | number | null;
  onOpenCreateInvoice?: () => void;
  onOpenEditInvoice?: (invoiceId?: number | string) => void;
  onInvoicePosted?: () => void;
}

export const DisplayInvoiceModal = ({ 
  onClose, 
  formatPKR, 
  initialInvoiceId,
  onOpenCreateInvoice,
  onOpenEditInvoice,
  onInvoicePosted
}: DisplayInvoiceModalProps) => {
  const [invoiceIdInput, setInvoiceIdInput] = useState(
    initialInvoiceId ? String(initialInvoiceId) : ''
  );
  const [invoice, setInvoice] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
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
    setPostSuccess(null);
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

  const handlePostNow = async () => {
    if (!invoice) return;
    setPostingLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setPostSuccess(`Invoice #${invoice.id} successfully POSTED and finalized!`);
        fetchInvoice(invoice.id);
        if (onInvoicePosted) onInvoicePosted();
      } else {
        setError(data.error || "Failed to post invoice");
      }
    } catch (err: any) {
      setError(err.message || "Failed to post invoice");
    } finally {
      setPostingLoading(false);
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

  const isPosted = invoice && (invoice.status === 'posted' || invoice.status === 'paid');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Display Invoice (VF03)</h3>
                {invoice && (
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    isPosted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  )}>
                    {isPosted ? 'Posted (Official)' : 'Draft / Unposted'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Document Multi-View & Status</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenEditInvoice && invoice && !isPosted && (
              <button 
                type="button"
                onClick={() => onOpenEditInvoice(invoice.id)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-amber-200"
                title="Edit this invoice (VF02)"
              >
                <Edit3 size={15} />
                <span>Edit Invoice (VF02)</span>
              </button>
            )}
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
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              {loading ? <RotateCcw className="animate-spin" size={16} /> : <Search size={16} />}
              Display
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {postSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-bold">{postSuccess}</p>
              </div>
              <button onClick={() => setPostSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
                <X size={16} />
              </button>
            </div>
          )}

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
              {/* Draft Status Notification */}
              {!isPosted && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <div>
                      <h4 className="text-xs font-black text-amber-900 uppercase">Draft (Unposted) Invoice</h4>
                      <p className="text-xs text-amber-700">
                        This invoice is unposted. It will only show in the official Sales Tax Invoice report (STI01) once posted.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handlePostNow}
                    disabled={postingLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0"
                  >
                    {postingLoading ? <RotateCcw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                    <span>Post Invoice Now</span>
                  </button>
                </div>
              )}

              {/* Receipt Print Header (Only visible on print) */}
              <div className="hidden print:block text-center border-b-2 border-dashed border-slate-900 pb-4 mb-6">
                <h2 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
                  {invoice.distributor_name || 'KARACHI CENTRAL LOGISTICS & DISTRIBUTION'}
                </h2>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-700">
                  {invoice.distributor_address || 'Plot 45, Sector 15, Korangi Industrial Area, Karachi'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Phone: {invoice.distributor_phone || '021-34567890'} {invoice.distributor_ntn ? `• NTN: ${invoice.distributor_ntn}` : ''} {invoice.distributor_strn ? `• STRN: ${invoice.distributor_strn}` : ''}
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-600 mt-4 px-2">
                  <span>PRINTED: {new Date().toLocaleString()}</span>
                  <span className="font-bold">OFFICIAL INVOICE ({isPosted ? 'POSTED' : 'DRAFT'})</span>
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
                      isPosted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {invoice.status || 'Draft'}
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-700 font-black text-xs rounded-lg border border-indigo-200 shadow-sm font-mono"
                          >
                            <Truck size={11} className="text-indigo-500" />
                            {dNum}
                          </span>
                        ))
                      ) : invoice.deliveries && invoice.deliveries.length > 0 ? (
                        invoice.deliveries.map((d: any, idx: number) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-700 font-black text-xs rounded-lg border border-indigo-200 shadow-sm font-mono"
                          >
                            <Truck size={11} className="text-indigo-500" />
                            #DEL-{d.id.toString().padStart(4, '0')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No linked deliveries</span>
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
                  {!isPosted && onOpenEditInvoice && (
                    <button 
                      onClick={() => onOpenEditInvoice(invoice.id)}
                      className="px-5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border border-amber-200 transition-all"
                    >
                      <Edit3 size={15} />
                      Edit Invoice (VF02)
                    </button>
                  )}
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
