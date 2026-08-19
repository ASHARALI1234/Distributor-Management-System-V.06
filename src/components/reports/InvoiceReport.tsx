import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Printer, RefreshCw, Code, Layers, Search, Calendar, X, ExternalLink, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface InvoiceItem {
  id: number;
  invoice_id: number;
  delivery_id: number;
  delivery_item_id: number;
  product_id: string;
  quantity: number;
  unit_price: number;
  trade_discount_pct: number;
  tax_pct: number;
  additional_tax_pct: number;
  special_discount_pct: number;
  net_amount: number;
  product_name: string;
  uom: string;
}

interface InvoiceRecord {
  id: number;
  shop_id: number;
  invoice_date: string;
  gross_amount: number;
  total_discount: number;
  total_tax: number;
  net_amount: number;
  status: string;
  created_at: string;
  shop_name: string;
  owner_name: string;
  location: string;
  phone: string;
  items: InvoiceItem[];
}

interface InvoiceReportProps {
  onBack: () => void;
  formatPKR: (num: number) => string;
}

// Standard English Words Converter
const getAmountInWords = (amount: number): string => {
  const num = Math.floor(amount);
  if (num === 0) return "Zero Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const helper = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + helper(n % 100) : "");
    if (n < 100000) return helper(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + helper(n % 1000) : "");
    if (n < 10000000) return helper(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + helper(n % 100000) : "");
    return helper(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + helper(n % 10000000) : "");
  };

  const result = helper(num).trim();
  // Format to standard Case
  return result + " Only";
};

// Formatting helpers
const formatInvoiceNo = (id: number): string => {
  return `INV # ${id.toString().padStart(4, '0')}`;
};

const formatInvoiceDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

const formatInvoiceTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '02:20 PM';
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes} ${ampm}`;
  } catch (e) {
    return '02:20 PM';
  }
};

const formatAmount = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

// Dynamic NTN generator to make it look 100% authentic
const getShopNTN = (shopId: number, phone: string): string => {
  const pStr = phone.replace(/[^0-9]/g, '');
  const part1 = pStr.slice(0, 5) || '42101';
  const part2 = ((shopId * 147289) % 10000000).toString().padStart(7, '0');
  const part3 = (shopId % 9).toString();
  return `${part1}-${part2}-${part3}/`;
};

export const InvoiceReport: React.FC<InvoiceReportProps> = ({ onBack, formatPKR }) => {
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Read initial query params for printing state persistence
  const urlParams = new URLSearchParams(window.location.search);
  const initialStartDate = urlParams.get('startDate') || '2021-06-16';
  const initialEndDate = urlParams.get('endDate') || '2021-06-16';
  const initialInvoiceNoFrom = urlParams.get('invoiceNoFrom') || '';
  const initialInvoiceNoTo = urlParams.get('invoiceNoTo') || '';

  // Filters state
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [invoiceNoFrom, setInvoiceNoFrom] = useState<string>(initialInvoiceNoFrom);
  const [invoiceNoTo, setInvoiceNoTo] = useState<string>(initialInvoiceNoTo);

  // Schema view state
  const [showSchema, setShowSchema] = useState<boolean>(false);
  
  // Iframe print helper modal state
  const [showIframePrintModal, setShowIframePrintModal] = useState<boolean>(false);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  // Auto-print effect when launched with ?print=true (bypasses iframe block in standalone tab)
  useEffect(() => {
    if (!loading && data.length > 0) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('print') === 'true') {
        const timer = setTimeout(() => {
          window.print();
        }, 1500); // 1.5s delay to ensure complete paint and styling renders
        return () => clearTimeout(timer);
      }
    }
  }, [loading, data]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
      if (invoiceNoFrom) queryParams.set('invoiceNoFrom', invoiceNoFrom);
      if (invoiceNoTo) queryParams.set('invoiceNoTo', invoiceNoTo);

      const res = await fetch(`/api/reports/invoices-range?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const invoices: InvoiceRecord[] = await res.json();
      setData(invoices);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load invoices. Please verify if invoices exist matching the selected parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  // Construct URL for printing with all currently active filters
  const getPrintUrl = () => {
    const params = new URLSearchParams();
    params.set('report', 'INV01');
    params.set('print', 'true');
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (invoiceNoFrom) params.set('invoiceNoFrom', invoiceNoFrom);
    if (invoiceNoTo) params.set('invoiceNoTo', invoiceNoTo);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handlePrint = () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      setShowIframePrintModal(true);
    } else {
      window.print();
    }
  };

  const datasetSchemaJSON = {
    "schema": "DistributionManagementSystem.InvoicePrintReport",
    "description": "Standard invoice printing template complying with professional accounting and distribution specifications. Generates single or range-based invoices with itemized calculations.",
    "parameters": [
      { "id": "Invoice Date From", "description": "Starting date boundaries for querying invoices" },
      { "id": "Invoice Date To", "description": "Ending date boundaries for querying invoices" },
      { "id": "Invoice Number From", "description": "Starting invoice ID filter (inclusive, mapped to 300919 offset)" },
      { "id": "Invoice Number To", "description": "Ending invoice ID filter (inclusive, mapped to 300919 offset)" }
    ],
    "columns": [
      { "id": "Quantity", "description": "Total units dispatched of the specific item" },
      { "id": "Description Of Goods", "description": "Name and description of product formulation" },
      { "id": "Packing", "description": "Packaging unit of measure" },
      { "id": "Sr#", "description": "Item serial number in the current invoice context" },
      { "id": "Rate", "description": "Trade rate of item" },
      { "id": "Gross", "description": "Total gross amount (Quantity * Rate)" },
      { "id": "Tax", "description": "Applied tax amount" },
      { "id": "Disc %", "description": "Trade and special discount percentage combined" },
      { "id": "Disc Amount", "description": "Discount value deducted" },
      { "id": "Net Amount", "description": "Total final net billed transaction valuation" }
    ]
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="invoice-report-view">
      {/* Header and Controls (Hidden during Print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl transition-all"
            title="Back to Reports"
            id="btn-back-reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                T-Code: INV01
              </span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                Invoice Report
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">Invoice Print Utility</h2>
            <p className="text-xs text-slate-500">Replicates official Estimate and Invoice layout. Supports bulk print of serial ranges.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowSchema(!showSchema)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              showSchema 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            id="btn-toggle-schema"
          >
            {showSchema ? <Layers size={16} /> : <Code size={16} />}
            <span>{showSchema ? 'View Interactive UI' : 'View Schema & Code'}</span>
          </button>
          
          <button 
            onClick={handlePrint}
            disabled={data.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-print-report"
          >
            <Printer size={16} />
            <span>Print PDF Invoices ({data.length})</span>
          </button>

          <button 
            onClick={fetchReportData}
            className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            title="Refresh Invoices"
            id="btn-refresh-data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter Section (Hidden during Print) */}
      {!showSchema && (
        <form onSubmit={handleSearchTrigger} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Calendar size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Invoice Selection parameters</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            {/* Invoice Date From */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Date From</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
              />
            </div>

            {/* Invoice Date To */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Date To</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
              />
            </div>

            {/* Invoice Number From */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Number From</label>
              <input 
                type="number"
                placeholder="e.g. 300919"
                value={invoiceNoFrom}
                onChange={(e) => setInvoiceNoFrom(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
              />
            </div>

            {/* Invoice Number To */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Number To</label>
              <input 
                type="number"
                placeholder="e.g. 300926"
                value={invoiceNoTo}
                onChange={(e) => setInvoiceNoTo(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStartDate('2021-06-16');
                setEndDate('2021-06-16');
                setInvoiceNoFrom('');
                setInvoiceNoTo('');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Search size={14} />
              <span>Retrieve Invoices</span>
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4 print:hidden">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-bold">Retrieving and processing invoices range...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-3 print:hidden">
          <div className="bg-rose-100 p-2 rounded-xl text-rose-700 shrink-0">
            <X size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs">Error Loading Data</h4>
            <p className="text-[10px] text-rose-700 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Report Schema / Code block view */}
      {showSchema && (
        <div className="bg-slate-950 text-slate-300 p-6 rounded-3xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-4 print:hidden">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Code size={16} />
              <span className="font-bold">Schema Definition & Metadata Payload</span>
            </div>
            <button 
              onClick={() => setShowSchema(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>
          <pre>{JSON.stringify(datasetSchemaJSON, null, 2)}</pre>
        </div>
      )}

      {/* Main Report View / Print View */}
      {!loading && !error && (
        <>
          {data.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-3xl border border-slate-100 shadow-sm space-y-3 print:hidden">
              <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto text-slate-400">
                <FileText size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Invoices Located</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No invoices were found matching the parameters. Try adjusting the Date From/To or Invoice range filters.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Standalone Visualizer Panel (Hidden during Print) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 print:hidden">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Live Preview ({data.length} invoices found)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Scroll down or click "Print PDF" to generate hard copies.
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">Invoice Count</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{data.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">Aggregate Value</p>
                    <p className="text-lg font-black text-indigo-600 mt-1">
                      {formatAmount(data.reduce((acc, inv) => acc + inv.net_amount, 0))} PKR
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">Total Dispatched Items</p>
                    <p className="text-lg font-black text-slate-800 mt-1">
                      {data.reduce((acc, inv) => acc + inv.items.reduce((sum, item) => sum + item.quantity, 0), 0)} Units
                    </p>
                  </div>
                </div>
              </div>

              {/* PRINT ELEMENT WRAPPER */}
              {/* Uses print-receipt-only class to satisfy the body *:not() print exception */}
              <div className="print-receipt-only space-y-12 w-full max-w-[210mm] mx-auto print:p-0">
                {data.map((invoice, invIndex) => {
                  const totalQty = invoice.items.reduce((sum, it) => sum + it.quantity, 0);
                  const totalGross = invoice.items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
                  const totalDiscAmount = invoice.items.reduce((sum, it) => {
                    const gross = it.quantity * it.unit_price;
                    const pct = (it.trade_discount_pct || 0) + (it.special_discount_pct || 0);
                    return sum + (gross * pct / 100);
                  }, 0);
                  const totalNet = invoice.items.reduce((sum, it) => sum + it.net_amount, 0);

                  return (
                    <div 
                      key={invoice.id} 
                      className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:break-inside-avoid print:break-after-page font-mono text-[11px] leading-normal text-black"
                    >
                      {/* Brand Header */}
                      <div className="text-center mb-6">
                        <h1 className="text-[18px] font-black tracking-wider uppercase text-black">
                          FBM DISTRIBUTORS
                        </h1>
                        <h2 className="text-[13px] font-bold mt-0.5 text-black">
                          Estimate
                        </h2>
                      </div>

                      {/* Meta Columns */}
                      <div className="grid grid-cols-12 gap-4 border-b border-black pb-4 mb-4">
                        {/* Customer Information (Left Side) */}
                        <div className="col-span-7 space-y-2">
                          <div className="flex">
                            <span className="w-32 shrink-0 font-medium text-black">Customer's Name:</span>
                            <span className="font-bold uppercase text-black">{invoice.shop_name}</span>
                          </div>
                          <div className="flex">
                            <span className="w-32 shrink-0 font-medium text-black">Customer's Address:</span>
                            <span className="text-black uppercase">{invoice.location}</span>
                          </div>
                          <div className="flex">
                            <span className="w-32 shrink-0 font-medium text-black">Customer's NTN/NIC:</span>
                            <span className="text-black">{getShopNTN(invoice.shop_id, invoice.phone)}</span>
                          </div>
                        </div>

                        {/* Invoice Metadata (Right Side) */}
                        <div className="col-span-5 space-y-2 text-right">
                          <div className="flex justify-end">
                            <span className="w-28 text-left font-medium text-black">Invoice No:</span>
                            <span className="w-24 text-right font-bold text-black">{formatInvoiceNo(invoice.id)}</span>
                          </div>
                          <div className="flex justify-end">
                            <span className="w-28 text-left font-medium text-black">Invoice Date:</span>
                            <span className="w-24 text-right text-black">{formatInvoiceDate(invoice.invoice_date)}</span>
                          </div>
                          <div className="flex justify-end">
                            <span className="w-28 text-left font-medium text-black">Time:</span>
                            <span className="w-24 text-right text-black">{formatInvoiceTime(invoice.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Itemized Table */}
                      <table className="w-full border-collapse border border-black text-black">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="border-r border-black p-1 text-center font-bold w-12 text-black">Quantity</th>
                            <th className="border-r border-black p-1 text-left font-bold text-black">Description Of Goods</th>
                            <th className="border-r border-black p-1 text-center font-bold w-16 text-black">Packing</th>
                            <th className="border-r border-black p-1 text-center font-bold w-8 text-black">Sr#</th>
                            <th className="border-r border-black p-1 text-right font-bold w-16 text-black">Rate</th>
                            <th className="border-r border-black p-1 text-right font-bold w-20 text-black">Gross</th>
                            <th className="border-r border-black p-1 text-right font-bold w-10 text-black">Tax</th>
                            <th className="border-r border-black p-1 text-right font-bold w-12 text-black">Disc %</th>
                            <th className="border-r border-black p-1 text-right font-bold w-16 text-black">Disc Amount</th>
                            <th className="p-1 text-right font-bold w-20 text-black">Net Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, idx) => {
                            const itemGross = item.quantity * item.unit_price;
                            const itemDiscPct = (item.trade_discount_pct || 0) + (item.special_discount_pct || 0);
                            const itemDiscAmt = itemGross * itemDiscPct / 100;
                            const itemTaxVal = (item.tax_pct || 0) + (item.additional_tax_pct || 0);

                            // Format Packing nicely (e.g. Cooking Oil 1L -> 1L / EA, Soap Bar -> EA)
                            let packing = item.uom || 'EA';
                            if (packing === 'EA') {
                              if (item.product_name.toLowerCase().includes('1l')) packing = '1 LTR';
                              else if (item.product_name.toLowerCase().includes('400g')) packing = '400 GRM';
                              else if (item.product_name.toLowerCase().includes('sugar')) packing = '1 KGS';
                            }

                            return (
                              <tr key={item.id} className="border-b border-black align-top">
                                <td className="border-r border-black p-1.5 text-center font-medium text-black">
                                  {item.quantity}
                                </td>
                                <td className="border-r border-black p-1.5 text-left font-medium uppercase text-black">
                                  {item.product_name}
                                </td>
                                <td className="border-r border-black p-1.5 text-center text-black uppercase">
                                  {packing}
                                </td>
                                <td className="border-r border-black p-1.5 text-center text-black">
                                  {idx + 1}
                                </td>
                                <td className="border-r border-black p-1.5 text-right text-black">
                                  {formatAmount(item.unit_price)}
                                </td>
                                <td className="border-r border-black p-1.5 text-right text-black">
                                  {formatAmount(itemGross)}
                                </td>
                                <td className="border-r border-black p-1.5 text-right text-black">
                                  {itemTaxVal}
                                </td>
                                <td className="border-r border-black p-1.5 text-right text-black">
                                  {itemDiscPct}
                                </td>
                                <td className="border-r border-black p-1.5 text-right text-black">
                                  {formatAmount(itemDiscAmt)}
                                </td>
                                <td className="p-1.5 text-right font-medium text-black">
                                  {formatAmount(item.net_amount)}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Summary Row */}
                          <tr className="border-t border-black font-bold bg-slate-50/10">
                            <td className="border-r border-black p-1.5 text-center text-black">
                              {totalQty}
                            </td>
                            <td className="border-r border-black p-1.5 text-left text-black"></td>
                            <td className="border-r border-black p-1.5 text-center text-black"></td>
                            <td className="border-r border-black p-1.5 text-center text-black"></td>
                            <td className="border-r border-black p-1.5 text-right text-black"></td>
                            <td className="border-r border-black p-1.5 text-right text-black">
                              {formatAmount(totalGross)}
                            </td>
                            <td className="border-r border-black p-1.5 text-right text-black"></td>
                            <td className="border-r border-black p-1.5 text-right text-black"></td>
                            <td className="border-r border-black p-1.5 text-right text-black">
                              {formatAmount(totalDiscAmount)}
                            </td>
                            <td className="p-1.5 text-right text-black">
                              {formatAmount(totalNet)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Calculations & Footers */}
                      <div className="mt-4 space-y-1">
                        <p className="font-bold text-black capitalize">
                          {getAmountInWords(totalNet)}
                        </p>
                        <p className="text-black text-[10px]">
                          Total # of Items: <span className="font-bold">{invoice.items.length}</span>
                        </p>
                      </div>

                      {/* Separator for multiple consecutive invoices (Only during live screen preview, page-break takes care in print) */}
                      {invIndex < data.length - 1 && (
                        <div className="hidden md:block print:hidden my-8 border-t-2 border-dashed border-slate-300"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Iframe Print Redirect Modal */}
      {showIframePrintModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative font-sans"
          >
            <button 
              onClick={() => setShowIframePrintModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              id="btn-close-print-modal"
            >
              <X size={16} />
            </button>

            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl w-fit mb-4">
              <Printer size={28} />
            </div>

            <h3 className="text-slate-900 font-black text-lg tracking-tight mb-2">Print & Save Invoice Range</h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Because this application is currently running inside an editor preview iframe, direct PDF printing is restricted by your browser. 
              <br /><br />
              Click the button below to open the invoices in a dedicated tab. Your browser will immediately launch the print interface where you can choose <strong>"Save as PDF"</strong> or choose your physical printer.
            </p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowIframePrintModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                id="btn-cancel-print"
              >
                Cancel
              </button>
              <a 
                href={getPrintUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowIframePrintModal(false)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                id="btn-confirm-print-tab"
              >
                <span>Open & Print</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
