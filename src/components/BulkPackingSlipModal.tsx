// ============================================================
// BulkPackingSlipModal.tsx — Print Multiple Packing Slips
// ============================================================
// When the user selects 2+ orders in the Orders page and clicks
// "Print Packing Lists", this modal renders all selected orders'
// packing slips stacked in a preview. Clicking Print sends them
// to the printer one slip per page.
//
// How multi-page printing works:
//   The CSS property "page-break-after: always" (or the modern
//   equivalent "break-after: page") tells the browser: "start a
//   new printed page after this element." We wrap each PackingSlip
//   in a div with that rule, so each order lands on its own sheet.
//
//   The print CSS targets "#bulk-packing-slips" — a wrapper id
//   unique to this component — to isolate it from the rest of the
//   page, the same visibility trick used in PackingSlipModal.

import React, { useEffect } from 'react';
import { Order } from '../types/index.ts';
import PackingSlip from './PackingSlip.tsx';

interface BulkPackingSlipModalProps {
  orders: Order[];    // the selected orders to print
  onClose: () => void;
}

// The print CSS — same isolation technique as PackingSlipModal,
// but targeting the bulk wrapper instead of a single slip.
// "break-after: page" is the modern standard; "page-break-after"
// is the legacy version. We include both for browser compatibility.
function buildPrintStyles(): string {
  return `
    @media print {
      @page {
        size: letter;
        margin: 0.6in 0.75in;
      }

      body * {
        visibility: hidden !important;
      }

      #bulk-packing-slips,
      #bulk-packing-slips * {
        visibility: visible !important;
      }

      #bulk-packing-slips {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
      }

      /* Each slip wrapper gets a page break after it */
      .bulk-slip-page {
        break-after: page;
        page-break-after: always;
      }

      /* Except the last one — no blank page at the end */
      .bulk-slip-page:last-child {
        break-after: avoid;
        page-break-after: avoid;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}

const BulkPackingSlipModal: React.FC<BulkPackingSlipModalProps> = ({ orders, onClose }) => {
  const isOpen = orders.length > 0;

  // Inject print styles while the modal is open; remove on close.
  // Same pattern as PackingSlipModal — scoped so Ctrl+P elsewhere
  // on the dashboard doesn't produce a blank page.
  useEffect(() => {
    if (!isOpen) return;
    const tag = document.createElement('style');
    tag.id = 'bulk-print-styles';
    tag.innerHTML = buildPrintStyles();
    document.head.appendChild(tag);
    return () => {
      document.getElementById('bulk-print-styles')?.remove();
    };
  }, [isOpen]);

  // Escape key closes the modal
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // z-[60] — above the order drawer (z-50) and its backdrop (z-40)
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: 'rgba(15,23,42,0.75)' }}>

      {/* ---- TOP BAR (hidden when printing) ---- */}
      <div className="print:hidden flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Bulk Packing Slip Preview</span>
          <span className="text-gray-300">·</span>
          {/* Pill showing how many slips are queued */}
          <span className="px-2.5 py-0.5 bg-slate-900 text-white text-xs font-semibold rounded-full">
            {orders.length} {orders.length === 1 ? 'slip' : 'slips'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print All {orders.length} Slips
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* ---- SCROLLABLE PREVIEW ---- */}
      <div className="flex-1 overflow-y-auto py-8 flex flex-col items-center gap-8" style={{ backgroundColor: '#e2e8f0' }}>

        {/* This is the element the print CSS isolates.
            It contains all the slips stacked for the preview view,
            and each .bulk-slip-page wrapper triggers a page break in print. */}
        <div id="bulk-packing-slips">
          {orders.map((order, index) => (
            <div key={order.id} className="bulk-slip-page">
              {/* In preview mode, add a divider label between slips */}
              <div className="print:hidden flex items-center gap-3 mb-4 px-2">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500 font-medium">
                  Slip {index + 1} of {orders.length} — {order.orderNumber}
                </span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
              <div className="shadow-2xl rounded-sm">
                <PackingSlip order={order} />
              </div>
              {/* Spacer between slips in the preview — hidden when printing */}
              {index < orders.length - 1 && (
                <div className="print:hidden h-8" />
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default BulkPackingSlipModal;
