import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Search, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier, Purchase, PurchaseReturn } from '../../types';
import { cn, formatPKR } from '../../lib/utils';

interface PurchaseReturnModalProps {
  onClose: () => void;
  suppliers: Supplier[];
  purchaseReturnRecord?: PurchaseReturn | null;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({ onClose, suppliers, purchaseReturnRecord }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const purchaseSearchRef = useRef<HTMLInputElement>(null);

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
        supplierSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returnItems, selectedSupplierId, selectedPurchaseId]);

  // Load existing purchase return context if editing
  useEffect(() => {
    if (purchaseReturnRecord) {
      setSelectedSupplierId(purchaseReturnRecord.supplier_id);
      setSupplierSearch(purchaseReturnRecord.supplier_name || '');
      setSelectedPurchaseId(purchaseReturnRecord.purchase_id);
      
      const fetchReturnContext = async () => {
        try {
          const res = await fetch(`/api/purchase-returns/${purchaseReturnRecord.id}/items`);
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
            setErrorStatus(err.error || "Failed to load purchase return items.");
            setReturnItems([]);
          }
        } catch (err) {
          console.error("Failed to load purchase return items", err);
          setErrorStatus("Failed to load purchase return items.");
          setReturnItems([]);
        }
      };
      fetchReturnContext();
    }
  }, [purchaseReturnRecord]);

  // Fetch supplier purchases when supplier changes
  useEffect(() => {
    if (selectedSupplierId) {
      fetch(`/api/suppliers/${selectedSupplierId}/purchases`)
        .then(res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setSupplierPurchases(data);
          } else {
            setSupplierPurchases([]);
          }
          if (!purchaseReturnRecord) {
            setSelectedPurchaseId(null);
            setReturnItems([]);
          }
        })
        .catch(err => {
          console.error("Failed to load supplier purchases", err);
          setSupplierPurchases([]);
        });
    } else if (!purchaseReturnRecord) {
      setSupplierPurchases([]);
      setSelectedPurchaseId(null);
      setReturnItems([]);
    }
  }, [selectedSupplierId, purchaseReturnRecord]);

  // Keep purchaseSearch in sync with selectedPurchaseId
  useEffect(() => {
    if (selectedPurchaseId) {
      const pur = supplierPurchases.find(p => p.id === selectedPurchaseId);
      if (pur) {
        setPurchaseSearch(`PUR # ${pur.id.toString().padStart(4, '0')} (Amt: ${formatPKR(pur.total_amount)})`);
      } else if (purchaseReturnRecord && purchaseReturnRecord.purchase_id === selectedPurchaseId) {
        setPurchaseSearch(`PUR # ${selectedPurchaseId.toString().padStart(4, '0')}`);
      }
    } else {
      setPurchaseSearch('');
    }
  }, [selectedPurchaseId, supplierPurchases, purchaseReturnRecord]);

  // Fetch purchase items when purchase selection changes
  useEffect(() => {
    if (selectedPurchaseId && !purchaseReturnRecord) {
      fetch(`/api/purchase-returns/purchase/${selectedPurchaseId}/items`)
        .then(res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setReturnItems(data);
          } else {
            setReturnItems([]);
            setErrorStatus("Invalid purchase items received.");
          }
        })
        .catch(err => {
          console.error("Failed to load purchase items", err);
          setErrorStatus("Failed to load purchase items.");
          setReturnItems([]);
        });
    } else if (!selectedPurchaseId && !purchaseReturnRecord) {
      setReturnItems([]);
    }
  }, [selectedPurchaseId, purchaseReturnRecord]);

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
    setSelectedPurchaseId(null);
    setReturnItems([]);
  };

  const handleSupplierBlur = () => {
    setTimeout(() => {
      setShowSupplierDropdown(false);
      if (selectedSupplierId) {
        const supp = suppliers.find(s => s.id === selectedSupplierId);
        if (supp) {
          setSupplierSearch(supp.name);
        }
      } else {
        setSupplierSearch('');
      }
    }, 200);
  };

  const handlePurchaseFocus = () => {
    setShowPurchaseDropdown(true);
    setPurchaseSearch('');
  };

  const handlePurchaseBlur = () => {
    setTimeout(() => {
      setShowPurchaseDropdown(false);
      if (selectedPurchaseId) {
        const pur = supplierPurchases.find(p => p.id === selectedPurchaseId);
        if (pur) {
          setPurchaseSearch(`PUR # ${pur.id.toString().padStart(4, '0')} (Amt: ${formatPKR(pur.total_amount)})`);
        } else {
          setPurchaseSearch(`PUR # ${selectedPurchaseId.toString().padStart(4, '0')}`);
        }
      } else {
        setPurchaseSearch('');
      }
    }, 200);
  };

  const handleReturnQtyChange = (idx: number, val: string) => {
    const qty = parseInt(val) || 0;
    const item = returnItems[idx];
    
    // Max returnable is net_qty available
    const maxReturnable = item.net_qty;

    if (qty > maxReturnable) {
      setErrorStatus(`Return quantity for ${item.product_name} cannot exceed remaining purchase quantity (${maxReturnable}).`);
      return;
    }
    
    setErrorStatus(null);
    const newItems = [...returnItems];
    newItems[idx].current_return_qty = qty;
    setReturnItems(newItems);
  };

  const handleReasonChange = (idx: number, val: string) => {
    if (val.length > 50) return;
    const newItems = [...returnItems];
    newItems[idx].reason = val;
    setReturnItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      setErrorStatus("Please select a Supplier first.");
      return;
    }

    if (!selectedPurchaseId) {
      setErrorStatus("Please select a Reference Purchase Order.");
      return;
    }

    const itemsToReturn = returnItems
      .filter(item => (item.current_return_qty || 0) > 0)
      .map(item => ({
        purchase_item_id: item.purchase_item_id,
        product_id: item.product_id,
        quantity: item.current_return_qty,
        unit_price: item.unit_price,
        reason: item.reason || ''
      }));

    if (itemsToReturn.length === 0) {
      setErrorStatus("At least one item must have a return quantity greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);

    try {
      const url = purchaseReturnRecord 
        ? `/api/purchase-returns/${purchaseReturnRecord.id}` 
        : `/api/purchase-returns`;
      
      const method = purchaseReturnRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplierId,
          purchase_id: selectedPurchaseId,
          items: itemsToReturn
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to process purchase return.");
      }

      window.dispatchEvent(new Event('refreshPurchases'));
      window.dispatchEvent(new Event('refreshInventory'));
      onClose();
    } catch (err: any) {
      setErrorStatus(err.message || "An error occurred while saving the purchase return.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const filteredPurchases = supplierPurchases.filter(p => 
    p.id.toString().includes(purchaseSearch) || 
    formatPKR(p.total_amount).includes(purchaseSearch)
  );

  const grandTotal = returnItems.reduce((acc, item) => acc + ((item.current_return_qty || 0) * (item.unit_price || 0)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-5xl w-full overflow-hidden flex flex-col my-8 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 z-10">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <RotateCcw size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 tracking-wider uppercase">
                  PRT01
                </span>
                <h2 className="text-xl font-bold">
                  {purchaseReturnRecord ? `Edit Purchase Return #PRT-${purchaseReturnRecord.id.toString().padStart(4, '0')}` : 'New Purchase Return'}
                </h2>
              </div>
              <p className="text-slate-400 text-xs">Process vendor returns referencing original purchase orders and decrease inventory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorStatus}</span>
            </motion.div>
          )}

          {/* Supplier & Purchase Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            {/* Supplier Selector */}
            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Select Supplier <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input 
                  ref={supplierSearchRef}
                  type="text" 
                  disabled={!!purchaseReturnRecord}
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  onFocus={() => !purchaseReturnRecord && setShowSupplierDropdown(true)}
                  onBlur={handleSupplierBlur}
                  placeholder="Type to search supplier..."
                  className={cn(
                    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none transition-all shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                    purchaseReturnRecord && "bg-slate-100 cursor-not-allowed opacity-75"
                  )}
                />
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Supplier Dropdown */}
              <AnimatePresence>
                {showSupplierDropdown && !purchaseReturnRecord && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto"
                  >
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={() => handleSupplierSelect(s)}
                          className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.contact_person} • {s.phone}</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">No suppliers found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Purchase Selector */}
            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Select Ref Purchase Order <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input 
                  ref={purchaseSearchRef}
                  type="text" 
                  disabled={!selectedSupplierId || !!purchaseReturnRecord}
                  value={purchaseSearch}
                  onChange={(e) => {
                    setPurchaseSearch(e.target.value);
                    setShowPurchaseDropdown(true);
                  }}
                  onFocus={handlePurchaseFocus}
                  onBlur={handlePurchaseBlur}
                  placeholder={selectedSupplierId ? "Select Purchase Order..." : "Select Supplier first..."}
                  className={cn(
                    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none transition-all shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                    (!selectedSupplierId || purchaseReturnRecord) && "bg-slate-100 cursor-not-allowed opacity-75"
                  )}
                />
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Purchase Dropdown */}
              <AnimatePresence>
                {showPurchaseDropdown && selectedSupplierId && !purchaseReturnRecord && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto"
                  >
                    {filteredPurchases.length > 0 ? (
                      filteredPurchases.map(pur => (
                        <button
                          key={pur.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedPurchaseId(pur.id);
                            setShowPurchaseDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              PUR # {pur.id.toString().padStart(4, '0')}
                            </p>
                            <p className="text-xs text-slate-400">
                              Date: {new Date(pur.purchase_date).toLocaleDateString()} • Amount: {formatPKR(pur.total_amount)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            {formatPKR(pur.total_amount)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">No purchases found for this supplier</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Items Table */}
          {selectedPurchaseId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>3. Purchased Items Available for Return</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  Total {returnItems.length} Product(s)
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Purchased Qty</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Prev Returned</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Net Available</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center w-32">Return Qty</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-right">Unit Price</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-right">Amount</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {returnItems.map((item, idx) => {
                      const returnAmt = (item.current_return_qty || 0) * (item.unit_price || 0);
                      return (
                        <tr key={idx} className={cn("hover:bg-slate-50 transition-colors", (item.current_return_qty || 0) > 0 && "bg-amber-50/30")}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{item.product_name}</p>
                            <p className="text-[10px] text-slate-400">{item.brand}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-rose-500">
                            {item.already_returned_qty || 0}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-600">
                            {item.net_qty}
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              min="0"
                              max={item.net_qty}
                              value={item.current_return_qty || ''}
                              onChange={(e) => handleReturnQtyChange(idx, e.target.value)}
                              placeholder="0"
                              className={cn(
                                "w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all",
                                (item.current_return_qty || 0) > 0 && "border-amber-500 bg-amber-50 text-amber-700"
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-600">
                            {formatPKR(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-600">
                            {formatPKR(returnAmt)}
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={item.reason || ''}
                              onChange={(e) => handleReasonChange(idx, e.target.value)}
                              placeholder="Reason (e.g. Expired, Damaged)"
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Refund Credit</p>
              <p className="text-2xl font-black text-amber-600">{formatPKR(grandTotal)}</p>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block border-l border-slate-200 pl-4">
              <span className="font-semibold text-slate-600">[F2]</span> Process Return • <span className="font-semibold text-slate-600">[F3]</span> Close
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel [F3]
            </button>
            <button
              type="button"
              disabled={isSubmitting || grandTotal <= 0}
              onClick={handleSubmit}
              className="flex-1 md:flex-none px-8 py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              <span>{isSubmitting ? "Processing..." : "Process Return [F2]"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
