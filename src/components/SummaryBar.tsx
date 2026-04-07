// ============================================================
// SummaryBar.tsx — Top 5-Tile Summary Bar
// ============================================================
// The horizontal row of stat cards at the top of the dashboard.
// Each tile shows a key number at a glance: new orders, processing,
// shipped today, issues, and today's revenue.

import React from 'react';
import { SummaryTile } from '../types/index.ts';
import { dummyOrders } from '../data/dummyData.ts';

// --------------------
// Compute tile values from dummy data
// --------------------
// Array.filter() returns a new array containing only items that pass a test.
// Here we count how many orders have each status.
const newCount        = dummyOrders.filter(o => o.status === 'new').length;
const processingCount = dummyOrders.filter(o => o.status === 'processing').length;
const shippedCount    = dummyOrders.filter(o => o.status === 'shipped').length;
const issueCount      = dummyOrders.filter(o => o.status === 'issue').length;

// .reduce() walks over the array and accumulates a single value —
// here we sum up the "total" field of every order.
const totalRevenue = dummyOrders.reduce((sum, o) => sum + o.total, 0);

// Build the 5 tile configs. We define the data separately from the JSX
// so the component stays clean and easy to read.
const tiles: SummaryTile[] = [
  {
    label: 'New Orders',
    value: newCount,
    colorClass: 'bg-blue-50 border-blue-200 text-blue-700',
    iconLabel: '🆕',
  },
  {
    label: 'Processing',
    value: processingCount,
    colorClass: 'bg-amber-50 border-amber-200 text-amber-700',
    iconLabel: '⚙️',
  },
  {
    label: 'Shipped Today',
    value: shippedCount,
    colorClass: 'bg-green-50 border-green-200 text-green-700',
    iconLabel: '🚚',
  },
  {
    label: 'Pending Issues',
    value: issueCount,
    colorClass: `${issueCount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`,
    iconLabel: '⚠️',
  },
  {
    label: "Today's Revenue",
    // toLocaleString formats a number with commas and currency symbol
    value: '$' + totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    colorClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    iconLabel: '💰',
  },
];

const SummaryBar: React.FC = () => {
  return (
    // This bar sits at the top of the main content area.
    // "flex-shrink-0" prevents it from shrinking when the window is small.
    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">

      {/* Page title row */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold text-gray-800">Order Operations</h1>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </span>
      </div>

      {/* Tile row — "grid grid-cols-5" places the 5 tiles in equal columns */}
      <div className="grid grid-cols-5 gap-3">
        {tiles.map((tile) => (
          // Each tile is a bordered card. The colorClass changes background,
          // border, and text color all at once based on which tile it is.
          <div
            key={tile.label}
            className={`rounded-lg border px-4 py-3 flex flex-col gap-1 ${tile.colorClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                {tile.label}
              </span>
              <span className="text-base leading-none">{tile.iconLabel}</span>
            </div>
            <div className="text-2xl font-bold leading-tight">{tile.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryBar;
