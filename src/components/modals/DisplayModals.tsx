import React, { useState } from 'react';
import { X, Search, FileText, ClipboardList, Truck, ShoppingBag, RotateCcw, AlertCircle, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderDetailsModal, PurchaseDetailsModal, DeliveryDetailsModal } from './DetailsModals';
import { Order, Purchase, Delivery, Return } from '../../types';
import { cn, formatPKR } from '../../lib/utils';

interface DocumentSearchModalProps {
  title: string;
  tCode: string;
  icon: React.ReactNode;
  placeholder: string;
  apiPath: string;
  onClose: () => void;
  renderDetails: (data: any) => React.ReactNode;
}

const DocumentSearchModal: React.FC<DocumentSearchModalProps> = ({
  title,
  tCode,
  icon,
  placeholder,
  apiPath,
  onClose,
  renderDetails
}) => {
  const [docId, setDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Clean ID from prefix if entered (e.g. ORD-0001 -> 1)
      const cleanId = docId.replace(/[^0-9]/g, '');
      const response = await fetch(`${apiPath}/${cleanId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Document not found');
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    return renderDetails(data);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-transparent hover:border-slate-100">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Document Number
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                autoFocus
                type="text"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !docId}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-slate-900"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={20} />
            )}
            <span>Display Document</span>
          </button>
        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Press ENTER to search • ESC to close
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Return Details Modal (custom for display)
const ReturnDetailsView = ({ returnData, onClose }: { returnData: Return; onClose: () => void }) => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/returns/${returnData.id}/items`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [returnData.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-bold text-slate-900 text-rose-600">Return Document Display</h3>
            <p className="text-sm text-slate-500">#RET-{returnData.id.toString().padStart(4, '0')} • {returnData.shop_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Retailer</p>
              <p className="text-sm font-bold text-slate-900">{returnData.shop_name}</p>
              <p className="text-xs text-slate-500">{returnData.location}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
              <p className="text-sm font-bold text-slate-900">{new Date(returnData.return_date).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">{new Date(returnData.return_date).toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {returnData.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Credit</p>
              <p className="text-xl font-black text-rose-600">{formatPKR(returnData.total_amount)}</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Return Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Unit Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Credit Amount</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading return items...</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{item.brand} • #DEL-{item.delivery_id}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-black text-rose-600">{item.current_return_qty || item.quantity}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600 font-medium">
                      {formatPKR(item.unit_price)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-black text-slate-900">
                      {formatPKR((item.current_return_qty || item.quantity) * item.unit_price)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 italic">"{item.reason || 'No reason specified'}"</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm">
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const DisplayOrderModal = ({ onClose }: { onClose: () => void }) => (
  <DocumentSearchModal 
    title="Display Sales Order"
    tCode="VA03"
    icon={<ClipboardList size={24} />}
    placeholder="ORD-0001"
    apiPath="/api/orders"
    onClose={onClose}
    renderDetails={(data) => <OrderDetailsModal order={data} onClose={onClose} formatPKR={formatPKR} />}
  />
);

export const DisplayDeliveryModal = ({ onClose }: { onClose: () => void }) => (
  <DocumentSearchModal 
    title="Display Delivery"
    tCode="VL03"
    icon={<Truck size={24} />}
    placeholder="DEL-0001"
    apiPath="/api/deliveries"
    onClose={onClose}
    renderDetails={(data) => <DeliveryDetailsModal delivery={data} onClose={onClose} formatPKR={formatPKR} />}
  />
);

export const DisplayPurchaseModal = ({ onClose }: { onClose: () => void }) => (
  <DocumentSearchModal 
    title="Display Purchase Order"
    tCode="ME03"
    icon={<ShoppingBag size={24} />}
    placeholder="PUR-0001"
    apiPath="/api/purchases"
    onClose={onClose}
    renderDetails={(data) => <PurchaseDetailsModal purchase={data} onClose={onClose} formatPKR={formatPKR} />}
  />
);

export const DisplayReturnModal = ({ onClose }: { onClose: () => void }) => (
  <DocumentSearchModal 
    title="Display Return"
    tCode="LR03"
    icon={<RotateCcw size={24} />}
    placeholder="RET-0001"
    apiPath="/api/returns"
    onClose={onClose}
    renderDetails={(data) => <ReturnDetailsView returnData={data} onClose={onClose} />}
  />
);
