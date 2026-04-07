// ============================================================
// InventoryPage.tsx — Stock Management
// ============================================================
// Shows all SKUs with physical stock, reservations, available-to-sell,
// and a per-SKU configurable reorder threshold.
//
// New concepts introduced here:
//   Inline editing  — a cell switches between display text and a live
//                     <input> when clicked; saves on Enter or blur,
//                     cancels on Escape. Uses "autoFocus" so the input
//                     focuses itself when it mounts — no ref needed.
//   Derived columns — "Available to Sell" is computed from two stored
//                     fields on every render rather than stored in state.
//   Record<K,V> override state — thresholds are stored as a plain object
//                     keyed by SKU. When we look up a threshold we check
//                     this override object first, then fall back to the
//                     default from the data.

import React, { useState, useMemo } from 'react';
import { InventoryItem, InventoryCategory } from '../types/index.ts';
import { dummyInventory } from '../data/dummyData.ts';

// ============================================================
// HELPERS
// ============================================================

function formatUSD(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const InventoryPage: React.FC = () => {

  // ----------------------------------------------------------
  // FILTER + SEARCH STATE
  // ----------------------------------------------------------
  const [searchQuery,     setSearchQuery]     = useState('');
  const [categoryFilter,  setCategoryFilter]  = useState<InventoryCategory | ''>('');
  const [showLowOnly,     setShowLowOnly]     = useState(false);

  // ----------------------------------------------------------
  // THRESHOLD OVERRIDE STATE
  // ----------------------------------------------------------
  // This is a plain object (Record) mapping SKU → custom threshold.
  // When a user edits a threshold, we store the override here without
  // touching the original dummyInventory data.
  // When reading a threshold, we check here first, then fall back to
  // the item's default. This is the "override" pattern — source data
  // stays immutable, UI state layer sits on top.
  const [thresholds, setThresholds] = useState<Record<string, number>>({});

  function getThreshold(item: InventoryItem): number {
    // The ?? operator (nullish coalescing) returns the right side only
    // if the left side is null or undefined — not for 0, which matters
    // here since 0 is a valid threshold.
    return thresholds[item.sku] ?? item.reorderThreshold;
  }

  // ----------------------------------------------------------
  // INLINE EDIT STATE
  // ----------------------------------------------------------
  // editingSku: which SKU's threshold cell is currently being edited.
  // editValue:  the string value in the input (strings because <input> always gives strings).
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editValue,  setEditValue]  = useState<string>('');

  function startEdit(item: InventoryItem) {
    setEditingSku(item.sku);
    setEditValue(String(getThreshold(item)));
  }

  function commitEdit() {
    if (editingSku === null) return;
    // parseInt(value, 10) converts the string to a base-10 integer.
    // isNaN() checks if the result is "Not a Number" (e.g. the user typed "abc").
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setThresholds(prev => ({ ...prev, [editingSku]: parsed }));
    }
    setEditingSku(null);
  }

  function cancelEdit() {
    setEditingSku(null);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  commitEdit();
    if (e.key === 'Escape') cancelEdit();
  }

  // ----------------------------------------------------------
  // DERIVED STATS (for summary tiles)
  // ----------------------------------------------------------
  // useMemo so these only recalculate when thresholds or data changes —
  // not on every keystroke in the search box.
  const stats = useMemo(() => {
    const lowStockItems  = dummyInventory.filter(i => (i.physicalStock - i.reserved) <= getThreshold(i));
    const totalValue     = dummyInventory.reduce((sum, i) => sum + i.physicalStock * i.unitCost, 0);
    const totalUnits     = dummyInventory.reduce((sum, i) => sum + i.physicalStock, 0);
    const outOfStock     = dummyInventory.filter(i => (i.physicalStock - i.reserved) <= 0);
    return { lowStockItems, totalValue, totalUnits, outOfStock };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholds]);

  // ----------------------------------------------------------
  // FILTERED LIST
  // ----------------------------------------------------------
  const filteredItems = useMemo(() => {
    return dummyInventory.filter(item => {
      const available = item.physicalStock - item.reserved;
      if (showLowOnly && available > getThreshold(item)) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !item.sku.toLowerCase().includes(q) &&
          !item.name.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, showLowOnly, thresholds]);

  // Unique categories for the filter dropdown
  const categories = Array.from(new Set(dummyInventory.map(i => i.category))) as InventoryCategory[];

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-800">Inventory</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {dummyInventory.length} SKUs · {filteredItems.length} shown
        </p>
      </div>

      {/* ====================================================
          SUMMARY TILES
      ==================================================== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'Total SKUs',
              value: dummyInventory.length,
              sub: `${stats.totalUnits.toLocaleString()} units on hand`,
              color: 'bg-slate-50 border-slate-200 text-slate-700',
            },
            {
              label: 'Low Stock',
              value: stats.lowStockItems.length,
              sub: 'at or below reorder point',
              color: stats.lowStockItems.length > 0
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Out of Stock',
              value: stats.outOfStock.length,
              sub: 'zero available to sell',
              color: stats.outOfStock.length > 0
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Inventory Value',
              value: formatUSD(stats.totalValue),
              sub: 'at cost',
              color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
          ].map(tile => (
            <div key={tile.label} className={`rounded-lg border px-4 py-3 ${tile.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{tile.label}</p>
              <p className="text-2xl font-bold mt-1 leading-tight">{tile.value}</p>
              <p className="text-xs opacity-60 mt-0.5">{tile.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ====================================================
          FILTER TOOLBAR
      ==================================================== */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search SKU or product name..."
          className="flex-1 min-w-[180px] max-w-xs px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as InventoryCategory | '')}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Toggle: show only low-stock items */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLowOnly}
            onChange={e => setShowLowOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
          />
          Low stock only
        </label>

        {(searchQuery || categoryFilter || showLowOnly) && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter(''); setShowLowOnly(false); }}
            className="text-sm text-red-500 hover:text-red-700 ml-auto"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* ====================================================
          INVENTORY TABLE
      ==================================================== */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Physical</th>
              <th className="px-4 py-3 font-medium text-right">Reserved</th>
              <th className="px-4 py-3 font-medium text-right">Available</th>
              {/* The Reorder Point column header has a hint about clicking */}
              <th className="px-4 py-3 font-medium text-right">
                Reorder Point
                <span className="ml-1 text-gray-300 font-normal normal-case tracking-normal">
                  (click to edit)
                </span>
              </th>
              <th className="px-4 py-3 font-medium text-right">MSRP</th>
              <th className="px-4 py-3 font-medium">Bin</th>
              <th className="px-4 py-3 font-medium">Last Received</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map(item => {
              const available  = item.physicalStock - item.reserved;
              const threshold  = getThreshold(item);
              const isLowStock = available <= threshold;
              const isEditing  = editingSku === item.sku;

              return (
                <tr
                  key={item.sku}
                  className={`
                    border-b transition-colors duration-100
                    ${isLowStock
                      ? 'bg-red-50 border-red-100 border-l-2 border-l-red-400'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* SKU — monospace so digit widths are consistent */}
                  <td className="px-6 py-3 font-mono font-medium text-gray-800 text-xs">
                    {item.sku}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </td>

                  <td className="px-4 py-3 text-gray-500 text-xs">{item.category}</td>

                  {/* Physical Stock */}
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {item.physicalStock}
                  </td>

                  {/* Reserved — muted if zero */}
                  <td className={`px-4 py-3 text-right text-sm ${item.reserved > 0 ? 'text-amber-700 font-medium' : 'text-gray-400'}`}>
                    {item.reserved > 0 ? item.reserved : '—'}
                  </td>

                  {/* Available to Sell — red if at or below threshold */}
                  <td className={`px-4 py-3 text-right font-bold text-base ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {available}
                    {isLowStock && (
                      <span className="ml-1.5 text-xs font-normal text-red-500">⚠ Low</span>
                    )}
                  </td>

                  {/* ---- REORDER POINT — inline editable ---- */}
                  {/* When isEditing, we render an <input>. When not, we render text + hint.
                      "autoFocus" on the input tells React to focus it as soon as it
                      appears in the DOM — no useRef or useEffect needed for this. */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editValue}
                        autoFocus
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-20 px-2 py-1 text-sm text-right border-2 border-yellow-400 rounded focus:outline-none bg-white"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(item)}
                        className={`
                          group flex items-center gap-1.5 ml-auto
                          text-sm font-medium rounded px-2 py-0.5
                          hover:bg-yellow-50 hover:text-yellow-700 transition-colors
                          ${isLowStock ? 'text-red-600' : 'text-gray-700'}
                        `}
                      >
                        {threshold}
                        {/* Pencil icon — visible on row hover */}
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-gray-600">{formatUSD(item.msrp)}</td>

                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.binLocation}</td>

                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(item.lastReceived)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
