import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  RefreshCw,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Building2,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  CreditCard,
  BookOpen,
  Filter,
  DollarSign,
  ShieldAlert,
  Percent,
  SlidersHorizontal,
  Info,
  ExternalLink,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AgingInvoiceItem {
  invoice_id: number;
  invoice_doc_no: string;
  invoice_date: string;
  billing_date: string;
  days_aged: number;
  slab_key: 'slab_30' | 'slab_45' | 'slab_60' | 'slab_75' | 'slab_90' | 'slab_over_90';
  slab_label: string;
  gross_amount: number;
  net_amount: number;
  paid_amount: number;
  receivable_amount: number;
  status: string;
  shop_id: number;
  shop_name: string;
  area: string;
  payments: Array<{
    invoice_id: number;
    payment_id: number;
    allocated_amount: number;
    payment_doc_no: string;
    payment_date: string;
    payment_method: string;
    cheque_no?: string;
    bank_name?: string;
  }>;
}

export interface ShopAgingSummary {
  shop_id: number;
  shop_name: string;
  owner_name: string;
  area: string;
  subarea: string;
  location: string;
  phone: string;
  credit_limit: number;
  category: string;
  distributor_id: number;
  distributor_name: string;
  distributor_code: string;
  distributor_address: string;
  distributor_phone: string;
  distributor_city: string;
  total_billed: number;
  total_paid: number;
  total_receivable: number;
  credit_utilization_pct: number;
  oldest_invoice_date: string | null;
  oldest_invoice_days: number;
  risk_level: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  slab_30: number;
  slab_45: number;
  slab_60: number;
  slab_75: number;
  slab_90: number;
  slab_over_90: number;
  invoices: AgingInvoiceItem[];
}

export interface AgingReportApiResponse {
  success: boolean;
  asOfDate: string;
  summary: {
    asOfDate: string;
    total_shops_analyzed: number;
    total_shops_with_balance: number;
    total_open_invoices: number;
    total_billed: number;
    total_paid: number;
    total_receivable: number;
    weighted_dso_days: number;
    critical_overdue_total: number;
    slabs: {
      slab_30: { amount: number; percentage: number; label: string };
      slab_45: { amount: number; percentage: number; label: string };
      slab_60: { amount: number; percentage: number; label: string };
      slab_75: { amount: number; percentage: number; label: string };
      slab_90: { amount: number; percentage: number; label: string };
      slab_over_90: { amount: number; percentage: number; label: string };
    };
    risk_breakdown: {
      critical_count: number;
      high_count: number;
      moderate_count: number;
      normal_count: number;
    };
  };
  shops: ShopAgingSummary[];
  allInvoices: AgingInvoiceItem[];
}

interface ShopAgingReportProps {
  onBack: () => void;
  formatPKR: (val: number) => string;
  distributorId?: number;
  isSuperAdmin?: boolean;
  currentUser?: any;
  onOpenShopLedger?: (shopId: number) => void;
  onCreatePayment?: (shopId: number) => void;
}

export const ShopAgingReport: React.FC<ShopAgingReportProps> = ({
  onBack,
  formatPKR,
  distributorId,
  isSuperAdmin,
  currentUser,
  onOpenShopLedger,
  onCreatePayment
}) => {
  const [asOfDate, setAsOfDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(
    distributorId ? String(distributorId) : 'all'
  );
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedSlabFilter, setSelectedSlabFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyWithBalance, setOnlyWithBalance] = useState<boolean>(true);
  const [activeViewMode, setActiveViewMode] = useState<'shops' | 'invoices'>('shops');

  const [reportData, setReportData] = useState<AgingReportApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedShopIds, setExpandedShopIds] = useState<Set<number>>(new Set());

  const printRef = useRef<HTMLDivElement>(null);

  // Fetch report data from API
  const fetchAgingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (asOfDate) params.append('asOfDate', asOfDate);
      if (selectedDistributorId && selectedDistributorId !== 'all') {
        params.append('distributor_id', selectedDistributorId);
      }
      if (selectedArea && selectedArea !== 'all') {
        params.append('area', selectedArea);
      }

      const res = await fetch(`/api/reports/shop-aging?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch aging data (status: ${res.status})`);
      }
      const data: AgingReportApiResponse = await res.json();
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load shop aging report:', err);
      setError(err.message || 'An error occurred while loading the report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgingData();
  }, [asOfDate, selectedDistributorId, selectedArea]);

  // Extract distinct areas for filter dropdown
  const availableAreas = useMemo(() => {
    if (!reportData?.shops) return [];
    const areas = new Set<string>();
    for (const s of reportData.shops) {
      if (s.area && s.area.trim()) areas.add(s.area.trim());
    }
    return Array.from(areas).sort();
  }, [reportData]);

  // Filtered Shops List
  const filteredShops = useMemo(() => {
    if (!reportData?.shops) return [];

    return reportData.shops.filter(shop => {
      // Balance filter
      if (onlyWithBalance && shop.total_receivable <= 0) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = shop.shop_name.toLowerCase().includes(query);
        const matchOwner = shop.owner_name?.toLowerCase().includes(query);
        const matchPhone = shop.phone?.toLowerCase().includes(query);
        const matchId = String(shop.shop_id).includes(query);
        const matchArea = shop.area?.toLowerCase().includes(query);
        if (!matchName && !matchOwner && !matchPhone && !matchId && !matchArea) {
          return false;
        }
      }

      // Slab Filter
      if (selectedSlabFilter !== 'all') {
        switch (selectedSlabFilter) {
          case 'slab_30':
            if (shop.slab_30 <= 0) return false;
            break;
          case 'slab_45':
            if (shop.slab_45 <= 0) return false;
            break;
          case 'slab_60':
            if (shop.slab_60 <= 0) return false;
            break;
          case 'slab_75':
            if (shop.slab_75 <= 0) return false;
            break;
          case 'slab_90':
            if (shop.slab_90 <= 0) return false;
            break;
          case 'slab_over_90':
            if (shop.slab_over_90 <= 0) return false;
            break;
        }
      }

      // Risk Filter
      if (selectedRiskFilter !== 'all' && shop.risk_level !== selectedRiskFilter) {
        return false;
      }

      return true;
    });
  }, [reportData, onlyWithBalance, searchTerm, selectedSlabFilter, selectedRiskFilter]);

  // Filtered Invoices List for Invoice tab
  const filteredInvoices = useMemo(() => {
    if (!reportData?.allInvoices) return [];

    return reportData.allInvoices.filter(inv => {
      // Area filter
      if (selectedArea !== 'all' && inv.area !== selectedArea) {
        return false;
      }

      // Slab filter
      if (selectedSlabFilter !== 'all' && inv.slab_key !== selectedSlabFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchInvDoc = inv.invoice_doc_no.toLowerCase().includes(query);
        const matchShop = inv.shop_name.toLowerCase().includes(query);
        const matchArea = inv.area.toLowerCase().includes(query);
        if (!matchInvDoc && !matchShop && !matchArea) {
          return false;
        }
      }

      return true;
    });
  }, [reportData, selectedArea, selectedSlabFilter, searchTerm]);

  // Calculated totals of the currently visible filtered shops
  const filteredTotals = useMemo(() => {
    return filteredShops.reduce(
      (acc, s) => {
        acc.billed += s.total_billed;
        acc.paid += s.total_paid;
        acc.receivable += s.total_receivable;
        acc.slab_30 += s.slab_30;
        acc.slab_45 += s.slab_45;
        acc.slab_60 += s.slab_60;
        acc.slab_75 += s.slab_75;
        acc.slab_90 += s.slab_90;
        acc.slab_over_90 += s.slab_over_90;
        return acc;
      },
      {
        billed: 0,
        paid: 0,
        receivable: 0,
        slab_30: 0,
        slab_45: 0,
        slab_60: 0,
        slab_75: 0,
        slab_90: 0,
        slab_over_90: 0
      }
    );
  }, [filteredShops]);

  // Toggle individual shop accordion
  const toggleExpandShop = (shopId: number) => {
    setExpandedShopIds(prev => {
      const next = new Set(prev);
      if (next.has(shopId)) {
        next.delete(shopId);
      } else {
        next.add(shopId);
      }
      return next;
    });
  };

  // Expand or Collapse All
  const handleToggleExpandAll = () => {
    if (expandedShopIds.size === filteredShops.length) {
      setExpandedShopIds(new Set());
    } else {
      setExpandedShopIds(new Set(filteredShops.map(s => s.shop_id)));
    }
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredShops || filteredShops.length === 0) return;

    const headers = [
      'Shop ID',
      'Shop Name',
      'Owner',
      'Area',
      'Subarea',
      'Phone',
      'Credit Limit',
      'Net Billed (PKR)',
      'Payments Deducted (PKR)',
      'Net Receivable (PKR)',
      '0 - 30 Days (PKR)',
      '31 - 45 Days (PKR)',
      '46 - 60 Days (PKR)',
      '61 - 75 Days (PKR)',
      '76 - 90 Days (PKR)',
      '> 90 Days (PKR)',
      'Risk Status',
      'Oldest Invoice Date',
      'Oldest Days'
    ];

    const rows = filteredShops.map(s => [
      s.shop_id,
      `"${s.shop_name.replace(/"/g, '""')}"`,
      `"${(s.owner_name || '').replace(/"/g, '""')}"`,
      `"${(s.area || '').replace(/"/g, '""')}"`,
      `"${(s.subarea || '').replace(/"/g, '""')}"`,
      `"${s.phone || ''}"`,
      s.credit_limit,
      s.total_billed,
      s.total_paid,
      s.total_receivable,
      s.slab_30,
      s.slab_45,
      s.slab_60,
      s.slab_75,
      s.slab_90,
      s.slab_over_90,
      s.risk_level,
      s.oldest_invoice_date || 'N/A',
      s.oldest_invoice_days
    ]);

    // Totals row
    rows.push([
      'TOTALS',
      `"${filteredShops.length} Shops"`,
      '',
      '',
      '',
      '',
      '',
      filteredTotals.billed,
      filteredTotals.paid,
      filteredTotals.receivable,
      filteredTotals.slab_30,
      filteredTotals.slab_45,
      filteredTotals.slab_60,
      filteredTotals.slab_75,
      filteredTotals.slab_90,
      filteredTotals.slab_over_90,
      '',
      '',
      ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Shop_Aging_Schedule_AsOf_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert size={12} className="text-rose-600" />
            Critical (&gt;90d)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle size={12} className="text-amber-600" />
            High (61-90d)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} className="text-blue-600" />
            Moderate (31-60d)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Current (0-30d)
          </span>
        );
    }
  };

  const distributorInfo = reportData?.shops?.[0]
    ? {
        name: reportData.shops[0].distributor_name || 'Al-Rehman Traders',
        code: reportData.shops[0].distributor_code || 'DIST-01',
        address: reportData.shops[0].distributor_address || 'Karachi Central Logistics & Distribution',
        phone: reportData.shops[0].distributor_phone || '021-34567890',
        city: reportData.shops[0].distributor_city || 'Karachi'
      }
    : {
        name: 'Al-Rehman Traders',
        code: 'DIST-01',
        address: 'Plot 45, Sector 15, Korangi Industrial Area',
        phone: '021-34567890',
        city: 'Karachi'
      };

  return (
    <div className="space-y-6" id="shop-aging-container">
      {/* ----------------- TOP CONTROLS & HEADER ----------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
              title="Return to reports hub"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Shop Aging Report
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  SAR01 / AG01
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Accounts Receivable Aging Schedule categorized by 30, 45, 60, 75, 90, and &gt;90 day slabs based on billing date
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchAgingData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!reportData || filteredShops.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all disabled:opacity-50"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData || filteredShops.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Printer size={16} />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* As-Of Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              As-Of Date (Aging Cutoff)
            </label>
            <div className="relative">
              <input
                type="date"
                value={asOfDate}
                onChange={e => setAsOfDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Urban Area
            </label>
            <div className="relative">
              <select
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Areas</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Slab Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Aging Slab Filter
            </label>
            <div className="relative">
              <select
                value={selectedSlabFilter}
                onChange={e => setSelectedSlabFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Aging Slabs</option>
                <option value="slab_30">0 - 30 Days Only</option>
                <option value="slab_45">31 - 45 Days Only</option>
                <option value="slab_60">46 - 60 Days Only</option>
                <option value="slab_75">61 - 75 Days Only</option>
                <option value="slab_90">76 - 90 Days Only</option>
                <option value="slab_over_90">&gt; 90 Days Overdue Only</option>
              </select>
              <Clock size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Risk Severity
            </label>
            <div className="relative">
              <select
                value={selectedRiskFilter}
                onChange={e => setSelectedRiskFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="CRITICAL">Critical (&gt;90 Days Overdue)</option>
                <option value="HIGH">High (61-90 Days)</option>
                <option value="MODERATE">Moderate (31-60 Days)</option>
                <option value="NORMAL">Normal (0-30 Days Current)</option>
              </select>
              <AlertTriangle size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Search Shop / Party
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search shop, owner, phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* View Switcher and Toggles */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setActiveViewMode('shops')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  activeViewMode === 'shops'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Building2 size={14} />
                <span>Shop Summary Matrix ({filteredShops.length})</span>
              </button>
              <button
                onClick={() => setActiveViewMode('invoices')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  activeViewMode === 'invoices'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Layers size={14} />
                <span>Itemized Open Invoices ({filteredInvoices.length})</span>
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium select-none text-xs">
              <input
                type="checkbox"
                checked={onlyWithBalance}
                onChange={e => setOnlyWithBalance(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Only show accounts with outstanding receivable balance</span>
            </label>
          </div>

          {activeViewMode === 'shops' && (
            <button
              onClick={handleToggleExpandAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {expandedShopIds.size === filteredShops.length ? 'Collapse All Details' : 'Expand All Invoices'}
            </button>
          )}
        </div>
      </div>

      {/* ----------------- KPI EXECUTIVE CARDS ----------------- */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 print:hidden">
          {/* Total Receivable */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1 lg:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Receivable
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatPKR(reportData.summary.total_receivable)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{reportData.summary.total_shops_with_balance} open accounts</span>
              <span className="font-semibold text-indigo-600">{reportData.summary.total_open_invoices} invs</span>
            </div>
          </div>

          {/* 0 - 30 Days */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                0 - 30 Days
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded">
                {reportData.summary.slabs.slab_30.percentage}%
              </span>
            </div>
            <div className="text-lg font-black text-emerald-950 mt-1">
              {formatPKR(reportData.summary.slabs.slab_30.amount)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">Current / On Time</div>
          </div>

          {/* 31 - 45 Days */}
          <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                31 - 45 Days
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded">
                {reportData.summary.slabs.slab_45.percentage}%
              </span>
            </div>
            <div className="text-lg font-black text-amber-950 mt-1">
              {formatPKR(reportData.summary.slabs.slab_45.amount)}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">Follow-up due</div>
          </div>

          {/* 46 - 60 Days */}
          <div className="bg-white p-4 rounded-2xl border border-orange-100 bg-orange-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
                46 - 60 Days
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded">
                {reportData.summary.slabs.slab_60.percentage}%
              </span>
            </div>
            <div className="text-lg font-black text-orange-950 mt-1">
              {formatPKR(reportData.summary.slabs.slab_60.amount)}
            </div>
            <div className="text-[11px] text-orange-700 mt-1">Notice recommended</div>
          </div>

          {/* 61 - 90 Days (Combined 61-75 & 76-90) */}
          <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                61 - 90 Days
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                {Math.round(
                  (reportData.summary.slabs.slab_75.percentage +
                    reportData.summary.slabs.slab_90.percentage) *
                    10
                ) / 10}
                %
              </span>
            </div>
            <div className="text-lg font-black text-rose-950 mt-1">
              {formatPKR(
                reportData.summary.slabs.slab_75.amount + reportData.summary.slabs.slab_90.amount
              )}
            </div>
            <div className="text-[11px] text-rose-700 mt-1">High aging risk</div>
          </div>

          {/* > 90 Days */}
          <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/25 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                &gt; 90 Days
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded">
                {reportData.summary.slabs.slab_over_90.percentage}%
              </span>
            </div>
            <div className="text-lg font-black text-purple-950 mt-1">
              {formatPKR(reportData.summary.slabs.slab_over_90.amount)}
            </div>
            <div className="text-[11px] text-purple-700 mt-1">Severe delinquency</div>
          </div>
        </div>
      )}

      {/* ----------------- VISUAL AGING DISTRIBUTION BAR ----------------- */}
      {reportData?.summary && reportData.summary.total_receivable > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Receivable Slabs Composition
              </span>
              <span className="text-xs text-slate-400 font-normal">
                (Calculated Net Receivable = Billed - Payments)
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Cutoff Date: <strong className="text-slate-800">{asOfDate}</strong>
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
            {reportData.summary.slabs.slab_30.percentage > 0 && (
              <div
                style={{ width: `${reportData.summary.slabs.slab_30.percentage}%` }}
                className="bg-emerald-500 h-full hover:brightness-110 transition-all cursor-pointer"
                title={`0-30 Days: ${formatPKR(reportData.summary.slabs.slab_30.amount)} (${reportData.summary.slabs.slab_30.percentage}%)`}
                onClick={() => setSelectedSlabFilter('slab_30')}
              />
            )}
            {reportData.summary.slabs.slab_45.percentage > 0 && (
              <div
                style={{ width: `${reportData.summary.slabs.slab_45.percentage}%` }}
                className="bg-amber-400 h-full hover:brightness-110 transition-all cursor-pointer"
                title={`31-45 Days: ${formatPKR(reportData.summary.slabs.slab_45.amount)} (${reportData.summary.slabs.slab_45.percentage}%)`}
                onClick={() => setSelectedSlabFilter('slab_45')}
              />
            )}
            {reportData.summary.slabs.slab_60.percentage > 0 && (
              <div
                style={{ width: `${reportData.summary.slabs.slab_60.percentage}%` }}
                className="bg-orange-500 h-full hover:brightness-110 transition-all cursor-pointer"
                title={`46-60 Days: ${formatPKR(reportData.summary.slabs.slab_60.amount)} (${reportData.summary.slabs.slab_60.percentage}%)`}
                onClick={() => setSelectedSlabFilter('slab_60')}
              />
            )}
            {reportData.summary.slabs.slab_75.percentage > 0 && (
              <div
                style={{ width: `${reportData.summary.slabs.slab_75.percentage}%` }}
                className="bg-rose-400 h-full hover:brightness-110 transition-all cursor-pointer"
                title={`61-75 Days: ${formatPKR(reportData.summary.slabs.slab_75.amount)} (${reportData.summary.slabs.slab_75.percentage}%)`}
                onClick={() => setSelectedSlabFilter('slab_75')}
              />
            )}
            {reportData.summary.slabs.slab_90.percentage > 0 && (
              <div
                style={{ width: `${reportData.summary.slabs.slab_90.percentage}%` }}
                className="bg-red-600 h-full hover:brightness-110 transition-all cursor-pointer"
                title={`76-90 Days: ${formatPKR(reportData.summary.slabs.slab_90.amount)} (${reportData.summary.slabs.slab_90.percentage}%)`}
                onClick={() => setSelectedSlabFilter('slab_90')}
              />
            )}
            {reportData.summary.slabs.slab_over_90.percentage > 0 && (
              <div
                style={{ width: `${reportData.summary.slabs.slab_over_90.percentage}%` }}
                className="bg-purple-800 h-full hover:brightness-110 transition-all cursor-pointer"
                title={`>90 Days: ${formatPKR(reportData.summary.slabs.slab_over_90.amount)} (${reportData.summary.slabs.slab_over_90.percentage}%)`}
                onClick={() => setSelectedSlabFilter('slab_over_90')}
              />
            )}
          </div>

          {/* Slabs Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-slate-600">
            <button
              onClick={() => setSelectedSlabFilter('slab_30')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
                selectedSlabFilter === 'slab_30' ? 'bg-emerald-100 font-bold text-emerald-900' : 'hover:bg-slate-100'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>0-30d: {formatPKR(reportData.summary.slabs.slab_30.amount)}</span>
            </button>
            <button
              onClick={() => setSelectedSlabFilter('slab_45')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
                selectedSlabFilter === 'slab_45' ? 'bg-amber-100 font-bold text-amber-900' : 'hover:bg-slate-100'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>31-45d: {formatPKR(reportData.summary.slabs.slab_45.amount)}</span>
            </button>
            <button
              onClick={() => setSelectedSlabFilter('slab_60')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
                selectedSlabFilter === 'slab_60' ? 'bg-orange-100 font-bold text-orange-900' : 'hover:bg-slate-100'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>46-60d: {formatPKR(reportData.summary.slabs.slab_60.amount)}</span>
            </button>
            <button
              onClick={() => setSelectedSlabFilter('slab_75')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
                selectedSlabFilter === 'slab_75' ? 'bg-rose-100 font-bold text-rose-900' : 'hover:bg-slate-100'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>61-75d: {formatPKR(reportData.summary.slabs.slab_75.amount)}</span>
            </button>
            <button
              onClick={() => setSelectedSlabFilter('slab_90')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
                selectedSlabFilter === 'slab_90' ? 'bg-red-100 font-bold text-red-900' : 'hover:bg-slate-100'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>76-90d: {formatPKR(reportData.summary.slabs.slab_90.amount)}</span>
            </button>
            <button
              onClick={() => setSelectedSlabFilter('slab_over_90')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
                selectedSlabFilter === 'slab_over_90' ? 'bg-purple-100 font-bold text-purple-950' : 'hover:bg-slate-100'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-800" />
              <span>&gt;90d: {formatPKR(reportData.summary.slabs.slab_over_90.amount)}</span>
            </button>

            {selectedSlabFilter !== 'all' && (
              <button
                onClick={() => setSelectedSlabFilter('all')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline ml-2"
              >
                Clear Slab Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------- LOADING & ERROR STATES ----------------- */}
      {loading && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="inline-block animate-spin text-indigo-600">
            <RefreshCw size={36} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Calculating Aging Matrix...</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Computing open invoice age against as-of cutoff date {asOfDate}, aggregating deducted payments, and assigning receivable slabs.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertTriangle size={20} className="text-rose-600" />
            <span>Error Generating Report</span>
          </div>
          <p className="text-sm text-rose-700">{error}</p>
          <button
            onClick={fetchAgingData}
            className="mt-2 px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* ----------------- PRINT HEADER (Visible only on print) ----------------- */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {distributorInfo.name}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">{distributorInfo.address}</p>
            <p className="text-xs text-slate-600">
              Phone: {distributorInfo.phone} | City: {distributorInfo.city}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded inline-block border border-slate-300">
              DOC: SAP-SAR01-AGING
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mt-1">ACCOUNTS RECEIVABLE AGING REPORT</h2>
            <p className="text-xs text-slate-600">
              Aging Cutoff Date: <strong>{asOfDate}</strong>
            </p>
            <p className="text-[10px] text-slate-400">
              Generated: {new Date().toLocaleString('en-PK')}
            </p>
          </div>
        </div>
      </div>

      {/* ----------------- MAIN REPORT CONTENT ----------------- */}
      {!loading && !error && reportData && (
        <>
          {/* VIEW MODE: SHOPS SUMMARY MATRIX */}
          {activeViewMode === 'shops' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-3 w-10 text-center print:hidden">#</th>
                      <th className="py-3.5 px-4">Shop / Account Title</th>
                      <th className="py-3.5 px-3">Area</th>
                      <th className="py-3.5 px-3 text-right">Credit Limit</th>
                      <th className="py-3.5 px-3 text-right">Net Billed</th>
                      <th className="py-3.5 px-3 text-right">Paid Amount</th>
                      <th className="py-3.5 px-4 text-right bg-indigo-50/50 text-indigo-950 font-black">
                        Net Receivable
                      </th>
                      <th className="py-3.5 px-3 text-right text-emerald-800 bg-emerald-50/40">
                        0 - 30 Days
                      </th>
                      <th className="py-3.5 px-3 text-right text-amber-800 bg-amber-50/40">
                        31 - 45 Days
                      </th>
                      <th className="py-3.5 px-3 text-right text-orange-800 bg-orange-50/40">
                        46 - 60 Days
                      </th>
                      <th className="py-3.5 px-3 text-right text-rose-800 bg-rose-50/40">
                        61 - 75 Days
                      </th>
                      <th className="py-3.5 px-3 text-right text-red-900 bg-red-50/40">
                        76 - 90 Days
                      </th>
                      <th className="py-3.5 px-3 text-right text-purple-950 bg-purple-50/40">
                        &gt; 90 Days
                      </th>
                      <th className="py-3.5 px-3 text-center">Risk Status</th>
                      <th className="py-3.5 px-3 text-center print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {filteredShops.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="py-12 text-center text-slate-400">
                          <Info size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm">No shops match the selected criteria</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Try adjusting your search, area, or aging slab filters.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredShops.map(shop => {
                        const isExpanded = expandedShopIds.has(shop.shop_id);
                        return (
                          <React.Fragment key={shop.shop_id}>
                            <tr
                              className={cn(
                                'hover:bg-slate-50/80 transition-colors cursor-pointer',
                                isExpanded ? 'bg-slate-50/60 font-semibold' : ''
                              )}
                              onClick={() => toggleExpandShop(shop.shop_id)}
                            >
                              {/* Expand chevron */}
                              <td className="py-3 px-3 text-center print:hidden">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleExpandShop(shop.shop_id);
                                  }}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              </td>

                              {/* Shop Details */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{shop.shop_name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>ID: #{shop.shop_id}</span>
                                  {shop.owner_name && <span>• {shop.owner_name}</span>}
                                  {shop.phone && <span>• {shop.phone}</span>}
                                </div>
                              </td>

                              {/* Area */}
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-700">{shop.area || 'N/A'}</div>
                                {shop.subarea && (
                                  <div className="text-[10px] text-slate-400">{shop.subarea}</div>
                                )}
                              </td>

                              {/* Credit Limit */}
                              <td className="py-3 px-3 text-right font-mono text-slate-600">
                                {shop.credit_limit > 0 ? (
                                  <div>
                                    <span>{formatPKR(shop.credit_limit)}</span>
                                    {shop.credit_utilization_pct > 80 && (
                                      <div className="text-[10px] font-bold text-rose-600">
                                        {shop.credit_utilization_pct}% used
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>

                              {/* Net Billed */}
                              <td className="py-3 px-3 text-right font-mono text-slate-700">
                                {formatPKR(shop.total_billed)}
                              </td>

                              {/* Paid Amount */}
                              <td className="py-3 px-3 text-right font-mono text-emerald-700">
                                {formatPKR(shop.total_paid)}
                              </td>

                              {/* Net Receivable */}
                              <td className="py-3 px-4 text-right font-mono font-extrabold bg-indigo-50/50 text-indigo-950">
                                {formatPKR(shop.total_receivable)}
                              </td>

                              {/* Slabs */}
                              <td
                                className={cn(
                                  'py-3 px-3 text-right font-mono',
                                  shop.slab_30 > 0 ? 'text-emerald-700 font-bold bg-emerald-50/20' : 'text-slate-300'
                                )}
                              >
                                {shop.slab_30 > 0 ? formatPKR(shop.slab_30) : '-'}
                              </td>

                              <td
                                className={cn(
                                  'py-3 px-3 text-right font-mono',
                                  shop.slab_45 > 0 ? 'text-amber-700 font-bold bg-amber-50/20' : 'text-slate-300'
                                )}
                              >
                                {shop.slab_45 > 0 ? formatPKR(shop.slab_45) : '-'}
                              </td>

                              <td
                                className={cn(
                                  'py-3 px-3 text-right font-mono',
                                  shop.slab_60 > 0 ? 'text-orange-700 font-bold bg-orange-50/20' : 'text-slate-300'
                                )}
                              >
                                {shop.slab_60 > 0 ? formatPKR(shop.slab_60) : '-'}
                              </td>

                              <td
                                className={cn(
                                  'py-3 px-3 text-right font-mono',
                                  shop.slab_75 > 0 ? 'text-rose-700 font-bold bg-rose-50/20' : 'text-slate-300'
                                )}
                              >
                                {shop.slab_75 > 0 ? formatPKR(shop.slab_75) : '-'}
                              </td>

                              <td
                                className={cn(
                                  'py-3 px-3 text-right font-mono',
                                  shop.slab_90 > 0 ? 'text-red-700 font-bold bg-red-50/20' : 'text-slate-300'
                                )}
                              >
                                {shop.slab_90 > 0 ? formatPKR(shop.slab_90) : '-'}
                              </td>

                              <td
                                className={cn(
                                  'py-3 px-3 text-right font-mono',
                                  shop.slab_over_90 > 0
                                    ? 'text-purple-900 font-black bg-purple-50/30'
                                    : 'text-slate-300'
                                )}
                              >
                                {shop.slab_over_90 > 0 ? formatPKR(shop.slab_over_90) : '-'}
                              </td>

                              {/* Risk Status */}
                              <td className="py-3 px-3 text-center">
                                {getRiskBadge(shop.risk_level)}
                              </td>

                              {/* Action Buttons */}
                              <td
                                className="py-3 px-3 text-center print:hidden"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {onOpenShopLedger && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenShopLedger(shop.shop_id)}
                                      className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-all"
                                      title="Open detailed Shop Ledger (SLR01)"
                                    >
                                      <BookOpen size={14} />
                                    </button>
                                  )}
                                  {onCreatePayment && (
                                    <button
                                      type="button"
                                      onClick={() => onCreatePayment(shop.shop_id)}
                                      className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition-all"
                                      title="Receive payment against outstanding balance"
                                    >
                                      <CreditCard size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Nested Invoice Breakdown Accordion */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90 border-b border-slate-200">
                                <td colSpan={15} className="py-4 px-6">
                                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-indigo-600" />
                                        <span className="font-bold text-xs text-slate-900">
                                          Open Invoices Breakdown for {shop.shop_name} ({shop.invoices.length} invoices)
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Oldest open invoice: <strong>{shop.oldest_invoice_date || 'N/A'}</strong> ({shop.oldest_invoice_days} days aged)
                                      </div>
                                    </div>

                                    {shop.invoices.length === 0 ? (
                                      <p className="text-xs text-slate-400 py-2">
                                        No outstanding open invoices found for this shop.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                          <thead>
                                            <tr className="border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase">
                                              <th className="py-2 px-3">Invoice Doc #</th>
                                              <th className="py-2 px-3">Billing Date</th>
                                              <th className="py-2 px-3 text-center">Days Aged</th>
                                              <th className="py-2 px-3 text-center">Assigned Slab</th>
                                              <th className="py-2 px-3 text-right">Net Billed</th>
                                              <th className="py-2 px-3 text-right">Payments Deducted</th>
                                              <th className="py-2 px-3 text-right font-bold text-indigo-950">
                                                Net Receivable
                                              </th>
                                              <th className="py-2 px-3">Settlement Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {shop.invoices.map(inv => (
                                              <tr key={inv.invoice_id} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 font-mono font-bold text-indigo-600">
                                                  {inv.invoice_doc_no}
                                                </td>
                                                <td className="py-2 px-3 font-mono">{inv.billing_date}</td>
                                                <td className="py-2 px-3 text-center">
                                                  <span
                                                    className={cn(
                                                      'px-2 py-0.5 rounded-full font-bold text-[10px]',
                                                      inv.days_aged > 90
                                                        ? 'bg-purple-100 text-purple-900'
                                                        : inv.days_aged > 60
                                                        ? 'bg-rose-100 text-rose-900'
                                                        : inv.days_aged > 30
                                                        ? 'bg-amber-100 text-amber-900'
                                                        : 'bg-emerald-100 text-emerald-900'
                                                    )}
                                                  >
                                                    {inv.days_aged} days
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3 text-center font-semibold">
                                                  {inv.slab_label}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono">
                                                  {formatPKR(inv.net_amount)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-emerald-600">
                                                  {inv.paid_amount > 0 ? formatPKR(inv.paid_amount) : '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-indigo-950">
                                                  {formatPKR(inv.receivable_amount)}
                                                </td>
                                                <td className="py-2 px-3">
                                                  {inv.paid_amount > 0 ? (
                                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                      Partially Settled ({Math.round((inv.paid_amount / inv.net_amount) * 100)}%)
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                      Unpaid
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>

                  {/* Grand Totals Footer */}
                  {filteredShops.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
                        <td className="py-3.5 px-3 print:hidden"></td>
                        <td className="py-3.5 px-4 font-black">
                          GRAND TOTAL ({filteredShops.length} SHOPS)
                        </td>
                        <td className="py-3.5 px-3"></td>
                        <td className="py-3.5 px-3"></td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          {formatPKR(filteredTotals.billed)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-800">
                          {formatPKR(filteredTotals.paid)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-indigo-950 bg-indigo-100/60 font-black text-sm">
                          {formatPKR(filteredTotals.receivable)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-900 bg-emerald-100/40">
                          {formatPKR(filteredTotals.slab_30)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-900 bg-amber-100/40">
                          {formatPKR(filteredTotals.slab_45)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-orange-900 bg-orange-100/40">
                          {formatPKR(filteredTotals.slab_60)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-rose-900 bg-rose-100/40">
                          {formatPKR(filteredTotals.slab_75)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-red-950 bg-red-100/40">
                          {formatPKR(filteredTotals.slab_90)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-purple-950 bg-purple-100/50">
                          {formatPKR(filteredTotals.slab_over_90)}
                        </td>
                        <td className="py-3.5 px-3"></td>
                        <td className="py-3.5 px-3 print:hidden"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE: ITEMIZED OPEN INVOICES */}
          {activeViewMode === 'invoices' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">
                  Itemized Open Invoices Schedule (Sorted by Oldest Outstanding First)
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredInvoices.length} invoices
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-3">Billing Date</th>
                      <th className="py-3 px-4">Shop Name</th>
                      <th className="py-3 px-3">Area</th>
                      <th className="py-3 px-3 text-center">Days Aged</th>
                      <th className="py-3 px-3 text-center">Aging Slab</th>
                      <th className="py-3 px-3 text-right">Net Billed</th>
                      <th className="py-3 px-3 text-right">Deducted Payments</th>
                      <th className="py-3 px-4 text-right font-black text-indigo-950 bg-indigo-50/50">
                        Net Receivable
                      </th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          <Info size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm">No open invoices match criteria</p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map(inv => (
                        <tr key={inv.invoice_id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            {inv.invoice_doc_no}
                          </td>
                          <td className="py-3 px-3 font-mono">{inv.billing_date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{inv.shop_name}</td>
                          <td className="py-3 px-3 text-slate-600">{inv.area}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full font-bold text-[10px]',
                                inv.days_aged > 90
                                  ? 'bg-purple-100 text-purple-900'
                                  : inv.days_aged > 60
                                  ? 'bg-rose-100 text-rose-900'
                                  : inv.days_aged > 30
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              )}
                            >
                              {inv.days_aged} days
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {inv.slab_label}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {formatPKR(inv.net_amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-600">
                            {inv.paid_amount > 0 ? formatPKR(inv.paid_amount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-indigo-950 bg-indigo-50/50">
                            {formatPKR(inv.receivable_amount)}
                          </td>
                          <td className="py-3 px-3">
                            {inv.paid_amount > 0 ? (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                                Partially Paid
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              {onOpenShopLedger && (
                                <button
                                  type="button"
                                  onClick={() => onOpenShopLedger(inv.shop_id)}
                                  className="p-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500 rounded transition-all"
                                  title="View Shop Ledger"
                                >
                                  <BookOpen size={14} />
                                </button>
                              )}
                              {onCreatePayment && (
                                <button
                                  type="button"
                                  onClick={() => onCreatePayment(inv.shop_id)}
                                  className="p-1.5 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 rounded transition-all"
                                  title="Receive Payment"
                                >
                                  <CreditCard size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------- PRINT SIGNATURE BLOCK ----------------- */}
          <div className="hidden print:grid grid-cols-3 gap-8 pt-12 mt-12 border-t-2 border-slate-300 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold text-slate-800">Prepared By</div>
              <div className="text-[10px] text-slate-500">Credit Control Officer</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold text-slate-800">Checked By</div>
              <div className="text-[10px] text-slate-500">Internal Accounts Auditor</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold text-slate-800">Approved By</div>
              <div className="text-[10px] text-slate-500">Finance Manager / Director</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
