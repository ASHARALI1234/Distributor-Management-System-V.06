import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Percent, 
  Layers, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Sliders, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  DollarSign,
  Info,
  Search,
  Sparkles
} from 'lucide-react';
import { Product, MaterialGroup } from '../../types';
import { cn } from '../../lib/utils';

interface ProductMarginProcessModalProps {
  products: Product[];
  materialGroups: MaterialGroup[];
  initialMaterialGroupId?: string;
  initialProductId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewItem {
  product_id: string;
  product_name: string;
  brand: string;
  material_group_id: string;
  material_group_name: string;
  current_trade_price: number;
  current_retail_price: number;
  current_margin_percent: number;
  new_margin_percent: number;
  new_retail_price: number;
  price_difference: number;
}

export const ProductMarginProcessModal: React.FC<ProductMarginProcessModalProps> = ({
  products,
  materialGroups,
  initialMaterialGroupId = 'all',
  initialProductId = 'all',
  onClose,
  onSuccess
}) => {
  // Parameters
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState<string>(initialMaterialGroupId || 'all');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || 'all');
  const [marginPercent, setMarginPercent] = useState<number>(12);
  const [productSearch, setProductSearch] = useState<string>('');

  // Selected product IDs in preview (for selective applying)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Execution states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Common quick preset percentages
  const marginPresets = [5, 8, 10, 12, 15, 18, 20, 25];

  // Filter products for the Product Code dropdown based on selected Material Group
  const eligibleProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedMaterialGroup !== 'all' && p.material_group_id !== selectedMaterialGroup) {
        return false;
      }
      return true;
    });
  }, [products, selectedMaterialGroup]);

  // When Material Group changes, check if selected product still belongs to it
  const handleMaterialGroupChange = (mgId: string) => {
    setSelectedMaterialGroup(mgId);
    if (mgId !== 'all' && selectedProductId !== 'all') {
      const existsInGroup = products.some(p => p.product_id === selectedProductId && p.material_group_id === mgId);
      if (!existsInGroup) {
        setSelectedProductId('all');
      }
    }
  };

  // Generate live preview items
  const previewItems: PreviewItem[] = useMemo(() => {
    const margin = Number(marginPercent) || 0;

    const filtered = products.filter(p => {
      if (selectedMaterialGroup !== 'all' && p.material_group_id !== selectedMaterialGroup) {
        return false;
      }
      if (selectedProductId !== 'all' && p.product_id !== selectedProductId) {
        return false;
      }
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase();
        return (
          p.product_name.toLowerCase().includes(query) ||
          p.product_id.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return filtered.map(p => {
      const tp = Number(p.trade_price) || 0;
      const rp = Number(p.retail_price) || 0;
      const currentMargin = p.profit_margin_percent !== undefined && p.profit_margin_percent !== null
        ? Number(p.profit_margin_percent)
        : (tp > 0 ? Math.round(((rp - tp) * 100.0) / tp * 100) / 100 : 0);

      // Formula: RP = TP * (1 + Margin / 100)
      const newRp = Math.round(tp * (1.0 + (margin / 100.0)) * 100) / 100;
      const diff = Math.round((newRp - rp) * 100) / 100;

      const mg = materialGroups.find(g => g.mat_gp === p.material_group_id);

      return {
        product_id: p.product_id,
        product_name: p.product_name,
        brand: p.brand,
        material_group_id: p.material_group_id,
        material_group_name: mg?.mat_description || p.material_group_id,
        current_trade_price: tp,
        current_retail_price: rp,
        current_margin_percent: currentMargin,
        new_margin_percent: margin,
        new_retail_price: newRp,
        price_difference: diff
      };
    });
  }, [products, materialGroups, selectedMaterialGroup, selectedProductId, marginPercent, productSearch]);

  // Sync selected IDs when preview items change
  useEffect(() => {
    setSelectedIds(new Set(previewItems.map(item => item.product_id)));
  }, [previewItems.length, selectedMaterialGroup, selectedProductId]);

  const handleToggleSelectAll = () => {
    if (selectedIds.size === previewItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(previewItems.map(i => i.product_id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Execute the batch process
  const handleExecuteProcess = async () => {
    if (selectedIds.size === 0) {
      setError("Please select at least one product to update.");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const targetProductIds = Array.from(selectedIds);
      const res = await fetch('/api/products/batch-update-margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_group_id: selectedMaterialGroup === 'all' ? undefined : selectedMaterialGroup,
          product_id: targetProductIds.length === 1 ? targetProductIds[0] : targetProductIds,
          profit_margin_percent: marginPercent,
          preview_only: false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profit margins");
      }

      setSuccessMessage(`Process executed successfully: Updated ${data.updated_count || targetProductIds.length} product(s) to ${marginPercent}% margin.`);
      onSuccess();
    } catch (err: any) {
      console.error("Batch update error:", err);
      setError(err.message || "An unexpected error occurred during batch update.");
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 my-8 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between shadow-sm relative overflow-hidden flex-shrink-0">
          <div className="absolute right-0 top-0 w-96 h-full bg-white/5 skew-x-12 pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 shadow-inner">
              <Percent className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Automatic Profit Margin & Retail Price Process</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white border border-white/20">
                  T-Code: PRM01
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Automatically recalculate Retail Price (RP) based on Trade Price (TP) and Target Profit Margin %
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors relative z-10"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Notification Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
                  <X size={16} />
                </button>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{successMessage}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Products database and price master have been updated.</p>
                  </div>
                </div>
                <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Parameters Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Process Parameters</h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Step 1: Define Target Material Group, Product Code & Profit Margin %
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Parameter 1: Material Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-600" />
                  Material Group Parameter
                </label>
                <select 
                  value={selectedMaterialGroup}
                  onChange={(e) => handleMaterialGroupChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm transition-all"
                >
                  <option value="all">★ All Material Groups ({materialGroups.length} Groups)</option>
                  {materialGroups.map(mg => (
                    <option key={mg.mat_gp} value={mg.mat_gp}>
                      {mg.mat_gp} — {mg.mat_description}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Select group or choose All Groups</p>
              </div>

              {/* Parameter 2: Product Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-600" />
                  Product Code Parameter
                </label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm transition-all"
                >
                  <option value="all">★ All Products in Selected Scope ({eligibleProducts.length} SKUs)</option>
                  {eligibleProducts.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_id} — {p.product_name} ({p.brand})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Target specific SKU or entire category</p>
              </div>

              {/* Parameter 3: Profit Margin % */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-indigo-600" />
                    Target Profit Margin %
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                    +{marginPercent}%
                  </span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="500"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 12"
                    className="w-full pl-4 pr-10 py-2.5 bg-indigo-50/70 border-2 border-indigo-300 rounded-xl text-sm font-bold text-indigo-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-inner"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-500">%</span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Presets:</span>
                  {marginPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMarginPercent(preset)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                        marginPercent === preset
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                      )}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Formula Calculation Box */}
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-indigo-900">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold">
                  fx
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Formula Rule: </span>
                  <code className="px-2 py-0.5 bg-white rounded border border-indigo-200 font-mono font-bold text-indigo-800">
                    Retail Price (RP) = Trade Price (TP) × (1 + {marginPercent}% / 100)
                  </code>
                </div>
              </div>
              <div className="text-slate-600 text-[11px] flex items-center gap-1.5">
                <Info size={13} className="text-indigo-500 flex-shrink-0" />
                <span>Example: Trade Price PKR 550.00 @ {marginPercent}% margin ➔ Retail Price PKR {(550 * (1 + marginPercent / 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Impact Preview Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Impact Simulation Preview ({previewItems.length} Products)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  {selectedIds.size} of {previewItems.length} selected for update
                </span>
              </div>

              {/* Quick Search inside preview */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filter preview list..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-indigo-600 outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <button 
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center"
                          title="Select / Deselect All"
                        >
                          {selectedIds.size === previewItems.length && previewItems.length > 0 ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Product Code & Name</th>
                      <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Material Group / Brand</th>
                      <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-right">Trade Price (TP)</th>
                      <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-center">Margin %</th>
                      <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-right">Retail Price (RP)</th>
                      <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-right">Price Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewItems.map(item => {
                      const isSelected = selectedIds.has(item.product_id);
                      return (
                        <tr 
                          key={item.product_id}
                          onClick={() => handleToggleItem(item.product_id)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-indigo-50/40",
                            isSelected ? "bg-indigo-50/20" : "opacity-60 bg-white"
                          )}
                        >
                          <td className="px-4 py-2.5">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-indigo-600" />
                            ) : (
                              <Square size={16} className="text-slate-300" />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-900">{item.product_name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{item.product_id}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="text-slate-700 font-medium">{item.material_group_name}</div>
                            <div className="text-[10px] text-slate-400">{item.brand}</div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800 tabular-nums">
                            PKR {item.current_trade_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-semibold">
                              <span className="text-slate-500">{item.current_margin_percent}%</span>
                              <ArrowRight size={11} className="text-slate-400" />
                              <span className="text-indigo-700 font-bold">{item.new_margin_percent}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            <div className="text-slate-400 line-through text-[11px]">
                              PKR {item.current_retail_price.toFixed(2)}
                            </div>
                            <div className="text-indigo-700 font-extrabold text-sm">
                              PKR {item.new_retail_price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-bold">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-bold inline-block",
                              item.price_difference > 0 ? "bg-emerald-100 text-emerald-700" :
                              item.price_difference < 0 ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {item.price_difference > 0 ? `+PKR ${item.price_difference.toFixed(2)}` :
                               item.price_difference < 0 ? `-PKR ${Math.abs(item.price_difference).toFixed(2)}` :
                               'PKR 0.00'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {previewItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Package size={36} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-semibold">No products found matching the specified parameters.</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try selecting "All Material Groups" or clearing the search filter.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800">{selectedIds.size}</span> product(s) will have their Profit Margin set to <span className="font-bold text-indigo-700">{marginPercent}%</span> and Retail Price recalculated.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all shadow-sm flex-1 sm:flex-initial"
            >
              Cancel (Esc)
            </button>
            <button 
              type="button"
              disabled={isExecuting || selectedIds.size === 0}
              onClick={handleExecuteProcess}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Apply Margin & Recalculate RP ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
