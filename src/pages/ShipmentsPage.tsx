// ============================================================
// ShipmentsPage.tsx — Carrier Tracking Overview
// ============================================================
// Shows all active and recent shipments. Clicking a row expands
// an inline tracking timeline directly below it in the table —
// an "accordion" pattern that avoids opening a full drawer for
// data that's compact enough to read inline.
//
// New concepts:
//   colSpan   — make a table cell span multiple columns
//   accordion — expand/collapse inline content within a table row
//   events[0] — newest-first array convention for O(1) "last scan" access

import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus, Carrier } from '../types/index.ts';
import { dummyShipments } from '../data/dummyData.ts';

// ============================================================
// STATUS CONFIG
// ============================================================
const statusConfig: Record<ShipmentStatus, {
  label: string;
  dot: string;       // color for the status dot
  badge: string;     // full badge className
}> = {
  in_transit:       { label: 'In Transit',       dot: 'bg-blue-500',  badge: 'bg-blue-100  text-blue-800'  },
  out_for_delivery: { label: 'Out for Delivery',  dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
  delivered:        { label: 'Delivered',         dot: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
  exception:        { label: 'Exception',         dot: 'bg-red-500',   badge: 'bg-red-100   text-red-800 font-semibold' },
};

const carrierConfig: Record<Carrier, { color: string }> = {
  USPS:          { color: 'text-blue-700'  },
  UPS:           { color: 'text-amber-700' },
  FedEx:         { color: 'text-purple-700'},
  'R+L Carriers':{ color: 'text-gray-700' },
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// Returns true if estimated delivery is today or in the past (overdue)
function isDeliveryDue(iso: string): boolean {
  const est  = new Date(iso);
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return est <= today;
}

// ============================================================
// TRACKING TIMELINE SUB-COMPONENT
// ============================================================
// Renders the vertical timeline of carrier scan events.
// Each event gets a dot on a vertical line; the first (latest) event
// gets a larger, colored dot. The rest are smaller and gray.
function TrackingTimeline({ shipment }: { shipment: Shipment }) {
  return (
    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
      <div className="flex gap-10 flex-wrap">

        {/* ---- Left: shipment meta-info ---- */}
        <div className="flex-shrink-0 space-y-2 min-w-[220px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Shipment Details
          </p>
          {[
            { label: 'Carrier',   value: shipment.carrier  },
            { label: 'Service',   value: shipment.service  },
            { label: 'Tracking',  value: shipment.trackingNumber },
            { label: 'Weight',    value: shipment.weight   },
            { label: 'Ship Date', value: formatDate(shipment.shipDate) },
            { label: 'Est. Delivery', value: formatDate(shipment.estimatedDelivery) },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* ---- Right: tracking timeline ---- */}
        <div className="flex-1 min-w-[300px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Tracking History
          </p>

          <div className="relative">
            {/* The vertical line that runs behind all the dots.
                It's absolutely positioned on the left, behind the event rows. */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-5">
              {shipment.events.map((event, index) => {
                const isLatest = index === 0;
                // Dot color: latest event uses the shipment's status color,
                // all others are plain gray
                const dotColor = isLatest
                  ? statusConfig[shipment.status].dot
                  : 'bg-gray-300';
                // Latest dot is slightly larger to draw the eye
                const dotSize = isLatest ? 'w-4 h-4 -ml-[0px]' : 'w-3 h-3 ml-[2px]';

                return (
                  <div key={index} className="flex items-start gap-4 relative">
                    {/* Dot on the timeline line */}
                    <div className={`flex-shrink-0 rounded-full mt-0.5 ring-2 ring-white ${dotSize} ${dotColor}`} />

                    {/* Event content */}
                    <div className="pb-1">
                      <p className={`text-sm ${isLatest ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {event.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(event.timestamp)}
                        <span className="mx-1.5">·</span>
                        {event.location}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const ShipmentsPage: React.FC = () => {
  // expandedId: which shipment row is currently expanded.
  // null means all rows are collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // statusFilter: '' means show all statuses
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');

  function toggleRow(id: string) {
    // If the clicked row is already open, close it.
    // Otherwise, open it (and close any other open row).
    setExpandedId(prev => prev === id ? null : id);
  }

  const filteredShipments = useMemo(() => {
    if (!statusFilter) return dummyShipments;
    return dummyShipments.filter(s => s.status === statusFilter);
  }, [statusFilter]);

  // Count per status for the summary tiles at the top
  const counts = useMemo(() => ({
    in_transit:       dummyShipments.filter(s => s.status === 'in_transit').length,
    out_for_delivery: dummyShipments.filter(s => s.status === 'out_for_delivery').length,
    delivered:        dummyShipments.filter(s => s.status === 'delivered').length,
    exception:        dummyShipments.filter(s => s.status === 'exception').length,
  }), []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-800">Shipments</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Active and recent shipments · {dummyShipments.length} total
        </p>
      </div>

      {/* ====================================================
          STATUS SUMMARY TILES
          Clickable — clicking a tile filters the table to that status.
          Clicking the active tile clears the filter.
      ==================================================== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-3">
          {(Object.entries(statusConfig) as [ShipmentStatus, typeof statusConfig[ShipmentStatus]][]).map(
            ([key, cfg]) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(isActive ? '' : key)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                    border transition-colors duration-100
                    ${isActive
                      ? `${cfg.badge} border-current`
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="font-medium">{cfg.label}</span>
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? 'bg-white/60' : 'bg-gray-200'}`}>
                    {counts[key]}
                  </span>
                </button>
              );
            }
          )}
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          SHIPMENTS TABLE
      ==================================================== */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <table className="w-full text-sm border-collapse">

          <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Carrier</th>
              <th className="px-4 py-3 font-medium">Tracking #</th>
              <th className="px-4 py-3 font-medium">Ship Date</th>
              <th className="px-4 py-3 font-medium">Est. Delivery</th>
              <th className="px-4 py-3 font-medium">Last Scan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {/* The chevron column — no label, just holds the expand icon */}
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>

          <tbody>
            {filteredShipments.map(shipment => {
              const isExpanded = expandedId === shipment.id;
              const cfg        = statusConfig[shipment.status];
              const ccfg       = carrierConfig[shipment.carrier];
              // latest event is always events[0] thanks to newest-first ordering
              const lastEvent  = shipment.events[0];

              return (
                // React.Fragment lets us return two <tr> elements for one map item
                // without a wrapper div (which would break table structure).
                // The key goes on the Fragment, not the individual rows.
                <React.Fragment key={shipment.id}>

                  {/* ---- MAIN ROW ---- */}
                  <tr
                    onClick={() => toggleRow(shipment.id)}
                    className={`
                      border-b border-gray-100 cursor-pointer transition-colors duration-100
                      ${isExpanded ? 'bg-white border-l-2 border-l-yellow-400' : 'bg-white hover:bg-gray-50'}
                      ${shipment.status === 'exception' && !isExpanded ? 'border-l-2 border-l-red-400' : ''}
                    `}
                  >
                    <td className="px-6 py-3 font-mono font-medium text-gray-800">
                      {shipment.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{shipment.customerName}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">
                        {shipment.shippingAddress}
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-semibold text-xs ${ccfg.color}`}>
                      {shipment.carrier}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {shipment.trackingNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(shipment.shipDate)}
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium ${
                      shipment.status !== 'delivered' && isDeliveryDue(shipment.estimatedDelivery)
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}>
                      {formatDate(shipment.estimatedDelivery)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-700 max-w-[200px]">
                        {lastEvent.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(lastEvent.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </td>
                    {/* Chevron icon — rotates 90° when expanded.
                        CSS transition on "transform" makes it animate smoothly. */}
                    <td className="px-4 py-3 text-gray-400">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        viewBox="0 0 20 20" fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>

                  {/* ---- EXPANDED DETAIL ROW ----
                      colSpan={9} makes this single cell stretch across all 9 columns.
                      This is how you put full-width content inside a table without
                      breaking the column alignment above it.
                      We only render this row when isExpanded is true — no point keeping
                      it in the DOM when it's hidden. */}
                  {isExpanded && (
                    <tr className="border-b border-gray-200">
                      <td colSpan={9} className="p-0">
                        <TrackingTimeline shipment={shipment} />
                      </td>
                    </tr>
                  )}

                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShipmentsPage;
