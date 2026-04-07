// ============================================================
// OrderDrawer.tsx — Sliding Order Detail Panel
// ============================================================
// When a row is clicked in the OrderFeed, this drawer slides
// in from the right side of the screen showing full order details.
//
// Key concepts used here:
//   - Props:     data passed down from a parent component
//   - useEffect: run code in response to something changing
//   - Conditional rendering: show/hide sections based on data
//   - CSS transitions: the slide animation is pure Tailwind
//   - Lifting state up: onUpdateOrder lets the drawer ask its
//     parent to persist a change, keeping data flow one-directional

import React, { useEffect, useState, useRef } from 'react';
import { Order, OrderStatus, Channel, OrderItem } from '../types/index.ts';
import PackingSlipModal from './PackingSlipModal.tsx';

// ============================================================
// PROPS INTERFACE
// ============================================================
interface OrderDrawerProps {
  order: Order | null;
  onClose: () => void;
  // The drawer itself doesn't own order data — it asks the parent
  // to update it via this callback. The parent (OrderFeed / OrdersPage)
  // holds the orders in useState and swaps in the updated object.
  onUpdateOrder: (updated: Order) => void;
}

// ============================================================
// HELPER CONSTANTS
// ============================================================
const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  new:        { label: 'New',        bg: 'bg-blue-100',   text: 'text-blue-700'   },
  processing: { label: 'Processing', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  shipped:    { label: 'Shipped',    bg: 'bg-green-100',  text: 'text-green-700'  },
  delivered:  { label: 'Delivered',  bg: 'bg-slate-100',  text: 'text-slate-600'  },
  issue:      { label: '⚠ Issue',   bg: 'bg-red-100',    text: 'text-red-700'    },
  cancelled:  { label: 'Cancelled',  bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

const channelConfig: Record<Channel, string> = {
  WooCommerce:   'bg-purple-100 text-purple-700',
  Walmart:       'bg-blue-100   text-blue-700',
  'TikTok Shop': 'bg-pink-100   text-pink-700',
  Newegg:        'bg-orange-100 text-orange-700',
  Direct:        'bg-gray-100   text-gray-700',
};

const invoiceConfig = {
  pending: { label: 'Pending',  className: 'bg-amber-100  text-amber-700'  },
  sent:    { label: 'Sent',     className: 'bg-blue-100   text-blue-700'   },
  paid:    { label: 'Paid',     className: 'bg-green-100  text-green-700'  },
  overdue: { label: 'Overdue',  className: 'bg-red-100    text-red-700 font-semibold' },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatUSD(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hasHazmat(items: OrderItem[]): boolean {
  return items.some(item => item.sku.startsWith('LFP-'));
}

function getMapViolations(items: OrderItem[]): OrderItem[] {
  return items.filter(item => item.msrp !== undefined && item.unitPrice < item.msrp);
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-gray-100">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function HazmatWarning() {
  return (
    <div className="mx-6 mt-4 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
      <span className="text-xl leading-none mt-0.5">🔋</span>
      <div>
        <p className="text-sm font-semibold text-orange-800">Hazmat — Lithium Battery Shipment</p>
        <p className="text-xs text-orange-700 mt-0.5">
          This order contains LiFePO4 batteries. Shipping label must include UN3480 / UN3481
          hazmat markings. Verify carrier compliance before creating label in ShipStation.
        </p>
      </div>
    </div>
  );
}

function MapViolationWarning({ violations }: { violations: OrderItem[] }) {
  return (
    <div className="mx-6 mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <span className="text-xl leading-none mt-0.5">⚠️</span>
      <div>
        <p className="text-sm font-semibold text-red-800">MAP Policy Violation</p>
        <p className="text-xs text-red-700 mt-0.5">
          {violations.length === 1 ? '1 item was' : `${violations.length} items were`} sold below
          Minimum Advertised Price:
        </p>
        <ul className="mt-1.5 space-y-0.5">
          {violations.map(item => (
            <li key={item.sku} className="text-xs text-red-700">
              <span className="font-mono font-medium">{item.sku}</span>
              {' '}— sold {formatUSD(item.unitPrice)}, MSRP {formatUSD(item.msrp!)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- Action Button ----
type ButtonVariant = 'primary' | 'secondary' | 'danger';

function ActionButton({
  label, icon, variant = 'secondary', onClick, disabled,
}: {
  label: string;
  icon: string;
  variant?: ButtonVariant;
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:   'bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-semibold',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger:    'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors duration-100
        ${styles[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <span className="leading-none">{icon}</span>
      {label}
    </button>
  );
}

// ---- Toast notification ----
// A small banner that slides in at the top of the drawer body
// and disappears automatically after 3 seconds.
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2
      ${type === 'success'
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </div>
  );
}

// ============================================================
// REFUND MODAL
// ============================================================
// A separate modal that floats above the drawer (z-[60]).
// It's self-contained: owns its own form state internally and
// calls onSuccess / onClose when done.
//
// Props:
//   order     — the order being refunded (null = modal is closed)
//   onSuccess — called with a confirmation message after the refund
//   onClose   — called when the user cancels or the modal closes

const REFUND_REASONS = [
  '',
  'Damaged in transit',
  'Wrong item shipped',
  'Customer changed mind',
  'MAP dispute / pricing error',
  'Duplicate order',
  'Other',
] as const;

interface RefundModalProps {
  order: Order | null;
  onSuccess: (message: string) => void;
  onClose: () => void;
}

function RefundModal({ order, onSuccess, onClose }: RefundModalProps) {
  const isOpen = order !== null;

  // ---- Form state ----
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');

  // Reset form whenever the modal opens for a new order.
  useEffect(() => {
    if (order) {
      setRefundType('full');
      setPartialAmount('');
      setReason('');
    }
  }, [order]);

  // The Confirm button is disabled until a reason is selected.
  // For partial refunds, the amount must also be a valid positive number.
  const amount = parseFloat(partialAmount);
  const isValid =
    reason !== '' &&
    (refundType === 'full' || (partialAmount !== '' && !isNaN(amount) && amount > 0 && order ? amount <= order.total : false));

  function handleConfirm() {
    if (!order) return;
    // Generate a fake reference number — in production this would come from the payment gateway.
    const ref = 'REF-' + Math.random().toString(36).toUpperCase().slice(2, 8);
    const displayAmount = refundType === 'full'
      ? formatUSD(order.total)
      : formatUSD(amount);
    onSuccess(`Refund of ${displayAmount} submitted. Reference: ${ref}`);
    onClose();
  }

  return (
    <>
      {/* Backdrop — higher z than the drawer backdrop (z-40) and drawer (z-50) */}
      <div
        className={`fixed inset-0 bg-black/50 z-[55] transition-opacity duration-200
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Modal card — centered on screen */}
      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4
        pointer-events-none`}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md
          pointer-events-auto transition-all duration-200
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Process Refund</h2>
                {order && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Order {order.orderNumber} · Total {formatUSD(order.total)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none mt-0.5"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">

            {/* Refund type — radio buttons */}
            {/* Radio buttons work by sharing the same "name" attribute.
                Only one in the group can be checked at a time. */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Refund Type</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    value="full"
                    checked={refundType === 'full'}
                    onChange={() => setRefundType('full')}
                    className="text-yellow-400 focus:ring-yellow-400"
                  />
                  <span className="text-sm text-gray-700">
                    Full refund {order && `(${formatUSD(order.total)})`}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    value="partial"
                    checked={refundType === 'partial'}
                    onChange={() => setRefundType('partial')}
                    className="text-yellow-400 focus:ring-yellow-400"
                  />
                  <span className="text-sm text-gray-700">Partial refund</span>
                </label>
              </div>
            </div>

            {/* Partial amount — only shown when Partial is selected */}
            {refundType === 'partial' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Refund Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    max={order?.total}
                    step="0.01"
                    value={partialAmount}
                    onChange={e => setPartialAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                {order && partialAmount && amount > order.total && (
                  <p className="text-xs text-red-600 mt-1">
                    Amount cannot exceed the order total ({formatUSD(order.total)}).
                  </p>
                )}
              </div>
            )}

            {/* Reason dropdown — required */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {REFUND_REASONS.map(r => (
                  <option key={r} value={r}>{r === '' ? 'Select a reason…' : r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg
                hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Refund
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700
                rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const OrderDrawer: React.FC<OrderDrawerProps> = ({ order, onClose, onUpdateOrder }) => {

  // ---- Escape key closes the drawer ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (order !== null) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [order, onClose]);

  // ---- Packing slip modal ----
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  useEffect(() => {
    if (order === null) setShowPackingSlip(false);
  }, [order]);

  // ---- Toast state ----
  // null = no toast showing. Set to an object to display it.
  // The useEffect below auto-clears it after 3 seconds.
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    // Clear any existing timer before starting a new one,
    // so rapid clicks don't cause the toast to disappear prematurely.
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  // Clear toast and timer when the drawer closes (order → null).
  useEffect(() => {
    if (order === null) {
      setToast(null);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }
  }, [order]);

  // ---- Cancel confirmation ----
  // Instead of cancelling immediately, we show an inline dialog first.
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Reset the confirm dialog whenever a different order opens.
  useEffect(() => { setShowCancelConfirm(false); }, [order]);

  // ---- Add Note UI ----
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  // ---- Refund modal ----
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Reset note state when the drawer closes or a different order opens.
  useEffect(() => {
    setShowAddNote(false);
    setNoteText('');
  }, [order]);

  // ---- Derived data ----
  const isOpen        = order !== null;
  const mapViolations = order ? getMapViolations(order.items) : [];
  const showHazmat    = order ? hasHazmat(order.items) : false;
  const showMapFlag   = mapViolations.length > 0;

  // ============================================================
  // ACTION HANDLERS
  // Each handler builds an updated Order object and passes it to
  // onUpdateOrder, which lives in the parent and updates its state.
  // ============================================================

  function handleConfirm() {
    if (!order) return;
    onUpdateOrder({ ...order, status: 'processing' });
    showToast(`Order ${order.orderNumber} confirmed and moved to Processing.`);
  }

  function handleCancelConfirmed() {
    if (!order) return;
    onUpdateOrder({
      ...order,
      status: 'cancelled',
      notes: [...(order.notes ?? []), `Order cancelled on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`],
    });
    setShowCancelConfirm(false);
    showToast(`Order ${order.orderNumber} has been cancelled.`, 'error');
  }

  function handleSaveNote() {
    if (!order || !noteText.trim()) return;
    const timestamp = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    onUpdateOrder({
      ...order,
      notes: [...(order.notes ?? []), `[${timestamp}] ${noteText.trim()}`],
    });
    setNoteText('');
    setShowAddNote(false);
    showToast('Note saved.');
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* ---- Backdrop ---- */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/40 z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
      />

      {/* ---- Drawer panel ---- */}
      <div
        className={`
          fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={order ? `Order ${order.orderNumber} details` : 'Order details'}
      >
        {order && (
          <>
            {/* ================================================
                HEADER
            ================================================ */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-lg font-bold text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${channelConfig[order.channel]}`}>
                      {order.channel}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${statusConfig[order.status].bg} ${statusConfig[order.status].text}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatFullDate(order.createdAt)}</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors duration-100"
                  aria-label="Close drawer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ================================================
                SCROLLABLE BODY
            ================================================ */}
            <div className="flex-1 overflow-y-auto">

              {/* ---- Toast notification ---- */}
              {toast && <Toast message={toast.message} type={toast.type} />}

              {/* ---- Warning blocks ---- */}
              {(showHazmat || showMapFlag) && (
                <div className="pb-4">
                  {showHazmat  && <HazmatWarning />}
                  {showMapFlag && <MapViolationWarning violations={mapViolations} />}
                </div>
              )}

              {/* ---- CUSTOMER ---- */}
              <Section title="Customer">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerEmail}</p>
                  {order.customerPhone && (
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  )}
                  <p className="text-sm text-gray-500 pt-1">{order.shippingAddress}</p>
                </div>
              </Section>

              {/* ---- LINE ITEMS ---- */}
              <Section title="Line Items">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left pb-2 font-medium">SKU / Product</th>
                      <th className="text-center pb-2 font-medium">Qty</th>
                      <th className="text-right pb-2 font-medium">Unit</th>
                      <th className="text-right pb-2 font-medium">Ext.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item) => {
                      const ext = item.qty * item.unitPrice;
                      const isBelowMap = item.msrp !== undefined && item.unitPrice < item.msrp;
                      return (
                        <tr key={item.sku}>
                          <td className="py-2 pr-2">
                            <div className="font-mono text-xs text-gray-500">{item.sku}</div>
                            <div className="text-gray-800">{item.name}</div>
                            {isBelowMap && (
                              <span className="text-xs text-red-600 font-medium">
                                ⚠ Below MAP ({formatUSD(item.msrp!)})
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-center text-gray-700">{item.qty}</td>
                          <td className="py-2 text-right text-gray-700">{formatUSD(item.unitPrice)}</td>
                          <td className="py-2 text-right font-medium text-gray-900">{formatUSD(ext)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={3} className="pt-2 text-sm font-semibold text-gray-600 text-right pr-2">
                        Order Total
                      </td>
                      <td className="pt-2 text-right text-base font-bold text-gray-900">
                        {formatUSD(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </Section>

              {/* ---- INVOICE STATUS ---- */}
              <Section title="Invoice">
                {order.invoiceStatus ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${invoiceConfig[order.invoiceStatus].className}`}>
                      {invoiceConfig[order.invoiceStatus].label}
                    </span>
                    {order.invoiceStatus === 'overdue' && (
                      <span className="text-xs text-red-600">— requires immediate follow-up</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No invoice on file</p>
                )}
              </Section>

              {/* ---- SHIPMENT / TRACKING ---- */}
              {order.trackingNumber && (
                <Section title="Shipment">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Tracking Number</p>
                      <p className="font-mono text-sm text-gray-800 break-all">
                        {order.trackingNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}
                      className="flex-shrink-0 px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </Section>
              )}

              {/* ---- NOTES ---- */}
              {/* This section always shows when there are notes, OR when
                  the Add Note input is open. The notes list grows as notes are added. */}
              {((order.notes && order.notes.length > 0) || showAddNote) && (
                <Section title="Notes">
                  {order.notes && order.notes.length > 0 && (
                    <ul className="space-y-2 mb-3">
                      {order.notes.map((note, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 text-gray-300 flex-shrink-0">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* ---- Add Note input — only visible when showAddNote is true ---- */}
                  {/* This is "inline expansion" — no modal, no page change. The button
                      in the footer flips showAddNote to true, expanding this section. */}
                  {showAddNote && (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Type your note here..."
                        autoFocus
                        rows={3}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2
                          focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNote}
                          disabled={!noteText.trim()}
                          className="px-3 py-1.5 text-sm font-semibold bg-yellow-400 text-slate-900
                            rounded-lg hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed
                            transition-colors"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => { setShowAddNote(false); setNoteText(''); }}
                          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* ---- CANCEL CONFIRMATION DIALOG ---- */}
              {/* Shown inline (not a separate modal) when the user clicks Cancel Order.
                  It asks them to confirm before we actually change the status. */}
              {showCancelConfirm && (
                <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Cancel order {order.orderNumber}?
                  </p>
                  <p className="text-xs text-red-700 mb-3">
                    This will mark the order as Cancelled and cannot be undone from this screen.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelConfirmed}
                      className="px-4 py-1.5 text-sm font-semibold bg-red-600 text-white
                        rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Yes, Cancel Order
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}

            </div>{/* end scrollable body */}

            {/* ================================================
                ACTIONS FOOTER
            ================================================ */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Actions</p>

              {/* Primary actions row */}
              <div className="flex flex-wrap gap-2 mb-2">
                {(order.status === 'new' || order.status === 'issue') && (
                  <ActionButton
                    icon="✓" label="Confirm Order" variant="primary"
                    onClick={handleConfirm}
                  />
                )}
                {(order.status === 'new' || order.status === 'processing') && (
                  <ActionButton
                    icon="📦" label="Create Shipment" variant="secondary"
                    onClick={() => showToast('ShipStation integration coming in Phase 3.', 'error')}
                  />
                )}
                {(order.status === 'shipped' || order.status === 'delivered') && (
                  <ActionButton
                    icon="↩" label="Refund" variant="secondary"
                    onClick={() => setShowRefundModal(true)}
                  />
                )}
                <ActionButton
                  icon="🖨" label="Packing List" variant="secondary"
                  onClick={() => setShowPackingSlip(true)}
                />
                <ActionButton
                  icon="✉" label="Send Invoice" variant="secondary"
                  onClick={() => showToast('QuickBooks integration coming in Phase 3.', 'error')}
                />
              </div>

              {/* Secondary / destructive actions row */}
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon="📝" label="Add Note" variant="secondary"
                  onClick={() => setShowAddNote(true)}
                  disabled={showAddNote}
                />
                {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <ActionButton
                    icon="✕" label="Cancel Order" variant="danger"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={showCancelConfirm}
                  />
                )}
              </div>
            </div>

          </>
        )}
      </div>

      {/* ---- Packing Slip Modal ---- */}
      <PackingSlipModal
        order={showPackingSlip ? order : null}
        onClose={() => setShowPackingSlip(false)}
      />

      {/* ---- Refund Modal ---- */}
      {/* z-[60] sits above the drawer (z-50) and its backdrop (z-40).
          We pass null when closed so the modal can handle its own
          open/close animation the same way the drawer does. */}
      <RefundModal
        order={showRefundModal ? order : null}
        onSuccess={msg => showToast(msg)}
        onClose={() => setShowRefundModal(false)}
      />
    </>
  );
};

export default OrderDrawer;
