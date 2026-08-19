import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, RefreshCw, Search, Calendar, ChevronDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface Product {
  product_id: string;
  product_name: string;
  brand: string;
  unit: string;
  purchase_price: number;
  trade_price: number;
}

interface LedgerItem {
  doc_date: string;
  doc_id: number;
  type: 'Opening' | 'Purchase' | 'Purchase Return' | 'Sale' | 'Sale Return';
  description: string;
  rate: number;
  qty: number;
  return_qty: number;
  balance: number;
  net_amount: number;
}

interface StockDetailReportProps {
  onBack: () => void;
  formatPKR: (num: number) => string;
}

export const StockDetailReport: React.FC<StockDetailReportProps> = ({ onBack, formatPKR }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('2026-06-17');
  const [endDate, setEndDate] = useState<string>('2026-06-17');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    product: Product;
    startDate: string;
    endDate: string;
    openingBalance: number;
    ledger: LedgerItem[];
  } | null>(null);

  const productSearchRef = useRef<HTMLInputElement>(null);

  // Fetch products for autocomplete on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
          // Set initial product as default to make it look ready
          if (data.length > 0) {
            // Find "Cooking Oil 1L" or first item
            const dalda = data.find((p: Product) => p.product_name.toLowerCase().includes('oil') || p.product_name.toLowerCase().includes('sugar'));
            const initial = dalda || data[0];
            setSelectedProductId(initial.product_id);
            setProductSearch(initial.product_name);
          }
        }
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };
    fetchProducts();
  }, []);

  // Sync search input with selection when blurred
  const handleProductBlur = () => {
    setTimeout(() => {
      setShowProductDropdown(false);
      if (selectedProductId) {
        const prod = products.find(p => p.product_id === selectedProductId);
        if (prod) {
          setProductSearch(prod.product_name);
        }
      } else {
        setProductSearch('');
      }
    }, 200);
  };

  const handleProductSelect = (p: Product) => {
    setSelectedProductId(p.product_id);
    setProductSearch(p.product_name);
    setShowProductDropdown(false);
  };

  const fetchReport = async () => {
    if (!selectedProductId) {
      setError("Please select a product first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('productId', selectedProductId);
      params.set('startDate', startDate);
      params.set('endDate', endDate);

      const res = await fetch(`/api/reports/stock-detail?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch stock detail report. Please make sure the product and date ranges are correct.");
    } finally {
      setLoading(false);
    }
  };

  // Run report once product and products list are ready
  useEffect(() => {
    if (selectedProductId) {
      fetchReport();
    }
  }, [selectedProductId]);

  const handlePrint = () => {
    window.print();
  };

  // Format date helper
  const formatDateLabel = (dateStr: string): string => {
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

  // Helper to get formatted Doc No.
  const formatDocNo = (item: LedgerItem): string => {
    if (item.type === 'Opening') {
      return 'SYSTEM';
    }
    if (item.type === 'Purchase') {
      return `PUR # ${item.doc_id.toString().padStart(4, '0')}`;
    }
    if (item.type === 'Purchase Return') {
      return `PRRET# ${item.doc_id.toString().padStart(4, '0')}`;
    }
    if (item.type === 'Sale') {
      return `INV # ${item.doc_id.toString().padStart(4, '0')}`;
    }
    if (item.type === 'Sale Return') {
      return `STRET# ${item.doc_id.toString().padStart(4, '0')}`;
    }
    return item.doc_id.toString();
  };

  // Totals computation
  const totalPurchase = reportData?.ledger.reduce((sum, item) => sum + (item.type === 'Purchase' ? item.qty : 0), 0) || 0;
  const totalPurchaseReturn = reportData?.ledger.reduce((sum, item) => sum + (item.type === 'Purchase Return' ? item.return_qty : 0), 0) || 0;
  const totalSale = reportData?.ledger.reduce((sum, item) => sum + (item.type === 'Sale' ? item.qty : 0), 0) || 0;
  const totalSaleReturn = reportData?.ledger.reduce((sum, item) => sum + (item.type === 'Sale Return' ? item.return_qty : 0), 0) || 0;

  const currentProduct = products.find(p => p.product_id === selectedProductId) || reportData?.product;
  const isExactSelectedProduct = currentProduct && productSearch.trim().toLowerCase() === currentProduct.product_name.trim().toLowerCase();
  const filteredProductsList = (!productSearch.trim() || isExactSelectedProduct)
    ? products
    : products.filter(p => 
        p.product_name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.product_id.toLowerCase().includes(productSearch.toLowerCase())
      );

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="stock-detail-report-view">
      {/* Filters and Controls Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                  T-Code: SDR01
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                  Stock Ledger
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">Stock Detail Report</h2>
              <p className="text-xs text-slate-500">View detailed opening stock, purchases, sales, and running ledger for any product.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Printer size={14} />
              Print Report
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {/* Autocomplete Product Search */}
          <div className="md:col-span-2 space-y-1.5 relative">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-1">Product Formulation</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                ref={productSearchRef}
                placeholder="Search product formulation (Google Searchable)..."
                value={productSearch}
                onFocus={(e) => {
                  setShowProductDropdown(true);
                  e.target.select();
                }}
                onBlur={handleProductBlur}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-indigo-600 outline-none font-medium transition-all"
                id="report-product-autocomplete"
              />
              <button 
                type="button"
                onClick={() => {
                  setShowProductDropdown(!showProductDropdown);
                  if (productSearchRef.current) {
                    productSearchRef.current.focus();
                    productSearchRef.current.select();
                  }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <AnimatePresence>
              {showProductDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden p-2"
                >
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {filteredProductsList.map(p => (
                      <button
                        key={p.product_id}
                        onMouseDown={() => handleProductSelect(p)}
                        className={cn(
                          "w-full px-4 py-2.5 text-left rounded-lg text-xs flex items-center justify-between transition-colors",
                          selectedProductId === p.product_id ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div>
                          <div className="font-semibold">{p.product_name}</div>
                          <div className="text-[10px] text-slate-400">{p.brand} · Code: {p.product_id}</div>
                        </div>
                        {selectedProductId === p.product_id && <Check size={14} className="text-indigo-600" />}
                      </button>
                    ))}
                    {filteredProductsList.length === 0 && (
                      <p className="p-4 text-center text-xs text-slate-400">No products match your search.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-indigo-600 outline-none font-medium transition-all"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-indigo-600 outline-none font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs rounded-xl font-medium border border-rose-100">
            {error}
          </div>
        )}
      </div>

      {/* Loading overlay for UI */}
      {loading && (
        <div className="bg-white p-20 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4 print:hidden">
          <Loader2 className="text-indigo-600 animate-spin" size={32} />
          <p className="text-sm font-semibold text-slate-700">Generating Stock Detail Report...</p>
        </div>
      )}

      {/* Report Container (Renderable & Printable) */}
      {!loading && reportData && (
        <div className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm font-sans text-slate-900 print:shadow-none print:border-none print:p-0 print-receipt-only" id="stock-detail-printable-area">
          
          {/* Print Only Header (Styled identically to FBM Distributors layout) */}
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">FBM Distributors</h1>
            <h2 className="text-base font-extrabold tracking-wider text-slate-800 uppercase">STOCK DETAIL REPORT</h2>
            <p className="text-xs font-bold text-slate-600 font-mono">
              From [ {formatDateLabel(reportData.startDate)} ] To [ {formatDateLabel(reportData.endDate)} ]
            </p>
          </div>

          {/* Product Header Row with opening balance */}
          <div className="border border-slate-900 rounded-md p-4 flex justify-between items-center bg-slate-50/50 mb-6 border-b-2">
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Product Name:</span>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mt-1">
                {currentProduct?.product_name || "WHITE SUGAR"}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Opening Balance:</span>
              <p className="text-lg font-black text-indigo-600 font-mono tracking-tight mt-1">
                {reportData.openingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold border-b border-slate-950 font-mono uppercase tracking-wider text-[10px]">
                  <th className="border border-slate-900 p-2.5 text-left w-[12%]">Doc.Date</th>
                  <th className="border border-slate-900 p-2.5 text-left w-[12%]">Doc. No</th>
                  <th className="border border-slate-900 p-2.5 text-left w-[26%]">Description</th>
                  <th className="border border-slate-900 p-2.5 text-right w-[10%]">Rate</th>
                  <th className="border border-slate-900 p-2.5 text-center w-[10%]">Purchase</th>
                  <th className="border border-slate-900 p-2.5 text-center w-[10%]">Purchase Return</th>
                  <th className="border border-slate-900 p-2.5 text-center w-[10%]">Sale</th>
                  <th className="border border-slate-900 p-2.5 text-center w-[10%]">Sale Return</th>
                  <th className="border border-slate-900 p-2.5 text-right w-[12%] font-extrabold">Balance</th>
                  <th className="border border-slate-900 p-2.5 text-right w-[12%]">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* System Opening Balance Row on the First Line */}
                <tr className="bg-slate-50/70 font-semibold border-b border-slate-900">
                  <td className="border border-slate-900 p-2.5 font-mono">
                    {formatDateLabel(reportData.startDate)}
                  </td>
                  <td className="border border-slate-900 p-2.5 font-mono text-slate-500 font-bold">
                    SYSTEM
                  </td>
                  <td className="border border-slate-900 p-2.5 font-sans uppercase font-extrabold text-slate-900">
                    OPENING BALANCE
                  </td>
                  <td className="border border-slate-900 p-2.5 text-right font-mono text-slate-400">-</td>
                  <td className="border border-slate-900 p-2.5 text-center font-mono text-slate-400">-</td>
                  <td className="border border-slate-900 p-2.5 text-center font-mono text-slate-400">-</td>
                  <td className="border border-slate-900 p-2.5 text-center font-mono text-slate-400">-</td>
                  <td className="border border-slate-900 p-2.5 text-center font-mono text-slate-400">-</td>
                  <td className="border border-slate-900 p-2.5 text-right font-mono font-black text-indigo-700">
                    {reportData.openingBalance.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2.5 text-right font-mono text-slate-400">-</td>
                </tr>

                {reportData.ledger.map((item, index) => {
                  const isPurchase = item.type === 'Purchase';
                  const isPurchaseReturn = item.type === 'Purchase Return';
                  const isSale = item.type === 'Sale';
                  const isSaleReturn = item.type === 'Sale Return';
                  
                  return (
                    <tr 
                      key={index} 
                      className={cn(
                        "hover:bg-slate-50 transition-colors font-medium border-b border-slate-900",
                        isPurchase && "bg-emerald-50/20",
                        isPurchaseReturn && "bg-amber-50/20",
                        isSaleReturn && "bg-indigo-50/20"
                      )}
                    >
                      <td className="border border-slate-900 p-2.5 font-mono">
                        {formatDateLabel(item.doc_date)}
                      </td>
                      <td className="border border-slate-900 p-2.5 font-mono">
                        {formatDocNo(item)}
                      </td>
                      <td className="border border-slate-900 p-2.5 font-sans uppercase font-bold text-slate-800">
                        {item.description}
                      </td>
                      <td className="border border-slate-900 p-2.5 text-right font-mono font-semibold">
                        {item.rate.toLocaleString()}
                      </td>
                      {/* Purchase Column */}
                      <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-emerald-700">
                        {isPurchase ? item.qty.toLocaleString() : '0'}
                      </td>
                      {/* Purchase Return Column */}
                      <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-amber-700">
                        {isPurchaseReturn ? item.return_qty.toLocaleString() : '0'}
                      </td>
                      {/* Sale Column */}
                      <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-rose-700">
                        {isSale ? item.qty.toLocaleString() : '0'}
                      </td>
                      {/* Sale Return Column */}
                      <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-indigo-700">
                        {isSaleReturn ? item.return_qty.toLocaleString() : '0'}
                      </td>
                      {/* Running Balance */}
                      <td className="border border-slate-900 p-2.5 text-right font-mono font-extrabold text-slate-900">
                        {item.balance.toLocaleString()}
                      </td>
                      {/* Net Amount */}
                      <td className="border border-slate-900 p-2.5 text-right font-mono font-bold text-slate-800">
                        {formatPKR(item.net_amount)}
                      </td>
                    </tr>
                  );
                })}

                {reportData.ledger.length === 0 && (
                  <tr>
                    <td colSpan={10} className="border border-slate-900 p-8 text-center text-slate-400 italic">
                      No stock movements recorded for this product during the selected dates.
                    </td>
                  </tr>
                )}

                {/* Totals Row */}
                <tr className="bg-slate-50 font-black border-t-2 border-slate-950 font-mono text-[11px]">
                  <td colSpan={4} className="border border-slate-900 p-2.5 text-left font-sans uppercase">Total</td>
                  <td className="border border-slate-900 p-2.5 text-center text-emerald-800">
                    {totalPurchase.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2.5 text-center text-slate-400">
                    0
                  </td>
                  <td className="border border-slate-900 p-2.5 text-center text-rose-800">
                    {totalSale.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2.5 text-center text-indigo-800">
                    {totalSaleReturn.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2.5 text-right font-extrabold text-slate-900">
                    {/* Final Balance */}
                    {(reportData.ledger[reportData.ledger.length - 1]?.balance ?? reportData.openingBalance).toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2.5 text-right text-slate-400 italic">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Print only footer */}
          <div className="mt-8 border-t border-slate-300 pt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {new Date().toLocaleTimeString('en-US')}</span>
            <span>Print by: ZENSOFT</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      )}
    </div>
  );
};
