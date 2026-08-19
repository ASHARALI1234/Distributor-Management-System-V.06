import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Package, User, Printer, RefreshCw, Code, Layers, Search, Calendar, FileText, ExternalLink, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportRow {
  sub_area: string;
  account_title: string;
  booker: string;
  product: string;
  pack_size: string;
  qty: number;
  rate: number;
  amount: number;
  t_invoice: number;
}

interface AreaWiseReportProps {
  onBack: () => void;
  formatPKR: (num: number) => string;
}

export const AreaWiseItemPartySummaryReport: React.FC<AreaWiseReportProps> = ({ onBack, formatPKR }) => {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Read initial query params for printing state persistence
  const urlParams = new URLSearchParams(window.location.search);
  const initialStartDate = urlParams.get('startDate') || '2021-06-16';
  const initialEndDate = urlParams.get('endDate') || '2021-06-16';
  const initialSearchQuery = urlParams.get('searchQuery') || '';
  const initialBooker = urlParams.get('selectedBooker') || 'ALL';
  const initialProduct = urlParams.get('selectedProduct') || 'ALL';

  // Filters state
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedBooker, setSelectedBooker] = useState<string>(initialBooker);
  const [selectedProduct, setSelectedProduct] = useState<string>(initialProduct);

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
      const queryParams = new URLSearchParams({
        startDate,
        endDate
      });
      const res = await fetch(`/api/reports/area-wise-item-party-summary?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const reportRows: ReportRow[] = await res.json();
      setData(reportRows);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load Area Wise Item Party Summary report dataset. Please check if invoices exist on these dates.");
    } finally {
      setLoading(false);
    }
  };

  // Construct URL for printing with all currently active filters
  const getPrintUrl = () => {
    const params = new URLSearchParams();
    params.set('report', 'APS01');
    params.set('print', 'true');
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    params.set('selectedBooker', selectedBooker);
    params.set('selectedProduct', selectedProduct);
    params.set('searchQuery', searchQuery);
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

  // Get unique bookers and products from data for filtering
  const bookers = Array.from(new Set(data.map(item => item.booker))).filter(Boolean).sort();
  const products = Array.from(new Set(data.map(item => item.product))).filter(Boolean).sort();

  // Filter data
  const filteredData = data.filter(row => {
    const matchesSearch = row.account_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBooker = selectedBooker === 'ALL' || row.booker === selectedBooker;
    const matchesProduct = selectedProduct === 'ALL' || row.product === selectedProduct;
    return matchesSearch && matchesBooker && matchesProduct;
  });

  // Group filtered data by sub_area
  const groupedData: Record<string, ReportRow[]> = {};
  filteredData.forEach(row => {
    if (!groupedData[row.sub_area]) {
      groupedData[row.sub_area] = [];
    }
    groupedData[row.sub_area].push(row);
  });

  // Calculate grand totals across all filtered data
  const grandTotalAmount = filteredData.reduce((sum, row) => sum + row.amount, 0);
  const grandTotalInvoices = filteredData.reduce((sum, row) => sum + row.t_invoice, 0);

  const datasetSchemaJSON = {
    "schema": "DistributionManagementSystem.AreaWiseItemPartySummary",
    "description": "Tabular presentation representing aggregated distribution sales grouping by Sub-Areas, listing client points of drop-off, active order bookers, and material quantity rates.",
    "columns": [
      { "id": "S.#", "description": "Serial numbering reset for each sub-area partition" },
      { "id": "Account Title", "description": "Registered business name of the customer point of sales" },
      { "id": "Booker", "description": "Assigned field distribution booking officer" },
      { "id": "Product", "description": "Product formulation code/name" },
      { "id": "Pack Size", "description": "Material configuration or packaging type" },
      { "id": "Qty Full", "description": "Total aggregated delivery units across invoices" },
      { "id": "Rate", "description": "Unit trade rate charged" },
      { "id": "Amount", "description": "Aggregate item line transaction valuation" },
      { "id": "T.Invoice", "description": "Count of distinct active delivery invoices containing this SKU" }
    ],
    "example_row": {
      "sub_area": "BLOCK 10",
      "account_title": "HYPER LINK SUPER MARKET & PHARMACY",
      "booker": "MUHAMMAD ADNAN",
      "product": "WHITE SUGAR",
      "pack_size": "1kgs",
      "qty": 800,
      "rate": 100,
      "amount": 40000,
      "t_invoice": 2
    }
  };

  return (
    <div className="space-y-6" id="area-wise-report-view">
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
                T-Code: APS01
              </span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                Distribution Report
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">Area Wise Item Party Summary</h2>
            <p className="text-xs text-slate-500">Sub-Area consolidated sales, products delivery records, and booking officer auditing totals.</p>
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
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
            id="btn-print-report"
          >
            <Printer size={16} />
            <span>Print PDF Report</span>
          </button>

          <button 
            onClick={fetchReportData}
            className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            title="Refresh Report Data"
            id="btn-refresh-data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter Section (Hidden during Print) */}
      {!showSchema && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Calendar size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Report Filter Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* From Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">From Date</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
                id="filter-start-date"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">To Date</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
                id="filter-end-date"
              />
            </div>

            {/* Booker Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Booker</label>
              <select 
                value={selectedBooker}
                onChange={(e) => setSelectedBooker(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                id="filter-booker"
              >
                <option value="ALL">All Bookers ({bookers.length})</option>
                {bookers.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Product</label>
              <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                id="filter-product"
              >
                <option value="ALL">All Products ({products.length})</option>
                {products.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Shop Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Name Search</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search shop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
                  id="filter-search"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4 print:hidden">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-600">Formulating Area Wise Summary report dataset...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center shadow-sm max-w-2xl mx-auto print:hidden">
          <div className="bg-rose-100 text-rose-700 p-3 rounded-2xl w-fit mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h3 className="text-slate-900 font-bold mb-1">No Distribution Records</h3>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black rounded-xl transition-all"
            >
              Back to reports
            </button>
            <button 
              onClick={fetchReportData}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Schema / Payload View */}
      {!loading && !error && showSchema && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-300 print:hidden"
          id="report-schema-view"
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl text-emerald-400">
                <Code size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Report Schema Definition</h3>
                <p className="text-[10px] text-slate-400">Structured layout specifications for printing dynamic invoices ledger indices.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2 py-1 rounded">JSON payload</span>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto font-mono text-[11px] leading-relaxed bg-slate-950/50">
            <pre className="text-emerald-400">{JSON.stringify(datasetSchemaJSON, null, 2)}</pre>
          </div>
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
            <button 
              onClick={() => setShowSchema(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Close Code View
            </button>
          </div>
        </motion.div>
      )}

      {/* Dynamic PDF/Print Report Representation */}
      {!loading && !error && !showSchema && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm print:border-none print:shadow-none print:p-0 print-receipt-only" id="report-printable-area">
          
          {/* Print Only Corporate Header Branding */}
          <div className="hidden print:flex flex-col items-center justify-center text-center pb-6 mb-4 border-b-2 border-slate-800">
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Karachi DMS</h1>
            <p className="text-xs font-black uppercase tracking-widest text-slate-600 mt-0.5">Distribution Management System</p>
            <div className="text-base font-black text-slate-800 tracking-tight mt-3 uppercase">
              Area Wise Item Party Summary
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mt-2">
              <span>Dated From: <strong className="text-slate-900">{startDate}</strong></span>
              <span>To: <strong className="text-slate-900">{endDate}</strong></span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Generated On: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Screen Only Interactive Status Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 print:hidden">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-700">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">Showing {filteredData.length} entries</p>
                <p className="text-[10px] text-slate-500">Date Range: {startDate} to {endDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Group count</p>
                <p className="text-xs font-black text-slate-800">{Object.keys(groupedData).length} Sub-areas</p>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoices sum</p>
                <p className="text-xs font-black text-slate-800">{grandTotalInvoices} Invoices</p>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-right">
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Grand Total Valuation</p>
                <p className="text-sm font-black text-indigo-600 font-mono">{formatPKR(grandTotalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Main Tabular Content */}
          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <MapPin className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-sm font-bold text-slate-500">No matching distribution records found for your filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try broadening your date range or adjusting booker/product filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedData).map(([subArea, rows]) => {
                // Compute sub-area specific totals
                const subAreaTotalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
                const subAreaTotalInvoices = rows.reduce((sum, r) => sum + r.t_invoice, 0);

                return (
                  <div key={subArea} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-none print:rounded-none">
                    
                    {/* Sub Area Title Bar */}
                    <div className="bg-slate-900 print:bg-transparent px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 print:border-b-2 print:border-slate-800 print:px-0 print:py-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-400 print:text-slate-800 shrink-0" />
                        <span className="text-xs sm:text-sm font-black text-white print:text-slate-900 uppercase font-mono tracking-wide">
                          Sub Area Title: {subArea}
                        </span>
                      </div>
                      
                      {/* Sub-total quick stats */}
                      <div className="flex items-center gap-4 text-[10px] sm:text-xs font-bold text-slate-300 print:text-slate-800 font-mono">
                        <span>Total Invoices: <strong className="text-emerald-400 print:text-slate-900">{subAreaTotalInvoices}</strong></span>
                        <span className="text-slate-700 print:text-slate-300">|</span>
                        <span>Total Sales: <strong className="text-white print:text-slate-900">{formatPKR(subAreaTotalAmount)}</strong></span>
                      </div>
                    </div>

                    {/* Sub Area Rows Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse print:text-[11px]" id={`table-group-${subArea.replace(/\s+/g, '-')}`}>
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-800">
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase text-center w-12 print:border print:border-slate-300">S.#</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase print:border print:border-slate-300">Account Title</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase print:border print:border-slate-300">Booker</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase print:border print:border-slate-300">Product</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase text-center w-24 print:border print:border-slate-300">Pack Size</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase text-right w-24 print:border print:border-slate-300">Qty Full</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase text-right w-28 print:border print:border-slate-300">Rate</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase text-right w-32 print:border print:border-slate-300">Amount</th>
                            <th className="px-4 py-2 font-black text-[10px] tracking-wider uppercase text-center w-24 print:border print:border-slate-300">T.Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700 print:divide-y print:divide-slate-300">
                          {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                              <td className="px-4 py-2 text-center font-mono text-slate-500 font-bold print:text-slate-900 print:border print:border-slate-300">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-2 font-black text-slate-900 print:border print:border-slate-300">
                                {row.account_title}
                              </td>
                              <td className="px-4 py-2 font-medium text-slate-600 print:text-slate-900 print:border print:border-slate-300">
                                {row.booker}
                              </td>
                              <td className="px-4 py-2 font-bold text-slate-800 print:text-slate-900 print:border print:border-slate-300">
                                {row.product}
                              </td>
                              <td className="px-4 py-2 text-center font-semibold text-slate-500 print:text-slate-900 print:border print:border-slate-300">
                                {row.pack_size}
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-black text-indigo-650 print:text-slate-900 print:border print:border-slate-300">
                                {row.qty}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-slate-600 print:text-slate-900 print:border print:border-slate-300">
                                {row.rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-black text-slate-900 print:border print:border-slate-300">
                                {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-2 text-center font-mono font-bold text-slate-500 print:text-slate-900 print:border print:border-slate-300">
                                {row.t_invoice}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Inner Sub Area Subtotal Row (visible inside table in print view for traditional format) */}
                          <tr className="bg-slate-50 font-black print:bg-slate-100 print:text-slate-900">
                            <td colSpan={5} className="px-4 py-2.5 text-right font-mono uppercase text-slate-600 print:text-slate-900 print:border print:border-slate-300">
                              Sub Total for {subArea}:
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono print:border print:border-slate-300">
                              {rows.reduce((sum, r) => sum + r.qty, 0)}
                            </td>
                            <td className="px-4 py-2.5 print:border print:border-slate-300"></td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-900 print:border print:border-slate-300">
                              {subAreaTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono print:border print:border-slate-300">
                              {subAreaTotalInvoices}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Grand Corporate Total Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md mt-8 border border-slate-800 print:bg-transparent print:text-slate-900 print:border-2 print:border-slate-800 print:rounded-none print:shadow-none print:p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2.5 rounded-2xl text-white print:hidden">
                    <Package size={22} />
                  </div>
                  <div>
                    <h3 className="font-mono text-xs font-bold text-slate-400 print:text-slate-600 uppercase tracking-widest leading-none">Karachi Distribution Totals</h3>
                    <h2 className="text-lg font-black tracking-tight mt-1 uppercase">Grand Corporate Summary</h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 print:text-slate-600 font-mono uppercase font-bold">Total Invoices:</span>
                    <span className="text-lg font-black font-mono text-indigo-400 print:text-slate-900">{grandTotalInvoices}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800 print:bg-slate-300 hidden sm:block"></div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 print:text-slate-600 font-mono uppercase font-bold">Total Sales Valuation:</span>
                    <span className="text-xl font-black font-mono text-emerald-400 print:text-slate-900">{formatPKR(grandTotalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
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

            <h3 className="text-slate-900 font-black text-lg tracking-tight mb-2">Save Report as PDF</h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Because this application is currently running inside an editor preview iframe, direct PDF printing is restricted by your browser. 
              <br /><br />
              Click the button below to open the report in a dedicated tab. Your browser will immediately launch the print interface where you can choose <strong>"Save as PDF"</strong> to select a storage directory.
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
                <span>Open & Save PDF</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
