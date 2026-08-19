import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Search, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Invoice, SalesReturn } from '../../types';
import { cn, formatPKR } from '../../lib/utils';

interface SalesReturnModalProps {
  onClose: () => void;
  shops: Shop[];
  salesReturnRecord?: SalesReturn | null;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({ onClose, shops, salesReturnRecord }) => {
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  
  const [shopInvoices, setShopInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const shopSearchRef = useRef<HTMLInputElement>(null);
  const invoiceSearchRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        shopSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returnItems, selectedShopId, selectedInvoiceId]);

  // Load existing sales return context if editing
  useEffect(() => {
    if (salesReturnRecord) {
      setSelectedShopId(salesReturnRecord.shop_id);
      setShopSearch(salesReturnRecord.shop_name || '');
      setSelectedInvoiceId(salesReturnRecord.invoice_id);
      
      const fetchReturnContext = async () => {
        try {
          const res = await fetch(`/api/sales-returns/${salesReturnRecord.id}/items`);
          if (res.ok) {
            const items = await res.json();
            if (Array.isArray(items)) {
              setReturnItems(items);
            } else {
              setReturnItems([]);
              setErrorStatus("Invalid return items data received.");
            }
          } else {
            const err = await res.json().catch(() => ({}));
            setErrorStatus(err.error || "Failed to load sales return items.");
            setReturnItems([]);
          }
        } catch (err) {
          console.error("Failed to load sales return items", err);
          setErrorStatus("Failed to load sales return items.");
          setReturnItems([]);
        }
      };
      fetchReturnContext();
    }
  }, [salesReturnRecord]);

  // Fetch shop invoices when shop changes
  useEffect(() => {
    if (selectedShopId) {
      fetch(`/api/shops/${selectedShopId}/invoices`)
        .then(res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setShopInvoices(data);
          } else {
            setShopInvoices([]);
          }
          if (!salesReturnRecord) {
            setSelectedInvoiceId(null);
            setReturnItems([]);
          }
        })
        .catch(err => {
          console.error("Failed to load shop invoices", err);
          setShopInvoices([]);
        });
    } else if (!salesReturnRecord) {
      setShopInvoices([]);
      setSelectedInvoiceId(null);
      setReturnItems([]);
    }
  }, [selectedShopId, salesReturnRecord]);

  // Keep invoiceSearch in sync with selectedInvoiceId
  useEffect(() => {
    if (selectedInvoiceId) {
      const inv = shopInvoices.find(i => i.id === selectedInvoiceId);
      if (inv) {
        setInvoiceSearch(`INV # ${inv.id.toString().padStart(4, '0')} (Amt: ${formatPKR(inv.net_amount)})`);
      } else if (salesReturnRecord && salesReturnRecord.invoice_id === selectedInvoiceId) {
        setInvoiceSearch(`INV # ${selectedInvoiceId.toString().padStart(4, '0')}`);
      }
    } else {
      setInvoiceSearch('');
    }
  }, [selectedInvoiceId, shopInvoices, salesReturnRecord]);

  // Fetch invoice items when invoice selection changes
  useEffect(() => {
    if (selectedInvoiceId && !salesReturnRecord) {
      fetch(`/api/sales-returns/invoice/${selectedInvoiceId}/items`)
        .then(res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setReturnItems(data);
          } else {
            setReturnItems([]);
            setErrorStatus("Invalid invoice items received.");
          }
        })
        .catch(err => {
          console.error("Failed to load invoice items", err);
          setErrorStatus("Failed to load invoice items.");
          setReturnItems([]);
        });
    } else if (!selectedInvoiceId && !salesReturnRecord) {
      setReturnItems([]);
    }
  }, [selectedInvoiceId, salesReturnRecord]);

  const handleShopSelect = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShopSearch(shop.shop_name);
    setShowShopDropdown(false);
    setSelectedInvoiceId(null);
    setReturnItems([]);
  };

  const handleShopBlur = () => {
    setTimeout(() => {
      setShowShopDropdown(false);
      if (selectedShopId) {
        const shop = shops.find(s => s.id === selectedShopId);
        if (shop) {
          setShopSearch(shop.shop_name);
        }
      } else {
        setShopSearch('');
      }
    }, 200);
  };

  const handleInvoiceFocus = () => {
    setShowInvoiceDropdown(true);
    setInvoiceSearch('');
  };

  const handleInvoiceBlur = () => {
    setTimeout(() => {
      setShowInvoiceDropdown(false);
      if (selectedInvoiceId) {
        const inv = shopInvoices.find(i => i.id === selectedInvoiceId);
        if (inv) {
          setInvoiceSearch(`INV # ${inv.id.toString().padStart(4, '0')} (Amt: ${formatPKR(inv.net_amount)})`);
        } else {
          setInvoiceSearch(`INV # ${selectedInvoiceId.toString().padStart(4, '0')}`);
        }
      } else {
        setInvoiceSearch('');
      }
    }, 200);
  };

  const handleReturnQtyChange = (idx: number, val: string) => {
    const qty = parseInt(val) || 0;
    const item = returnItems[idx];
    
    // Max returnable is net_qty available
    const maxReturnable = item.net_qty;

    if (qty > maxReturnable) {
      setErrorStatus(`Return quantity for ${item.product_name} cannot exceed remaining invoice quantity (${maxReturnable}).`);
      return;
    }
    
    setErrorStatus(null);
    const newItems = [...returnItems];
    newItems[idx].current_return_qty = qty;
    setReturnItems(newItems);
  };

  const handleReasonChange = (idx: number, val: string) => {
    if (val.length > 30) return;
    const newItems = [...returnItems];
    newItems[idx].reason = val;
    setReturnItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedShopId) {
      setErrorStatus("Please select a Retailer first.");
      return;
    }
    if (!selectedInvoiceId) {
      setErrorStatus("Please select a referenced Invoice.");
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.current_return_qty > 0);
    if (itemsToReturn.length === 0) {
      setErrorStatus("Please enter return quantity for at least one item.");
      return;
    }

    // Double check validations
    for (const item of itemsToReturn) {
      if (item.current_return_qty > item.net_qty) {
        setErrorStatus(`Invalid return quantity for ${item.product_name}.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      const url = salesReturnRecord ? `/api/sales-returns/${salesReturnRecord.id}` : '/api/sales-returns';
      const method = salesReturnRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: selectedShopId,
          invoice_id: selectedInvoiceId,
          items: itemsToReturn.map(item => ({
            invoice_item_id: item.invoice_item_id,
            product_id: item.product_id,
            quantity: item.current_return_qty,
            unit_price: item.price,
            reason: item.reason
          }))
        })
      });

      if (res.ok) {
        // Success: Stay on screen or close based on parent trigger.
        // We will call onClose to let user know they are done
        onClose();
      } else {
        const data = await res.json();
        setErrorStatus(data.error || "Failed to process sales return.");
      }
    } catch (err) {
      setErrorStatus("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeInvoice = shopInvoices.find(inv => inv.id === selectedInvoiceId);

  const filteredShopInvoices = shopInvoices.filter(inv => {
    if (!inv) return false;
    const customId = `INV # ${(inv.id || 0).toString().padStart(4, '0')}`;
    const query = (invoiceSearch || '').toLowerCase();
    const dateStr = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString().toLowerCase() : '';
    const amountStr = inv.net_amount !== undefined && inv.net_amount !== null ? inv.net_amount.toString() : '0';
    const amountFormatted = inv.net_amount !== undefined && inv.net_amount !== null ? formatPKR(inv.net_amount).toLowerCase() : '';

    return (
      customId.toLowerCase().includes(query) ||
      (inv.id || '').toString().includes(query) ||
      dateStr.includes(query) ||
      amountStr.includes(query) ||
      amountFormatted.includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        id="sales-return-modal-container"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900" id="sales-return-modal-title">
              {salesReturnRecord ? `Edit Sales Return #SRT-${salesReturnRecord.id.toString().padStart(4, '0')}` : 'Sales Return Processing (SRT01)'}
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Inventory Increase</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Ledger Credit</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)" id="sales-return-close-button">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorStatus && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 animate-pulse" id="sales-return-error-status">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{errorStatus}</p>
            </div>
          )}

          {/* Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase flex justify-between">
                <span>Select Retailer</span>
                <span className="text-emerald-500 font-mono">ALT+S</span>
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  ref={shopSearchRef}
                  placeholder="Select shop..."
                  value={shopSearch}
                  disabled={!!salesReturnRecord}
                  onFocus={() => setShowShopDropdown(true)}
                  onBlur={handleShopBlur}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShowShopDropdown(true);
                  }}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                  id="sales-return-shop-search"
                />
                <AnimatePresence>
                  {showShopDropdown && !salesReturnRecord && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto py-2">
                        {shops.filter(s => s.shop_name.toLowerCase().includes(shopSearch.toLowerCase())).map(shop => (
                          <button
                            key={shop.id}
                            onMouseDown={() => handleShopSelect(shop)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block group-hover:text-emerald-600 transition-colors">{shop.shop_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{shop.location}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-200 group-hover:text-emerald-400" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Reference Invoice</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  ref={invoiceSearchRef}
                  placeholder={selectedShopId ? "Search invoice by ID, date, or amount..." : "Select retailer first..."}
                  value={invoiceSearch}
                  disabled={!selectedShopId || !!salesReturnRecord}
                  onFocus={handleInvoiceFocus}
                  onBlur={handleInvoiceBlur}
                  onChange={(e) => {
                    setInvoiceSearch(e.target.value);
                    setShowInvoiceDropdown(true);
                  }}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-emerald-600 font-bold"
                  id="sales-return-invoice-search"
                />
                
                <AnimatePresence>
                  {showInvoiceDropdown && !salesReturnRecord && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden p-2"
                    >
                       <div className="max-h-60 overflow-y-auto space-y-1">
                        {filteredShopInvoices.map(inv => (
                          <button
                            key={inv.id}
                            onMouseDown={() => {
                              setSelectedInvoiceId(inv.id);
                              setShowInvoiceDropdown(false);
                            }}
                            className={cn(
                              "w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between",
                              selectedInvoiceId === inv.id ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <div>
                              <p className="text-xs font-bold font-mono italic">INV # {inv.id.toString().padStart(4, '0')}</p>
                              <p className="text-[10px] opacity-60 font-medium">{new Date(inv.invoice_date).toLocaleDateString()} • Net: {formatPKR(inv.net_amount)}</p>
                            </div>
                            {selectedInvoiceId === inv.id && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                          </button>
                        ))}
                        {filteredShopInvoices.length === 0 && (
                          <p className="p-4 text-center text-xs text-slate-400">
                            {shopInvoices.length === 0 ? "No active invoices found for this shop." : "No invoices match your search."}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse" id="sales-return-items-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product Details</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Billed Quantity</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Returned Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-emerald-600 uppercase text-center">Return Quantity</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Reason (Max 30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnItems.map((item, idx) => (
                  <tr key={`${item.invoice_id}-${item.product_id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider italic">{item.product_id} • Brand: {item.brand || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-slate-900">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-slate-400">{item.already_returned_qty}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <input 
                          type="number"
                          min="0"
                          max={item.net_qty}
                          value={item.current_return_qty === 0 ? '' : item.current_return_qty}
                          placeholder="0"
                          onChange={(e) => handleReturnQtyChange(idx, e.target.value)}
                          className={cn(
                            "w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-black outline-none transition-all focus:ring-2 focus:ring-emerald-100",
                            item.current_return_qty > 0 ? "border-emerald-400 bg-white text-emerald-600" : "focus:border-emerald-500 focus:bg-white"
                          )}
                          id={`sales-return-qty-input-${idx}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <input 
                          type="text"
                          value={item.reason || ''}
                          maxLength={30}
                          onChange={(e) => handleReasonChange(idx, e.target.value)}
                          placeholder="Reason for return..."
                          className="w-full px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none transition-all focus:border-emerald-500 focus:bg-white"
                          id={`sales-return-reason-input-${idx}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-bold uppercase">
                          {item.reason?.length || 0}/30
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {returnItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                      <RotateCcw size={48} className="mx-auto mb-4 opacity-10 animate-spin-slow" />
                      <p className="text-sm font-medium">Select Shop & Referenced Invoice to list returnable products</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Return Style Summary Bar */}
          <div className="bg-emerald-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-emerald-100" id="sales-return-summary-bar">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Return Items Count</p>
              <p className="text-2xl font-black">{returnItems.filter(i => i.current_return_qty > 0).length} Line Items</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-4 text-white font-bold opacity-70 hover:opacity-100 transition-opacity uppercase text-xs tracking-widest"
                id="sales-return-summary-discard"
              >
                Discard
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || returnItems.filter(i => i.current_return_qty > 0).length === 0}
                className="bg-white text-emerald-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
                id="sales-return-summary-submit"
              >
                {isSubmitting ? 'Updating Stock...' : (
                  <>
                    <Save size={18} />
                    <span>Post Return (F2)</span>
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
