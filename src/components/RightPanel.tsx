// ============================================================
// RightPanel.tsx — Right Sidebar
// ============================================================
// The right sidebar has three stacked sections:
//   1. PDF Drop Zone — for dragging in PDF purchase orders
//   2. Alerts Panel — issues and notifications
//   3. Channel Breakdown — per-platform order count + revenue

import React, { useState } from 'react';
import { Alert } from '../types/index.ts';
import { dummyAlerts, channelStats } from '../data/dummyData.ts';

// --------------------
// Section 1: PDF Drop Zone
// --------------------
// This mimics the look of a drag-and-drop file upload area.
// The actual file handling will be wired up in a later phase.
function PdfDropZone() {
  // isDragOver tracks whether a file is currently being dragged over the zone.
  // We use this to change the visual style (the dashed border turns solid blue).
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Email PO / PDF Intake
      </h3>
      <div
        // These events fire when a dragged file enters, leaves, or is dropped on the zone.
        // "preventDefault()" stops the browser's default behavior (opening the file).
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); /* handle later */ }}
        className={`
          border-2 border-dashed rounded-lg p-5 text-center cursor-pointer
          transition-colors duration-150
          ${isDragOver
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-white'
          }
        `}
      >
        <div className="text-2xl mb-2">📄</div>
        <p className="text-sm text-gray-500 font-medium">Drop PDF or email PO here</p>
        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
      </div>
    </div>
  );
}

// --------------------
// Section 2: Alerts Panel
// --------------------
// Color configuration for each alert type.
// "Record<K, V>" is a TypeScript type that means "an object with keys of type K and values of type V".
const alertStyle: Record<Alert['type'], { dot: string; border: string }> = {
  error:   { dot: 'bg-red-500',    border: 'border-l-red-400' },
  warning: { dot: 'bg-amber-400',  border: 'border-l-amber-400' },
  info:    { dot: 'bg-blue-400',   border: 'border-l-blue-400' },
};

function AlertsPanel() {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Alerts
        </h3>
        {/* Show a red count badge if there are errors */}
        {dummyAlerts.filter(a => a.type === 'error').length > 0 && (
          <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">
            {dummyAlerts.filter(a => a.type === 'error').length}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {dummyAlerts.map((alert) => {
          const style = alertStyle[alert.type];
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-lg border border-gray-200 border-l-4 ${style.border} px-3 py-2.5`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${style.dot}`} />
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------
// Section 3: Channel Breakdown
// --------------------
function ChannelBreakdown() {
  // Find the highest order count so we can draw a relative progress bar.
  const maxOrders = Math.max(...channelStats.map(c => c.orderCount));

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Channel Breakdown — Today
      </h3>
      <div className="space-y-3">
        {channelStats.map((stat) => (
          <div key={stat.channel}>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                {/* Colored dot matches the channel's brand color */}
                <div className={`w-2.5 h-2.5 rounded-full ${stat.colorClass}`} />
                <span className="font-medium text-gray-700">{stat.channel}</span>
              </div>
              <div className="text-gray-500 text-right">
                <span className="font-semibold text-gray-800">{stat.orderCount} orders</span>
                <span className="ml-2 text-gray-400">
                  ${stat.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            {/* Progress bar: width is proportional to order count vs. the highest channel */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${stat.colorClass} opacity-70`}
                style={{ width: `${(stat.orderCount / maxOrders) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------------
// MAIN COMPONENT
// --------------------
const RightPanel: React.FC = () => {
  return (
    // The right panel is a fixed-width column that scrolls independently.
    <aside className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-4 flex flex-col gap-2">
      <PdfDropZone />
      <hr className="border-gray-100" />
      <AlertsPanel />
      <hr className="border-gray-100" />
      <ChannelBreakdown />
    </aside>
  );
};

export default RightPanel;
