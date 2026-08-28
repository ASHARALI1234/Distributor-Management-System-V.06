import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  RefreshCw, 
  Search, 
  Calendar, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Plus, 
  DollarSign, 
  Filter, 
  Eye, 
  ExternalLink,
  Receipt,
  Layers,
  ChevronDown,
  RotateCcw,
  Check,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Shop {
  id: number;
  shop_name: string;
  owner_name?: string;
  area?: string;
  subarea?: string;
  location?: string;
  address?: string;
  phone?: string;
  credit_limit?: number;
  category?: string;
  distributor_id?: number;
  distributor_name?: string;
  distributor_code?: string;
  distributor_address?: string;
  distributor_phone?: string;
  distributor_ntn?: string;
  distributor_strn?: string;
  distributor_city?: string;
}

interface PaymentAllocation {
  invoice_id: number;
  payment_id: number;
  allocated_amount: number;
  payment_doc_no: string;
  payment_date: string;
  payment_method: string;
  cheque_no?: string;
  bank_name?: string;
}

interface InvoiceSettlement {
  payment_id: number;
  invoice_id: number;
  invoice_doc_no: string;
  allocated_amount: number;
  invoice_net_amount?: number;
  remaining_outstanding?: number;
}

interface LedgerItem {
  doc_id: number;
  doc_no: string;
  doc_date: string;
  doc_type: 'Invoice' | 'Payment' | 'Sales Return' | 'Delivery';
  status: string;
  gross_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  debit: number;
  credit: number;
  paid_amount?: number;
  outstanding_amount?: number;
  auto_balance: number;
  salesman_name?: string;
  description: string;
  settlement_status?: 'Fully Settled' | 'Partially Settled' | 'Unpaid';
  payments_applied?: PaymentAllocation[];
  invoices_settled?: InvoiceSettlement[];
  settled_summary?: string;
  applied_summary?: string;
  payment_method?: 'CASH' | 'CHEQUE';
  cheque_no?: string;
  cheque_date?: string;
  bank_name?: string;
  bank_branch?: string;
  cash_amount?: number;
  cheque_amount?: number;
  notes?: string;
}

interface ShopLedgerReportData {
  shop: Shop;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  netChange: number;
  allTimeBalance: number;
  ledger: LedgerItem[];
  invoicesSummary: any[];
  paymentsSummary: any[];
}

interface ShopLedgerReportProps {
  onBack: () => void;
  formatPKR: (num: number) => string;
  distributorId?: string | number | null;
  isSuperAdmin?: boolean;
  currentUser?: any;
  initialShopId?: number | null;
  onViewInvoice?: (invoiceId: number) => void;
  onViewPayment?: (paymentId: number) => void;
  onCreatePayment?: (shopId: number) => void;
}

export const ShopLedgerReport: React.FC<ShopLedgerReportProps> = ({
  onBack,
  formatPKR,
  distributorId,
  isSuperAdmin = false,
  currentUser,
  initialShopId,
  onViewInvoice,
  onViewPayment,
  onCreatePayment
}) => {
  // State
  const [shops, setShops] = useState<Shop[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(
    distributorId ? String(distributorId) : 'all'
  );
  const [selectedShopId, setSelectedShopId] = useState<number | null>(initialShopId || null);
  const [shopSearchTerm, setShopSearchTerm] = useState<string>('');
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState<boolean>(false);

  // Date Range (Default: All time from 2021 to current date)
  const [startDate, setStartDate] = useState<string>('2021-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeDatePreset, setActiveDatePreset] = useState<'all' | 'year' | 'month' | '30days'>('all');

  // Report Data
  const [reportData, setReportData] = useState<ShopLedgerReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // View Perspective Tab
  const [viewTab, setViewTab] = useState<'ledger' | 'invoices' | 'payments'>('ledger');
  
  // Quick inspection modal state
  const [inspectItem, setInspectItem] = useState<LedgerItem | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsShopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Distributors
  useEffect(() => {
    fetch('/api/distributors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDistributors(data);
        }
      })
      .catch(err => console.error("Error fetching distributors:", err));
  }, []);

  // Fetch Shops list
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedDistributorId && selectedDistributorId !== 'all') {
      params.append('distributor_id', selectedDistributorId);
    }

    fetch(`/api/shops?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setShops(data);
          // If no shop selected yet, or if current selection is not in list, auto-select first one or initialShopId
          if (!selectedShopId && data.length > 0) {
            const defaultShop = initialShopId 
              ? data.find(s => s.id === initialShopId) || data[0]
              : data.find(s => s.id === 3 || s.id === 4) || data[0];
            setSelectedShopId(defaultShop.id);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching shops:", err);
      });
  }, [selectedDistributorId, initialShopId]);

  // Fetch Ledger Report Data
  const fetchReport = () => {
    if (!selectedShopId) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      shopId: String(selectedShopId),
      startDate,
      endDate
    });

    if (selectedDistributorId && selectedDistributorId !== 'all') {
      params.append('distributor_id', selectedDistributorId);
    }

    fetch(`/api/reports/shop-ledger?${params.toString()}`)
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}: Failed to fetch shop ledger`);
        }
        return res.json();
      })
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load shop ledger report:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedShopId) {
      fetchReport();
    }
  }, [selectedShopId, startDate, endDate, selectedDistributorId]);

  // Date Preset Handlers
  const handleDatePreset = (preset: 'all' | 'year' | 'month' | '30days') => {
    setActiveDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('2021-01-01');
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const yearStart = `${today.getFullYear()}-01-01`;
      setStartDate(yearStart);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      setStartDate(monthStart);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Filtered Shops for autocomplete dropdown
  const filteredShops = useMemo(() => {
    if (!shopSearchTerm.trim()) return shops;
    const term = shopSearchTerm.toLowerCase();
    return shops.filter(s => 
      s.shop_name?.toLowerCase().includes(term) ||
      s.owner_name?.toLowerCase().includes(term) ||
      s.area?.toLowerCase().includes(term) ||
      s.subarea?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term) ||
      String(s.id).includes(term)
    );
  }, [shops, shopSearchTerm]);

  const currentSelectedShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || reportData?.shop;
  }, [shops, selectedShopId, reportData]);

  // Format Dates nicely: DD-MMM-YYYY
  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const clean = dateStr.replace('T', ' ').split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return `${day}-${monthNames[monthIndex] || parts[1]}-${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!reportData || !reportData.ledger || reportData.ledger.length === 0) return;

    const headers = [
      "Doc Date",
      "Doc No",
      "Doc Type",
      "Description / Particulars",
      "Booker / Rep",
      "Billed / Debit (PKR)",
      "Received / Credit (PKR)",
      "Auto Balance (PKR)",
      "Settlement Status",
      "Allocations / References"
    ];

    const rows = [
      [
        formatDateLabel(reportData.startDate),
        "SYSTEM",
        "Opening Balance",
        "RECEIVABLE OPENING BALANCE",
        "-",
        "-",
        "-",
        reportData.openingBalance,
        "-",
        "-"
      ]
    ];

    reportData.ledger.forEach(item => {
      rows.push([
        formatDateLabel(item.doc_date),
        item.doc_no,
        item.doc_type,
        item.description,
        item.salesman_name || "-",
        item.debit || 0,
        item.credit || 0,
        item.auto_balance,
        item.settlement_status || "-",
        item.applied_summary || item.settled_summary || item.notes || "-"
      ]);
    });

    // Summary Row
    rows.push([
      formatDateLabel(reportData.endDate),
      "TOTALS",
      "Closing Balance",
      "CLOSING CUMULATIVE RECEIVABLE",
      "-",
      reportData.totalDebit,
      reportData.totalCredit,
      reportData.closingBalance,
      "-",
      "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shop_Ledger_${currentSelectedShop?.shop_name?.replace(/\s+/g, '_') || 'Customer'}_${reportData.startDate}_to_${reportData.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Credit Limit & Headroom calculation
  const creditLimit = reportData?.shop?.credit_limit || 0;
  const currentClosingBalance = reportData?.closingBalance || 0;
  const availableCredit = Math.max(0, creditLimit - currentClosingBalance);
  const creditUtilizationPct = creditLimit > 0 ? Math.min(100, Math.round((currentClosingBalance / creditLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Toolbar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-bold text-xs"
            title="Back to Reports"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Reports</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">Shop Ledger Report</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 rounded-full">
                  SLR01 / FBL5N
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Customer account statement with itemized invoices, respective payments, and running receivable balance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onCreatePayment && currentSelectedShop && (
            <button
              onClick={() => onCreatePayment(currentSelectedShop.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Receive Payment (PA01)</span>
            </button>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-indigo-600")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!reportData || reportData.ledger.length === 0}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!reportData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Controls (Hidden on Print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Distributor Filter (For SuperAdmin / Multi-distributor) */}
          {(isSuperAdmin || distributors.length > 1) && (
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Distributor</span>
              </label>
              <select
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="all">All Distributors</option>
                {distributors.map(d => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shop Selector with Autocomplete Search */}
          <div className={cn("space-y-1.5 relative", (isSuperAdmin || distributors.length > 1) ? "md:col-span-5" : "md:col-span-6")} ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer / Shop Account *</span>
              </span>
              {currentSelectedShop && (
                <span className="text-[10px] font-mono font-bold text-indigo-600">
                  ID: #{String(currentSelectedShop.id).padStart(4, '0')}
                </span>
              )}
            </label>

            <div className="relative">
              <div 
                onClick={() => setIsShopDropdownOpen(prev => !prev)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {currentSelectedShop ? `${currentSelectedShop.shop_name} (${currentSelectedShop.area || 'Karachi'})` : 'Select Shop / Customer'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Dropdown Menu */}
              {isShopDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-80 overflow-y-auto space-y-1">
                  <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by shop name, owner, area, phone..."
                        value={shopSearchTerm}
                        onChange={(e) => setShopSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {filteredShops.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No matching shops found
                    </div>
                  ) : (
                    filteredShops.map(s => {
                      const isSelected = s.id === selectedShopId;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedShopId(s.id);
                            setIsShopDropdownOpen(false);
                          }}
                          className={cn(
                            "p-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between transition",
                            isSelected ? "bg-indigo-50 border border-indigo-200 text-indigo-900" : "hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{s.shop_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{s.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{s.owner_name || 'Owner'}</span>
                              <span>•</span>
                              <span>{s.area || s.subarea || 'Karachi'}</span>
                              {s.phone && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{s.phone}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className={cn("grid grid-cols-2 gap-2", (isSuperAdmin || distributors.length > 1) ? "md:col-span-4" : "md:col-span-6")}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset('all');
                }}
                className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset('all');
                }}
                className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Date Presets and Perspective Tabs Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider font-mono mr-1">Period:</span>
            <button
              onClick={() => handleDatePreset('all')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-xs transition",
                activeDatePreset === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All Time
            </button>
            <button
              onClick={() => handleDatePreset('year')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-xs transition",
                activeDatePreset === 'year' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              This Year
            </button>
            <button
              onClick={() => handleDatePreset('month')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-xs transition",
                activeDatePreset === 'month' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              This Month
            </button>
            <button
              onClick={() => handleDatePreset('30days')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-xs transition",
                activeDatePreset === '30days' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Last 30 Days
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewTab('ledger')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5",
                viewTab === 'ledger' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Running Ledger Statement</span>
            </button>
            <button
              onClick={() => setViewTab('invoices')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5",
                viewTab === 'invoices' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoices & Settlement</span>
            </button>
            <button
              onClick={() => setViewTab('payments')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5",
                viewTab === 'payments' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Receipts Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Generating Shop Ledger Report...</p>
          <p className="text-xs text-slate-400">Reconciling billed invoices, cash/cheque payments, and calculating cumulative auto-balances</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">Failed to generate report</h3>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main KPI Summary Dashboard (Hidden on Print) */}
      {!loading && reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
          {/* Opening Balance */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Opening Balance
            </span>
            <p className="text-lg font-black text-slate-800 font-mono tracking-tight mt-1">
              {formatPKR(reportData.openingBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Prior to {formatDateLabel(reportData.startDate)}
            </p>
          </div>

          {/* Invoiced / Debits */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">
              Total Invoiced (Debit)
            </span>
            <p className="text-lg font-black text-blue-700 font-mono tracking-tight mt-1">
              +{formatPKR(reportData.totalDebit)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {reportData.ledger.filter(l => l.doc_type === 'Invoice').length} billed invoices
            </p>
          </div>

          {/* Received / Credits */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">
              Total Received (Credit)
            </span>
            <p className="text-lg font-black text-emerald-700 font-mono tracking-tight mt-1">
              -{formatPKR(reportData.totalCredit)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {reportData.ledger.filter(l => l.doc_type === 'Payment').length} payment receipts
            </p>
          </div>

          {/* Closing Cumulative Receivable */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Closing Auto-Balance
            </span>
            <p className="text-xl font-black text-white font-mono tracking-tight mt-1">
              {formatPKR(reportData.closingBalance)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Net Receivable Position</span>
            </div>
          </div>

          {/* Credit Limit & Headroom */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Credit Headroom
              </span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono",
                creditUtilizationPct > 90 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
              )}>
                {creditUtilizationPct}% Used
              </span>
            </div>
            <p className="text-base font-black text-slate-800 font-mono tracking-tight mt-1">
              {creditLimit > 0 ? formatPKR(availableCredit) : 'No Limit'}
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  creditUtilizationPct > 90 ? "bg-rose-500" : creditUtilizationPct > 70 ? "bg-amber-500" : "bg-indigo-600"
                )}
                style={{ width: `${creditUtilizationPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTAINER (Renderable & Printable) */}
      {!loading && reportData && (
        <div 
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm font-sans text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0" 
          id="shop-ledger-printable-area"
        >
          {/* Official Letterhead Header */}
          <div className="text-center space-y-1 mb-6 border-b border-slate-200 pb-5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {reportData.shop.distributor_name 
                ? `${reportData.shop.distributor_name} (${reportData.shop.distributor_code || 'DST'})` 
                : 'Karachi Central Logistics & Distribution'}
            </h1>
            {reportData.shop.distributor_address && (
              <p className="text-xs text-slate-500 font-medium">
                {reportData.shop.distributor_address}
                {reportData.shop.distributor_phone && ` • Phone: ${reportData.shop.distributor_phone}`}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
              {reportData.shop.distributor_ntn && <span>NTN: {reportData.shop.distributor_ntn}</span>}
              {reportData.shop.distributor_strn && <span>STRN: {reportData.shop.distributor_strn}</span>}
            </div>

            <div className="pt-2">
              <h2 className="text-base font-extrabold tracking-wider text-slate-900 uppercase font-mono">
                CUSTOMER / SHOP LEDGER REPORT
              </h2>
              <p className="text-xs font-bold text-slate-600 font-mono">
                Statement Period: [ {formatDateLabel(reportData.startDate)} ] To [ {formatDateLabel(reportData.endDate)} ]
              </p>
            </div>
          </div>

          {/* Customer Master Information Block */}
          <div className="border border-slate-900 rounded-xl p-4 bg-slate-50/70 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono w-28 shrink-0">
                  Shop Name:
                </span>
                <span className="text-sm font-black text-slate-900 uppercase">
                  {reportData.shop.shop_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono w-28 shrink-0">
                  Proprietor:
                </span>
                <span className="font-bold text-slate-800">
                  {reportData.shop.owner_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono w-28 shrink-0">
                  Area / Territory:
                </span>
                <span className="font-medium text-slate-800">
                  {reportData.shop.location || `${reportData.shop.area || ''}, ${reportData.shop.subarea || ''}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono w-28 shrink-0">
                  Shop Address:
                </span>
                <span className="font-medium text-slate-700">
                  {reportData.shop.address || 'Karachi, Pakistan'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  Account No:
                </span>
                <span className="font-mono font-black text-slate-900">
                  #SHP-{String(reportData.shop.id).padStart(4, '0')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  Contact Phone:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {reportData.shop.phone || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  Approved Credit Limit:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {formatPKR(reportData.shop.credit_limit || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                  Current Net Receivable:
                </span>
                <span className="font-mono font-black text-indigo-700 text-sm">
                  {formatPKR(reportData.closingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* VIEW 1: THE RUNNING BALANCE CHRONOLOGICAL LEDGER */}
          {viewTab === 'ledger' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-950 font-mono uppercase tracking-wider text-[10px]">
                    <th className="border border-slate-900 p-2.5 text-left w-[10%]">Doc. Date</th>
                    <th className="border border-slate-900 p-2.5 text-left w-[11%]">Doc. No</th>
                    <th className="border border-slate-900 p-2.5 text-center w-[9%]">Doc. Type</th>
                    <th className="border border-slate-900 p-2.5 text-left w-[24%]">Particulars / Description</th>
                    <th className="border border-slate-900 p-2.5 text-left w-[12%]">Sales Rep</th>
                    <th className="border border-slate-900 p-2.5 text-right w-[11%]">Billed / Debit</th>
                    <th className="border border-slate-900 p-2.5 text-right w-[11%]">Received / Credit</th>
                    <th className="border border-slate-900 p-2.5 text-right w-[12%] font-extrabold bg-slate-200/60">
                      Auto Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* SYSTEM OPENING BALANCE ROW */}
                  <tr className="bg-slate-50/80 font-bold border-b border-slate-900">
                    <td className="border border-slate-900 p-2.5 font-mono">
                      {formatDateLabel(reportData.startDate)}
                    </td>
                    <td className="border border-slate-900 p-2.5 font-mono text-slate-500 font-bold">
                      SYSTEM
                    </td>
                    <td className="border border-slate-900 p-2.5 text-center">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[9px] font-mono font-bold uppercase">
                        Opening
                      </span>
                    </td>
                    <td className="border border-slate-900 p-2.5 font-sans uppercase font-extrabold text-slate-900">
                      RECEIVABLE OPENING BALANCE
                    </td>
                    <td className="border border-slate-900 p-2.5 font-mono text-slate-400">-</td>
                    <td className="border border-slate-900 p-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="border border-slate-900 p-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="border border-slate-900 p-2.5 text-right font-mono font-black text-indigo-700 bg-slate-50">
                      {formatPKR(reportData.openingBalance)}
                    </td>
                  </tr>

                  {/* NO TRANSACTIONS STATE */}
                  {reportData.ledger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-medium border border-slate-900">
                        No transactions recorded for this customer in the selected date range.
                      </td>
                    </tr>
                  ) : (
                    reportData.ledger.map((item, index) => {
                      const isInvoice = item.doc_type === 'Invoice';
                      const isPayment = item.doc_type === 'Payment';
                      const isReturn = item.doc_type === 'Sales Return';
                      const isDelivery = item.doc_type === 'Delivery';

                      return (
                        <tr 
                          key={index}
                          className={cn(
                            "hover:bg-slate-50/80 transition-colors font-medium border-b border-slate-900",
                            isInvoice && "bg-blue-50/15",
                            isPayment && "bg-emerald-50/20",
                            isReturn && "bg-amber-50/20"
                          )}
                        >
                          {/* Doc Date */}
                          <td className="border border-slate-900 p-2.5 font-mono text-slate-700">
                            {formatDateLabel(item.doc_date)}
                          </td>

                          {/* Doc No (Clickable to inspect in UI) */}
                          <td className="border border-slate-900 p-2.5 font-mono font-bold">
                            <button
                              onClick={() => setInspectItem(item)}
                              className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"
                              title="Inspect Details"
                            >
                              <span>{item.doc_no}</span>
                            </button>
                          </td>

                          {/* Doc Type Badge */}
                          <td className="border border-slate-900 p-2.5 text-center">
                            {isInvoice && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-[9px] uppercase">
                                Invoice
                              </span>
                            )}
                            {isPayment && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[9px] uppercase">
                                Payment
                              </span>
                            )}
                            {isReturn && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold text-[9px] uppercase">
                                Return
                              </span>
                            )}
                            {isDelivery && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold text-[9px] uppercase">
                                Delivery
                              </span>
                            )}
                          </td>

                          {/* Particulars & Respective Allocations */}
                          <td className="border border-slate-900 p-2.5 font-sans">
                            <div className="font-bold text-slate-900">
                              {item.description}
                            </div>

                            {/* If Invoice: Show respective payments applied */}
                            {isInvoice && item.payments_applied && item.payments_applied.length > 0 && (
                              <div className="text-[10px] text-slate-600 mt-1 flex flex-wrap items-center gap-1.5 font-mono">
                                <span className="font-bold text-slate-500">Paid by:</span>
                                {item.payments_applied.map((p, idx) => (
                                  <span key={idx} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                                    {p.payment_doc_no} ({formatPKR(p.allocated_amount)})
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* If Invoice: Show settlement status tag */}
                            {isInvoice && (
                              <div className="mt-1 flex items-center gap-2 text-[10px]">
                                {item.settlement_status === 'Fully Settled' && (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Fully Settled
                                  </span>
                                )}
                                {item.settlement_status === 'Partially Settled' && (
                                  <span className="text-blue-700 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Partially Paid: {formatPKR(item.paid_amount || 0)} | Due: {formatPKR(item.outstanding_amount || 0)}</span>
                                  </span>
                                )}
                                {item.settlement_status === 'Unpaid' && (
                                  <span className="text-rose-600 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Unpaid: {formatPKR(item.debit)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* If Payment: Show respective invoices settled */}
                            {isPayment && item.invoices_settled && item.invoices_settled.length > 0 && (
                              <div className="text-[10px] text-slate-600 mt-1 flex flex-wrap items-center gap-1.5 font-mono">
                                <span className="font-bold text-slate-500">Settled:</span>
                                {item.invoices_settled.map((s, idx) => (
                                  <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                    {s.invoice_doc_no} ({formatPKR(s.allocated_amount)})
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Instrument references for payments */}
                            {isPayment && item.payment_method === 'CHEQUE' && (
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                Cheque #{item.cheque_no} • {item.bank_name} {item.bank_branch ? `(${item.bank_branch})` : ''}
                              </div>
                            )}
                          </td>

                          {/* Sales Rep / Collector */}
                          <td className="border border-slate-900 p-2.5 font-sans font-medium text-slate-700">
                            {item.salesman_name || 'Direct'}
                          </td>

                          {/* Billed / Debit */}
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-bold text-slate-900">
                            {item.debit > 0 ? formatPKR(item.debit) : '-'}
                          </td>

                          {/* Received / Credit */}
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-bold text-emerald-700">
                            {item.credit > 0 ? formatPKR(item.credit) : '-'}
                          </td>

                          {/* Auto Balance (Cumulative Receivable) */}
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-black text-slate-950 bg-slate-100/50">
                            {formatPKR(item.auto_balance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* SUMMARY FOOTER ROW */}
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-950 text-xs">
                    <td colSpan={5} className="border border-slate-900 p-3 uppercase font-mono tracking-wider text-slate-900">
                      Total Movements & Closing Receivable Auto-Balance
                    </td>
                    <td className="border border-slate-900 p-3 text-right font-mono text-blue-800">
                      {formatPKR(reportData.totalDebit)}
                    </td>
                    <td className="border border-slate-900 p-3 text-right font-mono text-emerald-800">
                      {formatPKR(reportData.totalCredit)}
                    </td>
                    <td className="border border-slate-900 p-3 text-right font-mono text-base font-black text-slate-950 bg-slate-200">
                      {formatPKR(reportData.closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* VIEW 2: INVOICES & SETTLEMENTS MATRIX */}
          {viewTab === 'invoices' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900 text-xs font-medium flex items-center justify-between">
                <span>Displaying all sales invoices issued to this customer and their respective payment voucher settlements.</span>
                <span className="font-mono font-bold">{reportData.invoicesSummary.length} Invoices</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-950 font-mono uppercase tracking-wider text-[10px]">
                      <th className="border border-slate-900 p-2.5 text-left w-[12%]">Invoice No</th>
                      <th className="border border-slate-900 p-2.5 text-left w-[12%]">Date</th>
                      <th className="border border-slate-900 p-2.5 text-left w-[20%]">Delivery / Order Ref</th>
                      <th className="border border-slate-900 p-2.5 text-right w-[14%]">Net Invoiced</th>
                      <th className="border border-slate-900 p-2.5 text-right w-[14%]">Paid / Settled</th>
                      <th className="border border-slate-900 p-2.5 text-right w-[14%]">Balance Due</th>
                      <th className="border border-slate-900 p-2.5 text-center w-[14%]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.invoicesSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 font-medium border border-slate-900">
                          No invoices recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      reportData.invoicesSummary.map((inv, idx) => (
                        <tr key={idx} className="border-b border-slate-900 hover:bg-slate-50 transition">
                          <td className="border border-slate-900 p-2.5 font-mono font-bold text-indigo-700">
                            {inv.doc_no}
                          </td>
                          <td className="border border-slate-900 p-2.5 font-mono text-slate-600">
                            {formatDateLabel(inv.doc_date)}
                          </td>
                          <td className="border border-slate-900 p-2.5 font-sans">
                            <div className="font-bold text-slate-800">{inv.delivery_refs || 'Direct Invoice'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Rep: {inv.salesman_name || 'N/A'}</div>
                          </td>
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatPKR(inv.debit)}
                          </td>
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-bold text-emerald-700">
                            {formatPKR(inv.paid_amount || 0)}
                          </td>
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-black text-rose-700">
                            {formatPKR(inv.outstanding_amount || 0)}
                          </td>
                          <td className="border border-slate-900 p-2.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase",
                              inv.settlement_status === 'Fully Settled' ? "bg-emerald-100 text-emerald-800" :
                              inv.settlement_status === 'Partially Settled' ? "bg-blue-100 text-blue-800" :
                              "bg-rose-100 text-rose-800"
                            )}>
                              {inv.settlement_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: PAYMENT RECEIPTS REGISTER */}
          {viewTab === 'payments' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
                <span>Displaying all payment vouchers recorded for this customer, payment instrument types, and invoices cleared.</span>
                <span className="font-mono font-bold">{reportData.paymentsSummary.length} Payment Receipts</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-950 font-mono uppercase tracking-wider text-[10px]">
                      <th className="border border-slate-900 p-2.5 text-left w-[12%]">Payment Doc</th>
                      <th className="border border-slate-900 p-2.5 text-left w-[12%]">Receipt Date</th>
                      <th className="border border-slate-900 p-2.5 text-center w-[12%]">Mode</th>
                      <th className="border border-slate-900 p-2.5 text-left w-[24%]">Instrument Details</th>
                      <th className="border border-slate-900 p-2.5 text-left w-[24%]">Invoices Settled</th>
                      <th className="border border-slate-900 p-2.5 text-right w-[16%]">Total Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.paymentsSummary.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 font-medium border border-slate-900">
                          No payment receipts recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      reportData.paymentsSummary.map((pmt, idx) => (
                        <tr key={idx} className="border-b border-slate-900 hover:bg-slate-50 transition">
                          <td className="border border-slate-900 p-2.5 font-mono font-bold text-emerald-700">
                            {pmt.doc_no}
                          </td>
                          <td className="border border-slate-900 p-2.5 font-mono text-slate-600">
                            {formatDateLabel(pmt.doc_date)}
                          </td>
                          <td className="border border-slate-900 p-2.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase",
                              pmt.payment_method === 'CASH' ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                            )}>
                              {pmt.payment_method || 'CASH'}
                            </span>
                          </td>
                          <td className="border border-slate-900 p-2.5 font-sans">
                            {pmt.payment_method === 'CHEQUE' ? (
                              <div>
                                <div className="font-bold text-slate-800">Cheque #{pmt.cheque_no || 'N/A'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{pmt.bank_name || 'Bank'} {pmt.bank_branch ? `- ${pmt.bank_branch}` : ''}</div>
                              </div>
                            ) : (
                              <div className="font-medium text-slate-700">Counter / Field Cash Handover</div>
                            )}
                          </td>
                          <td className="border border-slate-900 p-2.5 font-mono text-slate-800 text-[11px]">
                            {pmt.settled_summary || 'General Account Credit'}
                          </td>
                          <td className="border border-slate-900 p-2.5 text-right font-mono font-black text-emerald-700">
                            {formatPKR(pmt.credit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Signatures & Verification Block (Print & Official PDF standard) */}
          <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-4 gap-6 text-center text-xs font-mono">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-700">
                {currentUser?.name || 'Accountant / Cashier'}
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Prepared By</span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-700">
                Credit Control Dept
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Verified & Reconciled</span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-700">
                Authorized Signatory
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Distributor Finance</span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-700">
                Customer Signature & Stamp
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Shop Acknowledgment</span>
            </div>
          </div>

          <div className="mt-6 text-[10px] text-slate-400 text-center font-mono print:block">
            Report Generated on: {new Date().toLocaleString()} • Powered by Karachi DMS ERP System
          </div>
        </div>
      )}

      {/* QUICK DOCUMENT INSPECTION MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-xl",
                  inspectItem.doc_type === 'Invoice' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                )}>
                  {inspectItem.doc_type === 'Invoice' ? <FileText className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {inspectItem.doc_type} Document Details
                  </h3>
                  <p className="text-xs font-mono text-indigo-600 font-bold">
                    {inspectItem.doc_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Date:</span>
                  <p className="font-mono font-bold text-slate-800">{formatDateLabel(inspectItem.doc_date)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Status:</span>
                  <p className="font-mono font-bold text-slate-800 capitalize">{inspectItem.settlement_status || inspectItem.status}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Description:</span>
                <p className="font-medium text-slate-800 mt-0.5">{inspectItem.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Debit:</span>
                  <p className="font-mono font-bold text-blue-700">{formatPKR(inspectItem.debit)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Credit:</span>
                  <p className="font-mono font-bold text-emerald-700">{formatPKR(inspectItem.credit)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Auto-Balance:</span>
                  <p className="font-mono font-black text-slate-900">{formatPKR(inspectItem.auto_balance)}</p>
                </div>
              </div>

              {/* Settlement Breakdowns */}
              {inspectItem.doc_type === 'Invoice' && inspectItem.payments_applied && inspectItem.payments_applied.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Respective Payments Applied:</span>
                  <div className="mt-1 space-y-1">
                    {inspectItem.payments_applied.map((p, i) => (
                      <div key={i} className="p-2 bg-emerald-50 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-900">
                        <span>{p.payment_doc_no} ({p.payment_method})</span>
                        <span className="font-bold">{formatPKR(p.allocated_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectItem.doc_type === 'Payment' && inspectItem.invoices_settled && inspectItem.invoices_settled.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Respective Invoices Settled:</span>
                  <div className="mt-1 space-y-1">
                    {inspectItem.invoices_settled.map((s, i) => (
                      <div key={i} className="p-2 bg-blue-50 rounded-lg flex items-center justify-between text-xs font-mono text-blue-900">
                        <span>{s.invoice_doc_no}</span>
                        <span className="font-bold">{formatPKR(s.allocated_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
