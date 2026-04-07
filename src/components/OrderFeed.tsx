// ============================================================
// OrderFeed.tsx — Center Order Feed (the main list view)
// ============================================================
// Scrollable table of all orders. Clicking a row opens the
// OrderDrawer with that order's full details.

import React, { useState, useCallback, useMemo } from 'react';
import { Order, OrderStatus, Channel } from '../types/index.ts';
import { dummyOrders } from '../data/dummyData.ts';
import OrderDrawer from './OrderDrawer.tsx';

// --------------------
// HELPER: Status Badge
// --------------------
const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  new:        { label: 'New',        className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', className: 'bg-amber-100 text-amber-700' },
  shipped:    { label: 'Shipped',    className: 'bg-green-100 text-green-700' },
  delivered:  { label: 'Delivered',  className: 'bg-slate-100 text-slate-600' },
  issue:      { label: '⚠ Issue',   className: 'bg-red-100 text-red-700 font-semibold' },
  cancelled:  { label: 'Cancelled',  className: 'bg-gray-100 text-gray-500 line-through' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// --------------------
// HELPER: Channel Badge
// --------------------
const channelConfig: Record<Channel, { className: string }> = {
  WooCommerce:   { className: 'bg-purple-100 text-purple-700' },
  Walmart:       { className: 'bg-blue-100 text-blue-700' },
  'TikTok Shop': { className: 'bg-pink-100 text-pink-700' },
  Newegg:        { className: 'bg-orange-100 text-orange-700' },
  Direct:        { className: 'bg-gray-100 text-gray-700' },
};

function ChannelBadge({ channel }: { channel: Channel }) {
  const cfg = channelConfig[channel];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {channel}
    </span>
  );
}

// --------------------
// HELPER: Format date
// --------------------
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// --------------------
// HELPER: Format items summary
// --------------------
function itemSummary(order: Order): string {
  const first = order.items[0];
  const extra = order.items.length - 1;
  const qtyLabel = `${first.qty}× ${first.name}`;
  return extra > 0 ? `${qtyLabel} +${extra} more` : qtyLabel;
}

// --------------------
// MAIN COMPONENT
// --------------------
const OrderFeed: React.FC = () => {
  // drawerOrderId holds the id of whichever order is currently open in the drawer.
  // null means the drawer is closed. We derive the actual Order object from this id below.
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

  // ---- ORDERS STATE ----
  // We store orders in useState (instead of reading dummyOrders directly)
  // so that action buttons in the drawer (Confirm, Cancel, Add Note) can
  // update individual orders and the table re-renders to reflect the change.
  // This is the "lifting state up" pattern: the parent owns the data,
  // and passes a callback down so children can request changes.
  const [orders, setOrders] = useState(dummyOrders);

  // Called by OrderDrawer when an action updates an order.
  // We map over the array and swap in the updated order by ID.
  const handleUpdateOrder = useCallback((updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, []);

  // ---- FILTER STATE ----
  // Three independent pieces of state, one per filter control.
  // When any of them changes, useMemo below will recompute filteredOrders.
  const [searchQuery,   setSearchQuery]   = useState('');
  const [channelFilter, setChannelFilter] = useState<Channel | ''>('');
  const [statusFilter,  setStatusFilter]  = useState<OrderStatus | ''>('');

  // ---- FILTERING ----
  // useMemo caches the filtered result and only recomputes when the
  // dependencies (the three filter values) actually change.
  // Without this, the filter would run on every render — fine for 10 orders,
  // but important to get into the habit of for larger datasets.
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
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
      if (channelFilter && order.channel !== channelFilter) return false;
      if (statusFilter  && order.status  !== statusFilter)  return false;
      return true;
    });
  }, [orders, searchQuery, channelFilter, statusFilter]);

  // Is any filter currently active? Used to show/hide the "clear" button.
  const hasActiveFilter = searchQuery !== '' || channelFilter !== '' || statusFilter !== '';

  function clearFilters() {
    setSearchQuery('');
    setChannelFilter('');
    setStatusFilter('');
  }

  // Find the full Order object from the live orders state (not the static array),
  // so the drawer always reflects the latest status/notes after an action.
  const drawerOrder = orders.find(o => o.id === drawerOrderId) ?? null;

  // useCallback gives a stable function reference so the Escape-key useEffect
  // inside OrderDrawer doesn't re-register on every keystroke.
  const handleClose = useCallback(() => setDrawerOrderId(null), []);

  return (
    // The outer div still takes up flex-1, but now it's a sibling to the drawer,
    // which is fixed-positioned and overlays everything when open.
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ---- TOOLBAR: search + filter ---- */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">

        {/* Search input with inline × clear button.
            The wrapper is position:relative so the × button can sit
            inside the right edge of the input field. */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search orders, customers, SKUs..."
            className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
          {/* Clear button — only visible when there's text to clear */}
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
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5
            focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5
            focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="issue">Issue</option>
        </select>

        {/* Order count + optional "Clear filters" link */}
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-400 whitespace-nowrap">
          {filteredOrders.length} of {dummyOrders.length} orders
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ---- ORDER TABLE ---- */}
      <div className="flex-1 overflow-y-auto bg-gray-50">

        {/* Empty state — shown when filters produce no results */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
            <div className="text-4xl">🔍</div>
            <p className="font-medium text-gray-600">No orders match your filters</p>
            <p className="text-sm text-gray-400">Try adjusting the search or filter criteria above</p>
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 underline">
              Clear all filters
            </button>
          </div>
        ) : (
        <table className="w-full text-sm border-collapse">

          <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => {
              const isOpen = order.id === drawerOrderId;
              return (
                <tr
                  key={order.id}
                  onClick={() => setDrawerOrderId(order.id)}
                  className={`
                    border-b border-gray-100 cursor-pointer transition-colors duration-100
                    ${isOpen
                      ? 'bg-yellow-50 border-l-2 border-l-yellow-400'
                      : 'bg-white hover:bg-gray-50'
                    }
                    ${order.status === 'issue' && !isOpen ? 'border-l-2 border-l-red-400' : ''}
                  `}
                >
                  <td className="px-6 py-3 font-mono font-medium text-gray-800">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <ChannelBadge channel={order.channel} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                    {itemSummary(order)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* ---- ORDER DRAWER ----
          Rendered here but it's fixed-position so it floats on top of the whole page.
          We pass the selected order (or null) and the close handler down as props. */}
      <OrderDrawer order={drawerOrder} onClose={handleClose} onUpdateOrder={handleUpdateOrder} />

    </div>
  );
};

export default OrderFeed;
