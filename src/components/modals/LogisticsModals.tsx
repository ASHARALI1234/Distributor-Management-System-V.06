import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { X, Save, Truck, Plus, CheckCircle2, ShoppingCart, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Salesman, Order, OrderItem, Delivery, DeliveryItem } from '../../types';
import { cn } from '../../lib/utils';

export const DeliveryModal = ({ 
  onClose, 
  onSuccess,
  salesmen,
  orders,
  delivery,
  formatPKR
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  salesmen: Salesman[],
  orders: Order[],
  delivery?: Delivery,
  formatPKR: (val: number) => string
}) => {
  // UI State Object (as requested)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryItems, setDeliveryItems] = useState<any[]>([]);
  const [orderQuery, setOrderQuery] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // 1. Header State: Searchable Retailers with pending orders
  const availableShops = useMemo(() => {
    const shopMap = new Map<number, {id: number, name: string}>();
    orders.forEach(o => {
      if (o.status === 'pending' || (delivery && o.shop_id === delivery.shop_id)) {
        shopMap.set(o.shop_id, { id: o.shop_id, name: o.shop_name });
      }
    });
    return Array.from(shopMap.values()).filter(s => 
      s.name.toLowerCase().includes(shopSearch.toLowerCase())
    );
  }, [orders, shopSearch, delivery]);

  // 2. Order List State: Orders for selected shop only
  const shopOrders = useMemo(() => {
    return orders.filter(o => 
      o.shop_id === selectedShopId && (o.status === 'pending' || selectedOrderIds.includes(o.id))
    );
  }, [selectedShopId, orders, selectedOrderIds]);

  // Initialization for Edit Mode
  useEffect(() => {
    if (delivery) {
      setSelectedShopId(delivery.shop_id || null);
      setShopSearch(delivery.shop_name || '');
      setSelectedSalesmanId(delivery.salesman_id || null);
      setDeliveryDate(new Date(delivery.delivery_date).toISOString().split('T')[0]);
      
      // Fetch items for this delivery to identify orders and initial quantities
      const fetchDeliveryContext = async () => {
        try {
          const res = await fetch(`/api/deliveries/${delivery.id}/items`);
          const items = await res.json();
          
          // Identify unique orders from delivery items
          const oids = Array.from(new Set(items.map((i: any) => i.order_ref))) as number[];
          setSelectedOrderIds(oids);
          
          // Initial delivery items state
          setDeliveryItems(items.map((i: any) => ({
            order_item_id: i.order_item_id,
            product_id: i.product_id,
            product_name: i.product_name,
            brand: i.brand,
            quantity: i.quantity,
            price: i.price,
            max_quantity: i.quantity + (i.remaining_on_order || 9999), 
            order_ref: i.order_ref,
            return_qty: i.return_qty || 0,
            net_qty: i.net_qty ?? i.quantity,
            sales_tax_pct: i.sales_tax_pct || 0,
            sales_tax_amount: i.sales_tax_amount || 0,
            additional_tax_pct: i.additional_tax_pct || 0,
            additional_tax_amount: i.additional_tax_amount || 0,
            discount_pct: i.discount_pct || 0,
            discount_amount: i.discount_amount || 0,
            extra_discount_pct: i.extra_discount_pct || 0,
            extra_discount_amount: i.extra_discount_amount || 0
          })));
        } catch (err) {
          console.error("Failed to load delivery context", err);
        }
      };
      fetchDeliveryContext();
    }
  }, [delivery]);

  // Zero-Conflict Policy: Clear logic when Shop changes
  const handleShopSelect = (shopId: number) => {
    setSelectedShopId(shopId);
    setSelectedOrderIds([]);
    setDeliveryItems([]);
    setShowShopDropdown(false);
    setShopSearch(availableShops.find(s => s.id === shopId)?.name || '');
  };

  useEffect(() => {
    if (selectedOrderIds.length > 0) {
      const fetchFlatItems = async () => {
        try {
          const allBatchItems: any[] = [];
          for (const oid of selectedOrderIds) {
            const url = `/api/orders/${oid}/pending-items${delivery ? `?excludeDeliveryId=${delivery.id}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            allBatchItems.push(...data);
          }
          
          setDeliveryItems(prev => {
            return allBatchItems.map(item => {
                const existing = prev.find(p => p.order_item_id === item.id);
                const max = item.quantity - (item.delivered_quantity || 0);
                return {
                  order_item_id: item.id,
                  product_id: item.product_id,
                  product_name: item.product_name,
                  brand: item.brand,
                  quantity: existing?.quantity || 0,
                  price: item.price,
                  max_quantity: max,
                  order_ref: item.order_id,
                  return_qty: existing?.return_qty || 0,
                  net_qty: existing?.net_qty ?? (existing?.quantity || 0),
                  sales_tax_pct: item.sales_tax_pct || 0,
                  additional_tax_pct: item.additional_tax_pct || 0,
                discount_pct: item.discount_pct || 0,
                extra_discount_pct: item.extra_discount_pct || 0
              };
            });
          });
        } catch (err) {
          console.error("Grid sync failed", err);
        }
      };
      fetchFlatItems();
    } else {
      setDeliveryItems([]);
    }
  }, [selectedOrderIds, delivery]);

  const toggleOrder = (oid: number) => {
    setSelectedOrderIds(prev => 
      prev.includes(oid) ? prev.filter(id => id !== oid) : [...prev, oid]
    );
  };

  const addOrderByNumber = (oidStr: string) => {
    const oid = parseInt(oidStr);
    if (isNaN(oid)) return;
    
    const targetOrder = orders.find(o => o.id === oid);
    if (!targetOrder) {
      setErrorStatus(`Order #ORD-${oid.toString().padStart(4, '0')} not found.`);
      return;
    }

    if (selectedShopId && targetOrder.shop_id !== selectedShopId) {
      setErrorStatus("Validation Error: This delivery already contains items for a different shop. Cannot merge items from multiple shops into one delivery.");
      return;
    }

    if (!selectedShopId) {
      handleShopSelect(targetOrder.shop_id);
    }

    if (!selectedOrderIds.includes(oid)) {
      setSelectedOrderIds(prev => [...prev, oid]);
      setErrorStatus(null);
      setOrderQuery('');
    } else {
      setErrorStatus("Order already added to this delivery.");
    }
  };

  const updateQty = (orderItemId: number, val: number) => {
    setDeliveryItems(prev => prev.map(item => {
      if (item.order_item_id === orderItemId) {
        return { ...item, quantity: Math.max(0, Math.min(val, item.max_quantity)) };
      }
      return item;
    }));
  };

  const calculateLineDetails = (item: any) => {
    const qty = item.quantity || 0;
    const price = item.price || 0;
    const gross = qty * price;
    
    // Tax/Discount calculations
    const sales_tax_amount = (gross * (item.sales_tax_pct || 0)) / 100;
    const additional_tax_amount = (gross * (item.additional_tax_pct || 0)) / 100;
    const discount_amount = (gross * (item.discount_pct || 0)) / 100;
    const extra_discount_amount = (gross * (item.extra_discount_pct || 0)) / 100;
    
    return {
      ...item,
      sales_tax_amount,
      additional_tax_amount,
      discount_amount,
      extra_discount_amount
    };
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const activeItems = deliveryItems.filter(i => i.quantity > 0).map(calculateLineDetails);
    if (!selectedSalesmanId || activeItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const url = delivery ? `/api/deliveries/${delivery.id}` : '/api/deliveries';
      const method = delivery ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_ids: selectedOrderIds,
          order_id: selectedOrderIds[0], // backward compatibility
          salesman_id: selectedSalesmanId,
          delivery_date: deliveryDate,
          items: activeItems
        })
      });
      if (res.ok) {
        onSuccess();
        // Removed onClose() to stay on screen
      } else {
        const err = await res.json();
        alert(err.error || `Delivery ${delivery ? 'Update' : 'Creation'} Failed`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Assist
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); handleSubmit(); }
      if (e.key === 'F3') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedOrderIds, selectedSalesmanId, deliveryItems, deliveryDate]);

  const totalValue = deliveryItems.reduce((s, i) => {
    const details = calculateLineDetails(i);
    return s + (i.quantity * i.price) + details.sales_tax_amount + details.additional_tax_amount - details.discount_amount - details.extra_discount_amount;
  }, 0);

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
              {delivery ? 'Edit Delivery Dispatch' : 'New Delivery Consolidation'}
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Logistics Hub</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
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

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Retailer</label>
              <div className="relative">
                <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search shop..."
                  value={shopSearch}
                  onFocus={() => setShowShopDropdown(true)}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShowShopDropdown(true);
                  }}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
                
                <AnimatePresence>
                  {showShopDropdown && availableShops.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto py-2">
                        {availableShops.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => handleShopSelect(s.id)}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors group"
                          >
                            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Dispatch Date</label>
              <input 
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Quick Add Order</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Order #"
                  value={orderQuery}
                  onChange={e => setOrderQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addOrderByNumber(orderQuery)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-indigo-600 transition-all"
                />
                <button 
                  onClick={() => addOrderByNumber(orderQuery)}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Salesman & Consolidation Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Assign Deliverer</label>
              <select
                value={selectedSalesmanId || ''}
                onChange={e => setSelectedSalesmanId(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition-all appearance-none"
              >
                <option value="">Select Salesman</option>
                {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Active Consolidation (Orders for {shopSearch || 'Retailer'})</label>
              <div className="flex flex-wrap gap-2">
                {shopOrders.map(o => (
                  <button
                    key={o.id}
                    onClick={() => toggleOrder(o.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all border",
                      selectedOrderIds.includes(o.id) 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                        : "bg-white border-slate-200 text-slate-500 hover:border-indigo-400"
                    )}
                  >
                    #ORD-{o.id.toString().padStart(4, '0')}
                  </button>
                ))}
                {shopOrders.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">Select a retailer to view pending orders</p>
                )}
              </div>
            </div>
          </div>

          {/* Unified Grid Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Origin Order</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product Description</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase">Return Qty</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase">Net Qty</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase">Allocatable</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase w-40">Load Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {deliveryItems.map(item => (
                  <tr key={item.order_item_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold font-mono border border-slate-200/50 italic">
                        #ORD-{item.order_ref.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.brand}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-rose-500">{item.return_qty || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-indigo-600">{item.quantity - (item.return_qty || 0)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-600">{item.max_quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input 
                        type="number"
                        min="0"
                        max={item.max_quantity}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.order_item_id, Number(e.target.value))}
                        className={cn(
                          "w-24 px-3 py-1.5 bg-slate-50 border rounded-xl text-sm text-right outline-none transition-all font-mono font-bold",
                          item.quantity > 0 ? "border-indigo-400 text-indigo-700 bg-white" : "border-slate-200 focus:border-indigo-600"
                        )}
                      />
                    </td>
                  </tr>
                ))}
                {deliveryItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                      <Truck size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-medium">Select orders to begin consolidation</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* New ORDER Style Summary Bar */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Items Count</p>
                <p className="text-2xl font-black">{deliveryItems.filter(i => i.quantity > 0).length} Segments</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Consolidated Value</p>
                <p className="text-2xl font-black">{formatPKR(totalValue)}</p>
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
                disabled={isSubmitting || deliveryItems.filter(i => i.quantity > 0).length === 0 || !selectedSalesmanId}
                onClick={() => handleSubmit()}
                className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : (
                  <>
                    <Save size={18} />
                    <span>Post Dispatch (F2)</span>
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


// Removed local cn as it's imported
