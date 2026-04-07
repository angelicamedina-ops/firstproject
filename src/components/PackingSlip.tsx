// ============================================================
// PackingSlip.tsx — Printable Packing Slip Document
// ============================================================
// This component renders the physical packing slip layout —
// no modal, no buttons, just the document itself.
//
// Keeping the layout separate from the modal wrapper means this
// component could be reused later: rendered to PDF on the server,
// attached to an email, or embedded in a different UI.
//
// The id="packing-slip-printable" on the outer div is the anchor
// that the PackingSlipModal's print CSS uses to isolate this element
// when the user hits Print.

import React from 'react';
// react-barcode renders a CODE128 barcode as an inline SVG.
// CODE128 supports letters, numbers, and dashes — perfect for "AGB-10041".
import Barcode from 'react-barcode';
import { Order } from '../types/index.ts';

// ============================================================
// HELPERS
// ============================================================

// Format date for the order details block (e.g. "Mar 25, 2026")
function formatSlipDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// ---- Company Logo (top right) ----
// We don't have the actual image file, so we build a styled text
// treatment in the brand colors — bold black "ANTIGRAVITY" over
// red "BATTERIES", mimicking the look of the real logo.
function CompanyLogo() {
  return (
    <div className="text-right leading-none">
      <div
        className="font-black uppercase tracking-tight text-gray-900"
        style={{ fontSize: '22px', letterSpacing: '-0.5px' }}
      >
        Antigravity
      </div>
      <div
        className="font-black uppercase tracking-widest text-red-600"
        style={{ fontSize: '14px', letterSpacing: '3px' }}
      >
        Batteries
      </div>
      <div className="text-xs text-gray-400 font-medium mt-0.5 tracking-wide">
        LLC
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface PackingSlipProps {
  order: Order;
}

const PackingSlip: React.FC<PackingSlipProps> = ({ order }) => {
  return (
    // The id is what the print CSS in PackingSlipModal targets to isolate
    // this element on the page when printing. Everything else gets hidden.
    //
    // w-[680px]: This matches approximately the printable width of 8.5" paper
    // at 96dpi with 0.75" margins (8.5 - 1.5 = 7" × 96 = 672px, rounded up).
    // In the modal preview it looks like a real document; in print it fills the page.
    <div
      id="packing-slip-printable"
      className="w-[680px] bg-white text-gray-900"
      style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
    >

      {/* ====================================================
          HEADER: Company info left | Logo right
          Then the dark "PACKING SLIP" bar below
      ==================================================== */}
      <div className="px-8 pt-7 pb-4">
        <div className="flex items-start justify-between">

          {/* Left: company name + address */}
          <div>
            <p className="font-black text-gray-900 uppercase tracking-wide" style={{ fontSize: '13px' }}>
              Antigravity Batteries LLC
            </p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">
              15622 Broadway Center St<br />
              Gardena, CA 90248<br />
              (310) 538-3600
            </p>
          </div>

          {/* Right: styled logo */}
          <CompanyLogo />
        </div>
      </div>

      {/* Dark header bar — "PACKING SLIP" */}
      {/* We use inline style here for the background because Tailwind's bg-gray-800
          sometimes gets stripped by print media — inline style is more reliable. */}
      <div
        className="px-8 py-2 text-center"
        style={{ backgroundColor: '#1e293b' }}   // slate-800
      >
        <span
          className="text-white font-black uppercase tracking-[0.25em]"
          style={{ fontSize: '13px' }}
        >
          Packing Slip
        </span>
      </div>

      {/* ====================================================
          SHIP TO + ORDER DETAILS (two-column row)
      ==================================================== */}
      <div className="px-8 pt-5 pb-4 flex gap-6">

        {/* Left: Ship To block */}
        <div className="flex-1">
          <p
            className="font-bold uppercase tracking-wider text-gray-500 mb-1.5"
            style={{ fontSize: '9px' }}
          >
            Ship To
          </p>
          <p className="font-bold text-gray-900" style={{ fontSize: '13px' }}>
            {order.customerName}
          </p>
          <p className="text-xs text-gray-700 mt-0.5 leading-snug whitespace-pre-line">
            {order.shippingAddress}
          </p>
          {order.customerPhone && (
            <p className="text-xs text-gray-600 mt-0.5">{order.customerPhone}</p>
          )}
        </div>

        {/* Right: key/value order details block */}
        {/* We use a table here — not for layout, but because a table is the
            semantically correct way to represent labeled pairs of data.
            (This is one of the valid uses of HTML tables!) */}
        <div className="flex-shrink-0" style={{ minWidth: '220px' }}>
          <table className="w-full text-xs">
            <tbody>
              {[
                { label: 'Order #',   value: order.orderNumber },
                { label: 'Date',      value: formatSlipDate(order.createdAt) },
                { label: 'User',      value: order.customerEmail },
                {
                  label: 'Ship Date',
                  value: order.status === 'shipped' || order.status === 'delivered'
                    ? formatSlipDate(order.createdAt)
                    : '—',
                },
              ].map(({ label, value }) => (
                <tr key={label} className="border-b border-gray-100">
                  <td
                    className="py-1 pr-3 font-semibold text-gray-500 uppercase whitespace-nowrap"
                    style={{ fontSize: '9px', letterSpacing: '0.05em' }}
                  >
                    {label}
                  </td>
                  <td className="py-1 text-gray-900 font-medium" style={{ fontSize: '11px' }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================
          LINE ITEMS TABLE
          Dark olive/green header matching ShipStation style.
          No pricing shown — packing slips don't show prices.
      ==================================================== */}
      <div className="px-8 pb-4">
        <table className="w-full border-collapse" style={{ fontSize: '12px' }}>

          {/* Olive green header — same color family as ShipStation's default theme */}
          <thead>
            <tr style={{ backgroundColor: '#4a5e2a' }}>
              <th
                className="text-left py-2 px-3 font-bold uppercase text-white"
                style={{ fontSize: '9px', letterSpacing: '0.1em', width: '30%' }}
              >
                Item
              </th>
              <th
                className="text-left py-2 px-3 font-bold uppercase text-white"
                style={{ fontSize: '9px', letterSpacing: '0.1em' }}
              >
                Description
              </th>
              <th
                className="text-center py-2 px-3 font-bold uppercase text-white"
                style={{ fontSize: '9px', letterSpacing: '0.1em', width: '60px' }}
              >
                Qty
              </th>
            </tr>
          </thead>

          <tbody>
            {order.items.map((item, index) => (
              // Alternating row colors — index % 2 === 0 means even row (0, 2, 4...)
              // This improves readability for multi-item orders
              <tr
                key={item.sku}
                style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}
                className="border-b border-gray-200"
              >
                <td className="py-2 px-3 font-mono text-gray-700" style={{ fontSize: '11px' }}>
                  {item.sku}
                </td>
                <td className="py-2 px-3 text-gray-900">{item.name}</td>
                <td className="py-2 px-3 text-center font-bold text-gray-900">{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ====================================================
          FOOTER: Thank-you message + barcode
      ==================================================== */}
      <div className="px-8 pt-2 pb-8 flex flex-col items-center gap-4 border-t border-gray-200">

        <p className="text-sm text-gray-600 text-center mt-3" style={{ fontStyle: 'italic' }}>
          Thank you for choosing Antigravity Batteries!
        </p>

        {/* Barcode — react-barcode renders a CODE128 SVG.
            We pass the order number as the value.
            width: bar width in px (1.5 is thin but scannable)
            height: bar height in px
            displayValue: show the human-readable number below the bars */}
        <div className="flex flex-col items-center">
          <Barcode
            value={order.orderNumber}
            format="CODE128"
            width={1.8}
            height={48}
            displayValue={true}
            fontSize={11}
            margin={0}
            background="#ffffff"
            lineColor="#1e293b"
          />
        </div>
      </div>

    </div>
  );
};

export default PackingSlip;
