// ============================================================
// ReportsPage.tsx — Summary Reports & Analytics
// ============================================================
// Shows high-level business metrics derived from the order data.
// All numbers are computed from dummyOrders so they stay consistent
// with what you see in the Orders page.
//
// No chart library needed — we use CSS bar charts built with divs.
// A div whose width is a percentage of its parent IS a bar chart.
// This keeps our bundle small and avoids a new dependency.
//
// The time-range toggle (Today / This Week / This Month) filters
// which orders are included in each calculation.

import React, { useState, useMemo } from 'react';
import { dummyOrders } from '../data/dummyData.ts';
import { Order, Channel, OrderStatus } from '../types/index.ts';

// ============================================================
// TYPES
// ============================================================
type TimeRange = 'today' | 'week' | 'month';

// ============================================================
// HELPER: FILTER BY TIME RANGE
// Returns only orders that fall within the selected period.
// We compare against today's date (hardcoded to 2026-04-06 in dummy data).
// ============================================================
function filterByRange(orders: Order[], range: TimeRange): Order[] {
  // "Now" for filtering purposes — in production this would be new Date()
  const now = new Date('2026-04-06T23:59:59Z');

  return orders.filter(order => {
    const created = new Date(order.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (range === 'today') return diffDays < 1;
    if (range === 'week')  return diffDays < 7;
    if (range === 'month') return diffDays < 30;
    return true;
  });
}

// ============================================================
// HELPER: FORMAT CURRENCY
// ============================================================
function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// ============================================================
// SUB-COMPONENT: SECTION CARD
// A consistent white card wrapper used throughout the page.
// ============================================================
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: HORIZONTAL BAR
// A single labeled bar in a bar chart. Width is driven by the
// `pct` prop (0–100), which is computed from max value in the set.
// ============================================================
function HBar({
  label, value, display, pct, colorClass
}: {
  label: string; value: number; display: string; pct: number; colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-gray-600 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        {/* The bar itself — width% is calculated relative to the max value in the set */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.max(pct, 2)}%` }}   // min 2% so even tiny values show
        />
      </div>
      <span className="w-20 text-right font-medium text-gray-800">{display}</span>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function ReportsPage() {
  const [range, setRange] = useState<TimeRange>('month');

  // useMemo re-computes all stats only when dummyOrders or range changes.
  // This avoids recalculating on every keystroke or unrelated state change.
  const stats = useMemo(() => {
    const orders = filterByRange(dummyOrders, range);

    // ---- SUMMARY NUMBERS ----
    const totalRevenue  = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders   = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // ---- REVENUE BY CHANNEL ----
    // Group orders by channel and sum their totals.
    // reduce() here builds a map of { channelName: totalRevenue }
    const revenueByChannel = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.channel] = (acc[o.channel] ?? 0) + o.total;
      return acc;
    }, {});

    const channelColors: Record<Channel, string> = {
      WooCommerce: 'bg-purple-500',
      Walmart:     'bg-blue-500',
      'TikTok Shop': 'bg-pink-500',
      Newegg:      'bg-orange-500',
      Direct:      'bg-gray-700',
    };

    // Sort channels by revenue descending
    const channelRows = (Object.entries(revenueByChannel) as [Channel, number][])
      .sort(([, a], [, b]) => b - a);
    const maxChannelRevenue = Math.max(...channelRows.map(([, v]) => v), 1);

    // ---- ORDERS BY STATUS ----
    const ordersByStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const statusLabels: Record<OrderStatus, string> = {
      new:        'New',
      processing: 'Processing',
      shipped:    'Shipped',
      delivered:  'Delivered',
      issue:      'Issue',
    };
    const statusColors: Record<OrderStatus, string> = {
      new:        'bg-blue-400',
      processing: 'bg-yellow-400',
      shipped:    'bg-indigo-400',
      delivered:  'bg-green-500',
      issue:      'bg-red-500',
    };

    const statusRows = (Object.entries(ordersByStatus) as [OrderStatus, number][])
      .sort(([, a], [, b]) => b - a);
    const maxStatusCount = Math.max(...statusRows.map(([, v]) => v), 1);

    // ---- TOP SELLING SKUs ----
    // Flatten all line items from all filtered orders, then group by SKU.
    const skuMap = orders.reduce<Record<string, { name: string; qty: number; revenue: number }>>((acc, o) => {
      o.items.forEach(item => {
        if (!acc[item.sku]) acc[item.sku] = { name: item.name, qty: 0, revenue: 0 };
        acc[item.sku].qty     += item.qty;
        acc[item.sku].revenue += item.qty * item.unitPrice;
      });
      return acc;
    }, {});

    const topSkus = Object.entries(skuMap)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 6);   // top 6 SKUs
    const maxSkuRevenue = Math.max(...topSkus.map(([, v]) => v.revenue), 1);

    return {
      totalRevenue, totalOrders, avgOrderValue,
      channelRows, maxChannelRevenue, channelColors,
      statusRows, maxStatusCount, statusLabels, statusColors,
      topSkus, maxSkuRevenue,
    };
  }, [range]);

  // ---- RANGE TOGGLE BUTTONS ----
  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* ---- PAGE HEADER ---- */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sales and order performance overview</p>
        </div>

        {/* Time range toggle — looks like a tab strip */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {ranges.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors
                ${range === r.key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- SCROLLABLE CONTENT ---- */}
      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* ---- TOP SUMMARY TILES ---- */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{money(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-400 mt-1">for selected period</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
            <p className="text-xs text-gray-400 mt-1">orders placed</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{money(stats.avgOrderValue)}</p>
            <p className="text-xs text-gray-400 mt-1">per order</p>
          </div>
        </div>

        {/* ---- CHARTS ROW: Revenue by Channel + Orders by Status ---- */}
        <div className="grid grid-cols-2 gap-5">

          {/* Revenue by Channel */}
          <Card title="Revenue by Channel">
            {stats.channelRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No orders in this period.</p>
            ) : (
              <div className="space-y-3">
                {stats.channelRows.map(([channel, revenue]) => (
                  <HBar
                    key={channel}
                    label={channel}
                    value={revenue}
                    display={money(revenue)}
                    pct={(revenue / stats.maxChannelRevenue) * 100}
                    colorClass={stats.channelColors[channel as Channel] ?? 'bg-gray-400'}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Orders by Status */}
          <Card title="Orders by Status">
            {stats.statusRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No orders in this period.</p>
            ) : (
              <div className="space-y-3">
                {stats.statusRows.map(([status, count]) => (
                  <HBar
                    key={status}
                    label={stats.statusLabels[status as OrderStatus]}
                    value={count}
                    display={`${count} order${count !== 1 ? 's' : ''}`}
                    pct={(count / stats.maxStatusCount) * 100}
                    colorClass={stats.statusColors[status as OrderStatus] ?? 'bg-gray-400'}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ---- TOP SELLING SKUs ---- */}
        <Card title="Top Selling SKUs">
          {stats.topSkus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No orders in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-semibold">Rank</th>
                  <th className="pb-2 font-semibold">SKU</th>
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 font-semibold text-right">Units Sold</th>
                  <th className="pb-2 font-semibold text-right">Revenue</th>
                  <th className="pb-2 font-semibold w-40">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topSkus.map(([sku, data], idx) => (
                  <tr key={sku} className="hover:bg-gray-50">
                    <td className="py-2.5 text-gray-400 font-medium">#{idx + 1}</td>
                    <td className="py-2.5 font-mono text-xs text-gray-500">{sku}</td>
                    <td className="py-2.5 text-gray-700">{data.name}</td>
                    <td className="py-2.5 text-right text-gray-800 font-medium">{data.qty}</td>
                    <td className="py-2.5 text-right text-gray-800 font-medium">{money(data.revenue)}</td>
                    <td className="py-2.5">
                      {/* Mini inline bar — just like the channel bars but compact */}
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden ml-4">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(data.revenue / stats.maxSkuRevenue) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* ---- FOOTER NOTE ---- */}
        <p className="text-xs text-gray-400 text-center pb-2">
          All figures are computed from dummy data and will reflect live API data in a future phase.
        </p>
      </div>
    </div>
  );
}
