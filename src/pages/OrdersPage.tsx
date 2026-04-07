// ============================================================
// OrdersPage.tsx — Full Order Management Page
// ============================================================
// The Orders nav item opens this page. It's a superset of the
// Dashboard's OrderFeed: same table, but with real working filters,
// row checkboxes, bulk actions, and a date range picker.
//
// New concepts introduced here:
//   useMemo    — cache the filtered list so it only recalculates when filters change
//   Set<string>— efficient data structure for tracking selected row IDs
//   useRef     — direct DOM access for the "indeterminate" checkbox state
//   useCallback— stable function references to avoid unnecessary effect re-runs

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Order, OrderStatus, Channel } from '../types/index.ts';
import { dummyOrders } from '../data/dummyData.ts';
import OrderDrawer from '../components/OrderDrawer.tsx';
import BulkPackingSlipModal from '../components/BulkPackingSlipModal.tsx';

// ============================================================
// BADGE HELPERS  (same styling as OrderFeed / OrderDrawer)
// ============================================================

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  new:        { label: 'New',        className: 'bg-blue-100  text-blue-700'  },
  processing: { label: 'Processing', className: 'bg-amber-100 text-amber-700' },
  shipped:    { label: 'Shipped',    className: 'bg-green-100 text-green-700' },
  delivered:  { label: 'Delivered',  className: 'bg-slate-100 text-slate-600' },
  issue:      { label: '⚠ Issue',   className: 'bg-red-100   text-red-700 font-semibold' },
  cancelled:  { label: 'Cancelled',  className: 'bg-gray-100  text-gray-500 line-through' },
};

const channelConfig: Record<Channel, string> = {
  WooCommerce:   'bg-purple-100 text-purple-700',
  Walmart:       'bg-blue-100   text-blue-700',
  'TikTok Shop': 'bg-pink-100   text-pink-700',
  Newegg:        'bg-orange-100 text-orange-700',
  Direct:        'bg-gray-100   text-gray-700',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = statusConfig[status];
  return <span className={`px-2 py-0.5 rounded-full text-xs ${c.className}`}>{c.label}</span>;
}

function ChannelBadge({ channel }: { channel: Channel }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${channelConfig[channel]}`}>
      {channel}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function itemSummary(order: Order) {
  const first = order.items[0];
  const extra = order.items.length - 1;
  return extra > 0 ? `${first.qty}× ${first.name} +${extra} more` : `${first.qty}× ${first.name}`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const OrdersPage: React.FC = () => {

  // ----------------------------------------------------------
  // ORDERS STATE — lifted so action buttons can update individual orders
  // ----------------------------------------------------------
  const [orders, setOrders] = useState(dummyOrders);

  const handleUpdateOrder = useCallback((updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, []);

  // ----------------------------------------------------------
  // FILTER STATE
  // ----------------------------------------------------------
  const [searchQuery,   setSearchQuery]   = useState('');
  const [channelFilter, setChannelFilter] = useState<Channel | ''>('');
  const [statusFilter,  setStatusFilter]  = useState<OrderStatus | ''>('');
  // dateFilter: 'all' | 'today' | 'week' | 'month'
  const [dateFilter,    setDateFilter]    = useState('all');

  // ----------------------------------------------------------
  // SELECTION STATE — using Set<string>
  // ----------------------------------------------------------
  // A Set is like an array but it only stores unique values and has
  // O(1) lookup (checking if an id is in the set is instant regardless
  // of how many items are in it, vs O(n) for arrays).
  // React state with Sets requires spreading into a new Set on update
  // because React uses reference equality to detect changes.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ----------------------------------------------------------
  // DRAWER + BULK PRINT STATE
  // ----------------------------------------------------------
  const [drawerOrderId,  setDrawerOrderId]  = useState<string | null>(null);
  const [showBulkPrint,  setShowBulkPrint]  = useState(false);

  const drawerOrder    = orders.find(o => o.id === drawerOrderId) ?? null;
  const selectedOrders = orders.filter(o => selectedIds.has(o.id));

  const handleDrawerClose   = useCallback(() => setDrawerOrderId(null), []);
  const handleBulkPrintClose = useCallback(() => setShowBulkPrint(false), []);

  // ----------------------------------------------------------
  // FILTERING — useMemo
  // ----------------------------------------------------------
  // useMemo takes a function and a dependency array.
  // It runs the function once and caches the result.
  // It only re-runs when one of the dependencies changes.
  // Without useMemo, filtering would re-run on EVERY render,
  // even for unrelated state changes like opening the drawer.
  const filteredOrders = useMemo(() => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo  = new Date(today.getTime() - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return orders.filter(order => {
      // Search: checks order number, customer name, email, and SKUs
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hit =
          order.orderNumber.toLowerCase().includes(q)   ||
          order.customerName.toLowerCase().includes(q)  ||
          order.customerEmail.toLowerCase().includes(q) ||
          order.items.some(i =>
            i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
          );
        if (!hit) return false;
      }
      // Channel filter: exact match
      if (channelFilter && order.channel !== channelFilter) return false;
      // Status filter: exact match
      if (statusFilter && order.status !== statusFilter) return false;
      // Date range filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'today' && orderDate < today)   return false;
        if (dateFilter === 'week'  && orderDate < weekAgo)  return false;
        if (dateFilter === 'month' && orderDate < monthAgo) return false;
      }
      return true;
    });
  }, [orders, searchQuery, channelFilter, statusFilter, dateFilter]);

  // ----------------------------------------------------------
  // SELECT ALL LOGIC — derived values
  // ----------------------------------------------------------
  // allSelected: every visible (filtered) order is checked
  // someSelected: at least one is checked, but not all (triggers indeterminate)
  const allSelected  = filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      // Deselect all — create a new empty Set
      setSelectedIds(new Set());
    } else {
      // Select all filtered orders — new Set from their IDs
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  }

  function toggleRow(id: string) {
    // We always create a NEW Set (spread existing into it) before modifying.
    // React uses reference equality — mutating the existing Set in place
    // wouldn't trigger a re-render because the reference didn't change.
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ----------------------------------------------------------
  // INDETERMINATE CHECKBOX — useRef
  // ----------------------------------------------------------
  // The "indeterminate" state on a checkbox (a dash/minus instead of
  // a checkmark, meaning "some but not all") cannot be set via HTML
  // attributes — it can only be set via JavaScript on the DOM node itself.
  //
  // useRef gives us a stable reference to a DOM element across renders.
  // Think of it like document.getElementById() but the React way.
  // Unlike useState, updating a ref does NOT cause a re-render.
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      // We set .indeterminate directly on the DOM node
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Orders</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              All channels · {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          {/* Show a "clear filters" link only when a filter is active */}
          {(searchQuery || channelFilter || statusFilter || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setChannelFilter('');
                setStatusFilter('');
                setDateFilter('all');
              }}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          BULK ACTION BAR — only visible when rows are selected
          This slides in/out using conditional rendering.
          When items are selected, it replaces the filter bar visually
          by showing above it with a distinct colored background.
      ==================================================== */}
      {selectedIds.size > 0 && (
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-2.5 bg-yellow-50 border-b border-yellow-200">
          <span className="text-sm font-medium text-yellow-800">
            {selectedIds.size} order{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => setShowBulkPrint(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              🖨 Print {selectedIds.size} Packing {selectedIds.size === 1 ? 'List' : 'Lists'}
            </button>
          </div>
          {/* Spacer pushes the deselect button to the far right */}
          <div className="ml-auto">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-yellow-700 hover:text-yellow-900 underline"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          FILTER TOOLBAR
      ==================================================== */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search orders, customers, SKUs..."
            className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400
                hover:text-gray-700 leading-none text-base"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value as Channel | '')}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">All Channels</option>
          <option value="WooCommerce">WooCommerce</option>
          <option value="Walmart">Walmart</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Newegg">Newegg</option>
          <option value="Direct">Direct</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="issue">Issue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* ====================================================
          ORDER TABLE
      ==================================================== */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredOrders.length === 0 ? (
          // Empty state — shown when filters produce no results
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
            <div className="text-4xl">🔍</div>
            <p className="font-medium text-gray-600">No orders match your filters</p>
            <p className="text-sm text-gray-400">Try adjusting the search or filter criteria above</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">

                {/* ---- SELECT-ALL CHECKBOX ----
                    The "indeterminate" state (dash/minus icon) is set by our
                    useRef + useEffect above whenever some but not all are checked. */}
                <th className="px-4 py-3 w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400 cursor-pointer"
                  />
                </th>

                <th className="px-3 py-3 font-medium">Order #</th>
                <th className="px-3 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium text-right">Total</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Invoice</th>
                <th className="px-3 py-3 font-medium">Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map(order => {
                const isChecked  = selectedIds.has(order.id);
                const isDrawerOpen = order.id === drawerOrderId;

                return (
                  <tr
                    key={order.id}
                    className={`
                      border-b border-gray-100 transition-colors duration-100
                      ${isDrawerOpen  ? 'bg-yellow-50 border-l-2 border-l-yellow-400' : ''}
                      ${isChecked && !isDrawerOpen ? 'bg-blue-50' : ''}
                      ${!isChecked && !isDrawerOpen ? 'bg-white hover:bg-gray-50' : ''}
                      ${order.status === 'issue' && !isDrawerOpen && !isChecked ? 'border-l-2 border-l-red-400' : ''}
                    `}
                  >
                    {/* Checkbox cell — stopPropagation prevents the row click
                        (which opens the drawer) from firing when you're just
                        trying to check a box */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRow(order.id)}
                        className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400 cursor-pointer"
                      />
                    </td>

                    {/* All other cells open the drawer on click */}
                    <td className="px-3 py-3 font-mono font-medium text-gray-800 cursor-pointer"
                        onClick={() => setDrawerOrderId(order.id)}>
                      {order.orderNumber}
                    </td>
                    <td className="px-3 py-3 cursor-pointer" onClick={() => setDrawerOrderId(order.id)}>
                      <ChannelBadge channel={order.channel} />
                    </td>
                    <td className="px-3 py-3 cursor-pointer" onClick={() => setDrawerOrderId(order.id)}>
                      <div className="font-medium text-gray-800">{order.customerName}</div>
                      <div className="text-xs text-gray-400">{order.customerEmail}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 max-w-[180px] truncate cursor-pointer"
                        onClick={() => setDrawerOrderId(order.id)}>
                      {itemSummary(order)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800 cursor-pointer"
                        onClick={() => setDrawerOrderId(order.id)}>
                      ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 cursor-pointer" onClick={() => setDrawerOrderId(order.id)}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3 cursor-pointer" onClick={() => setDrawerOrderId(order.id)}>
                      {order.invoiceStatus ? (
                        <span className={`text-xs font-medium ${
                          order.invoiceStatus === 'paid'    ? 'text-green-600' :
                          order.invoiceStatus === 'overdue' ? 'text-red-600 font-semibold' :
                          order.invoiceStatus === 'sent'    ? 'text-blue-600' :
                          'text-gray-400'
                        }`}>
                          {order.invoiceStatus.charAt(0).toUpperCase() + order.invoiceStatus.slice(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs cursor-pointer"
                        onClick={() => setDrawerOrderId(order.id)}>
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ====================================================
          ORDER DRAWER + BULK PRINT MODAL
          Both are fixed-position overlays — they live here in the
          JSX tree but float above the entire page when open.
      ==================================================== */}
      <OrderDrawer order={drawerOrder} onClose={handleDrawerClose} onUpdateOrder={handleUpdateOrder} />

      <BulkPackingSlipModal
        orders={showBulkPrint ? selectedOrders : []}
        onClose={handleBulkPrintClose}
      />

    </div>
  );
};

export default OrdersPage;
