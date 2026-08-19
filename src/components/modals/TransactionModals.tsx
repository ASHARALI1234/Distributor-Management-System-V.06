import React, { useState, useEffect, FormEvent } from 'react';
import { X, Save, Trash2, Edit, Plus, Trash, Search, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop, Product, OrderBooker, Supplier, Purchase, Order } from '../../types';

export const PurchaseModal = ({ 
  suppliers,
  products,
  onClose, 
  onSuccess,
  purchase
}: { 
  suppliers: Supplier[],
  products: Product[],
  onClose: () => void, 
  onSuccess: () => void,
  purchase?: Purchase
}) => {
  const [formData, setFormData] = useState({
    supplier_id: purchase?.supplier_id?.toString() || '',
    purchase_date: purchase?.purchase_date ? new Date(purchase.purchase_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    total_amount: purchase?.total_amount || 0
  });
  const [items, setItems] = useState<{ product_id: string, quantity: number, price: number, product_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLOV, setShowLOV] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (purchase) {
      fetchPurchaseItems(purchase.id);
    }
  }, [purchase]);

  const fetchPurchaseItems = async (pid: number) => {
    try {
      const res = await fetch(`/api/purchases/${pid}/items`);
      const data = await res.json();
      setItems(data.map((i: any) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
        product_name: i.product_name
      })));
    } catch (err) { console.error(err); }
  };

  const filteredProducts = products.filter(p => 
    p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.product_id);
    if (existing) {
      setItems(items.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { 
        product_id: product.product_id, 
        quantity: 1, 
        price: product.purchase_price,
        product_name: product.product_name 
      }]);
    }
    setSearchQuery('');
    setShowLOV(false);
  };

  const updateQty = (productId: string, qty: number) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ALT+A to focus search
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        document.getElementById('purchase-product-search')?.focus();
      }
      // CTRL+S or F2 to Save
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
  }, [formData, items]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.supplier_id || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const url = purchase ? `/api/purchases/${purchase.id}` : '/api/purchases';
      const method = purchase ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          supplier_id: parseInt(formData.supplier_id),
          items
        })
      });
      if (res.ok) {
        onSuccess();
        // Removed onClose()
      }
    } catch (err) {
      console.error("Failed to save purchase", err);
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
          <h3 className="text-lg font-bold text-slate-900">New Purchase Transaction</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Supplier</label>
              <select 
                required
                value={formData.supplier_id}
                onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              >
                <option value="">Select a Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Purchase Date</label>
              <input 
                required
                type="date" 
                value={formData.purchase_date}
                onChange={e => setFormData({...formData, purchase_date: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Add Products</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  id="purchase-product-search"
                  placeholder="Search by Product Name or Code (ALT+A)"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-600 shadow-sm"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowLOV(true);
                  }}
                  onFocus={() => setShowLOV(true)}
                />
              </div>

              {showLOV && searchQuery && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button
                      key={p.product_id}
                      type="button"
                      onClick={() => addItem(p)}
                      className="w-full px-6 py-3 text-left hover:bg-slate-50 flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.product_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.product_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">PKR {p.purchase_price}</p>
                        <p className="text-[10px] text-slate-400">Stock: {p.stock_quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Quantity</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Price</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Subtotal</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.product_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">{item.product_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            type="button"
                            onClick={() => updateQty(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            className="w-16 text-center bg-transparent font-bold text-slate-900 border-none outline-none focus:ring-0"
                            value={item.quantity}
                            onChange={e => updateQty(item.product_id, parseInt(e.target.value) || 1)}
                          />
                          <button 
                            type="button"
                            onClick={() => updateQty(item.product_id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number" 
                          className="w-24 text-right bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-medium focus:border-indigo-600 outline-none"
                          value={item.price}
                          onChange={e => setItems(items.map(i => i.product_id === item.product_id ? {...i, price: parseFloat(e.target.value) || 0} : i))}
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        PKR {(item.quantity * item.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No items added to the purchase</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Bill Amount</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold opacity-60">PKR</span>
                  <p className="text-3xl font-black">{totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : (
                  <>
                    <Save size={18} />
                    <span>Post Purchase (CTRL+S / F2)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const NewOrderModal = ({ 
  shops,
  orderBookers,
  products,
  order,
  onClose, 
  onSuccess,
  formatPKR
}: { 
  shops: Shop[],
  orderBookers: OrderBooker[],
  products: Product[],
  order?: Order,
  onClose: () => void, 
  onSuccess: () => void,
  formatPKR: (amount: number) => string
}) => {
  const [masterData, setMasterData] = useState({
    shop_id: order?.shop_id.toString() || '',
    order_booker_id: order?.order_booker_id.toString() || '',
    order_date: order?.order_date ? new Date(order.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    estimated_delivery_date: order?.estimated_delivery_date ? new Date(order.estimated_delivery_date).toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  
  const [items, setItems] = useState<{ 
    product_id: string, 
    quantity: number, 
    price: number, 
    product_name: string,
    sales_tax_pct: number,
    sales_tax_amount: number,
    additional_tax_pct: number,
    additional_tax_amount: number
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLOV, setShowLOV] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      const fetchItems = async () => {
        try {
          const res = await fetch(`/api/orders/${order.id}/items`);
          const data = await res.json();
          setItems(data.map((item: any) => ({
            ...item,
            sales_tax_pct: item.sales_tax_pct || 0,
            sales_tax_amount: item.sales_tax_amount || 0,
            additional_tax_pct: item.additional_tax_pct || 0,
            additional_tax_amount: item.additional_tax_amount || 0,
            discount_pct: item.discount_pct || 0,
            discount_amount: item.discount_amount || 0,
            extra_discount_pct: item.extra_discount_pct || 0,
            extra_discount_amount: item.extra_discount_amount || 0,
            product_name: products.find(p => p.product_id === item.product_id)?.product_name || 'Unknown Product'
          })));
        } catch (err) {
          console.error("Failed to fetch order items", err);
        }
      };
      fetchItems();
    }
  }, [order, products]);

  const defaultDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
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
  }, [masterData, items]);

  const filteredProducts = products.filter(p => 
    p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.product_id);
    if (existing) {
      const newQty = existing.quantity + 1;
      const newTaxAmount = (existing.price * newQty * existing.sales_tax_pct) / 100;
      const newAddTaxAmount = (existing.price * newQty * (existing.additional_tax_pct || 0)) / 100;
      const newDiscountAmount = (existing.price * newQty * (existing.discount_pct || 0)) / 100;
      const newExtraDiscountAmount = (existing.price * newQty * (existing.extra_discount_pct || 0)) / 100;
      setItems(items.map(i => i.product_id === product.product_id ? { 
        ...i, 
        quantity: newQty, 
        sales_tax_amount: newTaxAmount, 
        additional_tax_amount: newAddTaxAmount,
        discount_amount: newDiscountAmount,
        extra_discount_amount: newExtraDiscountAmount
      } : i));
    } else {
      const sales_tax_pct = (product as any).sales_tax_pct || 0;
      const additional_tax_pct = (product as any).additional_tax_pct || 0;
      const discount_pct = (product as any).discount_pct || 0;
      const extra_discount_pct = (product as any).extra_discount_pct || 0;

      const sales_tax_amount = (product.trade_price * 1 * sales_tax_pct) / 100;
      const additional_tax_amount = (product.trade_price * 1 * additional_tax_pct) / 100;
      const discount_amount = (product.trade_price * 1 * discount_pct) / 100;
      const extra_discount_amount = (product.trade_price * 1 * extra_discount_pct) / 100;

      setItems([...items, { 
        product_id: product.product_id, 
        quantity: 1, 
        price: product.trade_price,
        product_name: product.product_name,
        sales_tax_pct,
        sales_tax_amount,
        additional_tax_pct,
        additional_tax_amount,
        discount_pct,
        discount_amount,
        extra_discount_pct,
        extra_discount_amount
      }]);
    }
    setSearchQuery('');
    setShowLOV(false);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    setItems(items.map(i => {
      if (i.product_id === productId) {
        const newQty = Math.max(1, qty);
        const newTaxAmount = (i.price * newQty * (i.sales_tax_pct || 0)) / 100;
        const newAddTaxAmount = (i.price * newQty * (i.additional_tax_pct || 0)) / 100;
        const newDiscountAmount = (i.price * newQty * (i.discount_pct || 0)) / 100;
        const newExtraDiscountAmount = (i.price * newQty * (i.extra_discount_pct || 0)) / 100;
        return { 
          ...i, 
          quantity: newQty, 
          sales_tax_amount: newTaxAmount, 
          additional_tax_amount: newAddTaxAmount,
          discount_amount: newDiscountAmount,
          extra_discount_amount: newExtraDiscountAmount
        };
      }
      return i;
    }));
  };

  const updateTax = (productId: string, pct: number) => {
    setItems(items.map(i => {
      if (i.product_id === productId) {
        const newPct = Math.max(0, pct);
        const newTaxAmount = (i.price * i.quantity * newPct) / 100;
        return { ...i, sales_tax_pct: newPct, sales_tax_amount: newTaxAmount };
      }
      return i;
    }));
  };

  const updateAdditionalTax = (productId: string, pct: number) => {
    setItems(items.map(i => {
      if (i.product_id === productId) {
        const newPct = Math.max(0, pct);
        const newTaxAmount = (i.price * i.quantity * newPct) / 100;
        return { ...i, additional_tax_pct: newPct, additional_tax_amount: newTaxAmount };
      }
      return i;
    }));
  };

  const updateDiscount = (productId: string, pct: number) => {
    setItems(items.map(i => {
      if (i.product_id === productId) {
        const newPct = Math.max(0, pct);
        const newAmount = (i.price * i.quantity * newPct) / 100;
        return { ...i, discount_pct: newPct, discount_amount: newAmount };
      }
      return i;
    }));
  };

  const updateExtraDiscount = (productId: string, pct: number) => {
    setItems(items.map(i => {
      if (i.product_id === productId) {
        const newPct = Math.max(0, pct);
        const newAmount = (i.price * i.quantity * newPct) / 100;
        return { ...i, extra_discount_pct: newPct, extra_discount_amount: newAmount };
      }
      return i;
    }));
  };

  const itemsTotal = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
  const salesTaxTotal = items.reduce((sum, i) => sum + (i.sales_tax_amount || 0), 0);
  const additionalTaxTotal = items.reduce((sum, i) => sum + (i.additional_tax_amount || 0), 0);
  const discountTotal = items.reduce((sum, i) => sum + (i.discount_amount || 0), 0);
  const extraDiscountTotal = items.reduce((sum, i) => sum + (i.extra_discount_amount || 0), 0);
  const finalTotal = itemsTotal + salesTaxTotal + additionalTaxTotal - discountTotal - extraDiscountTotal;

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!masterData.shop_id || !masterData.order_booker_id || items.length === 0) {
      alert("Please fill all master data and add at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = order ? `/api/orders/${order.id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...masterData,
          shop_id: parseInt(masterData.shop_id),
          order_booker_id: parseInt(masterData.order_booker_id),
          sales_tax_pct: 0,
          sales_tax_amount: salesTaxTotal,
          additional_tax_pct: 0,
          additional_tax_amount: additionalTaxTotal,
          discount_pct: 0,
          discount_amount: discountTotal,
          extra_discount_pct: 0,
          extra_discount_amount: extraDiscountTotal,
          items
        })
      });
      if (res.ok) {
        onSuccess();
        // Removed onClose()
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save order");
      }
    } catch (err) {
      console.error("Failed to save order", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm(`Are you sure you want to cancel Order #ORD-${order.id.toString().padStart(4, '0')}? This will reverse stock but cannot be undone.`)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [order.id] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel order');
      
      alert("Order cancelled successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
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
          <h3 className="text-lg font-bold text-slate-900">
            {order ? `Update Sale Order (#ORD-${order.id.toString().padStart(4, '0')})` : 'New Booking Order'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Shop</label>
              <select 
                required
                value={masterData.shop_id}
                onChange={e => setMasterData({...masterData, shop_id: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              >
                <option value="">Select a Shop</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Booker</label>
              <select 
                required
                value={masterData.order_booker_id}
                onChange={e => setMasterData({...masterData, order_booker_id: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              >
                <option value="">Select an Order Booker</option>
                {orderBookers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Order Date</label>
              <input 
                required
                type="date" 
                value={masterData.order_date}
                onChange={e => setMasterData({...masterData, order_date: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Est. Delivery</label>
              <input 
                required
                type="date" 
                value={masterData.estimated_delivery_date}
                onChange={e => setMasterData({...masterData, estimated_delivery_date: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Add Products</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  id="product-search"
                  placeholder="Search by Product Name or Code (ALT+A)"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-600 shadow-sm"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowLOV(true);
                  }}
                  onFocus={() => setShowLOV(true)}
                />
              </div>

              {showLOV && searchQuery && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button
                      key={p.product_id}
                      type="button"
                      onClick={() => addItem(p)}
                      className="w-full px-6 py-3 text-left hover:bg-slate-50 flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.product_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.product_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">PKR {p.trade_price}</p>
                        <p className="text-[10px] text-slate-400">In Stock: {p.stock_quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Quantity</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Price</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right text-xs">Excl. Tax</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Tax (%)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right whitespace-nowrap">Add. Tax (%)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Disc (%)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right whitespace-nowrap">E. Disc (%)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Adj. Amount</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Total</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.product_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">{item.product_id}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            type="button"
                            onClick={() => updateQty(item.product_id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            className="w-12 text-center bg-transparent font-bold text-slate-900 border-none outline-none focus:ring-0 text-xs"
                            value={item.quantity}
                            onChange={e => updateQty(item.product_id, parseInt(e.target.value) || 1)}
                          />
                          <button 
                            type="button"
                            onClick={() => updateQty(item.product_id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-medium text-slate-600">
                        {formatPKR(item.price)}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-semibold text-slate-700">
                        {formatPKR(item.quantity * item.price)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-right text-[10px] outline-none focus:border-indigo-600"
                          value={item.sales_tax_pct}
                          onChange={e => updateTax(item.product_id, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-right text-[10px] outline-none focus:border-indigo-600"
                          value={item.additional_tax_pct}
                          onChange={e => updateAdditionalTax(item.product_id, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-right text-[10px] outline-none focus:border-indigo-600"
                          value={item.discount_pct}
                          onChange={e => updateDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-right text-[10px] outline-none focus:border-indigo-600"
                          value={item.extra_discount_pct}
                          onChange={e => updateExtraDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-4 text-right text-[10px] font-medium text-slate-600 leading-tight">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-600">+ ST: {formatPKR(item.sales_tax_amount)}</span>
                          <span className="text-emerald-600">+ AT: {formatPKR(item.additional_tax_amount)}</span>
                          <span className="text-rose-600">- DS: {formatPKR(item.discount_amount)}</span>
                          <span className="text-rose-600">- ED: {formatPKR(item.extra_discount_amount)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatPKR((item.quantity * item.price) + (item.sales_tax_amount || 0) + (item.additional_tax_amount || 0) - (item.discount_amount || 0) - (item.extra_discount_amount || 0))}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                        <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No items added to the order</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
              <div className="flex gap-8 items-center">
                <div className="flex gap-12 items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Subtotal</p>
                    <p className="text-xl font-bold">{formatPKR(itemsTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Sales Tax Total</p>
                    <p className="text-xl font-bold">{formatPKR(salesTaxTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Add. Tax Total</p>
                    <p className="text-xl font-bold">{formatPKR(additionalTaxTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Discount Total</p>
                    <p className="text-xl font-bold">{formatPKR(discountTotal + extraDiscountTotal)}</p>
                  </div>
                  <div className="h-10 w-px bg-white/20"></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Grand Total</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold opacity-60">PKR</span>
                      <p className="text-3xl font-black">{finalTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                {order && order.status?.toLowerCase() !== 'cancelled' && (
                  <button 
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isSubmitting}
                    className="bg-rose-500 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-rose-600 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>
              <button 
                type="submit"
                disabled={isSubmitting || items.length === 0 || order?.status?.toLowerCase() === 'cancelled'}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : (
                  <>
                    <Save size={18} />
                    <span>Post Order (CTRL+S / F2)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
