import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Save, Printer, CheckCircle2, AlertCircle, Search, 
  RotateCcw, Calendar, User, CreditCard, Building, Banknote,
  Receipt, ArrowRight, Edit3, ShieldCheck, Check, DollarSign,
  ChevronRight, Hash, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Payment, PaymentInvoiceDetail } from '../../types';
import { cn } from '../../lib/utils';

// Helper to convert number to words in Pakistani Rupees for official voucher printouts
function numberToWordsPKR(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n] + ' ';
      else {
        str += b[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) str += a[n % 10] + ' ';
      }
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const words = inWords(integerPart);
  return `${words} Rupees Only`;
}

// Popular Pakistani Banks for quick selection
const POPULAR_BANKS = [
  'Habib Bank Limited (HBL)',
  'Meezan Bank Limited',
  'MCB Bank Limited',
  'United Bank Limited (UBL)',
  'Bank Alfalah Limited',
  'Allied Bank Limited (ABL)',
  'Faysal Bank Limited',
  'Askari Bank Limited',
  'Dubai Islamic Bank',
  'Bank of Punjab (BOP)',
  'Standard Chartered Bank',
  'National Bank of Pakistan (NBP)'
];

// =========================================================================
// 1. PAYMENT TRANSACTION MODAL (PA01 - Create Payment / PA02 - Change Payment)
// =========================================================================

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  paymentId?: number | null;
  distributorId?: number | string;
  formatPKR: (amt: number) => string;
  currentUser?: any;
  onOpenDisplayPayment?: (paymentId: number | string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  paymentId,
  distributorId,
  formatPKR,
  currentUser,
  onOpenDisplayPayment
}) => {
  // Shops and Salesmen master lists
  const [shops, setShops] = useState<Shop[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Shop selection state
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [shopLedgerBalance, setShopLedgerBalance] = useState<number>(0);

  // Outstanding invoices for selected shop
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Allocations mapping: invoiceId -> allocated amount
  const [allocations, setAllocations] = useState<Record<number, number>>({});
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);

  // Payment method & instrument details
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE'>('CASH');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [chequeAmount, setChequeAmount] = useState<number>(0);

  // Salesman & metadata
  const [salesmanId, setSalesmanId] = useState<number | ''>('');
  const [salesmanName, setSalesmanName] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Status & notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPaymentDoc, setCreatedPaymentDoc] = useState<{ id: number; docNo: string } | null>(null);

  // Fetch shops and salesmen
  useEffect(() => {
    if (!isOpen) return;

    setLoadingInitial(true);
    const distParam = distributorId && distributorId !== 'all' ? `?distributor_id=${distributorId}` : '';

    Promise.all([
      fetch(`/api/shops${distParam}`).then(r => r.json()),
      fetch('/api/salesmen').then(r => r.json()).catch(() => [])
    ])
      .then(([shopsData, salesmenData]) => {
        setShops(Array.isArray(shopsData) ? shopsData : []);
        setSalesmen(Array.isArray(salesmenData) ? salesmenData : []);
        
        // Auto-select salesman if current logged in user is a salesman
        if (currentUser?.role === 'salesman' && currentUser?.id) {
          setSalesmanId(currentUser.id);
          setSalesmanName(currentUser.name || '');
        } else if (Array.isArray(salesmenData) && salesmenData.length > 0) {
          setSalesmanId(salesmenData[0].id);
          setSalesmanName(salesmenData[0].name);
        }
      })
      .catch(err => {
        console.error("Failed to load initial master data:", err);
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, [isOpen, distributorId, currentUser]);

  // Load existing payment if in edit mode (PA02)
  useEffect(() => {
    if (mode === 'edit' && paymentId && isOpen) {
      setLoadingInitial(true);
      fetch(`/api/payments/${paymentId}`)
        .then(r => {
          if (!r.ok) throw new Error("Payment not found");
          return r.json();
        })
        .then(data => {
          setSelectedShopId(data.shop_id);
          setPaymentMethod(data.payment_method || 'CASH');
          setCashAmount(data.cash_amount || 0);
          setChequeAmount(data.cheque_amount || 0);
          setChequeNo(data.cheque_no || '');
          setChequeDate(data.cheque_date ? data.cheque_date.split('T')[0] : '');
          setBankName(data.bank_name || '');
          setBankBranch(data.bank_branch || '');
          setSalesmanId(data.salesman_id || '');
          setSalesmanName(data.salesman_name || data.salesman_display_name || '');
          setPaymentDate(data.payment_date ? data.payment_date.split('T')[0] : '');
          setNotes(data.notes || '');
          setShopLedgerBalance(data.current_shop_balance || 0);
          
          if (Array.isArray(data.invoices)) {
            setOutstandingInvoices(data.invoices.map((inv: any) => ({
              id: inv.invoice_id,
              net_amount: inv.invoice_net_amount,
              paid_amount: inv.invoice_net_amount - inv.previous_outstanding,
              outstanding_amount: inv.remaining_outstanding,
              allocated_amount: inv.allocated_amount,
              invoice_date: inv.invoice_date,
              status: inv.invoice_status
            })));
            setSelectedInvoiceIds(data.invoices.map((inv: any) => inv.invoice_id));
            const allocs: Record<number, number> = {};
            data.invoices.forEach((inv: any) => {
              allocs[inv.invoice_id] = inv.allocated_amount;
            });
            setAllocations(allocs);
          }
        })
        .catch(err => {
          setErrorMessage(err.message);
        })
        .finally(() => {
          setLoadingInitial(false);
        });
    }
  }, [mode, paymentId, isOpen]);

  // Fetch outstanding invoices when shop is selected in create mode
  useEffect(() => {
    if (mode === 'create' && selectedShopId) {
      setLoadingInvoices(true);
      setErrorMessage(null);
      fetch(`/api/shops/${selectedShopId}/outstanding-invoices`)
        .then(r => {
          if (!r.ok) throw new Error("Failed to load outstanding invoices");
          return r.json();
        })
        .then(data => {
          const invs = Array.isArray(data.invoices) ? data.invoices : [];
          setOutstandingInvoices(invs);
          setShopLedgerBalance(data.current_ledger_balance || 0);

          // Reset selections
          setSelectedInvoiceIds([]);
          setAllocations({});
          setCashAmount(0);
          setChequeAmount(0);
        })
        .catch(err => {
          console.error("Error loading outstanding invoices:", err);
          setErrorMessage(err.message);
        })
        .finally(() => {
          setLoadingInvoices(false);
        });
    }
  }, [selectedShopId, mode]);

  // Filtered shops list for search
  const filteredShops = useMemo(() => {
    if (!shopSearch.trim()) return shops.slice(0, 15);
    const q = shopSearch.toLowerCase();
    return shops.filter(s => 
      s.shop_name?.toLowerCase().includes(q) ||
      s.owner_name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.area?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [shops, shopSearch]);

  const activeShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  // Handle invoice selection toggle
  const handleToggleInvoice = (inv: any) => {
    if (mode === 'edit') return; // Cannot re-allocate in edit mode

    const invId = inv.id;
    const isSelected = selectedInvoiceIds.includes(invId);
    let newSelected: number[];
    const newAllocations = { ...allocations };

    if (isSelected) {
      newSelected = selectedInvoiceIds.filter(id => id !== invId);
      delete newAllocations[invId];
    } else {
      newSelected = [...selectedInvoiceIds, invId];
      // Default to full outstanding balance of this invoice
      newAllocations[invId] = Number(inv.outstanding_amount) || 0;
    }

    setSelectedInvoiceIds(newSelected);
    setAllocations(newAllocations);

    // Update total cash/cheque amount
    const totalAllocated = (Object.values(newAllocations) as number[]).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
    if (paymentMethod === 'CASH') {
      setCashAmount(totalAllocated);
    } else {
      setChequeAmount(totalAllocated);
    }
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (mode === 'edit') return;

    if (selectedInvoiceIds.length === outstandingInvoices.length) {
      setSelectedInvoiceIds([]);
      setAllocations({});
      if (paymentMethod === 'CASH') setCashAmount(0);
      else setChequeAmount(0);
    } else {
      const allIds = outstandingInvoices.map(i => i.id);
      const newAllocs: Record<number, number> = {};
      let sum = 0;
      outstandingInvoices.forEach(i => {
        const amt = Number(i.outstanding_amount) || 0;
        newAllocs[i.id] = amt;
        sum += amt;
      });
      setSelectedInvoiceIds(allIds);
      setAllocations(newAllocs);
      if (paymentMethod === 'CASH') setCashAmount(sum);
      else setChequeAmount(sum);
    }
  };

  // Update line allocation
  const handleAllocationChange = (invId: number, maxOutstanding: number, value: number) => {
    if (mode === 'edit') return;
    const cleanVal = Math.max(0, Math.min(value, maxOutstanding));
    const newAllocs = { ...allocations, [invId]: cleanVal };
    setAllocations(newAllocs);

    const total = (Object.values(newAllocs) as number[]).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
    if (paymentMethod === 'CASH') {
      setCashAmount(total);
    } else {
      setChequeAmount(total);
    }
  };

  // Total allocated across selected invoices
  const totalAllocatedAmount = useMemo(() => {
    return (Object.values(allocations) as number[]).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  }, [allocations]);

  const activePaymentAmount = paymentMethod === 'CASH' ? cashAmount : chequeAmount;

  // Auto-allocate entered payment amount sequentially across selected invoices
  const handleDistributeAmount = (newTotal: number) => {
    let pool = newTotal;
    const newAllocs: Record<number, number> = {};
    for (const inv of outstandingInvoices) {
      if (selectedInvoiceIds.includes(inv.id)) {
        const out = Number(inv.outstanding_amount) || 0;
        const alloc = Math.min(out, Math.max(0, pool));
        newAllocs[inv.id] = alloc;
        pool -= alloc;
      }
    }
    setAllocations(newAllocs);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'create') {
      if (!selectedShopId) {
        setErrorMessage("Please select a Shop / Retailer.");
        return;
      }

      if (selectedInvoiceIds.length === 0) {
        setErrorMessage("Please select at least one outstanding invoice to settle.");
        return;
      }

      if (paymentMethod === 'CASH') {
        if (cashAmount <= 0) {
          setErrorMessage("Please enter a valid Cash Amount greater than 0.");
          return;
        }
      } else {
        if (chequeAmount <= 0) {
          setErrorMessage("Please enter a valid Cheque Amount greater than 0.");
          return;
        }
        if (!chequeNo.trim()) {
          setErrorMessage("Cheque Number is required.");
          return;
        }
        if (!bankName.trim()) {
          setErrorMessage("Bank Name is required.");
          return;
        }
        if (!chequeDate) {
          setErrorMessage("Cheque Date is required.");
          return;
        }
      }

      // Check that allocations sum up to payment amount
      const currentAllocSum = (Object.values(allocations) as number[]).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
      if (currentAllocSum <= 0) {
        setErrorMessage("Invoice allocations must sum to greater than 0.");
        return;
      }

      setIsSubmitting(true);

      const payload = {
        shop_id: selectedShopId,
        salesman_id: salesmanId || null,
        salesman_name: salesmanName || null,
        payment_method: paymentMethod,
        amount: activePaymentAmount,
        cash_amount: paymentMethod === 'CASH' ? cashAmount : 0,
        cheque_amount: paymentMethod === 'CHEQUE' ? chequeAmount : 0,
        cheque_no: paymentMethod === 'CHEQUE' ? chequeNo : null,
        cheque_date: paymentMethod === 'CHEQUE' ? chequeDate : null,
        bank_name: paymentMethod === 'CHEQUE' ? bankName : null,
        bank_branch: paymentMethod === 'CHEQUE' ? bankBranch : null,
        payment_date: paymentDate,
        notes: notes || null,
        distributor_id: distributorId && distributorId !== 'all' ? distributorId : (activeShop?.distributor_id || 1),
        invoices: selectedInvoiceIds.map(invId => ({
          invoice_id: invId,
          allocated_amount: allocations[invId] || 0
        }))
      };

      try {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create payment document.");
        }

        setCreatedPaymentDoc({
          id: data.id,
          docNo: data.payment_doc_no
        });
        onSuccess();
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Edit mode (PA02)
      if (!paymentId) return;

      setIsSubmitting(true);
      const payload = {
        cheque_no: paymentMethod === 'CHEQUE' ? chequeNo : null,
        cheque_date: paymentMethod === 'CHEQUE' ? chequeDate : null,
        bank_name: paymentMethod === 'CHEQUE' ? bankName : null,
        bank_branch: paymentMethod === 'CHEQUE' ? bankBranch : null,
        salesman_id: salesmanId || null,
        salesman_name: salesmanName || null,
        notes: notes || null,
        payment_date: paymentDate
      };

      try {
        const res = await fetch(`/api/payments/${paymentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update payment.");
        }

        onSuccess();
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/40">
                  {mode === 'create' ? 'PA01' : 'PA02'}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {mode === 'create' ? 'Create Customer Payment' : `Change Payment Record (#PAY-${String(paymentId).padStart(4, '0')})`}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'create' 
                  ? 'Receive Cash/Cheque from Shop against outstanding invoices & update Ledger' 
                  : 'Modify payment metadata, cheque information, or salesman remarks'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Modal Confirmation View */}
        {createdPaymentDoc ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900">Payment Processed Successfully!</h4>
              <p className="text-sm text-slate-600 max-w-md">
                Payment Document <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{createdPaymentDoc.docNo}</span> has been posted. Invoices are cleared and the shop ledger has been credited.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (onOpenDisplayPayment) {
                    onOpenDisplayPayment(createdPaymentDoc.id);
                  }
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition-all"
              >
                <Printer size={16} />
                Display & Print Voucher (PA03)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: SHOP SELECTION */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">1</span>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Customer / Shop Master
                  </label>
                </div>
                {activeShop && (
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: #{activeShop.id} • Area: {activeShop.area || 'Karachi'}
                  </span>
                )}
              </div>

              {mode === 'create' ? (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Search shop by name, owner, phone or area..."
                      value={activeShop ? `${activeShop.shop_name} (${activeShop.owner_name} - ${activeShop.phone})` : shopSearch}
                      onChange={(e) => {
                        setSelectedShopId(null);
                        setShopSearch(e.target.value);
                        setShowShopDropdown(true);
                      }}
                      onFocus={() => setShowShopDropdown(true)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm transition-all"
                    />
                    {activeShop && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShopId(null);
                          setShopSearch('');
                          setOutstandingInvoices([]);
                          setSelectedInvoiceIds([]);
                          setAllocations({});
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Options */}
                  {showShopDropdown && !activeShop && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {filteredShops.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No matching shops found
                        </div>
                      ) : (
                        filteredShops.map(s => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedShopId(s.id);
                              setShowShopDropdown(false);
                            }}
                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{s.shop_name}</p>
                              <p className="text-[11px] text-slate-500">
                                Owner: {s.owner_name} • Phone: {s.phone}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                {s.area || 'Karachi'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode: Locked Shop Display */
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-900">{activeShop?.shop_name || `Shop #${selectedShopId}`}</span>
                  <span className="text-slate-500">{activeShop?.owner_name} • {activeShop?.phone}</span>
                </div>
              )}

              {/* Shop Ledger & Credit Limit Summary Card */}
              {activeShop && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shop Balance (Ledger)</span>
                    <span className={cn(
                      "text-sm font-black mt-0.5 block",
                      shopLedgerBalance > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {formatPKR(Math.abs(shopLedgerBalance))} {shopLedgerBalance > 0 ? '(Debit / Due)' : '(Advance / Clear)'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Limit</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                      {formatPKR(activeShop.credit_limit || 0)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                    <span className="text-xs text-slate-700 truncate mt-0.5 block">
                      {activeShop.address || activeShop.area || 'Karachi'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: OUTSTANDING INVOICES */}
            {selectedShopId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Outstanding Posted Invoices
                    </h4>
                  </div>
                  {outstandingInvoices.length > 0 && mode === 'create' && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {selectedInvoiceIds.length === outstandingInvoices.length ? 'Deselect All' : 'Select All Invoices'}
                    </button>
                  )}
                </div>

                {loadingInvoices ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                    Loading outstanding invoices...
                  </div>
                ) : outstandingInvoices.length === 0 ? (
                  <div className="p-6 text-center bg-amber-50/50 rounded-2xl border border-amber-200/70 text-amber-800 text-xs space-y-1">
                    <AlertCircle size={22} className="mx-auto text-amber-500 mb-1" />
                    <p className="font-bold">No outstanding posted invoices found for this shop.</p>
                    <p className="text-[11px] text-amber-700">
                      All invoices are either settled or no posted billing documents exist for this account.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                            {mode === 'create' && <th className="px-3 py-3 w-10 text-center"></th>}
                            <th className="px-3 py-3">Invoice #</th>
                            <th className="px-3 py-3">Date</th>
                            <th className="px-3 py-3 text-right">Net Bill</th>
                            <th className="px-3 py-3 text-right">Paid</th>
                            <th className="px-3 py-3 text-right">Outstanding</th>
                            <th className="px-3 py-3 text-right w-36 bg-emerald-50/60 font-black text-emerald-800">
                              Payment Allocated
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {outstandingInvoices.map((inv) => {
                            const isSelected = selectedInvoiceIds.includes(inv.id);
                            const outAmt = Number(inv.outstanding_amount) || 0;
                            const curAlloc = allocations[inv.id] || 0;

                            return (
                              <tr 
                                key={inv.id} 
                                className={cn(
                                  "transition-colors",
                                  isSelected ? "bg-emerald-50/30" : "hover:bg-slate-50/70"
                                )}
                              >
                                {mode === 'create' && (
                                  <td className="px-3 py-2.5 text-center">
                                    <input 
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleInvoice(inv)}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                    />
                                  </td>
                                )}
                                <td className="px-3 py-2.5 font-bold font-mono text-indigo-700">
                                  #INV-{String(inv.id).padStart(4, '0')}
                                </td>
                                <td className="px-3 py-2.5 text-slate-600">
                                  {inv.invoice_date ? inv.invoice_date.split('T')[0] : 'N/A'}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-slate-700">
                                  {formatPKR(inv.net_amount)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-slate-500">
                                  {formatPKR(inv.paid_amount || 0)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-black text-rose-600">
                                  {formatPKR(outAmt)}
                                </td>
                                <td className="px-3 py-2.5 text-right bg-emerald-50/20">
                                  {mode === 'create' ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-[10px] text-slate-400">Rs.</span>
                                      <input 
                                        type="number"
                                        min="0"
                                        max={outAmt}
                                        disabled={!isSelected}
                                        value={isSelected ? curAlloc : 0}
                                        onChange={(e) => handleAllocationChange(inv.id, outAmt, parseFloat(e.target.value) || 0)}
                                        className={cn(
                                          "w-24 px-2 py-1 text-right text-xs font-bold rounded-lg border outline-none transition-all",
                                          isSelected 
                                            ? "border-emerald-400 bg-white text-emerald-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500" 
                                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                        )}
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-bold text-emerald-700">
                                      {formatPKR(curAlloc)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                            <td colSpan={mode === 'create' ? 5 : 4} className="px-3 py-2.5 text-right text-slate-600 uppercase">
                              Total Selected Allocation:
                            </td>
                            <td colSpan={2} className="px-3 py-2.5 text-right font-black text-emerald-700 text-sm">
                              {formatPKR(totalAllocatedAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD & DETAILS */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">3</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Payment Method & Instrument Details
                  </h4>
                </div>
              </div>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <button
                  type="button"
                  disabled={mode === 'edit'}
                  onClick={() => setPaymentMethod('CASH')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border",
                    paymentMethod === 'CASH'
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  )}
                >
                  <Banknote size={16} />
                  Cash Payment
                </button>
                <button
                  type="button"
                  disabled={mode === 'edit'}
                  onClick={() => setPaymentMethod('CHEQUE')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border",
                    paymentMethod === 'CHEQUE'
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  )}
                >
                  <Building size={16} />
                  Cheque / Bank Draft
                </button>
              </div>

              {/* Dynamic Fields for Cash or Cheque */}
              {paymentMethod === 'CASH' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cash Amount Collected (PKR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                      <input 
                        type="number"
                        min="1"
                        disabled={mode === 'edit'}
                        value={cashAmount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setCashAmount(val);
                          handleDistributeAmount(val);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Cheque Details */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cheque Number *
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. CHQ-901842"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cheque Date *
                    </label>
                    <input 
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Bank Name *
                    </label>
                    <input 
                      type="text"
                      list="popularBanksList"
                      placeholder="Type or select Bank..."
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                    />
                    <datalist id="popularBanksList">
                      {POPULAR_BANKS.map((b, i) => (
                        <option key={i} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Bank Branch / City
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Korangi Branch, Karachi"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cheque Amount (PKR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                      <input 
                        type="number"
                        min="1"
                        disabled={mode === 'edit'}
                        value={chequeAmount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setChequeAmount(val);
                          handleDistributeAmount(val);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Salesman & Collection Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Collecting Salesman
                  </label>
                  <select
                    value={salesmanId}
                    onChange={(e) => {
                      const sId = Number(e.target.value);
                      setSalesmanId(sId || '');
                      const sm = salesmen.find(s => s.id === sId);
                      setSalesmanName(sm ? sm.name : '');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                  >
                    <option value="">-- General Salesman --</option>
                    {salesmen.map(sm => (
                      <option key={sm.id} value={sm.id}>
                        {sm.name} {sm.cell_no ? `(${sm.cell_no})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Collection / Value Date
                  </label>
                  <input 
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Cash collected during evening round / Post-dated cheque"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Financial Ledger Impact Box */}
            {selectedShopId && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">
                    Financial Ledger Impact
                  </span>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Recording this payment will credit the shop ledger by{' '}
                    <span className="font-bold text-emerald-700">{formatPKR(activePaymentAmount)}</span>.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Updated Shop Ledger Balance
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {formatPKR(Math.max(0, shopLedgerBalance - activePaymentAmount))}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel (ESC)
              </button>

              <button
                type="submit"
                disabled={isSubmitting || (mode === 'create' && selectedInvoiceIds.length === 0)}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSubmitting 
                  ? 'Processing...' 
                  : mode === 'create' 
                    ? 'Process & Post Payment (PA01)' 
                    : 'Save Changes (PA02)'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// =========================================================================
// 2. DISPLAY PAYMENT VOUCHER MODAL (PA03 - Display / Print Payment Document)
// =========================================================================

interface DisplayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId?: number | null;
  initialDocNo?: string;
  formatPKR: (amt: number) => string;
  onOpenEditPayment?: (paymentId: number) => void;
  onOpenNewPayment?: () => void;
}

export const DisplayPaymentModal: React.FC<DisplayPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  initialDocNo,
  formatPKR,
  onOpenEditPayment,
  onOpenNewPayment
}) => {
  const [searchTerm, setSearchTerm] = useState(initialDocNo || (paymentId ? String(paymentId) : ''));
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  // Fetch payment details
  const fetchPayment = (idOrDoc: string | number) => {
    if (!idOrDoc) return;
    setLoading(true);
    setErrorMessage(null);

    fetch(`/api/payments/${idOrDoc}`)
      .then(r => {
        if (!r.ok) throw new Error(`Payment document "${idOrDoc}" not found`);
        return r.json();
      })
      .then(data => {
        setPaymentData(data);
      })
      .catch(err => {
        setErrorMessage(err.message);
        setPaymentData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // On open, load initial payment or fetch recent payments
  useEffect(() => {
    if (isOpen) {
      if (paymentId) {
        fetchPayment(paymentId);
      } else if (initialDocNo) {
        fetchPayment(initialDocNo);
      } else {
        // Fetch recent payments for quick lookup
        fetch('/api/payments?limit=10')
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setRecentPayments(data.slice(0, 8));
              fetchPayment(data[0].id);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, paymentId, initialDocNo]);

  // Clean Print View
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
      >
        {/* Top Header - Hidden on Print */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Printer size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/40">
                  PA03
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Display Payment Voucher
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official payment receipt & settlement document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {paymentData && onOpenEditPayment && (
              <button
                type="button"
                onClick={() => onOpenEditPayment(paymentData.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <Edit3 size={14} />
                Edit (PA02)
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Printer size={14} />
              Print Voucher
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search / Lookup Bar - Hidden on Print */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="Lookup Payment by Doc # (e.g. PAY-0001) or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchPayment(searchTerm);
              }}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchPayment(searchTerm)}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            Find
          </button>
        </div>

        {/* Voucher Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:overflow-visible font-sans">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading payment voucher details...
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 text-xs space-y-2">
              <AlertCircle size={24} className="mx-auto text-rose-500" />
              <p className="font-bold text-sm">Failed to find payment</p>
              <p>{errorMessage}</p>
            </div>
          ) : paymentData ? (
            <div className="max-w-3xl mx-auto space-y-6 text-slate-900 border border-slate-200 print:border-none p-6 rounded-2xl bg-white">
              {/* Voucher Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    {paymentData.distributor_name || 'Karachi Central Logistics & Distribution'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paymentData.distributor_address || 'Plot 45, Sector 15, Korangi Industrial Area, Karachi'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
                    <span>Phone: {paymentData.distributor_phone || '021-34567890'}</span>
                    {paymentData.distributor_ntn && <span>NTN: {paymentData.distributor_ntn}</span>}
                    {paymentData.distributor_strn && <span>STRN: {paymentData.distributor_strn}</span>}
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                    Official Receipt Voucher
                  </span>
                  <p className="text-base font-black font-mono text-slate-900">
                    {paymentData.payment_doc_no || `#PAY-${String(paymentData.id).padStart(4, '0')}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date: {paymentData.payment_date ? paymentData.payment_date.split('T')[0] : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Shop and Salesman Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer / Retailer
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{paymentData.shop_name}</p>
                  <p className="text-slate-600 mt-0.5">Owner: {paymentData.owner_name}</p>
                  <p className="text-slate-600">Phone: {paymentData.shop_phone}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Location: {paymentData.shop_area || 'Karachi'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Receipt & Collector Details
                  </span>
                  <p className="font-bold text-slate-900">
                    Method:{' '}
                    <span className="font-black text-emerald-700 uppercase">
                      {paymentData.payment_method}
                    </span>
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Salesman: <span className="font-semibold">{paymentData.salesman_display_name || paymentData.salesman_name || 'General'}</span>
                  </p>
                  {paymentData.payment_method === 'CHEQUE' && (
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] text-slate-700">
                      <p>Cheque #: <span className="font-mono font-bold">{paymentData.cheque_no}</span></p>
                      <p>Bank: <span className="font-semibold">{paymentData.bank_name}</span> ({paymentData.bank_branch || 'Branch'})</p>
                      <p>Cheque Date: {paymentData.cheque_date}</p>
                    </div>
                  )}
                  {paymentData.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Notes: {paymentData.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Settled Invoices Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Settled Invoices Breakdown
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="px-3 py-2.5">Invoice #</th>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5 text-right">Invoice Net</th>
                        <th className="px-3 py-2.5 text-right">Previous Balance</th>
                        <th className="px-3 py-2.5 text-right font-black text-emerald-800 bg-emerald-50/50">
                          Amount Settled
                        </th>
                        <th className="px-3 py-2.5 text-right">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentData.invoices && paymentData.invoices.length > 0 ? (
                        paymentData.invoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                              #INV-{String(inv.invoice_id).padStart(4, '0')}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {inv.invoice_date ? inv.invoice_date.split('T')[0] : 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {formatPKR(inv.invoice_net_amount)}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-500">
                              {formatPKR(inv.previous_outstanding)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50/20">
                              {formatPKR(inv.allocated_amount)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-700">
                              {formatPKR(inv.remaining_outstanding)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-slate-400 text-xs italic">
                            Payment recorded against account balance.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                        <td colSpan={4} className="px-3 py-2.5 text-right text-slate-700 uppercase">
                          Total Received & Settled:
                        </td>
                        <td colSpan={2} className="px-3 py-2.5 text-right text-sm font-black text-emerald-700">
                          {formatPKR(paymentData.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Amount in Words & Ledger Status */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Amount in Words:
                  </span>
                  <span className="text-xs font-bold text-slate-800 italic">
                    {numberToWordsPKR(paymentData.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Current Shop Ledger Balance:
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {formatPKR(paymentData.current_shop_balance || 0)}
                  </span>
                </div>
              </div>

              {/* Signatures Section */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-300 h-10 mb-2"></div>
                  <p className="font-bold text-slate-800">Collecting Salesman</p>
                  <p className="text-[10px] text-slate-400">{paymentData.salesman_display_name || 'Signature'}</p>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-300 h-10 mb-2"></div>
                  <p className="font-bold text-slate-800">Shopkeeper / Customer</p>
                  <p className="text-[10px] text-slate-400">Stamp & Signature</p>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-300 h-10 mb-2"></div>
                  <p className="font-bold text-slate-800">Accounts & Cashier</p>
                  <p className="text-[10px] text-slate-400">Authorized Signatory</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              Please enter a payment document number to display.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
