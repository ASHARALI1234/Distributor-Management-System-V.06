import React, { useState, useEffect } from 'react';
import { X, Trash2, Printer, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop, Order, Purchase, LedgerEntry, OrderItem, Delivery, DeliveryItem, Product, InventoryAuditLog } from '../../types';

export const ValuationHistoryModal = ({
  product,
  onClose,
  formatPKR
}: {
  product: Product;
  onClose: () => void;
  formatPKR: (amount: number) => string;
}) => {
  const [logs, setLogs] = useState<InventoryAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/products/${product.product_id}/valuation-history`);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch valuation history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [product.product_id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-700">
                {product.product_id}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{product.product_name}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">SAP MM Moving Average Price (MAP) Audit Log & Valuation History</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors shrink-0">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Current State Header Cards */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-100/60 border-b border-slate-100">
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Stock</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{product.stock_quantity} <span className="text-xs font-normal text-slate-500">{product.unit || 'EACH'}</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Moving Avg Price (MAP)</span>
            <p className="text-xl font-black text-indigo-600 mt-1">{formatPKR(product.moving_average_price || product.purchase_price)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Inventory Value</span>
            <p className="text-xl font-black text-emerald-600 mt-1">{formatPKR(product.inventory_value || (product.stock_quantity * (product.moving_average_price || product.purchase_price)))}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase / Trade Price</span>
            <p className="text-sm font-medium text-slate-700 mt-1">PP: {formatPKR(product.purchase_price)}</p>
            <p className="text-xs font-medium text-slate-500">TP: {formatPKR(product.trade_price)}</p>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Ref #</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Qty Change</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Unit Price</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Prev MAP</th>
                    <th className="px-4 py-3 text-xs font-bold text-indigo-600 uppercase text-right">New MAP</th>
                    <th className="px-4 py-3 text-xs font-bold text-emerald-600 uppercase text-right">New Inv Value</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => {
                    const isPurchase = log.transaction_type === 'PURCHASE';
                    const isReturn = log.transaction_type === 'PURCHASE_RETURN';
                    return (
                      <tr key={log.id} className="text-xs hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            isPurchase && "bg-emerald-100 text-emerald-800",
                            isReturn && "bg-rose-100 text-rose-800",
                            log.transaction_type === 'SALE' && "bg-blue-100 text-blue-800",
                            log.transaction_type === 'SALE_RETURN' && "bg-amber-100 text-amber-800",
                            log.transaction_type === 'ADJUSTMENT' && "bg-purple-100 text-purple-800"
                          )}>
                            {log.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">#{log.reference_id}</td>
                        <td className={cn("px-4 py-3 text-right font-bold font-mono", log.qty_change > 0 ? "text-emerald-600" : "text-rose-600")}>
                          {log.qty_change > 0 ? `+${log.qty_change}` : log.qty_change}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{formatPKR(log.unit_price)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatPKR(log.previous_map)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600 bg-indigo-50/50">{formatPKR(log.new_map)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatPKR(log.new_value)}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.notes}</td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        No valuation audit entries recorded yet for this product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const LedgerModal = ({ 
  shop, 
  onClose, 
  formatPKR 
}: { 
  shop: Shop, 
  onClose: () => void, 
  formatPKR: (amount: number) => string 
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [onClose]);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch(`/api/ledger/${shop.id}`);
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("Failed to fetch ledger", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [shop.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Shop Ledger</h3>
            <p className="text-sm text-slate-500">{shop.shop_name} • Financial History</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Debit</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Credit</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map(entry => (
                  <tr key={entry.id} className="text-sm">
                    <td className="px-4 py-3 text-slate-600">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{entry.description}</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-medium">
                      {entry.debit > 0 ? formatPKR(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {entry.credit > 0 ? formatPKR(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold">{formatPKR(entry.balance)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">No ledger entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
          >
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const OrderDetailsModal = ({ 
  order, 
  onClose, 
  onSuccess,
  formatPKR 
}: { 
  order: Order, 
  onClose: () => void, 
  onSuccess?: () => void,
  formatPKR: (amount: number) => string 
}) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
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
  }, [onClose]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/items`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch order items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [order.id]);

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel Order #ORD-${order.id.toString().padStart(4, '0')}? This will reverse stock and cannot be undone.`)) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [order.id] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel order');
      
      alert("Order cancelled successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCancelling(false);
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
        <div className="p-6 border-b border-slate-100 flex justify-between items-center no-print">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Order Details</h3>
            <p className="text-sm text-slate-500">#ORD-{order.id.toString().padStart(4, '0')} • {order.shop_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto print-receipt-only">
          {/* Receipt Print Header (Only visible on print) */}
          <div className="hidden print:block text-center border-b-2 border-dashed border-slate-900 pb-4 mb-6">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">KARACHI DMS</h2>
            <p className="text-xs uppercase tracking-widest font-bold text-slate-700">Distribution Management System</p>
            <p className="text-[10px] text-slate-500 mt-1">Karachi, Sindh, Pakistan • Support: +92 21 111-K-DMS</p>
            <div className="flex justify-between items-center text-[10px] text-slate-600 mt-4 px-2">
              <span>PRINTED: {new Date().toLocaleString()}</span>
              <span className="font-bold">SALES ORDER RECEIPT</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Shop</p>
              <p className="text-sm font-bold text-slate-900">{order.shop_name}</p>
              <p className="text-xs text-slate-500">Booker: {order.order_booker_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-block",
                order.status?.toLowerCase() === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                order.status?.toLowerCase() === 'pending' ? "bg-amber-50 text-amber-600" : 
                order.status?.toLowerCase() === 'partially_delivered' ? "bg-blue-50 text-blue-600" :
                order.status?.toLowerCase() === 'cancelled' ? "bg-rose-50 text-rose-600" :
                "bg-slate-50 text-slate-600"
              )}>
                {order.status?.replace('_', ' ')}
              </span>
              <p className="text-xs text-slate-500 mt-1">{new Date(order.order_date).toLocaleString()}</p>
              <p className="text-xs font-bold text-indigo-600 mt-1 uppercase">Delivery: {order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Add. Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Disc (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">E. Disc (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right text-xs">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm italic">Loading items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm italic">No items found</td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500">{item.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">{formatPKR(item.price)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.sales_tax_pct}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.sales_tax_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.additional_tax_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.additional_tax_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.discount_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.discount_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.extra_discount_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.extra_discount_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatPKR((item.price * item.quantity) + (item.sales_tax_amount || 0) + (item.additional_tax_amount || 0) - (item.discount_amount || 0) - (item.extra_discount_amount || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 text-xs">
                  <td colSpan={7} className="px-4 py-2 font-medium text-slate-500 text-right uppercase tracking-wider">Subtotal</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">{formatPKR(order.total_amount - (order.sales_tax_amount || 0) - (order.additional_tax_amount || 0) + (order.discount_amount || 0) + (order.extra_discount_amount || 0))}</td>
                </tr>
                {order.sales_tax_amount && order.sales_tax_amount > 0 ? (
                  <tr className="bg-slate-50/50 text-xs">
                    <td colSpan={7} className="px-4 py-2 font-medium text-slate-500 text-right uppercase tracking-wider">Sales Tax Total</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">{formatPKR(order.sales_tax_amount || 0)}</td>
                  </tr>
                ) : null}
                {order.additional_tax_amount && order.additional_tax_amount > 0 ? (
                  <tr className="bg-slate-50/50 text-xs">
                    <td colSpan={7} className="px-4 py-2 font-medium text-slate-500 text-right uppercase tracking-wider">Additional Tax Total</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">{formatPKR(order.additional_tax_amount || 0)}</td>
                  </tr>
                ) : null}
                {(order.discount_amount || 0) + (order.extra_discount_amount || 0) > 0 ? (
                  <tr className="bg-slate-50/50 text-xs text-rose-600">
                    <td colSpan={7} className="px-4 py-2 font-medium text-right uppercase tracking-wider">Discount Total</td>
                    <td className="px-4 py-2 text-right font-medium">-{formatPKR((order.discount_amount || 0) + (order.extra_discount_amount || 0))}</td>
                  </tr>
                ) : null}
                <tr className="bg-slate-100/50">
                  <td colSpan={7} className="px-4 py-3 text-sm font-bold text-slate-900 text-right uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-indigo-600">{formatPKR(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Receipt Print Footer (Only visible on print) */}
          <div className="hidden print:block text-center border-t border-dashed border-slate-900 pt-6 mt-8">
            <p className="text-xs font-black text-slate-950 uppercase tracking-wider">Thank you for your business!</p>
            <p className="text-[10px] text-slate-500 mt-1">This is an electronically generated sales order under Karachi distribution records.</p>
            <p className="text-[9px] text-slate-400 font-mono mt-2">Powered by Karachi DMS Distribution Suite v7.0</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center no-print">
          <div>
            {order.status?.toLowerCase() !== 'cancelled' && (
              <button 
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-6 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isCancelling ? 'Processing...' : 'Cancel Order'}
              </button>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                Print Order
              </button>
              <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                Close (F3)
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
      </motion.div>
    </div>
  );
};

export const PurchaseDetailsModal = ({ 
  purchase, 
  onClose, 
  formatPKR 
}: { 
  purchase: Purchase, 
  onClose: () => void, 
  formatPKR: (amount: number) => string 
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [onClose]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/purchases/${purchase.id}/items`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch purchase items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [purchase.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Purchase Details</h3>
            <p className="text-sm text-slate-500">#PUR-{purchase.id.toString().padStart(4, '0')} • {purchase.supplier_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
              <p className="text-sm font-bold text-slate-900">{purchase.supplier_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                {purchase.status}
              </span>
              <p className="text-xs text-slate-500 mt-1">{new Date(purchase.purchase_date).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Product / Batch</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Cost</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm italic">Loading items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm italic">No items found</td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500">{item.brand}</span>
                        {item.supplier_batch_no && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">Batch: {item.supplier_batch_no}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{item.storage_location || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{formatPKR(item.price)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatPKR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/50">
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-900 text-right uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-indigo-600">{formatPKR(purchase.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const DeliveryDetailsModal = ({ 
  delivery, 
  onClose, 
  formatPKR 
}: { 
  delivery: Delivery, 
  onClose: () => void, 
  formatPKR: (val: number) => string 
}) => {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [onClose]);

  useEffect(() => {
    fetchItems();
  }, [delivery.id]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch delivery items", err);
    } finally {
      setLoading(false);
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
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">Delivery Details</h3>
              <span className="text-xs font-mono text-slate-400">#DEL-{delivery.id.toString().padStart(4, '0')}</span>
            </div>
            <p className="text-xs text-slate-500">
              Order Ref: #ORD-{(delivery.order_ref || delivery.order_id || 0).toString().padStart(4, '0')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shop</p>
              <p className="text-sm font-bold text-slate-900">{delivery.shop_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Salesman</p>
              <p className="text-sm font-bold text-slate-900">{delivery.salesman_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
              <p className="text-sm font-bold text-slate-900">{new Date(delivery.delivery_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Amount</p>
              <p className="text-sm font-bold text-indigo-600">{formatPKR(delivery.total_amount)}</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Delivered</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Returned</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-indigo-600 uppercase text-center">Net Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Add. Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Disc (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">E. Disc (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Loading items...</td></tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          #ORD-{(item.order_ref || delivery.order_ref || delivery.order_id || 0).toString().padStart(4, '0')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{item.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-rose-500">{item.return_qty || 0}</td>
                    <td className="px-4 py-3 text-center text-sm font-black text-indigo-600">{item.net_qty}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{formatPKR(item.price)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.sales_tax_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.sales_tax_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.additional_tax_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.additional_tax_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.discount_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.discount_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {item.extra_discount_pct || 0}%
                      <span className="block text-[8px] opacity-70">({formatPKR(item.extra_discount_amount || 0)})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatPKR((item.quantity * item.price) + (item.sales_tax_amount || 0) + (item.additional_tax_amount || 0) - (item.discount_amount || 0) - (item.extra_discount_amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
