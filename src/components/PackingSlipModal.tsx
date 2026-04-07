// ============================================================
// PackingSlipModal.tsx — Packing Slip Preview Modal
// ============================================================
// Wraps PackingSlip in a full-screen preview overlay.
// When the user clicks Print, window.print() fires and a
// <style> tag we inject makes ONLY the slip visible on the
// printed page — all the modal chrome disappears.
//
// Key concepts:
//   useEffect:  inject/remove the print <style> tag when modal opens/closes
//   print CSS:  "visibility: hidden everything, then unhide just the slip"
//   print-color-adjust: exact  — forces browsers to print background colors

import React, { useEffect } from 'react';
import { Order } from '../types/index.ts';
import PackingSlip from './PackingSlip.tsx';

interface PackingSlipModalProps {
  order: Order | null;   // null = modal is closed
  onClose: () => void;
}

// ============================================================
// THE PRINT CSS TRICK — explained
// ============================================================
// By default, when you call window.print(), the browser prints
// the ENTIRE page — modal backdrop, order feed, sidebar, everything.
//
// The trick: inject a <style> tag that:
//   1. Hides EVERY element on the page (visibility: hidden)
//   2. Then UN-hides the specific element we want (visibility: visible)
//
// Why "visibility: hidden" instead of "display: none"?
// "display: none" removes elements from layout flow entirely, which can
// cause the visible element to jump around. "visibility: hidden" keeps
// the layout intact — things are invisible but still occupy space.
//
// We also need -webkit-print-color-adjust: exact (and the standard
// print-color-adjust: exact) to tell the browser: "preserve background
// colors and images when printing." Without this, the olive green table
// header would print as a plain white rectangle.
const PRINT_STYLES = `
  @media print {
    @page {
      size: letter;
      margin: 0.6in 0.75in;
    }

    /* Step 1: hide everything */
    body * {
      visibility: hidden !important;
    }

    /* Step 2: unhide the slip and all its children */
    #packing-slip-printable,
    #packing-slip-printable * {
      visibility: visible !important;
    }

    /* Step 3: position the slip at the top-left of the printed page */
    #packing-slip-printable {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      box-shadow: none !important;
    }

    /* Step 4: force background colors to print (browsers suppress them by default) */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

const PackingSlipModal: React.FC<PackingSlipModalProps> = ({ order, onClose }) => {
  const isOpen = order !== null;

  // ----------------------------------------------------------
  // useEffect: inject the print <style> tag while modal is open
  // ----------------------------------------------------------
  // We create a <style> element, add it to <head>, and then
  // REMOVE it when the modal closes. This keeps the print CSS
  // scoped to when the modal is actually visible.
  //
  // If we left the print CSS on the page all the time, hitting
  // Ctrl+P anywhere on the dashboard would produce a blank page.
  useEffect(() => {
    if (!isOpen) return;

    const styleTag = document.createElement('style');
    styleTag.setAttribute('id', 'packing-slip-print-styles');
    styleTag.innerHTML = PRINT_STYLES;
    document.head.appendChild(styleTag);

    // Cleanup: remove the style tag when the modal closes.
    // This is the same cleanup pattern we used for the Escape key listener.
    return () => {
      const existing = document.getElementById('packing-slip-print-styles');
      if (existing) existing.remove();
    };
  }, [isOpen]);

  // Escape key closes the modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  // We return null entirely when closed — unlike the drawer (which stays mounted
  // for the slide animation), the modal doesn't need an animation so there's no
  // reason to keep it in the DOM when it's not showing.

  return (
    // z-[60] sits above the order drawer (z-50) and its backdrop (z-40)
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: 'rgba(15,23,42,0.7)' }}>

      {/* ====================================================
          TOP BAR — "print:hidden" hides this row when printing.
          Tailwind's "print:" prefix applies styles only in
          @media print — so "print:hidden" = "display:none when printing"
      ==================================================== */}
      <div className="print:hidden flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">

        <div className="flex items-center gap-3">
          {/* Breadcrumb */}
          <span className="text-sm text-gray-500">Packing Slip Preview</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-semibold text-gray-800 font-mono">
            {order.orderNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Print button — calls window.print() which triggers the browser's
              native print dialog. Our injected CSS does the rest. */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>

          {/* Close button */}
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

      {/* ====================================================
          SCROLLABLE PREVIEW AREA
          The slip is centered in a gray "desk" background,
          just like how a PDF viewer shows a white page.
          This area scrolls if the slip is taller than the screen.
      ==================================================== */}
      <div className="flex-1 overflow-y-auto py-8 flex justify-center" style={{ backgroundColor: '#e2e8f0' }}>
        {/* White "paper" shadow — makes it look like a document floating on a desk */}
        <div className="shadow-2xl rounded-sm">
          <PackingSlip order={order} />
        </div>
      </div>

    </div>
  );
};

export default PackingSlipModal;
