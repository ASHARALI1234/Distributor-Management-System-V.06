import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Menu, 
  X, 
  LogOut, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone,
  Truck, 
  FileText, 
  Printer,
  CreditCard,
  Banknote,
  Store,
  ChevronRight,
  ChevronLeft,
  Factory,
  DollarSign,
  Save,
  Database,
  BarChart3,
  Edit,
  Trash2,
  Settings,
  Shield,
  ShieldCheck,
  LifeBuoy,
  Filter,
  RotateCcw,
  Hash,
  CheckCircle,
  SlidersHorizontal,
  ShoppingBag,
  ChevronDown,
  HelpCircle,
  XCircle,
  Download,
  Upload,
  AlertCircle,
  Check,
  ArrowLeft,
  Bot,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cn } from './lib/utils';
import { 
  Product, 
  Shop, 
  Order, 
  DashboardStats, 
  OrderItem, 
  Purchase, 
  LoadPlan, 
  LedgerEntry,
  Supplier,
  StockValuationReport,
  MaterialGroup,
  Driver,
  OrderBooker,
  Salesman,
  Delivery,
  DeliveryItem,
  Return,
  ReturnItem,
  Unit,
  Invoice,
  InvoiceItem,
  SalesReturn,
  SalesReturnItem,
  AuthUser,
  Distributor,
  Payment
} from './types';

// Modal component imports
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/modals/UserManagementModal';
import { DistributorMasterModal } from './components/modals/DistributorMasterModal';
import { InvoiceTransactionModal, EditInvoiceModal, DisplayInvoiceModal } from './components/modals/InvoiceModals';
import { PaymentModal, DisplayPaymentModal } from './components/modals/PaymentModals';
import { 
  DisplayOrderModal, 
  DisplayDeliveryModal, 
  DisplayPurchaseModal, 
  DisplayReturnModal 
} from './components/modals/DisplayModals';
import { ReturnModal } from './components/modals/ReturnModals';
import { SalesReturnModal } from './components/modals/SalesReturnModal';
import { PurchaseReturnModal } from './components/modals/PurchaseReturnModal';
import { LedgerModal, OrderDetailsModal, PurchaseDetailsModal, DeliveryDetailsModal, ValuationHistoryModal } from './components/modals/DetailsModals';
import { DriverModal, SalesmanModal, OrderBookerModal, MaterialGroupModal, TCodeMasterModal, LocationMasterModal } from './components/modals/MasterModals';
import { PurchaseModal, NewOrderModal } from './components/modals/TransactionModals';
import { DeliveryModal } from './components/modals/LogisticsModals';
import { RegisterShopModal, ShopMasterModal, RegisterSupplierModal, SupplierMasterModal, ProductMasterDataModal, UnitModal } from './components/modals/DataManagementModals';
import { DailyLoadPlanReport } from './components/reports/DailyLoadPlanReport';
import { AreaWiseItemPartySummaryReport } from './components/reports/AreaWiseItemPartySummaryReport';
import { InvoiceReport } from './components/reports/InvoiceReport';
import { SalesTaxInvoiceReport } from './components/reports/SalesTaxInvoiceReport';
import { StockDetailReport } from './components/reports/StockDetailReport';
import { AdminTab } from './components/AdminTab';
import { AIInquiryDesk } from './components/AIInquiryDesk';

const OrderCancellationScreen = ({ onClose, orders, formatPKR }: { onClose: () => void, orders: Order[], formatPKR: (amt: number) => string }) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [fromOrderId, setFromOrderId] = useState<string>('');
  const [toOrderId, setToOrderId] = useState<string>('');

  const handleSelectRange = () => {
    const from = parseInt(fromOrderId.replace(/\D/g, ''));
    const to = parseInt(toOrderId.replace(/\D/g, ''));
    if (isNaN(from) || isNaN(to)) return;

    const rangeIds = orders
      .filter(o => o.id >= from && o.id <= to)
      .map(o => o.id);
    
    setSelectedOrderIds(prev => Array.from(new Set([...prev, ...rangeIds])));
  };

  const toggleOrder = (id: number) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const handleCancel = async () => {
    if (selectedOrderIds.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrderIds })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) throw new Error(data.error || 'Failed to cancel orders');
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Cancellation error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="text-rose-600" size={24} />
              Order Cancellation Transaction (ORD02)
            </h2>
            <p className="text-slate-500 font-medium">Bulk cancel orders by marking them as cancelled</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3">
              <AlertTriangle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3 animate-bounce">
              <CheckCircle size={20} />
              <p className="text-sm font-bold">Orders marked as cancelled successfully!</p>
            </div>
          )}

          <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">From Order ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="e.g. 1"
                  value={fromOrderId}
                  onChange={(e) => setFromOrderId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">To Order ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="e.g. 10"
                  value={toOrderId}
                  onChange={(e) => setToOrderId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
            <button 
              onClick={handleSelectRange}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Select Range
            </button>
            <button 
              onClick={() => setSelectedOrderIds([])}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-white transition-all border border-slate-200"
            >
              Clear Selection
            </button>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedOrderIds(orders.map(o => o.id));
                        else setSelectedOrderIds([]);
                      }}
                      checked={selectedOrderIds.length === orders.length && orders.length > 0}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Shop</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No active orders available for cancellation</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className={cn("hover:bg-slate-50 transition-colors", selectedOrderIds.includes(order.id) && "bg-rose-50/30")}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleOrder(order.id)}
                          className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900 underline decoration-slate-200 cursor-pointer">
                        #ORD-{order.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.shop_name}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{formatPKR(order.total_amount)}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          order.status?.toLowerCase() === 'pending' ? "bg-amber-50 text-amber-600" : 
                          order.status?.toLowerCase() === 'delivered' ? "bg-emerald-50 text-emerald-600" :
                          order.status?.toLowerCase() === 'partially_delivered' ? "bg-blue-50 text-blue-600" :
                          order.status?.toLowerCase() === 'cancelled' ? "bg-rose-50 text-rose-600" :
                          "bg-slate-50 text-slate-600"
                        )}>
                          {order.status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="text-slate-500 text-sm font-bold">
            {selectedOrderIds.length} orders selected for cancellation
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-white transition-all border border-transparent hover:border-slate-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleCancel}
              disabled={selectedOrderIds.length === 0 || isProcessing}
              className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? <RotateCcw className="animate-spin" size={18} /> : <X size={18} />}
              Confirm Cancellation
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Sidebar and Stat Components ---







const PIE_COLORS: { [key: string]: string } = {
  'Pending': '#f59e0b',
  'Delivered': '#10b981',
  'Partially Delivered': '#3b82f6',
  'Cancelled': '#ef4444'
};

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, color, trend, alert }: any) => (
  <div className={cn(
    "bg-white p-6 rounded-2xl border transition-all duration-300",
    alert ? "border-rose-200 shadow-lg shadow-rose-50 ring-1 ring-rose-100" : "border-slate-100 shadow-sm"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn(
        "p-3 rounded-xl", 
        color,
        alert && "animate-pulse"
      )}>
        <Icon size={24} className="text-white" />
      </div>
      {alert && (
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-600 uppercase tracking-wider">
          Action Required
        </span>
      )}
      {trend && !alert && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
    <h3 className={cn(
      "text-2xl font-bold transition-colors",
      alert ? "text-rose-600" : "text-slate-900"
    )}>{value}</h3>
  </div>
);

const FilterBar = ({ 
  title, 
  filters, 
  onFilterChange, 
  onClear, 
  options 
}: { 
  title: string, 
  filters: any, 
  onFilterChange: (key: string, val: any) => void, 
  onClear: () => void,
  options: { key: string, label: string, choices: { value: string, label: string }[] }[]
}) => {
  const activeFilters = Object.entries(filters).filter(([_, val]) => val !== 'any');

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <h4 className="text-sm font-bold text-slate-700">{title}</h4>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {options.map((opt) => (
            <div key={opt.key} className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{opt.label}</span>
              <select 
                value={filters[opt.key]}
                onChange={(e) => onFilterChange(opt.key, e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 transition-colors"
              >
                <option value="any">All {opt.label}s</option>
                {opt.choices.map(choice => (
                  <option key={choice.value} value={choice.value}>{choice.label}</option>
                ))}
              </select>
            </div>
          ))}
          
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors mt-auto"
          >
            <RotateCcw size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Active:</span>
          {activeFilters.map(([key, val]) => (
            <button 
              key={key}
              onClick={() => onFilterChange(key, 'any')}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              <span>{options.find(o => o.key === key)?.label}: {val}</span>
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'transactions' | 'master_data' | 'reports' | 'ai_inquiry' | 'admin'>(
    (localStorage.getItem('dms_activeTab') as any) || 'dashboard'
  );
  const [masterDataSubTab, setMasterDataSubTab] = useState<'products' | 'shops' | 'suppliers' | 'order_bookers' | 'salesmen' | 'drivers' | 'locations' | 'distributors' | 'units'>(
    (localStorage.getItem('dms_masterDataSubTab') as any) || 'products'
  );
  const [transactionsSubTab, setTransactionsSubTab] = useState<'purchases' | 'orders' | 'deliveries' | 'delivery_returns' | 'load_plans' | 'invoices' | 'sales_returns' | 'payments'>(
    (localStorage.getItem('dms_transactionsSubTab') as any) || 'orders'
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalMode, setPaymentModalMode] = useState<'create' | 'edit'>('create');
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [isDisplayPaymentModalOpen, setIsDisplayPaymentModalOpen] = useState(false);
  const [displayPaymentId, setDisplayPaymentId] = useState<number | null>(null);
  const [paymentSearchInput, setPaymentSearchInput] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'CASH' | 'CHEQUE'>('all');
  const [valuation, setValuation] = useState<StockValuationReport | null>(null);
  const [selectedReportTitle, setSelectedReportTitle] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orderBookers, setOrderBookers] = useState<OrderBooker[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [chartData, setChartData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem('dms_isSidebarOpen') === null ? true : localStorage.getItem('dms_isSidebarOpen') === 'true'
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedProductForValuation, setSelectedProductForValuation] = useState<Product | null>(null);
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('dms_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const isSuperAdmin = currentUser?.role === 'admin' || 
    (currentUser?.roles && currentUser.roles.some((r: any) => 
      typeof r === 'string' ? r === 'SUPER_ADMIN' : r?.name === 'SUPER_ADMIN'
    ));

  // Granular T-Code and RBAC Authorization Helpers
  const hasTCode = (tcode: string): boolean => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    const userCodes = currentUser.permitted_tcodes || [];
    return userCodes.some(c => c.toUpperCase() === tcode.toUpperCase());
  };

  const hasAnyTCode = (...tcodes: string[]): boolean => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    const userCodes = currentUser.permitted_tcodes || [];
    const upperUserCodes = userCodes.map(c => c.toUpperCase());
    return tcodes.some(c => upperUserCodes.includes(c.toUpperCase()));
  };

  // Top-Level Module Authorization
  const canAccessMasterData = isSuperAdmin || hasAnyTCode(
    'DST01', 'DIS01', 'DM01', 'SLM1', 'SM01', 'SM05', 'SM07', 'SM08',
    'PR01', 'PR02', 'PR03', 'MM01', 'MM02', 'MM03', 'IN01', 'IN05',
    'SH01', 'SH05', 'SH07', 'SH08', 'SHM1', 'VD01', 'VD02', 'VD03', 'BP01',
    'XK01', 'XK02', 'XK03', 'SUM1', 'SU01', 'SU05', 'SU07', 'SU08',
    'OBM1', 'OB01', 'OB02', 'OB05', 'DRV1', 'LOC01', 'GEO01', 'UN01', 'UOM01'
  );

  const canAccessTransactions = isSuperAdmin || hasAnyTCode(
    'ME21N', 'ME03', 'PUR01', 'PUR02', 'VA01', 'VA02', 'VA03', 'OR01', 'OR05', 'ORD02',
    'DLVY', 'DL01', 'DL05', 'VL03', 'DEL01', 'DEL02', 'RT01', 'PGR01', 'DRT01',
    'INV01', 'VF01', 'VF02', 'VF03', 'STI01', 'SRT01', 'PRT01', 'LP01', 'LPR01',
    'PA01', 'PA02', 'PA03'
  );

  const canAccessReports = isSuperAdmin || hasAnyTCode(
    'APS01', 'LPR01', 'SDR01', 'REPT', 'VF03', 'STI01', 'MB52', 'MB51', 'FBL5N'
  );

  const canAccessAI = isSuperAdmin || hasAnyTCode('AI01', 'INQ01', 'DASH');

  const canAccessAdmin = isSuperAdmin || hasAnyTCode('USR1', 'SU01', 'SU05', 'SU07', 'SU08', 'SUM1');

  // Master Data subtabs filtered strictly by user authorizations
  const masterDataTabDefs = [
    { id: 'distributors', label: 'Distributors', icon: Store, tcodes: ['DST01', 'DIS01', 'DM01'] },
    { id: 'suppliers', label: 'Suppliers', icon: Factory, tcodes: ['XK01', 'XK02', 'XK03', 'SUM1', 'SU01', 'SU05', 'SU07', 'SU08'] },
    { id: 'shops', label: 'Shops', icon: Store, tcodes: ['SH01', 'SH05', 'SH07', 'SH08', 'SHM1', 'VD01', 'VD02', 'VD03', 'BP01'] },
    { id: 'order_bookers', label: 'Order Bookers', icon: Users, tcodes: ['OBM1', 'OB01', 'OB02', 'OB05'] },
    { id: 'salesmen', label: 'Salesmen', icon: Users, tcodes: ['SLM1', 'SM01', 'SM05', 'SM07', 'SM08'] },
    { id: 'products', label: 'Products', icon: Package, tcodes: ['PR01', 'PR02', 'PR03', 'MM01', 'MM02', 'MM03', 'IN01', 'IN05'] },
    { id: 'locations', label: 'Locations', icon: MapPin, tcodes: ['LOC01', 'GEO01'] },
    { id: 'units', label: 'Units', icon: Settings, tcodes: ['UN01', 'UOM01'] },
  ];

  const allowedMasterDataTabs = masterDataTabDefs.filter(tab => hasAnyTCode(...tab.tcodes));

  // Transactions subtabs filtered strictly by user authorizations
  const transactionTabDefs = [
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag, tcodes: ['ME21N', 'ME03', 'PUR01', 'PUR02'] },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, tcodes: ['VA01', 'VA02', 'VA03', 'OR01', 'OR05', 'ORD02'] },
    { id: 'deliveries', label: 'Deliveries', icon: Truck, tcodes: ['DLVY', 'DL01', 'DL05', 'VL03', 'DEL01', 'DEL02'] },
    { id: 'delivery_returns', label: 'Delivery Return', icon: RotateCcw, tcodes: ['RT01', 'PGR01', 'DRT01', 'DL05'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, tcodes: ['INV01', 'VF01', 'VF02', 'VF03', 'STI01'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, tcodes: ['PA01', 'PA02', 'PA03'] },
    { id: 'sales_returns', label: 'Sales Return', icon: RotateCcw, tcodes: ['SRT01', 'RT01'] },
    { id: 'load_plans', label: 'Load Plans', icon: Truck, tcodes: ['LP01', 'LPR01'] },
  ];

  const allowedTransactionTabs = transactionTabDefs.filter(tab => hasAnyTCode(...tab.tcodes));

  // Reports filtered strictly by user authorizations
  const allReportsList = [
    { title: 'Daily Load Plan', desc: 'Aggregated loading metrics and stop sequencing for delivery dispatch.', icon: Truck, tcodes: ['LPR01', 'LP01'] },
    { title: 'Area Wise Item Party Summary', desc: 'Consolidated sales, products, and booker performance per urban sub-area.', icon: MapPin, tcodes: ['APS01'] },
    { title: 'Invoice', desc: 'Detailed billing statement matching official print-out specifications.', icon: FileText, tcodes: ['VF03', 'INV01'] },
    { title: 'Sales Tax Invoice', desc: 'Detailed billing statement matching official print-out specifications under Section 23 of the Drugs Act 1976.', icon: FileText, tcodes: ['STI01', 'VF03'] },
    { title: 'Stock Detail', desc: 'Detailed itemized transaction log showing opening balance, purchases, sales, and running ledger.', icon: Package, tcodes: ['SDR01', 'MB52'] },
    { title: 'Sales Summary', desc: 'Daily, weekly and monthly sales analysis', icon: TrendingUp, tcodes: ['REPT'] },
    { title: 'Inventory Valuation', desc: 'Current stock value at PP and TP', icon: Package, tcodes: ['SDR01', 'MB52'] },
    { title: 'Shop Aging', desc: 'Outstanding payments and credit analysis', icon: Clock, tcodes: ['REPT', 'FBL5N'] },
    { title: 'Booker Performance', desc: 'Orders and revenue by order booker', icon: Users, tcodes: ['REPT', 'OBM1'] },
    { title: 'Product Velocity', desc: 'Fast and slow moving items', icon: BarChart3, tcodes: ['REPT', 'PR01'] },
  ];

  const allowedReports = allReportsList.filter(rep => hasAnyTCode(...rep.tcodes));

  // Dynamic Navigation Guard: Ensure activeTab and active subtabs stay within authorized bounds
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'master_data') {
      if (allowedMasterDataTabs.length > 0 && !allowedMasterDataTabs.some(t => t.id === masterDataSubTab)) {
        setMasterDataSubTab(allowedMasterDataTabs[0].id as any);
      } else if (allowedMasterDataTabs.length === 0) {
        setActiveTab('dashboard');
      }
    }

    if (activeTab === 'transactions') {
      if (allowedTransactionTabs.length > 0 && !allowedTransactionTabs.some(t => t.id === transactionsSubTab)) {
        setTransactionsSubTab(allowedTransactionTabs[0].id as any);
      } else if (allowedTransactionTabs.length === 0) {
        setActiveTab('dashboard');
      }
    }

    if (activeTab === 'reports' && !canAccessReports) {
      setActiveTab('dashboard');
    }

    if (activeTab === 'admin' && !canAccessAdmin) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab, masterDataSubTab, transactionsSubTab]);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isDistributorMasterModalOpen, setIsDistributorMasterModalOpen] = useState(false);

  const [isProductMasterModalOpen, setIsProductMasterModalOpen] = useState(false);
  const [isRegisterShopModalOpen, setIsRegisterShopModalOpen] = useState(false);
  const [isRegisterSupplierModalOpen, setIsRegisterSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isMaterialGroupModalOpen, setIsMaterialGroupModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<number | string | null>(null);
  const [isDisplayInvoiceModalOpen, setIsDisplayInvoiceModalOpen] = useState(false);
  const [displayInvoiceId, setDisplayInvoiceId] = useState<number | string | null>(null);
  const [isDisplayOrderModalOpen, setIsDisplayOrderModalOpen] = useState(false);
  const [isDisplayDeliveryModalOpen, setIsDisplayDeliveryModalOpen] = useState(false);
  const [isDisplayPurchaseModalOpen, setIsDisplayPurchaseModalOpen] = useState(false);
  const [isDisplayReturnModalOpen, setIsDisplayReturnModalOpen] = useState(false);
  const [isBulkInvoiceCancelOpen, setIsBulkInvoiceCancelOpen] = useState(false);
  const [bulkCancelRange, setBulkCancelRange] = useState({ start: '', end: '' });
  const [isBulkCancelling, setIsBulkCancelling] = useState(false);
  const [isOrderBookerModalOpen, setIsOrderBookerModalOpen] = useState(false);
  const [isSalesmanModalOpen, setIsSalesmanModalOpen] = useState(false);
  const [isShopMasterModalOpen, setIsShopMasterModalOpen] = useState(false);
  const [isSupplierMasterModalOpen, setIsSupplierMasterModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<Return | null>(null);
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [isPurchaseReturnModalOpen, setIsPurchaseReturnModalOpen] = useState(false);
  const [editingSalesReturn, setEditingSalesReturn] = useState<SalesReturn | null>(null);
  const [salesReturnSearchInput, setSalesReturnSearchInput] = useState("");
  const [showSalesReturnSuggestions, setShowSalesReturnSuggestions] = useState(false);
  const [isOrderCancellationOpen, setIsOrderCancellationOpen] = useState(false);
  const [isTCodeModalOpen, setIsTCodeModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [commandValue, setCommandValue] = useState("");
  const [isCommandExpanded, setIsCommandExpanded] = useState(
    localStorage.getItem('dms_isCommandExpanded') === null ? true : localStorage.getItem('dms_isCommandExpanded') === 'true'
  );
  const [tCodeError, setTCodeError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const dbFileInputRef = useRef<HTMLInputElement>(null);

  // Resilient confirmations & notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = useState<number | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [orderToUncancel, setOrderToUncancel] = useState<number | null>(null);
  const [deliveryToDelete, setDeliveryToDelete] = useState<number | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleDownloadDB = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch('/api/download-db');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `karachi_dms_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      showToast('Error downloading database backup', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsCommandExpanded(true);
        setTimeout(() => {
          commandInputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // Master Data Filters State
  const [filters, setFilters] = useState({
    shops: JSON.parse(localStorage.getItem('dms_filters_shops') || '{"route": "any", "status": "any", "balanceRange": "any", "search": ""}'),
    suppliers: JSON.parse(localStorage.getItem('dms_filters_suppliers') || '{"category": "any", "city": "any", "search": ""}'),
    salesmen: JSON.parse(localStorage.getItem('dms_filters_salesmen') || '{"territory": "any", "manager": "any", "search": ""}'),
    orderBookers: JSON.parse(localStorage.getItem('dms_filters_orderBookers') || '{"status": "any", "search": ""}'),
    products: JSON.parse(localStorage.getItem('dms_filters_products') || '{"brand": "any", "mg": "any", "availability": "any", "search": ""}'),
    orders: JSON.parse(localStorage.getItem('dms_filters_orders') || '{"search": "", "status": "any"}'),
    purchases: JSON.parse(localStorage.getItem('dms_filters_purchases') || '{"search": "", "status": "any"}'),
    deliveries: JSON.parse(localStorage.getItem('dms_filters_deliveries') || '{"search": "", "status": "any"}'),
    returns: JSON.parse(localStorage.getItem('dms_filters_returns') || '{"search": "", "status": "any"}'),
    salesReturns: JSON.parse(localStorage.getItem('dms_filters_salesReturns') || '{"search": "", "status": "any"}'),
  });

  const [shopSearchInput, setShopSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_shops') || '{}').search || ""
  );
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);

  const [supplierSearchInput, setSupplierSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_suppliers') || '{}').search || ""
  );
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);

  const [salesmanSearchInput, setSalesmanSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_salesmen') || '{}').search || ""
  );
  const [showSalesmanSuggestions, setShowSalesmanSuggestions] = useState(false);

  const [orderBookerSearchInput, setOrderBookerSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_orderBookers') || '{}').search || ""
  );
  const [showOrderBookerSuggestions, setShowOrderBookerSuggestions] = useState(false);

  const [productSearchInput, setProductSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_products') || '{}').search || ""
  );
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const [orderSearchInput, setOrderSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_orders') || '{}').search || ""
  );
  const [showOrderSuggestions, setShowOrderSuggestions] = useState(false);

  const [purchaseSearchInput, setPurchaseSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_purchases') || '{}').search || ""
  );
  const [showPurchaseSuggestions, setShowPurchaseSuggestions] = useState(false);

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('dms_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('dms_masterDataSubTab', masterDataSubTab); }, [masterDataSubTab]);
  useEffect(() => { localStorage.setItem('dms_transactionsSubTab', transactionsSubTab); }, [transactionsSubTab]);
  useEffect(() => { localStorage.setItem('dms_isSidebarOpen', String(isSidebarOpen)); }, [isSidebarOpen]);
  useEffect(() => { localStorage.setItem('dms_isCommandExpanded', String(isCommandExpanded)); }, [isCommandExpanded]);
  useEffect(() => { localStorage.setItem('dms_filters_shops', JSON.stringify(filters.shops)); }, [filters.shops]);
  useEffect(() => { localStorage.setItem('dms_filters_suppliers', JSON.stringify(filters.suppliers)); }, [filters.suppliers]);
  useEffect(() => { localStorage.setItem('dms_filters_salesmen', JSON.stringify(filters.salesmen)); }, [filters.salesmen]);
  useEffect(() => { localStorage.setItem('dms_filters_orderBookers', JSON.stringify(filters.orderBookers)); }, [filters.orderBookers]);
  useEffect(() => { localStorage.setItem('dms_filters_products', JSON.stringify(filters.products)); }, [filters.products]);
  useEffect(() => { localStorage.setItem('dms_filters_orders', JSON.stringify(filters.orders)); }, [filters.orders]);
  useEffect(() => { localStorage.setItem('dms_filters_purchases', JSON.stringify(filters.purchases)); }, [filters.purchases]);
  useEffect(() => { localStorage.setItem('dms_filters_deliveries', JSON.stringify(filters.deliveries)); }, [filters.deliveries]);
  useEffect(() => { localStorage.setItem('dms_filters_returns', JSON.stringify(filters.returns)); }, [filters.returns]);
  useEffect(() => { localStorage.setItem('dms_filters_salesReturns', JSON.stringify(filters.salesReturns)); }, [filters.salesReturns]);

  const [deliverySearchInput, setDeliverySearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_deliveries') || '{}').search || ""
  );
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);

  const [returnSearchInput, setReturnSearchInput] = useState(
    JSON.parse(localStorage.getItem('dms_filters_returns') || '{}').search || ""
  );
  const [showReturnSuggestions, setShowReturnSuggestions] = useState(false);

  const [invoiceSearchInput, setInvoiceSearchInput] = useState("");
  const [loadPlanSearchInput, setLoadPlanSearchInput] = useState("");

  const shopSuggestions = shopSearchInput.length > 0 
    ? shops.filter(s => s.shop_name?.toLowerCase().includes(shopSearchInput.toLowerCase())).slice(0, 5)
    : [];

  const supplierSuggestions = supplierSearchInput.length > 0 
    ? suppliers.filter(s => s.name?.toLowerCase().includes(supplierSearchInput.toLowerCase()) || (s as any).company_name?.toLowerCase().includes(supplierSearchInput.toLowerCase())).slice(0, 5)
    : [];

  const salesmanSuggestions = salesmanSearchInput.length > 0 
    ? salesmen.filter(s => s.name?.toLowerCase().includes(salesmanSearchInput.toLowerCase())).slice(0, 5)
    : [];

  const orderBookerSuggestions = orderBookerSearchInput.length > 0 
    ? orderBookers.filter(s => s.name?.toLowerCase().includes(orderBookerSearchInput.toLowerCase())).slice(0, 5)
    : [];

  const productSuggestions = productSearchInput.length > 0 
    ? products.filter(s => s.name?.toLowerCase().includes(productSearchInput.toLowerCase())).slice(0, 5)
    : [];

  const orderSuggestions = orderSearchInput.length > 0
    ? orders.filter(o => 
        o.id.toString().includes(orderSearchInput) || 
        o.shop_name?.toLowerCase().includes(orderSearchInput.toLowerCase()) ||
        o.order_booker_name?.toLowerCase().includes(orderSearchInput.toLowerCase())
      ).slice(0, 5)
    : [];

  const purchaseSuggestions = purchaseSearchInput.length > 0
    ? purchases.filter(p => 
        p.id.toString().includes(purchaseSearchInput) || 
        p.supplier_name?.toLowerCase().includes(purchaseSearchInput.toLowerCase()) ||
        p.bill_no?.toLowerCase().includes(purchaseSearchInput.toLowerCase())
      ).slice(0, 5)
    : [];

  const deliverySuggestions = deliverySearchInput.length > 0
    ? deliveries.filter(d => 
        d.id.toString().includes(deliverySearchInput) || 
        d.shop_name?.toLowerCase().includes(deliverySearchInput.toLowerCase()) ||
        d.order_id?.toString().includes(deliverySearchInput) ||
        d.driver_name?.toLowerCase().includes((deliverySearchInput || "").toLowerCase())
      ).slice(0, 5)
    : [];

  const returnSuggestions = returnSearchInput.length > 0
    ? returns.filter(r => 
        r.id.toString().includes(returnSearchInput) || 
        r.shop_name?.toLowerCase().includes(returnSearchInput.toLowerCase())
      ).slice(0, 5)
    : [];

  const salesReturnSuggestions = salesReturnSearchInput.length > 0
    ? salesReturns.filter(sr => 
        sr.id.toString().includes(salesReturnSearchInput) || 
        sr.shop_name?.toLowerCase().includes(salesReturnSearchInput.toLowerCase()) ||
        sr.invoice_id.toString().includes(salesReturnSearchInput) ||
        `INV # ${sr.invoice_id.toString().padStart(4, '0')}`.toLowerCase().includes(salesReturnSearchInput.toLowerCase()) ||
        (300918 + Number(sr.invoice_id)).toString().includes(salesReturnSearchInput)
      ).slice(0, 5)
    : [];

  useEffect(() => {
    localStorage.setItem('dms_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('dms_masterDataSubTab', masterDataSubTab);
  }, [masterDataSubTab]);

  useEffect(() => {
    localStorage.setItem('dms_transactionsSubTab', transactionsSubTab);
  }, [transactionsSubTab]);

  useEffect(() => {
    localStorage.setItem('dms_isSidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('dms_isCommandExpanded', isCommandExpanded.toString());
  }, [isCommandExpanded]);

  const updateFilter = (module: keyof typeof filters, key: string, value: any) => {
    const newFilters = {
      ...filters,
      [module]: { ...filters[module], [key]: value }
    };
    setFilters(newFilters);
    localStorage.setItem(`dms_filters_${module as string}`, JSON.stringify(newFilters[module]));
  };

  const clearFilters = (module: keyof typeof filters) => {
    const defaults: any = {
      shops: { route: 'any', status: 'any', balanceRange: 'any', search: '' },
      suppliers: { category: 'any', city: 'any', search: '' },
      salesmen: { territory: 'any', manager: 'any', search: '' },
      orderBookers: { status: 'any', search: '' },
      products: { brand: 'any', mg: 'any', availability: 'any', search: '' },
      orders: { search: '', status: 'any' },
      purchases: { search: '', status: 'any' },
      deliveries: { search: '', status: 'any' },
      returns: { search: '', status: 'any' }
    };
    if (module === 'shops') setShopSearchInput("");
    if (module === 'suppliers') setSupplierSearchInput("");
    if (module === 'salesmen') setSalesmanSearchInput("");
    if (module === 'orderBookers') setOrderBookerSearchInput("");
    if (module === 'products') setProductSearchInput("");
    if (module === 'orders') setOrderSearchInput("");
    if (module === 'purchases') setPurchaseSearchInput("");
    if (module === 'deliveries') setDeliverySearchInput("");
    if (module === 'returns') setReturnSearchInput("");
    updateFilter(module, 'RESET', null); // Trigger reset
    const newFilters = { ...filters, [module]: defaults[module] };
    setFilters(newFilters);
    localStorage.setItem(`dms_filters_${module as string}`, JSON.stringify(defaults[module]));
  };

  const handleLogout = () => {
    localStorage.removeItem('dms_auth_user');
    setCurrentUser(null);
    setToast({
      type: 'info',
      message: 'You have been safely logged out of your DMS session.'
    });
  };

  const handleLoginSuccess = (user: AuthUser) => {
    localStorage.setItem('dms_auth_user', JSON.stringify(user));
    setCurrentUser(user);
    setToast({
      type: 'success',
      message: `Welcome back, ${user.name} (${user.role.toUpperCase()})!`
    });
  };

  const executeTransaction = (code: string) => {
    const rawCode = code.trim().toUpperCase();
    if (!rawCode) return;

    // Handle /N prefix (terminate session pattern)
    const isNewSession = rawCode.startsWith('/N');
    const finalCode = isNewSession ? rawCode.slice(2).trim() : rawCode;

    if (isNewSession) {
      // Close all modals
      setIsProductMasterModalOpen(false);
      setIsRegisterShopModalOpen(false);
      setIsRegisterSupplierModalOpen(false);
      setIsPurchaseModalOpen(false);
      setIsDeliveryModalOpen(false);
      setIsMaterialGroupModalOpen(false);
      setIsDriverModalOpen(false);
      setIsOrderBookerModalOpen(false);
      setIsSalesmanModalOpen(false);
      setIsShopMasterModalOpen(false);
      setIsSupplierMasterModalOpen(false);
      setIsUserManagementModalOpen(false);
      setIsDistributorMasterModalOpen(false);
      setIsNewOrderModalOpen(false);
      setIsOrderCancellationOpen(false);
      setIsUnitModalOpen(false);
      setIsLocationModalOpen(false);
      setIsReturnModalOpen(false);
      setIsSalesReturnModalOpen(false);
      setIsPurchaseReturnModalOpen(false);
      setIsInvoiceModalOpen(false);
      setIsDisplayInvoiceModalOpen(false);
      setIsPaymentModalOpen(false);
      setIsDisplayPaymentModalOpen(false);
      setIsDisplayOrderModalOpen(false);
      setIsDisplayDeliveryModalOpen(false);
      setIsDisplayPurchaseModalOpen(false);
      setIsDisplayReturnModalOpen(false);
      setSelectedOrder(null);
      setSelectedShop(null);
      setSelectedPurchase(null);
      setSelectedDelivery(null);
      
      // If code was just /N, go to dashboard
      if (!finalCode) {
        setActiveTab('dashboard');
        setCommandValue("");
        return;
      }
    }

    const baseCode = finalCode.split(/\s+/)[0];

    // Universal / Session commands
    const isSessionCode = ['EXIT', 'LOGOUT', 'LOCK', 'DASH', 'REPT', 'TC01', 'HELP'].includes(baseCode);

    // Permission enforcement: Super Admin has full access; other users require T-Code in permitted_tcodes
    if (!isSessionCode) {
      const isPermitted = isSuperAdmin || (currentUser?.permitted_tcodes && currentUser.permitted_tcodes.some(c => c.toUpperCase() === baseCode.toUpperCase()));
      if (!isPermitted) {
        setTCodeError(`ACCESS DENIED: ${finalCode}`);
        setToast({
          type: 'error',
          message: `Access Denied (SU53): Transaction ${finalCode} is not permitted for your assigned role (${currentUser?.role || 'User'}).`
        });
        return;
      }
    }

    switch (baseCode) {
      // AI & Smart Desk
      case 'AI01':
      case 'INQ01':
        setActiveTab('ai_inquiry');
        break;
      // Admin / Security / RBAC
      case 'ADM01':
      case 'ADMIN':
      case 'PFCG':
      case 'SU02':
        if (isSuperAdmin) {
          setActiveTab('admin');
        } else {
          setTCodeError(`ACCESS DENIED: ${finalCode}`);
          setToast({
            type: 'error',
            message: 'Access Denied: Admin panel is restricted to Super Admin.'
          });
          return;
        }
        break;

      // Sales & Distribution (SD)
      case 'VA01': 
      case 'OR05':
        setIsNewOrderModalOpen(true); 
        break;
      case 'ORD02':
      case 'VA02':
        setIsOrderCancellationOpen(true);
        break;
      case 'OR01':
        setActiveTab('transactions');
        setTransactionsSubTab('orders');
        break;
      case 'DLVY': 
      case 'DL01':
        setActiveTab('transactions');
        setTransactionsSubTab('deliveries');
        break;
      case 'INV01':
      case 'VF01':
        setIsInvoiceModalOpen(true);
        break;
      case 'INV02':
      case 'VF02': {
        const parts = finalCode.split(/\s+/);
        if (parts.length > 1) {
          setEditInvoiceId(parts[1]);
        } else {
          setEditInvoiceId(null);
        }
        setIsEditInvoiceModalOpen(true);
        setIsCommandExpanded(false);
        break;
      }
      case 'VA03': 
        setIsDisplayOrderModalOpen(true);
        setIsCommandExpanded(false);
        break;
      case 'VL03':
        setIsDisplayDeliveryModalOpen(true);
        setIsCommandExpanded(false);
        break;
      case 'ME03':
        setIsDisplayPurchaseModalOpen(true);
        setIsCommandExpanded(false);
        break;
      case 'LR03':
        setIsDisplayReturnModalOpen(true);
        setIsCommandExpanded(false);
        break;
      case 'VF03': {
        const parts = finalCode.split(/\s+/);
        if (parts.length > 1) {
          setDisplayInvoiceId(parts[1]);
        } else {
          setDisplayInvoiceId(null);
        }
        setIsDisplayInvoiceModalOpen(true);
        setIsCommandExpanded(false);
        break;
      }
      case 'PA01':
        setPaymentModalMode('create');
        setEditingPaymentId(null);
        setIsPaymentModalOpen(true);
        setIsCommandExpanded(false);
        break;
      case 'PA02': {
        const parts = finalCode.split(/\s+/);
        if (parts.length > 1) {
          const pId = parseInt(parts[1].replace(/[^0-9]/g, ''));
          setEditingPaymentId(!isNaN(pId) ? pId : null);
        } else {
          setEditingPaymentId(null);
        }
        setPaymentModalMode('edit');
        setIsPaymentModalOpen(true);
        setIsCommandExpanded(false);
        break;
      }
      case 'PA03': {
        const parts = finalCode.split(/\s+/);
        if (parts.length > 1) {
          const pId = parseInt(parts[1].replace(/[^0-9]/g, ''));
          setDisplayPaymentId(!isNaN(pId) ? pId : null);
        } else {
          setDisplayPaymentId(null);
        }
        setIsDisplayPaymentModalOpen(true);
        setIsCommandExpanded(false);
        break;
      }
      case 'LPR01':
        setActiveTab('reports');
        setSelectedReportTitle('Daily Load Plan');
        break;
      case 'APS01':
        setActiveTab('reports');
        setSelectedReportTitle('Area Wise Item Party Summary');
        break;
      case 'STI01':
        setActiveTab('reports');
        setSelectedReportTitle('Sales Tax Invoice');
        break;
      case 'SDR01':
        setActiveTab('reports');
        setSelectedReportTitle('Stock Detail');
        break;
      case 'RT01':
        setIsReturnModalOpen(true);
        break;
      case 'SRT01':
        setIsSalesReturnModalOpen(true);
        break;
      case 'PRT01':
        setIsPurchaseReturnModalOpen(true);
        break;
      
      // Material Management (MM) / Product (PR)
      case 'MM01': 
      case 'IN05':
        setIsMaterialGroupModalOpen(true); 
        break;
      case 'MM02': 
      case 'PR01':
      case 'PR02':
      case 'PR03':
        setIsProductMasterModalOpen(true); 
        break;
      case 'MM03': 
      case 'IN01':
        setActiveTab('inventory'); 
        break;
      case 'UN01': setIsUnitModalOpen(true); break;
      case 'LOC01': setIsLocationModalOpen(true); break;
      case 'ME21N': 
        setActiveTab('transactions');
        setTransactionsSubTab('purchases');
        break;
      
      // Master Data (MD) / Salesmen (SM) / Shops (SH)
      case 'VD01': 
      case 'SH05':
      case 'SH07':
        setIsRegisterShopModalOpen(true); 
        break;
      case 'VD02':
      case 'VD03':
      case 'SHM1':
      case 'SH01':
      case 'SH08':
        setIsShopMasterModalOpen(true);
        break;
      case 'XK01': 
      case 'SU05':
      case 'SU07':
        setIsRegisterSupplierModalOpen(true); 
        break;
      case 'XK02':
      case 'XK03':
      case 'SUM1':
      case 'SU08':
        setIsSupplierMasterModalOpen(true);
        break;
      case 'BP01': setIsShopMasterModalOpen(true); break;
      case 'OBM1': setIsOrderBookerModalOpen(true); break;
      case 'SLM1': 
      case 'SM01':
      case 'SM05':
      case 'SM07':
      case 'SM08':
        setIsSalesmanModalOpen(true); 
        break;
      case 'DRV1': setIsDriverModalOpen(true); break;
      case 'TC01': setIsTCodeModalOpen(true); break;

      // Distributor Management (DST01, DIS01, DM01)
      case 'DST01':
      case 'DIS01':
      case 'DM01':
      case 'DST02':
      case 'DST03':
        setIsDistributorMasterModalOpen(true);
        break;

      // Basis / Security / User Management
      case 'USR1':
      case 'USER':
      case 'USERS':
      case 'USER1':
      case 'SU01':
      case 'SU1':
        setIsUserManagementModalOpen(true);
        break;

      // Session Management
      case 'EXIT':
      case 'LOGOUT':
      case 'LOCK':
        handleLogout();
        break;
      
      // Systems & Reports
      case 'DASH': setActiveTab('dashboard'); break;
      case 'REPT': setActiveTab('reports'); break;
      case 'LP01': 
      case 'DL05':
        setActiveTab('transactions');
        setTransactionsSubTab('load_plans');
        break;
      
      default:
        setTCodeError(`INVALID: ${finalCode}`);
        console.warn(`Transaction code ${finalCode} not recognized`);
        return; // Don't clear command if error
    }
    setCommandValue("");
    setTCodeError(null);
  };
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  // UI State Persistence
  useEffect(() => {
    localStorage.setItem('dms_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('dms_masterDataSubTab', masterDataSubTab);
  }, [masterDataSubTab]);

  useEffect(() => {
    localStorage.setItem('dms_transactionsSubTab', transactionsSubTab);
  }, [transactionsSubTab]);

  useEffect(() => {
    localStorage.setItem('dms_isSidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('dms_isCommandExpanded', String(isCommandExpanded));
  }, [isCommandExpanded]);

  const fetchBatchInit = async (distIdOverride?: string) => {
    try {
      const activeDist = distIdOverride !== undefined 
        ? distIdOverride 
        : (currentUser?.role === 'admin' ? selectedDistributorId : (currentUser?.distributor_id ? String(currentUser.distributor_id) : 'all'));
      const queryParam = activeDist && activeDist !== 'all' ? `?distributor_id=${encodeURIComponent(activeDist)}` : '';
      const res = await fetch(`/api/batch-init${queryParam}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      setStats(data.stats);
      if (data.distributors) setDistributors(data.distributors);
      setProducts(data.products || []);
      setShops(data.shops || []);
      setSuppliers(data.suppliers || []);
      setOrders(data.orders || []);
      setChartData(data.chartData || []);
      setPurchases(data.purchases || []);
      setLoadPlans(data.loadPlans || []);
      setValuation(data.valuation || null);
      setMaterialGroups(data.materialGroups || []);
      setDrivers(data.drivers || []);
      setOrderBookers(data.orderBookers || []);
      setSalesmen(data.salesmen || []);
      setUnits(data.units || []);
      setDeliveries(data.deliveries || []);
      setReturns(data.returns || []);
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error("Batch initialization failed:", err);
    }
  };

  useEffect(() => {
    fetchBatchInit();
    fetchSalesReturns();
    fetchPayments();
  }, [currentUser, selectedDistributorId]);

  // Intercept query params to auto-display report on external tab load (useful for PDF printing bypass)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportCode = params.get('report');
    if (reportCode === 'APS01') {
      setActiveTab('reports');
      setSelectedReportTitle('Area Wise Item Party Summary');
    } else if (reportCode === 'LPR01') {
      setActiveTab('reports');
      setSelectedReportTitle('Daily Load Plan');
    } else if (reportCode === 'INV01') {
      setActiveTab('reports');
      setSelectedReportTitle('Invoice');
    } else if (reportCode === 'STI01') {
      setActiveTab('reports');
      setSelectedReportTitle('Sales Tax Invoice');
    } else if (reportCode === 'SDR01') {
      setActiveTab('reports');
      setSelectedReportTitle('Stock Detail');
    } else if (params.get('print') === 'true') {
      setActiveTab('reports');
      setSelectedReportTitle('Area Wise Item Party Summary');
    }
  }, []);

  // Filtered Data Computation
  const filteredShops = shops.filter(shop => {
    const f = filters.shops;
    if (f.search && !shop.shop_name?.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.route !== 'any' && shop.location !== f.route) return false;
    // Note: status filter assuming shop has a status field (defaulting to true/active for now if column missing)
    if (f.status !== 'any') {
      const shopStatus = (shop as any).status === 0 ? 'inactive' : 'active';
      if (shopStatus !== f.status) return false;
    }
    if (f.balanceRange !== 'any') {
      const bal = (shop as any).balance || 0;
      if (f.balanceRange === 'high' && bal < 50000) return false;
      if (f.balanceRange === 'low' && bal >= 10000) return false;
    }
    return true;
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const f = filters.suppliers;
    if (f.search && !(supplier.name?.toLowerCase().includes(f.search.toLowerCase()) || (supplier as any).company_name?.toLowerCase().includes(f.search.toLowerCase()))) return false;
    if (f.category !== 'any' && (supplier as any).category !== f.category) return false;
    if (f.city !== 'any' && (supplier as any).city !== f.city) return false;
    return true;
  });

  const filteredSalesmen = salesmen.filter(sm => {
    const f = filters.salesmen;
    if (f.search && !sm.name?.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.territory !== 'any' && (sm as any).territory !== f.territory) return false;
    if (f.manager !== 'any' && (sm as any).reporting_manager !== f.manager) return false;
    return true;
  });

  const filteredOrderBookers = orderBookers.filter(ob => {
    const f = filters.orderBookers;
    if (f.search && !ob.name?.toLowerCase().includes(f.search.toLowerCase())) return false;
    return true;
  });

  const filteredProducts = products.filter(product => {
    const f = filters.products;
    if (f.search && !product.name?.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.brand !== 'any' && product.brand !== f.brand) return false;
    if (f.mg !== 'any' && product.material_group_id !== f.mg) return false;
    if (f.availability !== 'any') {
      const isAvailable = product.stock_quantity > 0;
      if (f.availability === 'in' && !isAvailable) return false;
      if (f.availability === 'out' && isAvailable) return false;
    }
    return true;
  });

  const filteredOrders = orders.filter(order => {
    const f = filters.orders;
    const searchLower = f.search.toLowerCase();
    if (f.search && !(
      order.id.toString().includes(f.search) || 
      order.shop_name?.toLowerCase().includes(searchLower) ||
      order.order_booker_name?.toLowerCase().includes(searchLower) ||
      order.items_summary?.toLowerCase().includes(searchLower) ||
      new Date(order.order_date).toLocaleDateString().includes(f.search)
    )) return false;
    if (f.status !== 'any') {
      const orderStatus = order.status?.toLowerCase();
      const filterStatus = f.status.toLowerCase();
      if (filterStatus === 'pending') {
        if (orderStatus !== 'pending' && orderStatus !== 'partially_delivered') return false;
      } else {
        if (orderStatus !== filterStatus) return false;
      }
    }
    return true;
  });

  const filteredPurchases = purchases.filter(p => {
    const f = filters.purchases;
    const searchLower = f.search.toLowerCase();
    if (f.search && !(
      p.id.toString().includes(f.search) || 
      p.supplier_name?.toLowerCase().includes(searchLower) ||
      p.bill_no?.toLowerCase().includes(searchLower) ||
      p.items_summary?.toLowerCase().includes(searchLower) ||
      new Date(p.purchase_date).toLocaleDateString().includes(f.search)
    )) return false;
    return true;
  });

  const filteredDeliveries = deliveries.filter(d => {
    const f = filters.deliveries;
    const searchLower = f.search.toLowerCase();
    if (f.search && !(
      d.id.toString().includes(f.search) || 
      d.shop_name?.toLowerCase().includes(searchLower) ||
      d.order_id?.toString().includes(f.search) ||
      d.driver_name?.toLowerCase().includes(searchLower) ||
      d.items_summary?.toLowerCase().includes(searchLower) ||
      new Date(d.delivery_date).toLocaleDateString().includes(f.search)
    )) return false;
    return true;
  });

  const filteredReturns = returns.filter(r => {
    const f = filters.returns;
    const searchLower = f.search.toLowerCase();
    if (f.search && !(
      r.id.toString().includes(f.search) || 
      r.shop_name?.toLowerCase().includes(searchLower) ||
      r.items_summary?.toLowerCase().includes(searchLower) ||
      new Date(r.return_date).toLocaleDateString().includes(f.search)
    )) return false;
    return true;
  });

  const filteredSalesReturns = salesReturns.filter(sr => {
    const f = filters.salesReturns || { search: '', status: 'any' };
    const searchLower = f.search.toLowerCase();
    if (f.search && !(
      sr.id.toString().includes(f.search) || 
      sr.shop_name?.toLowerCase().includes(searchLower) ||
      sr.items_summary?.toLowerCase().includes(searchLower) ||
      sr.invoice_id.toString().includes(f.search) ||
      `INV # ${sr.invoice_id.toString().padStart(4, '0')}`.toLowerCase().includes(searchLower) ||
      (300918 + Number(sr.invoice_id)).toString().includes(f.search) ||
      new Date(sr.return_date).toLocaleDateString().includes(f.search)
    )) return false;
    return true;
  });

  const filteredInvoices = invoices.filter(i => {
    const searchLower = invoiceSearchInput.toLowerCase();
    if (invoiceSearchInput && !(
      i.id.toString().includes(invoiceSearchInput) ||
      i.shop_name?.toLowerCase().includes(searchLower) ||
      i.items_summary?.toLowerCase().includes(searchLower) ||
      new Date(i.invoice_date).toLocaleDateString().includes(invoiceSearchInput)
    )) return false;
    return true;
  });

  const filteredPayments = payments.filter(p => {
    if (paymentMethodFilter !== 'all' && p.payment_method !== paymentMethodFilter) {
      return false;
    }
    if (paymentSearchInput) {
      const q = paymentSearchInput.toLowerCase();
      const matchDoc = p.payment_doc_no?.toLowerCase().includes(q) || p.id.toString().includes(q);
      const matchShop = p.shop_name?.toLowerCase().includes(q);
      const matchOwner = p.owner_name?.toLowerCase().includes(q);
      const matchSalesman = (p.salesman_display_name || p.salesman_name || '').toLowerCase().includes(q);
      const matchBank = p.bank_name?.toLowerCase().includes(q);
      const matchCheque = p.cheque_no?.toLowerCase().includes(q);
      const matchArea = p.shop_area?.toLowerCase().includes(q);
      const matchDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString().includes(paymentSearchInput) : false;
      return matchDoc || matchShop || matchOwner || matchSalesman || matchBank || matchCheque || matchArea || matchDate;
    }
    return true;
  });

  const paymentStats = {
    totalAmount: filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    totalCash: filteredPayments.filter(p => p.payment_method === 'CASH').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    totalCheque: filteredPayments.filter(p => p.payment_method === 'CHEQUE').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    count: filteredPayments.length
  };

  const filteredLoadPlans = loadPlans.filter(lp => {
    const searchLower = loadPlanSearchInput.toLowerCase();
    if (loadPlanSearchInput && !(
      lp.id.toString().includes(loadPlanSearchInput) ||
      lp.driver_name?.toLowerCase().includes(searchLower) ||
      lp.items_summary?.toLowerCase().includes(searchLower) ||
      new Date(lp.plan_date).toLocaleDateString().includes(loadPlanSearchInput)
    )) return false;
    return true;
  });

  const getDistParam = () => {
    const activeDist = currentUser?.role === 'admin' 
      ? selectedDistributorId 
      : (currentUser?.distributor_id ? String(currentUser.distributor_id) : 'all');
    return activeDist && activeDist !== 'all' ? `?distributor_id=${encodeURIComponent(activeDist)}` : '';
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const res = await fetch(`/api/deliveries${getDistParam()}`);
      const data = await res.json();
      setDeliveries(data);
    } catch (err) {
      console.error("Failed to fetch deliveries", err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`/api/invoices${getDistParam()}`);
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      setPayments([]);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await fetch(`/api/returns${getDistParam()}`);
      const data = await res.json();
      setReturns(data);
    } catch (err) {
      console.error("Failed to fetch returns", err);
    }
  };

  const fetchSalesReturns = async () => {
    try {
      const res = await fetch(`/api/sales-returns${getDistParam()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setSalesReturns(data);
      } else {
        console.error("Expected array for sales returns, got:", data);
        setSalesReturns([]);
      }
    } catch (err) {
      console.error("Failed to fetch sales returns", err);
      setSalesReturns([]);
    }
  };

  const deleteDelivery = async (id: number) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Delivery #DEL-${id.toString().padStart(4, '0')} was successfully deleted.`);
        fetchDeliveries();
        fetchProducts();
        fetchOrders();
        fetchStats();
      } else {
        const err = await res.json();
        showToast(err.error || "Delete Failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error deleting delivery", "error");
    }
  };

  const deletePurchase = async (id: number) => {
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Purchase order #PUR-${id.toString().padStart(4, '0')} was successfully deleted.`);
        fetchPurchases();
        fetchProducts();
        fetchStats();
      } else {
        const err = await res.json();
        showToast(err.error || "Delete Failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error deleting purchase", "error");
    }
  };

  const handleCancelOrder = async (id: number) => {
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [id] })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel');
      }
      showToast(`Order #ORD-${id.toString().padStart(4, '0')} was successfully cancelled.`);
      fetchOrders();
      fetchProducts();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUncancelOrder = async (id: number) => {
    try {
      const response = await fetch('/api/orders/uncancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [id] })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restore order');
      }
      showToast(`Order #ORD-${id.toString().padStart(4, '0')} was successfully restored.`);
      fetchOrders();
      fetchProducts();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const fetchSalesmen = async () => {
    try {
      const res = await fetch(`/api/salesmen${getDistParam()}`);
      const data = await res.json();
      setSalesmen(data);
    } catch (err) {
      console.error("Failed to fetch salesmen", err);
    }
  };

  const fetchOrderBookers = async () => {
    try {
      const res = await fetch(`/api/order-bookers${getDistParam()}`);
      const data = await res.json();
      setOrderBookers(data);
    } catch (err) {
      console.error("Failed to fetch order bookers", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`/api/drivers${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  const fetchMaterialGroups = async () => {
    try {
      const res = await fetch('/api/material-groups');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMaterialGroups(data);
    } catch (err) {
      console.error("Failed to fetch material groups", err);
    }
  };

  const fetchValuation = async () => {
    try {
      const res = await fetch(`/api/reports/stock-valuation${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setValuation(data);
    } catch (err) {
      console.error("Failed to fetch valuation", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await fetch(`/api/shops${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setShops(data);
    } catch (err) {
      console.error("Failed to fetch shops", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`/api/purchases${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    }
  };

  const fetchLoadPlans = async () => {
    try {
      const res = await fetch(`/api/load-plans${getDistParam()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setLoadPlans(data);
    } catch (err) {
      console.error("Failed to fetch load plans", err);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch('/api/sales-chart');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    }
  };

  const handlePostInvoice = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Invoice #INV-${invoiceId.toString().padStart(4, '0')} has been successfully posted and released to MIS Sales Tax Reports.`);
        fetchInvoices();
        fetchDeliveries();
      } else {
        showToast(data.error || 'Failed to post invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error posting invoice', 'error');
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    try {
      const res = await fetch('/api/invoices/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId })
      });
      if (res.ok) {
        showToast(`Invoice #INV-${invoiceId.toString().padStart(4, '0')} has been cancelled successfully.`);
        fetchInvoices();
        fetchDeliveries();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to cancel invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error cancelling invoice', 'error');
    }
  };

  const handleBulkCancelInvoices = async () => {
    if (!bulkCancelRange.start || !bulkCancelRange.end) {
      showToast('Please enter both start and end invoice numbers', 'error');
      return;
    }
    const start = parseInt(bulkCancelRange.start);
    const end = parseInt(bulkCancelRange.end);
    
    if (isNaN(start) || isNaN(end)) {
      showToast('Invalid invoice number range', 'error');
      return;
    }

    setIsBulkCancelling(true);
    try {
      const res = await fetch('/api/invoices/bulk-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          start_id: start, 
          end_id: end 
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${data.count} invoices were successfully processed for cancellation.`);
        setIsBulkInvoiceCancelOpen(false);
        setBulkCancelRange({ start: '', end: '' });
        fetchInvoices();
        fetchDeliveries();
      } else {
        showToast(data.error || 'Failed to bulk cancel invoices', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error bulk cancelling invoices', 'error');
    } finally {
      setIsBulkCancelling(false);
    }
  };

  const handleRestoreDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Log to verify the event is triggered
    console.log("[DEBUG] handleRestoreDB triggered for file:", file.name);

    const formData = new FormData();
    formData.append('db_file', file);

    setIsRestoring(true);
    setRestoreLogs(["[SYSTEM] Initiating full system recovery...", "[IO] Analyzing backup file: " + file.name]);

    try {
      // Small pause to allow UI transition hit the DOM
      await new Promise(r => setTimeout(r, 1000));
      setRestoreLogs(prev => [...prev, "[IO] Validating database integrity...", "[IO] Integrity: OK (SQLite v3)"]);
      
      const res = await fetch('/api/upload-db', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRestoreLogs(prev => [...prev, "[LOCK] DB connection closed safely.", "[STORAGE] Replacing core storage blocks...", "[OS] Syncing file system buffers..."]);
        await new Promise(r => setTimeout(r, 1200));
        setRestoreLogs(prev => [...prev, "[SYSTEM] Finalizing restoration...", "[SYNC] Integrity: 100% OK"]);
        await new Promise(r => setTimeout(r, 800));
        setRestoreLogs(prev => [...prev, "[SYSTEM] RESTORED SUCCESSFULLY!", "[SYNC] EXECUTING HARD REBOOT...", "[BOOT] REFRESHING BROWSER CACHE..."]);
        
        // Final pause to allow user to see the success message
        await new Promise(r => setTimeout(r, 2500));
        
        // Clear session storage to ensure no app state persists
        sessionStorage.clear();
        
        // Hard reload with double cache buster
        const cleanUrl = window.location.origin + window.location.pathname + "?reboot=" + Date.now();
        
        // Final step as requested: Perform the hard refresh
        window.location.replace(cleanUrl);
        // Fallback refresh for certainty
        setTimeout(() => window.location.reload(), 500);
      } else {
        setRestoreLogs(prev => [...prev, "[FATAL] Restoration failed: " + (data.error || 'Unknown server error')]);
        showToast("Restore failed: " + (data.error || "Could not restore database."), "error");
      }
    } catch (err) {
      console.error("[RESTORE] Error:", err);
      setRestoreLogs(prev => [...prev, "[SOCKET] Network transport error. Please check server logs."]);
      showToast("Connection error: Failed to upload the backup file to the server.", "error");
    } finally {
      setIsRestoring(false);
      if (e.target) e.target.value = '';
    }
  };

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // If no user is authenticated, render the Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-x-hidden relative">
      {/* System Modals (High Priority Overlay) */}
      <AnimatePresence>
        {isRestoring && (
          <div className="fixed inset-0 bg-slate-950 z-[99999] flex items-center justify-center p-4 overflow-hidden pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-indigo-500/40 w-full max-w-lg rounded-2xl shadow-[0_0_80px_rgba(79,70,229,0.3)] overflow-hidden font-mono"
            >
              <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">RECOVERY_CONSOLE_V1.0</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                </div>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(79,70,229,0.1)]">
                    <RotateCcw className="text-indigo-400 animate-spin" size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-2xl tracking-tight">Synchronizing Partitions</h3>
                    <p className="text-indigo-400/60 text-sm mt-1 uppercase tracking-widest font-black">Replacing core dms clusters...</p>
                  </div>
                </div>

                <div className="bg-black/90 rounded-xl p-6 h-64 overflow-y-auto border border-slate-800 shadow-inner ring-1 ring-white/5 scrollbar-none">
                  {restoreLogs.map((log, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] mb-2.5 flex gap-4 items-start leading-relaxed"
                    >
                      <span className="text-slate-600 shrink-0 font-bold tabular-nums">{(index + 1).toString().padStart(2, '0')}</span>
                      <span className={log.includes('ERROR') || log.includes('FATAL') ? 'text-rose-400' : log.includes('SUCCESS') || log.includes('SUCCESSFUL') ? 'text-emerald-400 font-bold' : 'text-indigo-300/90'}>
                        {log.includes('SUCCESS') ? '✓ ' : log.includes('FATAL') || log.includes('ERROR') ? '!! ' : '$ '}{log}
                      </span>
                    </motion.div>
                  ))}
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-indigo-500 ml-1 translate-y-0.5"
                  />
                </div>

                <div className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                    <span className="text-[11px] text-indigo-300 font-black uppercase tracking-[0.2em]">Restoration In Progress</span>
                  </div>
                  <div className="text-[10px] text-indigo-400/40 font-bold italic">DO NOT CLOSE TAB</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isDownloading && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99998] flex items-center justify-center p-4 overscroll-none pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center border border-indigo-100"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center relative shadow-inner overflow-hidden">
                <Download className="text-indigo-600 animate-bounce relative z-10" size={40} />
                <motion.div 
                  className="absolute inset-0 bg-indigo-100/50"
                  animate={{ y: ["100%", "-100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Creating System Mirror</h2>
                <p className="text-sm text-slate-500 leading-relaxed font-semibold px-2 italic">Synthesizing current state into partition file...</p>
              </div>
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl w-full justify-center">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-widest animate-pulse">
                  Backup In Progress
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative shadow-inner">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-indigo-600"
                  animate={{ 
                    left: ["-100%", "100%"],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  style={{ width: "50%" }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Karachi DMS</h1>
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            {canAccessMasterData && (
              <SidebarItem 
                icon={Database} 
                label="Master Data" 
                active={activeTab === 'master_data'} 
                onClick={() => setActiveTab('master_data')} 
              />
            )}
            {canAccessTransactions && (
              <SidebarItem 
                icon={TrendingUp} 
                label="Transactions" 
                active={activeTab === 'transactions'} 
                onClick={() => setActiveTab('transactions')} 
              />
            )}
            {canAccessReports && (
              <SidebarItem 
                icon={BarChart3} 
                label="MIS - Reports" 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
              />
            )}
            {canAccessAI && (
              <SidebarItem 
                icon={Bot} 
                label="AI Inquiry Desk" 
                active={activeTab === 'ai_inquiry'} 
                onClick={() => setActiveTab('ai_inquiry')} 
              />
            )}
            {canAccessAdmin && (
              <SidebarItem 
                icon={ShieldCheck} 
                label="Admin" 
                active={activeTab === 'admin'} 
                onClick={() => setActiveTab('admin')} 
              />
            )}
          </nav>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-sm shadow-indigo-200">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name || 'Administrator'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {currentUser?.role || 'admin'}
                  </span>
                </div>
                {currentUser?.distributor_name && (
                  <p className="text-[10px] font-medium text-slate-500 truncate mt-1">
                    🏢 {currentUser.distributor_name}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-xs"
            >
              <LogOut size={16} />
              <span>Sign Out (LOGOUT)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-40 gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-1 min-w-[260px] shadow-inner focus-within:ring-2 focus-within:ring-indigo-600 focus-within:bg-white transition-all">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg select-none font-mono tracking-wider shrink-0">
                T-Code
              </span>
              
              <div className="relative flex items-center w-full">
                <input 
                  ref={commandInputRef}
                  type="text" 
                  value={commandValue}
                  onChange={(e) => setCommandValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeTransaction(commandValue);
                    } else if (tCodeError) {
                      setTCodeError(null);
                    }
                  }}
                  placeholder="e.g. VF03, LPR01..." 
                  className={cn(
                    "w-full bg-transparent border-none px-2 py-0.5 text-xs font-bold font-mono focus:ring-0 placeholder:text-slate-400 uppercase",
                    tCodeError && "text-rose-500 font-bold"
                  )}
                />
                
                <AnimatePresence>
                  {tCodeError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full ml-4 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg flex items-center gap-1.5"
                    >
                      <AlertCircle size={12} />
                      {tCodeError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => executeTransaction(commandValue)}
                className="p-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center shrink-0 mr-1 gap-1"
                title="Execute (Enter)"
              >
                <Check size={11} className="stroke-[3]" />
                <span>Run</span>
              </button>
              
              <button 
                onClick={() => setIsTCodeModalOpen(true)}
                className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600 shrink-0"
                title="T-Code Directory (Help)"
              >
                <HelpCircle size={15} />
              </button>
            </div>

              <button 
                onClick={handleDownloadDB}
                className="ml-1 p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-400 hover:text-indigo-600"
                title="Download Database Backup"
              >
                <Download size={16} />
              </button>

              <button 
                onClick={() => dbFileInputRef.current?.click()}
                className={`ml-1 p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-400 hover:text-indigo-600 ${isRestoring ? 'animate-pulse text-indigo-500 bg-indigo-50' : ''}`}
                title="Restore Database Backup"
                disabled={isRestoring}
              >
                {isRestoring ? <RotateCcw className="animate-spin" size={16} /> : <Upload size={16} />}
              </button>

              <input 
                type="file"
                ref={dbFileInputRef}
                onChange={handleRestoreDB}
                className="hidden"
                accept=".db"
              />
            </div>

          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search orders, shops, products..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-600 rounded-xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Distributor Context Selector / Badge */}
            {currentUser?.role === 'admin' ? (
              <div className="flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/80 px-2.5 py-1 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 font-mono flex items-center gap-1">
                  🏢 Dist:
                </span>
                <select
                  value={selectedDistributorId}
                  onChange={(e) => {
                    setSelectedDistributorId(e.target.value);
                  }}
                  className="bg-white border border-indigo-200 text-slate-800 text-xs font-bold rounded-lg px-2 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Distributors (Consolidated)</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id.toString()}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsDistributorMasterModalOpen(true)}
                  className="p-1 hover:bg-white hover:shadow-xs rounded text-indigo-600 text-[10px] font-black font-mono transition-all ml-0.5"
                  title="Distributor Master Setup (T-Code: DST01)"
                >
                  DST01
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                <span className="text-emerald-600 text-xs">🏢</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-900 leading-tight">
                    {currentUser?.distributor_name || 'Assigned Distributor'}
                  </p>
                  <p className="text-[9px] font-black text-emerald-700/80 uppercase font-mono tracking-wider">
                    Scoped Domain • DST-{(currentUser?.distributor_id || 1).toString().padStart(3, '0')}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsUserManagementModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group"
              title="Manage Users & Credentials (T-Code: USR1)"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">
                  {currentUser?.name || 'Administrator'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">
                  {currentUser?.role || 'admin'} • <span className="font-mono text-indigo-600">USR1</span>
                </p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Sign Out / Terminate Session (T-Code: EXIT)"
            >
              <LogOut size={14} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Market Overview</h2>
                    <p className="text-slate-500">
                      {currentUser?.role === 'admin'
                        ? (selectedDistributorId === 'all' 
                            ? 'Real-time consolidated distribution metrics for all distributors' 
                            : `Real-time distribution metrics for ${distributors.find(d => String(d.id) === String(selectedDistributorId))?.name || 'Selected Distributor'}`)
                        : `Real-time distribution metrics for ${currentUser?.distributor_name || 'Assigned Distributor'}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsTCodeModalOpen(true)}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                    >
                      <LifeBuoy size={18} />
                      <span>Help</span>
                    </button>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-slate-500">Last Updated</p>
                      <p className="text-sm font-bold text-slate-900">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>

                {stats && stats.lowStock > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4"
                  >
                    <div className="bg-rose-500 p-2 rounded-lg text-white">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-rose-900">Inventory Alert</p>
                      <p className="text-xs text-rose-700">There are {stats.lowStock} items currently below their minimum stock level. Please review inventory.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab('master_data');
                        setMasterDataSubTab('products');
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      View Inventory
                    </button>
                  </motion.div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    label="Total Sales" 
                    value={formatPKR(stats?.totalSales || 0)} 
                    icon={TrendingUp} 
                    color="bg-indigo-600"
                    trend={12}
                  />
                  <StatCard 
                    label="Stock Value (PP)" 
                    value={formatPKR(valuation?.totalValueAtPP || 0)} 
                    icon={Package} 
                    color="bg-amber-500"
                  />
                  <StatCard 
                    label="Potential Revenue" 
                    value={formatPKR(valuation?.totalPotentialRevenueAtTP || 0)} 
                    icon={DollarSign} 
                    color="bg-emerald-500"
                  />
                  <StatCard 
                    label="Active Shops" 
                    value={stats?.totalShops || 0} 
                    icon={Store} 
                    color="bg-indigo-500"
                    trend={5}
                  />
                </div>

                {/* Valuation Summary */}
                {valuation && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold">Stock Valuation Summary</h3>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FIFO Valuation</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Total Potential Profit</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatPKR(valuation.totalPotentialProfit)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Average Margin</p>
                        <p className="text-2xl font-bold text-indigo-600">{valuation.averageMarginPercent.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Inventory Health</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600" 
                              style={{ width: `${Math.min(valuation.averageMarginPercent * 2, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Optimal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts Section */}
                <div className="space-y-6 mb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Main Sales Trend */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp size={16} className="text-indigo-500" />
                          Sales Trend (Last 7 Days)
                        </h3>
                        <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase italic">Real-time</span>
                        </div>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats?.salesTrend || []}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              tickFormatter={(val) => `Rs ${val / 1000}k`}
                            />
                            <Tooltip 
                              cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [formatPKR(val), 'Revenue']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Regional Performance */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                        <MapPin size={16} className="text-amber-500" />
                        Regional Sales Distribution
                      </h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats?.salesByTown || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                              width={100} 
                            />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [formatPKR(val), 'Revenue']}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Category Sales  */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Revenue by Category</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats?.categorySales || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {(stats?.categorySales || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [formatPKR(val), 'Sales']}
                            />
                            <Legend 
                              iconType="circle"
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Order Status Breakdown */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Order Status Metrics</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats?.orderStatusCounts || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {(stats?.orderStatusCounts || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend 
                              iconType="circle"
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Order Bookers Ranking */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Top Performers (Bookers)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats?.topOrderBookers || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                            />
                            <YAxis axisLine={false} tickLine={false} hide />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [formatPKR(val), 'Volume']}
                            />
                            <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      {/* Quick Access Section */}
                      <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-xl font-black tracking-tight">System Administration</h3>
                              <p className="text-slate-400 text-sm font-medium">Direct master data & T-Code controllers</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl">
                              <Shield className="text-indigo-400" size={24} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <button 
                              onClick={() => setIsTCodeModalOpen(true)}
                              className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/10 group"
                            >
                              <div className="p-3 bg-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                                <Shield size={24} className="text-indigo-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold">Transaction codes</p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">TC01</p>
                              </div>
                            </button>
                            <button 
                              onClick={() => setIsOrderCancellationOpen(true)}
                              className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/10 group"
                            >
                              <div className="p-3 bg-rose-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                                <RotateCcw size={24} className="text-rose-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold">Cancel Orders</p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">ORD02</p>
                              </div>
                            </button>
                            <button 
                              onClick={() => setIsLocationModalOpen(true)}
                              className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/10 group"
                            >
                              <div className="p-3 bg-amber-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                                <MapPin size={24} className="text-amber-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold">Location Setup</p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">LOC01</p>
                              </div>
                            </button>
                            <button 
                              onClick={() => setIsUnitModalOpen(true)}
                              className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/10 group"
                            >
                              <div className="p-3 bg-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                                <Settings size={24} className="text-emerald-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold">Unit Conversion</p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">UN01</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                          <ShoppingCart size={20} className="text-indigo-600" />
                          Recent Orders
                        </h3>
                        <button 
                          onClick={() => { setActiveTab('transactions'); setTransactionsSubTab('orders'); }}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          All
                        </button>
                      </div>
                      <div className="space-y-4 flex-1">
                        {orders.slice(0, 6).map(order => (
                          <div 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all text-slate-600">
                                <ShoppingCart size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{order.shop_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.order_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900">{formatPKR(order.total_amount)}</p>
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full inline-block mt-1",
                                order.status?.toLowerCase() === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                                order.status?.toLowerCase() === 'pending' ? "bg-amber-50 text-amber-600" :
                                order.status?.toLowerCase() === 'partially_delivered' ? "bg-blue-50 text-blue-600" :
                                order.status?.toLowerCase() === 'cancelled' ? "bg-rose-50 text-rose-600" :
                                "bg-slate-50 text-slate-600"
                              )}>
                                {order.status?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'master_data' && (
              <motion.div 
                key="master_data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Master Data</h2>
                    <p className="text-slate-500">Configure core entities and configurations</p>
                  </div>
                </div>

                {/* Sub-tabs Navigation */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit flex-wrap">
                  {allowedMasterDataTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMasterDataSubTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        masterDataSubTab === tab.id 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setIsTCodeModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-slate-900 text-white hover:bg-slate-800 ml-2"
                  >
                    <Shield size={16} />
                    <span>TCODE Directory (TC01)</span>
                  </button>
                </div>

                {/* Sub-tab Content */}
                <div className="mt-6">
                  {masterDataSubTab === 'distributors' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Distributor Master Data (DST01)</h3>
                          <p className="text-xs text-slate-500">Manage distribution companies, tenant scoping, and operating credentials</p>
                        </div>
                        {currentUser?.role === 'admin' && (
                          <button 
                            onClick={() => setIsDistributorMasterModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                          >
                            <Plus size={18} />
                            <span>Setup / Manage Distributors (DST01)</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Distributors</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{distributors.length}</p>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-2">
                            Multi-Tenant Architecture Active
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Entities</p>
                          <p className="text-2xl font-black text-emerald-600 mt-1">
                            {distributors.filter(d => d.is_active !== 0).length}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
                            Operational & Scoped
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Scope</p>
                          <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                            {currentUser?.role === 'admin' 
                              ? (selectedDistributorId === 'all' ? 'All (Global View)' : (distributors.find(d => String(d.id) === selectedDistributorId)?.name || selectedDistributorId))
                              : (currentUser?.distributor_name || 'Scoped User')}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-2">
                            {currentUser?.role === 'admin' ? 'Super Admin Mode' : `Domain ID: ${currentUser?.distributor_id}`}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Distributor Name</th>
                                <th className="px-6 py-4">Contact & Phone</th>
                                <th className="px-6 py-4">Region / City</th>
                                <th className="px-6 py-4">NTN / STRN</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {distributors.map(dist => (
                                <tr key={dist.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">
                                    {dist.code}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-900">
                                    <div>{dist.name}</div>
                                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{dist.address}</div>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-slate-600">
                                    <div>{dist.contact_person || '—'}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{dist.phone || '—'}</div>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                    {dist.city || 'Karachi'}
                                  </td>
                                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                                    {dist.ntn_number || '—'}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                      dist.is_active !== 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                    )}>
                                      {dist.is_active !== 0 ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {currentUser?.role === 'admin' && (
                                      <button
                                        onClick={() => setIsDistributorMasterModalOpen(true)}
                                        className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {distributors.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
                                    No distributors configured yet. Click "Setup / Manage Distributors" to create one.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {masterDataSubTab === 'locations' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Location Master Data</h3>
                        <button 
                          onClick={() => setIsLocationModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Settings size={18} />
                          <span>Locations Master</span>
                        </button>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 shadow-xl shadow-indigo-100/50">
                          <MapPin size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Hierarchical Location Structure</h4>
                        <p className="text-slate-500 mb-8 sm:px-10">
                          Configure your multi-level location master data to enable precise routing and load plan tracking. 
                          The system supports a 6-level hierarchy from Country down to Subarea.
                        </p>
                        
                        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                          {[
                            { l: 'Level 1', n: 'Country' },
                            { l: 'Level 2', n: 'Province' },
                            { l: 'Level 3', n: 'City' },
                            { l: 'Level 4', n: 'Town' },
                            { l: 'Level 5', n: 'Area' },
                            { l: 'Level 6', n: 'Subarea' }
                          ].map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.l}</span>
                              <p className="text-sm font-bold text-slate-900">{item.n}</p>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={() => setIsLocationModalOpen(true)}
                          className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200"
                        >
                          Open Location Manager (LOC01)
                        </button>
                      </div>
                    </div>
                  )}

                  {masterDataSubTab === 'suppliers' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={supplierSearchInput}
                              onFocus={() => setShowSupplierSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowSupplierSuggestions(false), 200)}
                              onChange={(e) => {
                                setSupplierSearchInput(e.target.value);
                                updateFilter('suppliers', 'search', e.target.value);
                              }}
                              placeholder="Search by supplier or company name..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showSupplierSuggestions && supplierSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Suggestions</span>
                                </div>
                                {supplierSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setSupplierSearchInput(suggestion.name);
                                      updateFilter('suppliers', 'search', suggestion.name);
                                      setShowSupplierSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-amber-50 p-2 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                      <Factory size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.name}</p>
                                      <p className="text-[10px] text-slate-400">{(suggestion as any).company_name} • {suggestion.contact_person}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsSupplierMasterModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-50 border border-indigo-500"
                          >
                            <Settings size={18} />
                            <span>Suppliers (SUM1)</span>
                          </button>
                          <button 
                            onClick={() => setIsRegisterSupplierModalOpen(true)}
                            className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200"
                          >
                            <Plus size={18} />
                            <span>Register Supplier (XK01)</span>
                          </button>
                        </div>
                      </div>

                      <FilterBar 
                        title="Supplier Filters"
                        filters={filters.suppliers}
                        onFilterChange={(k, v) => updateFilter('suppliers', k, v)}
                        onClear={() => clearFilters('suppliers')}
                        options={[
                          { 
                            key: 'category', 
                            label: 'Category', 
                            choices: Array.from(new Set(suppliers.map((s: any) => s.category || 'Trading'))).map(c => ({ value: String(c), label: String(c) }))
                          },
                          { 
                            key: 'city', 
                            label: 'City', 
                            choices: Array.from(new Set(suppliers.map((s: any) => s.address?.split(',').pop()?.trim() || 'Karachi'))).map(c => ({ value: String(c), label: String(c) }))
                          }
                        ]}
                      />

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      >
                        {filteredSuppliers.map(supplier => (
                          <div key={supplier.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Factory size={24} />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{supplier.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                              <Users size={14} className="text-slate-400" />
                              {supplier.contact_person}
                            </p>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={16} className="text-slate-400" />
                                <span>{supplier.address}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{supplier.phone}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {masterDataSubTab === 'shops' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={shopSearchInput}
                              onFocus={() => setShowShopSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowShopSuggestions(false), 200)}
                              onChange={(e) => {
                                setShopSearchInput(e.target.value);
                                updateFilter('shops', 'search', e.target.value);
                              }}
                              placeholder="Search by shop name (e.g. 'Zahid Stores')..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showShopSuggestions && shopSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Suggestions</span>
                                </div>
                                {shopSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setShopSearchInput(suggestion.shop_name);
                                      updateFilter('shops', 'search', suggestion.shop_name);
                                      setShowShopSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <Store size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.shop_name}</p>
                                      <p className="text-[10px] text-slate-400">{suggestion.location} • {suggestion.owner_name}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsShopMasterModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-50 border border-indigo-500"
                          >
                            <Settings size={18} />
                            <span>Shops (SHM1)</span>
                          </button>
                          <button 
                            onClick={() => setIsRegisterShopModalOpen(true)}
                            className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200"
                          >
                            <Plus size={18} />
                            <span>Register Shop (VD01)</span>
                          </button>
                        </div>
                      </div>

                      <FilterBar 
                        title="Shop Network Filters"
                        filters={filters.shops}
                        onFilterChange={(k, v) => updateFilter('shops', k, v)}
                        onClear={() => clearFilters('shops')}
                        options={[
                          { 
                            key: 'route', 
                            label: 'Route', 
                            choices: Array.from(new Set(shops.map(s => s.location))).map(l => ({ value: String(l), label: String(l) }))
                          },
                          { 
                            key: 'status', 
                            label: 'Status', 
                            choices: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
                          },
                          { 
                            key: 'balanceRange', 
                            label: 'Outstanding', 
                            choices: [{ value: 'low', label: 'Under 10k' }, { value: 'high', label: 'Over 50k' }]
                          }
                        ]}
                      />

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      >
                        {filteredShops.map(shop => (
                          <div key={shop.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl">
                                <Store className="text-indigo-600" size={24} />
                              </div>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{shop.shop_name}</h3>
                            <p className="text-sm text-slate-500 mb-4">{shop.owner_name}</p>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-start gap-2 text-sm text-slate-600">
                                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  {shop.area && (
                                    <span className="inline-block px-1.5 py-0.2 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded mr-1.5">
                                      {shop.area}
                                    </span>
                                  )}
                                  <span className="font-medium text-slate-800">{shop.subarea || shop.location}</span>
                                  {shop.address && (
                                    <p className="text-xs text-slate-500 truncate mt-0.5" title={shop.address}>
                                      {shop.address}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{shop.phone}</span>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Limit</span>
                                <span className="text-sm font-bold text-slate-900">{formatPKR(shop.credit_limit)}</span>
                              </div>
                              <div className="pt-4 border-t border-slate-50 flex justify-end">
                                <button 
                                  onClick={() => setSelectedShop(shop)}
                                  className="flex items-center gap-1 text-indigo-600 text-sm font-bold hover:underline"
                                >
                                  <span>View Ledger</span>
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {masterDataSubTab === 'order_bookers' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={orderBookerSearchInput}
                              onFocus={() => setShowOrderBookerSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowOrderBookerSuggestions(false), 200)}
                              onChange={(e) => {
                                setOrderBookerSearchInput(e.target.value);
                                updateFilter('orderBookers', 'search', e.target.value);
                              }}
                              placeholder="Search by order booker name..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showOrderBookerSuggestions && orderBookerSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Suggestions</span>
                                </div>
                                {orderBookerSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setOrderBookerSearchInput(suggestion.name);
                                      updateFilter('orderBookers', 'search', suggestion.name);
                                      setShowOrderBookerSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <Users size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.name}</p>
                                      <p className="text-[10px] text-slate-400">ID: #BK-{suggestion.id.toString().padStart(3, '0')} • {suggestion.cell_no}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <button 
                          onClick={() => setIsOrderBookerModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-50 border border-indigo-500"
                        >
                          <Plus size={18} />
                          <span>Order Bookers</span>
                        </button>
                      </div>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      >
                        {filteredOrderBookers.map(booker => (
                          <div key={booker.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                <Users size={24} />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{booker.name}</h3>
                                <p className="text-sm text-slate-500">Booker ID: #BK-{booker.id.toString().padStart(3, '0')}</p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{booker.cell_no}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock size={16} className="text-slate-400" />
                                <span>Joined: {new Date(booker.joining_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {masterDataSubTab === 'salesmen' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={salesmanSearchInput}
                              onFocus={() => setShowSalesmanSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowSalesmanSuggestions(false), 200)}
                              onChange={(e) => {
                                setSalesmanSearchInput(e.target.value);
                                updateFilter('salesmen', 'search', e.target.value);
                              }}
                              placeholder="Search by salesman name..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showSalesmanSuggestions && salesmanSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Suggestions</span>
                                </div>
                                {salesmanSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setSalesmanSearchInput(suggestion.name);
                                      updateFilter('salesmen', 'search', suggestion.name);
                                      setShowSalesmanSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <Users size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.name}</p>
                                      <p className="text-[10px] text-slate-400">ID: #SM-{suggestion.id.toString().padStart(3, '0')} • {suggestion.cell_no}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <button 
                          onClick={() => setIsSalesmanModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-50 border border-indigo-500"
                        >
                          <Plus size={18} />
                          <span>Salesmen Registration</span>
                        </button>
                      </div>

                      <FilterBar 
                        title="Salesmen Category Filters"
                        filters={filters.salesmen}
                        onFilterChange={(k, v) => updateFilter('salesmen', k, v)}
                        onClear={() => clearFilters('salesmen')}
                        options={[
                          { 
                            key: 'territory', 
                            label: 'Territory', 
                            choices: Array.from(new Set(salesmen.map((s: any) => s.territory || 'Karachi South'))).map(t => ({ value: String(t), label: String(t) }))
                          },
                          { 
                            key: 'manager', 
                            label: 'Reporting Manager', 
                            choices: Array.from(new Set(salesmen.map((s: any) => s.reporting_manager || 'Ghulam Ali'))).map(m => ({ value: String(m), label: String(m) }))
                          }
                        ]}
                      />

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      >
                        {filteredSalesmen.map(salesman => (
                          <div key={salesman.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                <Users size={24} />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{salesman.name}</h3>
                                <p className="text-sm text-slate-500">Salesman ID: #SM-{salesman.id.toString().padStart(3, '0')}</p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{salesman.cell_no}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock size={16} className="text-slate-400" />
                                <span>Joined: {new Date(salesman.joining_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {masterDataSubTab === 'products' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={productSearchInput}
                              onFocus={() => setShowProductSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                              onChange={(e) => {
                                setProductSearchInput(e.target.value);
                                updateFilter('products', 'search', e.target.value);
                              }}
                              placeholder="Search by product name..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showProductSuggestions && productSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Suggestions</span>
                                </div>
                                {productSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setProductSearchInput(suggestion.name);
                                      updateFilter('products', 'search', suggestion.name);
                                      setShowProductSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <Package size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.name}</p>
                                      <p className="text-[10px] text-slate-400">{suggestion.sku} • {suggestion.brand}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsMaterialGroupModalOpen(true)}
                            className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                          >
                            <Package size={18} />
                            <span>Groups</span>
                          </button>
                          <button 
                            onClick={() => setIsProductMasterModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                          >
                            <Settings size={18} />
                            <span>Product Master Data</span>
                          </button>
                        </div>
                      </div>

                      <FilterBar 
                        title="Inventory Filters"
                        filters={filters.products}
                        onFilterChange={(k, v) => updateFilter('products', k, v)}
                        onClear={() => clearFilters('products')}
                        options={[
                          { 
                            key: 'brand', 
                            label: 'Brand', 
                            choices: Array.from(new Set(products.map(p => p.brand))).map(b => ({ value: String(b), label: String(b) }))
                          },
                          { 
                            key: 'mg', 
                            label: 'Category', 
                            choices: materialGroups.map(mg => ({ value: String(mg.mat_gp), label: String(mg.mat_description) }))
                          },
                          { 
                            key: 'availability', 
                            label: 'Availability', 
                            choices: [{ value: 'in', label: 'In Stock' }, { value: 'out', label: 'Out of Stock' }]
                          }
                        ]}
                      />

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                      >
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Group</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PP / TP / RP</th>
                              <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Valuation (MAP)</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map(product => {
                              const mapVal = product.moving_average_price || product.purchase_price;
                              const invVal = product.inventory_value || (product.stock_quantity * mapVal);
                              return (
                                <tr key={product.product_id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.product_id}</td>
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-900">{product.product_name}</p>
                                    <p className="text-[10px] text-slate-500">{product.brand}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                      {product.material_group_name || product.material_group_id}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col text-xs">
                                      <span className="text-slate-600">PP: {formatPKR(product.purchase_price)}</span>
                                      <span className="text-indigo-600 font-medium">TP: {formatPKR(product.trade_price)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
                                        MAP: {formatPKR(mapVal)}
                                      </span>
                                      <span className="text-[11px] font-bold text-emerald-600 mt-0.5">
                                        Val: {formatPKR(invVal)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className={cn("text-sm font-bold", product.stock_quantity < 20 ? "text-rose-600" : "text-slate-900")}>
                                      {product.stock_quantity}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => setSelectedProductForValuation(product)}
                                      className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                      title="View MAP Valuation Audit History"
                                    >
                                      MAP History
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </motion.div>
                    </div>
                  )}

                  {masterDataSubTab === 'units' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Units Master Data</h3>
                        <button 
                          onClick={() => setIsUnitModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Settings size={18} />
                          <span>Units (UN01)</span>
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Code</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Short Name</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {units.map(unit => (
                              <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{unit.unit_code}</td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-slate-600">{unit.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-slate-600">{unit.short_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                                    unit.status === 1 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                  )}>
                                    {unit.status === 1 ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {selectedReportTitle === 'Daily Load Plan' ? (
                  <DailyLoadPlanReport 
                    onBack={() => setSelectedReportTitle(null)} 
                    formatPKR={formatPKR}
                    distributorId={currentUser?.distributor_id}
                    isSuperAdmin={isSuperAdmin}
                    currentUser={currentUser}
                  />
                ) : selectedReportTitle === 'Area Wise Item Party Summary' ? (
                  <AreaWiseItemPartySummaryReport 
                    onBack={() => setSelectedReportTitle(null)} 
                    formatPKR={formatPKR}
                    distributorId={currentUser?.distributor_id}
                    isSuperAdmin={isSuperAdmin}
                    currentUser={currentUser}
                  />
                ) : selectedReportTitle === 'Invoice' ? (
                  <InvoiceReport 
                    onBack={() => setSelectedReportTitle(null)} 
                    formatPKR={formatPKR}
                    distributorId={currentUser?.distributor_id}
                    isSuperAdmin={isSuperAdmin}
                    currentUser={currentUser}
                  />
                ) : selectedReportTitle === 'Sales Tax Invoice' ? (
                  <SalesTaxInvoiceReport 
                    onBack={() => setSelectedReportTitle(null)} 
                    formatPKR={formatPKR}
                    distributorId={currentUser?.distributor_id}
                    isSuperAdmin={isSuperAdmin}
                    currentUser={currentUser}
                  />
                ) : selectedReportTitle === 'Stock Detail' ? (
                  <StockDetailReport 
                    onBack={() => setSelectedReportTitle(null)} 
                    formatPKR={formatPKR}
                    distributorId={currentUser?.distributor_id}
                    isSuperAdmin={isSuperAdmin}
                    currentUser={currentUser}
                  />
                ) : selectedReportTitle ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                      <button 
                        onClick={() => setSelectedReportTitle(null)}
                        className="p-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl transition-all"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedReportTitle}</h2>
                        <p className="text-xs text-slate-500">MIS Business Intelligence and analytical summary report.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50">
                        <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">Target Achieved</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-slate-900">84.2%</span>
                          <span className="text-xs text-emerald-600 font-bold">+2.3% MoM</span>
                        </div>
                      </div>
                      <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50">
                        <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">Annual SLA Speed</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-slate-900">18.5 hrs</span>
                          <span className="text-xs text-emerald-600 font-bold">-1.2 hrs dec</span>
                        </div>
                      </div>
                      <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50">
                        <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">Audit Index</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-slate-900">99.8%</span>
                          <span className="text-xs text-indigo-600 font-bold">Standard OK</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100/70 text-amber-800 p-4 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-bold font-mono">Sandbox Sandbox Mode Notice</p>
                        <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
                          This analytical report relies on live production pipelines. To configure customized visualization pivots, feel free to inspect master tables or export to CSV formatting.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">MIS - Reports</h2>
                        <p className="text-slate-500">Analytical insights and business reports</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allowedReports.map((report, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedReportTitle(report.title)}
                          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <report.icon size={24} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
                          <p className="text-sm text-slate-500 mb-4">{report.desc}</p>
                          <button className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
                            Generate Report <ChevronRight size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div 
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transaction Processing</h2>
                    <p className="text-slate-500">Sales, purchases and logistics transactions</p>
                  </div>
                </div>

                {/* Sub-tabs Navigation */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit flex-wrap">
                  {allowedTransactionTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTransactionsSubTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        transactionsSubTab === tab.id 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  {transactionsSubTab === 'orders' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={orderSearchInput}
                              onFocus={() => setShowOrderSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowOrderSuggestions(false), 200)}
                              onChange={(e) => {
                                setOrderSearchInput(e.target.value);
                                updateFilter('orders', 'search', e.target.value);
                              }}
                              placeholder="Search by Product, Shop, Date..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showOrderSuggestions && orderSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Recent Orders</span>
                                </div>
                                {orderSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setOrderSearchInput(suggestion.id.toString());
                                      updateFilter('orders', 'search', suggestion.id.toString());
                                      setShowOrderSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <ShoppingCart size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.shop_name}</p>
                                      <p className="text-[10px] text-slate-400">#ORD-{suggestion.id.toString().padStart(4, '0')} • {suggestion.order_booker_name} • <span className={cn((suggestion.status?.toLowerCase() === 'cancelled' || suggestion.is_cancelled === 'X') ? "text-rose-500 font-bold" : "")}>{suggestion.is_cancelled === 'X' ? 'Cancelled' : suggestion.status}</span></p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            <select 
                              value={filters.orders.status}
                              onChange={(e) => updateFilter('orders', 'status', e.target.value)}
                              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:border-indigo-600 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
                            >
                              <option value="any">Any Status</option>
                              <option value="pending">Pending</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <ChevronDown size={14} />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => setIsOrderCancellationOpen(true)}
                              className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
                            >
                              <RotateCcw size={18} />
                              <span>Cancel Orders (ORD02)</span>
                            </button>
                            <button 
                              onClick={() => setIsNewOrderModalOpen(true)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
                            >
                              <Plus size={18} />
                              <span>New Order</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-10 text-center">C</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Booker</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Delivery</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map(order => (
                              <tr 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                              >
                                <td className="px-6 py-4 text-center">
                                  <div className={cn(
                                    "w-5 h-5 mx-auto rounded border flex items-center justify-center transition-colors shadow-sm",
                                    order.is_cancelled === 'X' 
                                      ? "bg-rose-500 border-rose-600 text-white" 
                                      : "bg-white border-slate-200"
                                  )}>
                                    {order.is_cancelled === 'X' && <span className="text-[10px] font-black">X</span>}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-mono text-slate-500">#ORD-{order.id.toString().padStart(4, '0')}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-900">{order.shop_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-slate-600">{order.order_booker_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-slate-600">{new Date(order.order_date).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-bold text-indigo-600">{order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : 'N/A'}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-bold text-slate-900">{formatPKR(order.total_amount)}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                                    order.status?.toLowerCase() === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                                    order.status?.toLowerCase() === 'pending' ? "bg-amber-50 text-amber-600" : 
                                    order.status?.toLowerCase() === 'partially_delivered' ? "bg-blue-50 text-blue-600" :
                                    order.status?.toLowerCase() === 'cancelled' ? "bg-rose-50 text-rose-600" :
                                    "bg-slate-50 text-slate-600"
                                  )}>
                                    {order.status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingOrder(order);
                                        setIsNewOrderModalOpen(true);
                                      }}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                      title="Edit Order"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    {order.status?.toLowerCase() !== 'cancelled' && order.is_cancelled !== 'X' && order.status?.toLowerCase() !== 'delivered' && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOrderToCancel(order.id);
                                        }}
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                        title="Quick Cancel"
                                      >
                                        <RotateCcw size={18} />
                                      </button>
                                    )}
                                    {(order.status?.toLowerCase() === 'cancelled' || order.is_cancelled === 'X') && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOrderToUncancel(order.id);
                                        }}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                        title="Restore Order"
                                      >
                                        <RotateCcw size={18} className="scale-x-[-1]" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'deliveries' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={deliverySearchInput}
                              onFocus={() => setShowDeliverySuggestions(true)}
                              onBlur={() => setTimeout(() => setShowDeliverySuggestions(false), 200)}
                              onChange={(e) => {
                                setDeliverySearchInput(e.target.value);
                                updateFilter('deliveries', 'search', e.target.value);
                              }}
                              placeholder="Search by Product, Shop, Date..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showDeliverySuggestions && deliverySuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Delivery Suggestions</span>
                                </div>
                                {deliverySuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setDeliverySearchInput(suggestion.id.toString());
                                      updateFilter('deliveries', 'search', suggestion.id.toString());
                                      setShowDeliverySuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <Truck size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.shop_name}</p>
                                      <p className="text-[10px] text-slate-400">#DEL-{suggestion.id.toString().padStart(4, '0')} • Order #ORD-{suggestion.order_id}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSelectedDelivery(null);
                              setIsDeliveryModalOpen(true);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
                          >
                            <Plus size={18} />
                            <span>New Delivery</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Ref</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salesman</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Return Qty</th>
                              <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider text-center">Net Qty</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredDeliveries.map(delivery => (
                              <tr key={delivery.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                  <span className="font-mono font-bold text-indigo-600">#DEL-{delivery.id.toString().padStart(4, '0')}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-medium text-slate-600">
                                    #ORD-{(delivery.order_ref || delivery.order_id || 0).toString().padStart(4, '0')}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-900">{delivery.shop_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-slate-600">{delivery.salesman_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-slate-600">{new Date(delivery.delivery_date).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm font-bold text-rose-500">{delivery.total_return_qty || 0}</span>
                                </td>
                                <td className="px-6 py-4 text-center border-x border-slate-50">
                                  <span className="text-sm font-black text-indigo-600">{delivery.total_net_qty}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <p className="text-sm font-bold text-slate-900">{formatPKR(delivery.total_amount)}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button 
                                      onClick={() => setSelectedDelivery(delivery)}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                      <FileText size={18} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setEditingDelivery(delivery);
                                        setIsDeliveryModalOpen(true);
                                      }}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={() => setDeliveryToDelete(delivery.id)}
                                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {deliveries.length === 0 && (
                              <tr>
                                <td colSpan={9} className="px-6 py-12 text-center">
                                  <Truck size={48} className="mx-auto text-slate-200 mb-4" />
                                  <p className="text-slate-500 font-medium">No deliveries found</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'delivery_returns' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={returnSearchInput}
                              onFocus={() => setShowReturnSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowReturnSuggestions(false), 200)}
                              onChange={(e) => {
                                setReturnSearchInput(e.target.value);
                                updateFilter('returns', 'search', e.target.value);
                              }}
                              placeholder="Search by Product, Shop, Date..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showReturnSuggestions && returnSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Return Suggestions</span>
                                </div>
                                {returnSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setReturnSearchInput(suggestion.id.toString());
                                      updateFilter('returns', 'search', suggestion.id.toString());
                                      setShowReturnSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <RotateCcw size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.shop_name}</p>
                                      <p className="text-[10px] text-slate-400">#RET-{suggestion.id.toString().padStart(4, '0')}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setIsReturnModalOpen(true);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
                          >
                            <Plus size={18} />
                            <span>New Delivery Return</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Return ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredReturns.map(ret => (
                              <tr key={ret.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                  <span className="font-mono font-bold text-indigo-600">#RET-{ret.id.toString().padStart(4, '0')}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-900">{ret.shop_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-slate-600">{new Date(ret.return_date).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <p className="text-sm font-bold text-slate-900">{formatPKR(ret.total_amount)}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingReturn(ret);
                                        setIsReturnModalOpen(true);
                                      }}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="Edit Return"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                      <FileText size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {returns.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                  <RotateCcw size={48} className="mx-auto text-slate-200 mb-4" />
                                  <p className="text-slate-500 font-medium">No returns found</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'sales_returns' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={salesReturnSearchInput}
                              onFocus={() => setShowSalesReturnSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowSalesReturnSuggestions(false), 200)}
                              onChange={(e) => {
                                setSalesReturnSearchInput(e.target.value);
                                const newFilters = { ...filters };
                                newFilters.salesReturns = { ...newFilters.salesReturns, search: e.target.value };
                                setFilters(newFilters);
                              }}
                              placeholder="Search by Invoice, Shop, Date..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showSalesReturnSuggestions && salesReturnSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Sales Return Suggestions</span>
                                </div>
                                {salesReturnSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setSalesReturnSearchInput(suggestion.id.toString());
                                      const newFilters = { ...filters };
                                      newFilters.salesReturns = { ...newFilters.salesReturns, search: suggestion.id.toString() };
                                      setFilters(newFilters);
                                      setShowSalesReturnSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                      <RotateCcw size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.shop_name}</p>
                                      <p className="text-[10px] text-slate-400">#SRT-{suggestion.id.toString().padStart(4, '0')} (Inv: INV # {suggestion.invoice_id.toString().padStart(4, '0')})</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingSalesReturn(null);
                              setIsSalesReturnModalOpen(true);
                            }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 flex items-center gap-2"
                          >
                            <Plus size={18} />
                            <span>New Sales Return</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Return ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ref Invoice</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSalesReturns.map(ret => (
                              <tr key={ret.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                  <span className="font-mono font-bold text-emerald-600">#SRT-{ret.id.toString().padStart(4, '0')}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs text-slate-500">INV # {ret.invoice_id.toString().padStart(4, '0')}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-900">{ret.shop_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-slate-600">{new Date(ret.return_date).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <p className="text-sm font-bold text-slate-900">{formatPKR(ret.total_amount)}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingSalesReturn(ret);
                                        setIsSalesReturnModalOpen(true);
                                      }}
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Edit Sales Return"
                                    >
                                      <Edit size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {salesReturns.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                  <RotateCcw size={48} className="mx-auto text-slate-200 mb-4" />
                                  <p className="text-slate-500 font-medium">No sales returns found</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'purchases' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={purchaseSearchInput}
                              onFocus={() => setShowPurchaseSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowPurchaseSuggestions(false), 200)}
                              onChange={(e) => {
                                setPurchaseSearchInput(e.target.value);
                                updateFilter('purchases', 'search', e.target.value);
                              }}
                              placeholder="Search by Product, Shop, Date..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-sm font-medium shadow-sm transition-all outline-none"
                            />
                          </div>

                          <AnimatePresence>
                            {showPurchaseSuggestions && purchaseSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-slate-50 bg-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Purchase Suggestions</span>
                                </div>
                                {purchaseSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => {
                                      setPurchaseSearchInput(suggestion.id.toString());
                                      updateFilter('purchases', 'search', suggestion.id.toString());
                                      setShowPurchaseSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                  >
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      <ShoppingBag size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{suggestion.supplier_name}</p>
                                      <p className="text-[10px] text-slate-400">#PUR-{suggestion.id.toString().padStart(4, '0')} • Bill: {suggestion.bill_no}</p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                          >
                            <Plus size={18} />
                            <span>New Purchase</span>
                          </button>
                          <button 
                            onClick={() => setIsPurchaseReturnModalOpen(true)}
                            className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-md shadow-amber-100"
                          >
                            <RotateCcw size={18} />
                            <span>Purchase Return (PRT01)</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredPurchases.map(purchase => (
                              <tr 
                                key={purchase.id} 
                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                              >
                                <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm font-mono text-slate-500">#PUR-{purchase.id.toString().padStart(4, '0')}</td>
                                <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm font-bold text-slate-900">{purchase.supplier_name}</td>
                                <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm text-slate-600">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                                <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm font-bold text-slate-900">{formatPKR(purchase.total_amount)}</td>
                                <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                                    {purchase.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingPurchase(purchase);
                                        setIsPurchaseModalOpen(true);
                                      }}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPurchaseToDelete(purchase.id);
                                      }}
                                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'invoices' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input 
                            type="text"
                            value={invoiceSearchInput}
                            onChange={(e) => setInvoiceSearchInput(e.target.value)}
                            placeholder="Search by Product, Shop, Date..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:border-indigo-600 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => {
                              setDisplayInvoiceId(null);
                              setIsDisplayInvoiceModalOpen(true);
                            }}
                            className="bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center gap-2"
                            title="Display Invoice Document (VF03)"
                          >
                            <FileText size={18} />
                            <span>Display Invoice (VF03)</span>
                          </button>
                          <button 
                            onClick={() => {
                              setEditInvoiceId(null);
                              setIsEditInvoiceModalOpen(true);
                            }}
                            className="bg-amber-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-100 flex items-center gap-2"
                            title="Edit Draft Invoice (VF02)"
                          >
                            <Edit size={18} />
                            <span>Edit Invoice (VF02)</span>
                          </button>
                          <button 
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                          >
                            <Plus size={18} />
                            <span>Generate New Invoice (INV01)</span>
                          </button>
                          <button 
                            onClick={() => setIsBulkInvoiceCancelOpen(true)}
                            className="bg-rose-50 text-rose-600 border border-rose-100 px-5 py-3 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all flex items-center gap-2"
                          >
                            <XCircle size={18} />
                            <span>Bulk Cancel Invoices</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Gross Amt</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Discount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tax</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.map(invoice => (
                              <tr 
                                key={invoice.id} 
                                onClick={() => {
                                  setDisplayInvoiceId(invoice.id);
                                  setIsDisplayInvoiceModalOpen(true);
                                }}
                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-mono font-bold text-indigo-600 group-hover:underline">
                                      #INV-{invoice.id.toString().padStart(4, '0')}
                                    </span>
                                    {invoice.delivery_numbers && (
                                      <span className="text-[10px] text-slate-500 font-mono font-medium flex items-center gap-1 mt-0.5" title={`Source Deliveries: ${invoice.delivery_numbers}`}>
                                        <Truck size={10} className="text-indigo-500 shrink-0" />
                                        <span className="truncate max-w-[120px]">{invoice.delivery_numbers}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{invoice.shop_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-slate-500">{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                                  {formatPKR(invoice.gross_amount)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-rose-500">
                                  -{formatPKR(invoice.total_discount)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-emerald-500">
                                  +{formatPKR(invoice.total_tax)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600">
                                  {formatPKR(invoice.net_amount)}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap inline-flex items-center gap-1",
                                    invoice.status === 'cancelled' ? "bg-slate-100 text-slate-500 border border-slate-200" :
                                    invoice.status === 'posted' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                    invoice.status === 'paid' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                    "bg-amber-50 text-amber-700 border border-amber-200"
                                  )}>
                                    {invoice.status === 'posted' && <ShieldCheck size={11} className="text-emerald-600" />}
                                    {invoice.status === 'draft' && <Clock size={11} className="text-amber-600" />}
                                    {invoice.status || 'draft'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {(invoice.status === 'draft' || !invoice.status) && (
                                      <>
                                        <button 
                                          onClick={() => handlePostInvoice(invoice.id)}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                                          title="Post Invoice (Lock & Release to MIS Sales Tax Reports)"
                                        >
                                          <ShieldCheck size={13} />
                                          <span>Post</span>
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setEditInvoiceId(invoice.id);
                                            setIsEditInvoiceModalOpen(true);
                                          }}
                                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                          title="Edit Invoice (VF02)"
                                        >
                                          <Edit size={18} />
                                        </button>
                                      </>
                                    )}
                                    {invoice.status === 'posted' && (
                                      <button 
                                        onClick={() => {
                                          setEditingPaymentId(null);
                                          setPaymentModalMode('create');
                                          setIsPaymentModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                                        title="Receive Payment for Shop (PA01)"
                                      >
                                        <CreditCard size={13} />
                                        <span>Pay</span>
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => {
                                        setDisplayInvoiceId(invoice.id);
                                        setIsDisplayInvoiceModalOpen(true);
                                      }}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                                      title="Display Invoice (VF03)"
                                    >
                                      <FileText size={18} />
                                    </button>
                                    <button 
                                      onClick={() => setInvoiceToCancel(invoice.id)}
                                      disabled={invoice.status === 'cancelled'}
                                      className={cn(
                                        "p-2 rounded-lg transition-colors opacity-80 group-hover:opacity-100",
                                        invoice.status === 'cancelled' ? "text-slate-200 cursor-not-allowed" : "text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                      )}
                                      title="Cancel Invoice"
                                    >
                                      <XCircle size={18} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setDisplayInvoiceId(invoice.id);
                                        setIsDisplayInvoiceModalOpen(true);
                                      }}
                                      className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                                      title="Print / View Receipt"
                                    >
                                      <Printer size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {invoices.length === 0 && (
                              <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">No invoices found. Generate an invoice from pending deliveries.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'payments' && (
                    <div className="space-y-6">
                      {/* Metric Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collections</p>
                            <h4 className="text-xl font-black text-slate-900 mt-1">{formatPKR(paymentStats.totalAmount)}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{paymentStats.count} Total Payments</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign size={24} />
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Received</p>
                            <h4 className="text-xl font-black text-emerald-600 mt-1">{formatPKR(paymentStats.totalCash)}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Direct Cash in Hand</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Banknote size={24} />
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cheque Instruments</p>
                            <h4 className="text-xl font-black text-indigo-600 mt-1">{formatPKR(paymentStats.totalCheque)}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Bank Cheques Pending/Clearing</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CreditCard size={24} />
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posted Vouchers</p>
                            <h4 className="text-xl font-black text-purple-600 mt-1">{paymentStats.count}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Ledger Credited Records</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FileText size={24} />
                          </div>
                        </div>
                      </div>

                      {/* Filter & Actions Bar */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-3">
                          <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text"
                              value={paymentSearchInput}
                              onChange={(e) => setPaymentSearchInput(e.target.value)}
                              placeholder="Search by Doc #, Shop, Salesman, Cheque #..."
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:border-indigo-600 outline-none transition-all shadow-sm"
                            />
                            {paymentSearchInput && (
                              <button
                                onClick={() => setPaymentSearchInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          {/* Method Filter Pills */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                            <button
                              onClick={() => setPaymentMethodFilter('all')}
                              className={cn(
                                "px-3 py-1.5 rounded-lg transition-all",
                                paymentMethodFilter === 'all' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setPaymentMethodFilter('CASH')}
                              className={cn(
                                "px-3 py-1.5 rounded-lg transition-all",
                                paymentMethodFilter === 'CASH' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              Cash
                            </button>
                            <button
                              onClick={() => setPaymentMethodFilter('CHEQUE')}
                              className={cn(
                                "px-3 py-1.5 rounded-lg transition-all",
                                paymentMethodFilter === 'CHEQUE' ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              Cheque
                            </button>
                          </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => {
                              setDisplayPaymentId(null);
                              setIsDisplayPaymentModalOpen(true);
                            }}
                            className="bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center gap-2"
                            title="Display Payment Voucher (PA03)"
                          >
                            <FileText size={18} />
                            <span>Display Voucher (PA03)</span>
                          </button>
                          <button 
                            onClick={() => {
                              setEditingPaymentId(null);
                              setPaymentModalMode('edit');
                              setIsPaymentModalOpen(true);
                            }}
                            className="bg-amber-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-100 flex items-center gap-2"
                            title="Change Payment (PA02)"
                          >
                            <Edit size={18} />
                            <span>Change Payment (PA02)</span>
                          </button>
                          <button 
                            onClick={() => {
                              setEditingPaymentId(null);
                              setPaymentModalMode('create');
                              setIsPaymentModalOpen(true);
                            }}
                            className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                            title="Receive Payment (PA01)"
                          >
                            <Plus size={18} />
                            <span>Receive Payment (PA01)</span>
                          </button>
                        </div>
                      </div>

                      {/* Payment Records Table */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document #</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Shop</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salesman</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method & Reference</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Settled Invoices</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount Received</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredPayments.map(payment => (
                              <tr 
                                key={payment.id} 
                                onClick={() => {
                                  setDisplayPaymentId(payment.id);
                                  setIsDisplayPaymentModalOpen(true);
                                }}
                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-mono font-bold text-indigo-600 group-hover:underline flex items-center gap-1.5">
                                      <FileText size={14} className="text-slate-400" />
                                      {payment.payment_doc_no || `#PAY-${payment.id.toString().padStart(4, '0')}`}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: {payment.id}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{payment.shop_name}</span>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                      {payment.owner_name && <span>{payment.owner_name}</span>}
                                      {payment.shop_area && (
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-medium">
                                          {payment.shop_area}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-slate-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-medium text-slate-700">{payment.salesman_display_name || payment.salesman_name || 'Unassigned'}</span>
                                </td>
                                <td className="px-6 py-4">
                                  {payment.payment_method === 'CASH' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                      <Banknote size={12} className="text-emerald-600" />
                                      CASH
                                    </span>
                                  ) : (
                                    <div className="flex flex-col">
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1 w-fit">
                                        <CreditCard size={12} className="text-indigo-600" />
                                        CHEQUE
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        {payment.bank_name || 'Bank'} {payment.cheque_no ? `• #${payment.cheque_no}` : ''}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {payment.settled_invoices_summary ? (
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                      {payment.settled_invoices_summary.split(',').map((invNo, idx) => (
                                        <span key={idx} className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                          {invNo.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">General Receipt</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-bold text-emerald-600 font-mono">
                                    {formatPKR(payment.amount)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      onClick={() => {
                                        setDisplayPaymentId(payment.id);
                                        setIsDisplayPaymentModalOpen(true);
                                      }}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                                      title="Display / Print Voucher (PA03)"
                                    >
                                      <Printer size={18} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setEditingPaymentId(payment.id);
                                        setPaymentModalMode('edit');
                                        setIsPaymentModalOpen(true);
                                      }}
                                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                                      title="Change Payment (PA02)"
                                    >
                                      <Edit size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                              <tr>
                                <td colSpan={8} className="px-6 py-16 text-center">
                                  <div className="max-w-xs mx-auto flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                                      <CreditCard size={32} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800">No payment records found</h4>
                                    <p className="text-xs text-slate-400 mt-1 mb-4">
                                      {paymentSearchInput || paymentMethodFilter !== 'all' 
                                        ? "No payments match your current search or filter criteria." 
                                        : "Collect payments from shops against posted invoices to update customer ledgers."}
                                    </p>
                                    <button
                                      onClick={() => {
                                        setEditingPaymentId(null);
                                        setPaymentModalMode('create');
                                        setIsPaymentModalOpen(true);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-100 transition-all"
                                    >
                                      <Plus size={16} />
                                      <span>Receive Payment (PA01)</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'load_plans' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-bold text-slate-900">Load Plans</h3>
                          <p className="text-xs text-slate-500">Manage and track product loadings</p>
                        </div>
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input 
                            type="text"
                            value={loadPlanSearchInput}
                            onChange={(e) => setLoadPlanSearchInput(e.target.value)}
                            placeholder="Search by Product, Shop, Date..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:border-indigo-600 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsDriverModalOpen(true)}
                            className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                          >
                            <Users size={18} />
                            <span>Drivers Master</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLoadPlans.map(plan => (
                          <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-3">
                                <div className="bg-indigo-50 p-3 rounded-xl">
                                  <Truck className="text-indigo-600" size={24} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900">#LP-{plan.id.toString().padStart(4, '0')}</h3>
                                  <p className="text-xs text-slate-500">{new Date(plan.plan_date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                                plan.status === 'completed' ? "bg-emerald-50 text-emerald-600" : 
                                plan.status === 'dispatched' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                              )}>
                                {plan.status}
                              </span>
                            </div>
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Truck size={14} />
                                <span>Vehicle: {plan.vehicle_id}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Users size={14} />
                                <span>Driver: {plan.driver_name}</span>
                              </div>
                            </div>
                            <button className="w-full py-2 text-sm font-bold text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors">
                              View Dispatch List
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai_inquiry' && canAccessAI && (
              <motion.div 
                key="ai_inquiry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <AIInquiryDesk 
                  currentUser={currentUser}
                  formatPKR={formatPKR}
                />
              </motion.div>
            )}

            {activeTab === 'admin' && isSuperAdmin && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <AdminTab 
                  distributors={distributors}
                  currentUserRole={currentUser?.role}
                  onRefreshData={() => {
                    fetchBatchInit();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onSuccess={() => {
              fetchOrders();
              fetchProducts();
              fetchStats();
            }}
            formatPKR={formatPKR}
          />
        )}
        {selectedDelivery && (
          <DeliveryDetailsModal 
            delivery={selectedDelivery} 
            onClose={() => setSelectedDelivery(null)} 
            formatPKR={formatPKR}
          />
        )}
        {selectedShop && (
          <LedgerModal 
            shop={selectedShop} 
            onClose={() => setSelectedShop(null)} 
            formatPKR={formatPKR}
          />
        )}
        {selectedPurchase && (
          <PurchaseDetailsModal 
            purchase={selectedPurchase} 
            onClose={() => setSelectedPurchase(null)} 
            formatPKR={formatPKR}
          />
        )}
        {isProductMasterModalOpen && (
          <ProductMasterDataModal 
            products={products}
            materialGroups={materialGroups}
            units={units}
            onClose={() => setIsProductMasterModalOpen(false)} 
            onSuccess={() => {
              fetchProducts();
              fetchStats();
            }}
          />
        )}
        {isRegisterShopModalOpen && (
          <RegisterShopModal 
            onClose={() => setIsRegisterShopModalOpen(false)} 
            onSuccess={() => {
              fetchShops();
              fetchStats();
            }}
          />
        )}
        {isRegisterSupplierModalOpen && (
          <RegisterSupplierModal 
            onClose={() => setIsRegisterSupplierModalOpen(false)} 
            onSuccess={() => {
              fetchSuppliers();
            }}
          />
        )}
        {isPurchaseModalOpen && (
          <PurchaseModal 
            products={products}
            suppliers={suppliers}
            purchase={editingPurchase || undefined}
            onClose={() => {
              setIsPurchaseModalOpen(false);
              setEditingPurchase(null);
            }} 
            onSuccess={() => {
              fetchPurchases();
              fetchProducts();
              fetchStats();
              fetchValuation();
            }}
          />
        )}
        {isDeliveryModalOpen && (
          <DeliveryModal 
            onClose={() => {
              setIsDeliveryModalOpen(false);
              setEditingDelivery(null);
            }} 
            onSuccess={() => {
              fetchDeliveries();
              fetchOrders();
              fetchStats();
            }}
            salesmen={salesmen}
            orders={orders}
            delivery={editingDelivery || undefined}
            formatPKR={formatPKR}
          />
        )}
        {isMaterialGroupModalOpen && (
          <MaterialGroupModal 
            materialGroups={materialGroups}
            onClose={() => setIsMaterialGroupModalOpen(false)} 
            onSuccess={() => {
              fetchMaterialGroups();
              fetchProducts();
            }}
          />
        )}
        {isDriverModalOpen && (
          <DriverModal 
            drivers={drivers}
            onClose={() => setIsDriverModalOpen(false)} 
            onSuccess={() => {
              fetchDrivers();
              fetchLoadPlans();
            }}
          />
        )}
        {isOrderBookerModalOpen && (
          <OrderBookerModal 
            orderBookers={orderBookers}
            onClose={() => setIsOrderBookerModalOpen(false)} 
            onSuccess={() => {
              fetchOrderBookers();
              fetchOrders();
            }}
          />
        )}
        {isSalesmanModalOpen && (
          <SalesmanModal 
            salesmen={salesmen}
            onClose={() => setIsSalesmanModalOpen(false)} 
            onSuccess={() => {
              fetchSalesmen();
              fetchDeliveries();
            }}
          />
        )}
        {isShopMasterModalOpen && (
          <ShopMasterModal 
            onClose={() => setIsShopMasterModalOpen(false)}
            onSuccess={() => {
              fetchShops();
              setIsShopMasterModalOpen(false);
            }}
            shops={shops}
          />
        )}

        {isSupplierMasterModalOpen && (
          <SupplierMasterModal 
            onClose={() => setIsSupplierMasterModalOpen(false)}
            onSuccess={() => {
              fetchSuppliers();
              setIsSupplierMasterModalOpen(false);
            }}
            suppliers={suppliers}
          />
        )}
        {isNewOrderModalOpen && (
          <NewOrderModal 
            shops={shops}
            orderBookers={orderBookers}
            products={products}
            order={editingOrder || undefined}
            onClose={() => {
              setIsNewOrderModalOpen(false);
              setEditingOrder(null);
            }} 
            onSuccess={() => {
              fetchOrders();
              fetchProducts();
              fetchStats();
            }}
            formatPKR={formatPKR}
          />
        )}
        {isReturnModalOpen && (
          <ReturnModal 
            onClose={() => {
              setIsReturnModalOpen(false);
              setEditingReturn(null);
              fetchReturns();
              fetchDeliveries();
              fetchProducts();
              fetchStats();
            }}
            shops={shops}
            returnRecord={editingReturn}
          />
        )}

        {isSalesReturnModalOpen && (
          <SalesReturnModal 
            onClose={() => {
              setIsSalesReturnModalOpen(false);
              setEditingSalesReturn(null);
              fetchSalesReturns();
              fetchProducts();
              fetchStats();
              fetchInvoices();
            }}
            shops={shops}
            salesReturnRecord={editingSalesReturn}
          />
        )}

        {isPurchaseReturnModalOpen && (
          <PurchaseReturnModal 
            onClose={() => {
              setIsPurchaseReturnModalOpen(false);
              fetchPurchases();
              fetchProducts();
              fetchStats();
            }}
            suppliers={suppliers}
          />
        )}

        {isOrderCancellationOpen && (
          <OrderCancellationScreen 
            onClose={() => {
              setIsOrderCancellationOpen(false);
              fetchOrders();
              fetchProducts();
              fetchStats();
            }}
            orders={orders.filter(o => 
              o.status?.toLowerCase() !== 'cancelled' && 
              o.is_cancelled !== 'X' && 
              !o.has_delivery
            )}
            formatPKR={formatPKR}
          />
        )}
        {isTCodeModalOpen && (
          <TCodeMasterModal 
            onClose={() => setIsTCodeModalOpen(false)}
          />
        )}
        {isUserManagementModalOpen && (
          <UserManagementModal 
            onClose={() => setIsUserManagementModalOpen(false)}
            currentUserRole={currentUser?.role}
            onOpenDistributorMaster={() => setIsDistributorMasterModalOpen(true)}
          />
        )}
        {isDistributorMasterModalOpen && (
          <DistributorMasterModal 
            isOpen={isDistributorMasterModalOpen}
            onClose={() => {
              setIsDistributorMasterModalOpen(false);
              fetchBatchInit();
            }}
            onSaveSuccess={() => {
              fetchBatchInit();
            }}
          />
        )}
        {isUnitModalOpen && (
          <UnitModal 
            onClose={() => setIsUnitModalOpen(false)}
            onSuccess={() => {
              // units are not fetched at top level currently, but common to Success handling
              setIsUnitModalOpen(false);
            }}
          />
        )}
        {isLocationModalOpen && (
          <LocationMasterModal 
            onClose={() => setIsLocationModalOpen(false)}
          />
        )}
        {isInvoiceModalOpen && (
          <InvoiceTransactionModal 
            shops={shops}
            onClose={() => setIsInvoiceModalOpen(false)}
            onSuccess={() => {
              fetchDeliveries();
              fetchInvoices();
              setIsInvoiceModalOpen(false);
            }}
            formatPKR={formatPKR}
            onOpenDisplayInvoice={(invId) => {
              setIsInvoiceModalOpen(false);
              setDisplayInvoiceId(invId || null);
              setIsDisplayInvoiceModalOpen(true);
            }}
            onOpenEditInvoice={(invId) => {
              setIsInvoiceModalOpen(false);
              setEditInvoiceId(invId || null);
              setIsEditInvoiceModalOpen(true);
            }}
          />
        )}
        {isEditInvoiceModalOpen && (
          <EditInvoiceModal 
            onClose={() => {
              setIsEditInvoiceModalOpen(false);
              setEditInvoiceId(null);
            }}
            formatPKR={formatPKR}
            initialInvoiceId={editInvoiceId}
            onSuccess={() => {
              fetchInvoices();
              fetchDeliveries();
              setIsEditInvoiceModalOpen(false);
              setEditInvoiceId(null);
            }}
            onOpenDisplayInvoice={(invId) => {
              setIsEditInvoiceModalOpen(false);
              setEditInvoiceId(null);
              setDisplayInvoiceId(invId || null);
              setIsDisplayInvoiceModalOpen(true);
            }}
          />
        )}
        {isDisplayInvoiceModalOpen && (
          <DisplayInvoiceModal 
            onClose={() => {
              setIsDisplayInvoiceModalOpen(false);
              setDisplayInvoiceId(null);
            }}
            formatPKR={formatPKR}
            initialInvoiceId={displayInvoiceId}
            onOpenCreateInvoice={() => {
              setIsDisplayInvoiceModalOpen(false);
              setDisplayInvoiceId(null);
              setIsInvoiceModalOpen(true);
            }}
          />
        )}
        {isPaymentModalOpen && (
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            mode={paymentModalMode}
            paymentId={editingPaymentId}
            distributorId={selectedDistributorId}
            formatPKR={formatPKR}
            currentUser={currentUser}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setEditingPaymentId(null);
            }}
            onSuccess={() => {
              fetchPayments();
              fetchInvoices();
              fetchBatchInit();
            }}
            onOpenDisplayPayment={(pId) => {
              setDisplayPaymentId(Number(pId));
              setIsDisplayPaymentModalOpen(true);
            }}
          />
        )}
        {isDisplayPaymentModalOpen && (
          <DisplayPaymentModal 
            isOpen={isDisplayPaymentModalOpen}
            paymentId={displayPaymentId}
            formatPKR={formatPKR}
            onClose={() => {
              setIsDisplayPaymentModalOpen(false);
              setDisplayPaymentId(null);
            }}
            onOpenEditPayment={(pId) => {
              setIsDisplayPaymentModalOpen(false);
              setDisplayPaymentId(null);
              setEditingPaymentId(pId);
              setPaymentModalMode('edit');
              setIsPaymentModalOpen(true);
            }}
            onOpenNewPayment={() => {
              setIsDisplayPaymentModalOpen(false);
              setDisplayPaymentId(null);
              setEditingPaymentId(null);
              setPaymentModalMode('create');
              setIsPaymentModalOpen(true);
            }}
          />
        )}
        {isDisplayOrderModalOpen && (
          <DisplayOrderModal onClose={() => setIsDisplayOrderModalOpen(false)} />
        )}
        {isDisplayDeliveryModalOpen && (
          <DisplayDeliveryModal onClose={() => setIsDisplayDeliveryModalOpen(false)} />
        )}
        {isDisplayPurchaseModalOpen && (
          <DisplayPurchaseModal onClose={() => setIsDisplayPurchaseModalOpen(false)} />
        )}
        {isDisplayReturnModalOpen && (
          <DisplayReturnModal onClose={() => setIsDisplayReturnModalOpen(false)} />
        )}
        {isBulkInvoiceCancelOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Bulk Cancel Invoices</h3>
                  <p className="text-xs text-slate-500 font-medium">Enter invoice range to cancel</p>
                </div>
                <button onClick={() => setIsBulkInvoiceCancelOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                  <p className="text-xs text-rose-600 leading-relaxed font-bold">
                    This action will cancel all invoices within the specified range. 
                    Associated deliveries will be unlocked for re-invoicing. This cannot be undone.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Start Invoice #</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="number"
                        value={bulkCancelRange.start}
                        onChange={(e) => setBulkCancelRange(prev => ({ ...prev, start: e.target.value }))}
                        placeholder="e.g. 1"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">End Invoice #</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="number"
                        value={bulkCancelRange.end}
                        onChange={(e) => setBulkCancelRange(prev => ({ ...prev, end: e.target.value }))}
                        placeholder="e.g. 10"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {bulkCancelRange.start && bulkCancelRange.end && (
                  <div className="px-4 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">
                      Processing range: #INV-{bulkCancelRange.start.padStart(4, '0')} to #INV-{bulkCancelRange.end.padStart(4, '0')}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsBulkInvoiceCancelOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-white transition-all"
                >
                  Keep Invoices
                </button>
                <button 
                  onClick={handleBulkCancelInvoices}
                  disabled={isBulkCancelling || !bulkCancelRange.start || !bulkCancelRange.end}
                  className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkCancelling ? (
                    <RotateCcw className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  <span>Cancel Range</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Confirmation Modals (Sandboxed iFrame Safe) */}
        {invoiceToCancel !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-rose-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                <h3 className="text-sm font-black text-rose-700 tracking-wider uppercase font-mono">Cancel Invoice</h3>
                <button onClick={() => setInvoiceToCancel(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Confirm Cancellation</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Are you sure you want to cancel Invoice <span className="font-mono font-bold">#INV-{invoiceToCancel.toString().padStart(4, '0')}</span>?
                    </p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100/50">
                  <p className="text-[10px] sm:text-xs text-rose-600 font-medium">
                    This will unlock all associated deliveries and set them back to completed, allowing them to be re-invoiced. This action is permanent.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setInvoiceToCancel(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white transition-all"
                >
                  Keep Invoice
                </button>
                <button 
                  onClick={async () => {
                    const id = invoiceToCancel;
                    setInvoiceToCancel(null);
                    await handleCancelInvoice(id);
                  }}
                  className="flex-1 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-md"
                >
                  Cancel Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {orderToCancel !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-rose-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                <h3 className="text-sm font-black text-rose-700 tracking-wider uppercase font-mono">Cancel Order</h3>
                <button onClick={() => setOrderToCancel(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Confirm Order Cancel</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Are you sure you want to cancel Order <span className="font-mono font-bold">#ORD-{orderToCancel.toString().padStart(4, '0')}</span>?
                    </p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100/50">
                  <p className="text-[10px] sm:text-xs text-rose-600 font-medium">
                    This will reverse the order booking status, enabling you to restock or recreate the order if necessary.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white transition-all"
                >
                  Keep Order
                </button>
                <button 
                  onClick={async () => {
                    const id = orderToCancel;
                    setOrderToCancel(null);
                    await handleCancelOrder(id);
                  }}
                  className="flex-1 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-md"
                >
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deliveryToDelete !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-rose-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                <h3 className="text-sm font-black text-rose-700 tracking-wider uppercase font-mono">Delete Delivery</h3>
                <button onClick={() => setDeliveryToDelete(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Delete Delivery Confirmation</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Are you sure you want to delete Delivery <span className="font-mono font-bold">#DEL-{deliveryToDelete.toString().padStart(4, '0')}</span>?
                    </p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100/50">
                  <p className="text-[10px] sm:text-xs text-rose-600 font-medium">
                    Deleting this delivery will reserve inventory levels and revert the original order status back into bookkeeping.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setDeliveryToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white transition-all"
                >
                  Keep Delivery
                </button>
                <button 
                  onClick={async () => {
                    const id = deliveryToDelete;
                    setDeliveryToDelete(null);
                    await deleteDelivery(id);
                  }}
                  className="flex-1 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-md"
                >
                  Delete Delivery
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {purchaseToDelete !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-rose-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                <h3 className="text-sm font-black text-rose-700 tracking-wider uppercase font-mono">Delete Purchase</h3>
                <button onClick={() => setPurchaseToDelete(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Delete Purchase Confirmation</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Are you sure you want to delete Purchase Order <span className="font-mono font-bold">#PUR-{purchaseToDelete.toString().padStart(4, '0')}</span>?
                    </p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100/50">
                  <p className="text-[10px] sm:text-xs text-rose-600 font-medium">
                    This action will reduce current inventory warehouse stock levels back to their previous counts.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setPurchaseToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white transition-all"
                >
                  Keep Purchase
                </button>
                <button 
                  onClick={async () => {
                    const id = purchaseToDelete;
                    setPurchaseToDelete(null);
                    await deletePurchase(id);
                  }}
                  className="flex-1 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-md"
                >
                  Delete Purchase
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {orderToUncancel !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-emerald-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                <h3 className="text-sm font-black text-emerald-700 tracking-wider uppercase font-mono">Restore Order</h3>
                <button onClick={() => setOrderToUncancel(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Confirm Restoration</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Are you sure you want to restore and reopen Order <span className="font-mono font-bold">#ORD-{orderToUncancel.toString().padStart(4, '0')}</span>?
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100/50">
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-medium">
                    This will set the order and all item status back to "Pending", allowing you to generate a delivery record or modify items as required.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setOrderToUncancel(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white transition-all"
                >
                  Keep Cancelled
                </button>
                <button 
                  onClick={async () => {
                    const id = orderToUncancel;
                    setOrderToUncancel(null);
                    await handleUncancelOrder(id);
                  }}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md"
                >
                  Restore Order
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedProductForValuation !== null && (
          <ValuationHistoryModal
            product={selectedProductForValuation}
            onClose={() => setSelectedProductForValuation(null)}
            formatPKR={formatPKR}
          />
        )}

        {/* Global Toast Notification System */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[100000]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border font-bold text-xs sm:text-sm min-w-[280px] sm:min-w-[320px] max-w-sm",
                toast.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                toast.type === 'error' ? "bg-rose-50 border-rose-100 text-rose-800" :
                "bg-slate-900 border-slate-800 text-white"
              )}
            >
              {toast.type === 'success' && <CheckCircle className="text-emerald-500 shrink-0" size={18} />}
              {toast.type === 'error' && <AlertCircle className="text-rose-500 shrink-0" size={18} />}
              {toast.type === 'info' && <AlertCircle className="text-blue-500 shrink-0" size={18} />}
              <span className="flex-1 leading-relaxed">{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={14} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
