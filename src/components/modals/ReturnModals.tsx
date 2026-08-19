import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Search, ChevronRight, AlertCircle, ShoppingCart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Delivery, DeliveryItem, Return } from '../../types';
import { cn, formatPKR } from '../../lib/utils';

interface ReturnModalProps {
  onClose: () => void;
  shops: Shop[];
  returnRecord?: Return | null;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ onClose, shops, returnRecord }) => {
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  
  const [completedDeliveries, setCompletedDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([]);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const shopSearchRef = React.useRef<HTMLInputElement>(null);

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
  }, [returnItems, selectedShopId]); // Added dependencies to ensure handleSubmit has latest state
  useEffect(() => {
    if (returnRecord) {
      setSelectedShopId(returnRecord.shop_id);
      setShopSearch(returnRecord.shop_name || '');
      
      const fetchReturnContext = async () => {
        try {
          const res = await fetch(`/api/returns/${returnRecord.id}/items`);
          const items = await res.json();
          
          // Identify unique deliveries from items
          const dids = Array.from(new Set(items.map((i: any) => i.delivery_id))) as number[];
          setSelectedDeliveryIds(dids);
          setReturnItems(items);
        } catch (err) {
          console.error("Failed to load return context", err);
        }
      };
      fetchReturnContext();
    }
  }, [returnRecord]);

  // Fetch completed deliveries when shop changes
  useEffect(() => {
    if (selectedShopId) {
      fetch(`/api/shops/${selectedShopId}/completed-deliveries`)
        .then(res => res.json())
        .then(data => setCompletedDeliveries(data))
        .catch(err => console.error(err));
    } else if (!returnRecord) {
      setCompletedDeliveries([]);
      setSelectedDeliveryIds([]);
      setReturnItems([]);
    }
  }, [selectedShopId, returnRecord]);

  // Fetch items when selected deliveries change
  useEffect(() => {
    if (selectedDeliveryIds.length > 0 && !returnRecord) {
      const fetchAllItems = async () => {
        try {
          const allItems: any[] = [];
          for (const deliveryId of selectedDeliveryIds) {
            const res = await fetch(`/api/deliveries/${deliveryId}/items`);
            if (res.ok) {
              const items: DeliveryItem[] = await res.json();
              items.forEach(item => {
                allItems.push({
                   ...item,
                   delivery_id: deliveryId,
                   delivery_item_id: item.id, // The ID of the row in delivery_items
                   current_return_qty: 0, // This is what the user is entering now
                   uom: item.product_name?.includes('Box') ? 'BOX' : 'EACH' 
                });
              });
            }
          }
          setReturnItems(allItems);
        } catch (err) {
          console.error("Error fetching delivery items:", err);
        }
      };
      fetchAllItems();
    } else if (selectedDeliveryIds.length === 0 && !returnRecord) {
      setReturnItems([]);
    }
  }, [selectedDeliveryIds, returnRecord]);

  const handleShopSelect = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShopSearch(shop.shop_name);
    setShowShopDropdown(false);
    setSelectedDeliveryIds([]);
  };

  const toggleDeliverySelection = (id: number) => {
    setSelectedDeliveryIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleReturnQtyChange = (idx: number, val: string) => {
    const qty = parseInt(val) || 0;
    const item = returnItems[idx];
    
    // Use net_qty from backend which is Delivery_Qty - already_returned_qty
    const maxReturnable = item.net_qty ?? item.quantity;

    if (qty > maxReturnable) {
      setErrorStatus(`Return quantity for ${item.product_name} cannot exceed net quantity (${maxReturnable}).`);
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
    const itemsToReturn = returnItems.filter(item => item.current_return_qty > 0);
    if (itemsToReturn.length === 0) {
      setErrorStatus("Please enter return quantity for at least one item.");
      return;
    }

    // Double check validations
    for (const item of itemsToReturn) {
      const maxReturnable = item.net_qty ?? item.quantity;
      if (item.current_return_qty > maxReturnable) {
        setErrorStatus(`Invalid return quantity for ${item.product_name}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = returnRecord ? `/api/returns/${returnRecord.id}` : '/api/returns';
      const method = returnRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: selectedShopId,
          items: itemsToReturn.map(item => ({
            delivery_id: item.delivery_id,
            delivery_item_id: item.delivery_item_id,
            product_id: item.product_id,
            quantity: item.current_return_qty,
            unit_price: item.price,
            reason: item.reason
          }))
        })
      });

      if (res.ok) {
        // Removed onClose() to stay on screen as per user request
      } else {
        const data = await res.json();
        setErrorStatus(data.error || "Failed to process return.");
      }
    } catch (err) {
      setErrorStatus("Network error occurred.");
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
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">
              {returnRecord ? `Edit Return #RET-${returnRecord.id.toString().padStart(4, '0')}` : 'Delivery Return Processing (RT01)'}
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">Inventory Adjust</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorStatus && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{errorStatus}</p>
            </div>
          )}

          {/* Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase flex justify-between">
                <span>Select Retailer</span>
                <span className="text-indigo-400 font-mono">ALT+S</span>
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  ref={shopSearchRef}
                  placeholder="Select shop..."
                  value={shopSearch}
                  onFocus={() => setShowShopDropdown(true)}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShowShopDropdown(true);
                  }}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
                <AnimatePresence>
                  {showShopDropdown && (
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
                            onClick={() => handleShopSelect(shop)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{shop.shop_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{shop.location}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Related Deliveries</label>
              <div className="relative">
                <button 
                  onClick={() => setShowDeliveryDropdown(!showDeliveryDropdown)}
                  disabled={!selectedShopId}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-left flex justify-between items-center disabled:opacity-50"
                >
                  <span className={cn(selectedDeliveryIds.length > 0 ? "text-indigo-600 font-bold" : "text-slate-400")}>
                    {selectedDeliveryIds.length > 0 
                      ? `${selectedDeliveryIds.length} Deliveries Selected` 
                      : "Select deliveries to return from..."}
                  </span>
                  <ChevronRight size={16} className={cn("transition-transform", showDeliveryDropdown && "rotate-90")} />
                </button>
                
                <AnimatePresence>
                  {showDeliveryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden p-2"
                    >
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {completedDeliveries.map(d => (
                          <button
                            key={d.id}
                            onClick={() => toggleDeliverySelection(d.id)}
                            className={cn(
                              "w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between",
                              selectedDeliveryIds.includes(d.id) ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <div>
                              <p className="text-xs font-bold font-mono italic">#DEL-{d.id.toString().padStart(4, '0')}</p>
                              <p className="text-[10px] opacity-60 font-medium">{new Date(d.delivery_date).toLocaleDateString()} • {formatPKR(d.total_amount)}</p>
                            </div>
                            {selectedDeliveryIds.includes(d.id) && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product Details</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Load Quantity</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-rose-500 uppercase text-center">Return Quantity</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Reason (Max 30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnItems.map((item, idx) => (
                  <tr key={`${item.delivery_id}-${item.product_id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider italic">{item.product_id} • #DEL-{item.delivery_id}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-slate-900">{item.quantity}</span>
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
                            "w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-black outline-none transition-all focus:ring-2 focus:ring-rose-100",
                            item.current_return_qty > 0 ? "border-rose-400 bg-white text-rose-600" : "focus:border-indigo-400 focus:bg-white"
                          )}
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
                          className="w-full px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none transition-all focus:border-indigo-400 focus:bg-white"
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
                      <RotateCcw size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-medium">Select Shop & Deliveries to list returnable products</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* New ORDER Style Summary Bar */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Return Items Count</p>
              <p className="text-2xl font-black">{returnItems.filter(i => i.current_return_qty > 0).length} Line Items</p>
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
                disabled={isSubmitting || returnItems.filter(i => i.current_return_qty > 0).length === 0}
                className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
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
