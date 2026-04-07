// ============================================================
// EmailPOPage.tsx — Email PO Intake Inbox
// ============================================================
// This page shows incoming dealer purchase orders received via email.
// In a later phase, these will be parsed automatically from Gmail/Outlook
// using OAuth. For now, we display dummy data so we can build and style
// the full UI before the backend exists.
//
// Layout:
//  - Top: summary stat tiles + status filter tabs
//  - Center: inbox table (one row per PO email)
//  - Right: sliding detail panel when a row is clicked
//
// Pattern note: the detail panel uses the same "translate" trick as
// the Order Drawer — it's always in the DOM, but hidden off-screen
// (translate-x-full) until a PO is selected (translate-x-0).

import React, { useState, useCallback } from 'react';
import { EmailPO, EmailPOStatus } from '../types/index.ts';
import { dummyEmailPOs } from '../data/dummyData.ts';

// ============================================================
// HELPER: STATUS BADGE
// Maps each status to a color scheme for the badge pill.
// This is pulled into its own function so we can reuse it in
// both the table row and the detail panel header.
// ============================================================
function StatusBadge({ status }: { status: EmailPOStatus }) {
  const styles: Record<EmailPOStatus, string> = {
    pending:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
    processed: 'bg-green-100  text-green-800  border border-green-300',
    flagged:   'bg-red-100    text-red-800    border border-red-300',
    archived:  'bg-gray-100   text-gray-600   border border-gray-300',
  };
  const labels: Record<EmailPOStatus, string> = {
    pending:   'Pending Review',
    processed: 'Processed',
    flagged:   'Flagged',
    archived:  'Archived',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ============================================================
// HELPER: FORMAT DATE
// Turns "2026-04-06T08:14:00Z" into "Apr 6, 2026 8:14 AM"
// ============================================================
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ============================================================
// DETAIL PANEL
// Slides in from the right when a PO is selected.
// Shows extracted order info, line items, and action buttons.
// ============================================================
interface DetailPanelProps {
  po: EmailPO | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: EmailPOStatus) => void;
}

function DetailPanel({ po, onClose, onUpdateStatus }: DetailPanelProps) {
  // The panel is always rendered. When po is null, we push it off-screen.
  // This allows the CSS transition to play smoothly when opening/closing.
  const isOpen = po !== null;

  return (
    <>
      {/* Backdrop — semi-transparent dark overlay behind the panel */}
      {/* clicking it closes the panel, same as the Order Drawer */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sliding panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Only render content when a PO is actually selected.
            This avoids errors trying to read properties of null. */}
        {po && (
          <>
            {/* ---- HEADER ---- */}
            <div className="flex items-start justify-between p-5 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={po.status} />
                  <span className="text-xs text-gray-400">{formatDate(po.receivedAt)}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800">{po.dealerName}</h2>
                <p className="text-sm text-gray-500">{po.senderEmail}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none mt-1"
                aria-label="Close panel"
              >
                ×
              </button>
            </div>

            {/* ---- SCROLLABLE BODY ---- */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Email subject + PO number */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subject</span>
                  <span className="text-gray-800 font-medium text-right max-w-[300px]">{po.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Number</span>
                  <span className="text-gray-800 font-medium font-mono">{po.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">From</span>
                  <span className="text-gray-800 font-medium">{po.sender}</span>
                </div>
              </div>

              {/* Raw email snippet — what the dealer actually wrote */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Body
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed border border-gray-200">
                  {po.rawSnippet}
                </div>
              </div>

              {/* Flagged note — only shows when status is 'flagged' */}
              {po.notes && (
                <div className={`rounded-lg p-3 text-sm border
                  ${po.status === 'flagged'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                  <span className="font-semibold mr-1">
                    {po.status === 'flagged' ? '⚑ Flag Note:' : 'Note:'}
                  </span>
                  {po.notes}
                </div>
              )}

              {/* Extracted line items table */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Extracted Line Items
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-left">
                      <th className="px-3 py-2 rounded-tl-md font-semibold">SKU</th>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold text-right">Qty</th>
                      <th className="px-3 py-2 rounded-tr-md font-semibold text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {po.items.map((item) => (
                      <tr key={item.sku} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                        <td className="px-3 py-2 text-gray-700">{item.name}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{item.qty}</td>
                        <td className="px-3 py-2 text-right text-gray-800">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-600">
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">
                        ${po.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ---- ACTION BUTTONS ---- */}
            {/* These let staff change the status without leaving the panel.
                We show different buttons depending on the current status. */}
            <div className="border-t p-4 flex flex-wrap gap-2 bg-gray-50">
              {po.status !== 'processed' && (
                <button
                  onClick={() => onUpdateStatus(po.id, 'processed')}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white
                    text-sm font-semibold rounded-lg transition-colors"
                >
                  Mark Processed
                </button>
              )}
              {po.status !== 'flagged' && po.status !== 'archived' && (
                <button
                  onClick={() => onUpdateStatus(po.id, 'flagged')}
                  className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800
                    text-sm font-semibold rounded-lg transition-colors border border-red-300"
                >
                  Flag
                </button>
              )}
              {po.status !== 'archived' && (
                <button
                  onClick={() => onUpdateStatus(po.id, 'archived')}
                  className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700
                    text-sm font-semibold rounded-lg transition-colors"
                >
                  Archive
                </button>
              )}
              {po.status !== 'pending' && (
                <button
                  onClick={() => onUpdateStatus(po.id, 'pending')}
                  className="flex-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800
                    text-sm font-semibold rounded-lg transition-colors border border-yellow-300"
                >
                  Move to Pending
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function EmailPOPage() {
  // pos — the live list of POs, starts as the dummy data.
  // In a real app, this would come from an API call.
  // We store it in state so we can update statuses without reloading.
  const [pos, setPos] = useState<EmailPO[]>(dummyEmailPOs);

  // selectedId — which PO the user clicked. null = panel closed.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // statusFilter — the active tab. 'all' shows everything.
  const [statusFilter, setStatusFilter] = useState<EmailPOStatus | 'all'>('all');

  // searchQuery — filters by sender name, email, subject, or PO number
  const [searchQuery, setSearchQuery] = useState('');

  // Derived: the currently selected PO object (or null)
  const selectedPO = pos.find(p => p.id === selectedId) ?? null;

  // Close panel
  const handleClose = useCallback(() => setSelectedId(null), []);

  // Update a PO's status in local state.
  // useCallback prevents this function from being recreated on every render.
  const handleUpdateStatus = useCallback((id: string, newStatus: EmailPOStatus) => {
    setPos(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    // If we archived/processed something, close the panel after a tiny delay
    // so the user can see the status change animate before the panel closes.
    if (newStatus === 'archived') {
      setTimeout(() => setSelectedId(null), 150);
    }
  }, []);

  // ---- FILTERING ----
  // First filter by tab, then by search query.
  const filtered = pos
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.sender.toLowerCase().includes(q) ||
        p.senderEmail.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.poNumber.toLowerCase().includes(q) ||
        p.dealerName.toLowerCase().includes(q)
      );
    });

  // ---- SUMMARY COUNTS (for tab badges + stat tiles) ----
  const counts = {
    all:       pos.length,
    pending:   pos.filter(p => p.status === 'pending').length,
    processed: pos.filter(p => p.status === 'processed').length,
    flagged:   pos.filter(p => p.status === 'flagged').length,
    archived:  pos.filter(p => p.status === 'archived').length,
  };

  // Total value of all pending POs — useful to see what's waiting for action
  const pendingValue = pos
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.subtotal, 0);

  // ---- TAB CONFIG ----
  const tabs: { key: EmailPOStatus | 'all'; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending Review' },
    { key: 'processed', label: 'Processed' },
    { key: 'flagged',   label: 'Flagged' },
    { key: 'archived',  label: 'Archived' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* ---- PAGE HEADER ---- */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Email PO Intake</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Incoming dealer purchase orders received by email
        </p>
      </div>

      {/* ---- SUMMARY TILES ---- */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total POs</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{counts.all}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{counts.pending}</p>
          <p className="text-xs text-yellow-600 mt-0.5">
            ${pendingValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total value
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-xs text-red-700 font-medium uppercase tracking-wide">Flagged</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{counts.flagged}</p>
          <p className="text-xs text-red-600 mt-0.5">Needs follow-up</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Processed</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{counts.processed}</p>
        </div>
      </div>

      {/* ---- FILTERS ROW ---- */}
      <div className="px-6 pb-3 flex items-center gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5
                ${statusFilter === tab.key
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
              {/* Badge showing count for each tab */}
              <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none
                ${statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search box */}
        <input
          type="text"
          placeholder="Search by dealer, subject, PO#..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="ml-auto w-72 border rounded-lg px-3 py-2 text-sm text-gray-700
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* ---- INBOX TABLE ---- */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 text-left">
                <th className="px-4 py-3 font-semibold">Dealer</th>
                <th className="px-4 py-3 font-semibold">Subject / PO #</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold text-right">Value</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No POs match your current filter.
                  </td>
                </tr>
              ) : (
                filtered.map(po => (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedId(po.id)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50
                      ${selectedId === po.id ? 'bg-blue-50' : ''}
                      ${po.status === 'flagged' ? 'border-l-4 border-l-red-400' : ''}
                      ${po.status === 'pending' ? 'font-medium' : ''}`}
                  >
                    {/* Dealer name + sender email */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{po.dealerName}</div>
                      <div className="text-xs text-gray-400">{po.senderEmail}</div>
                    </td>

                    {/* Subject + PO number */}
                    <td className="px-4 py-3">
                      <div className="text-gray-700 truncate max-w-[220px]">{po.subject}</div>
                      <div className="text-xs text-gray-400 font-mono">{po.poNumber}</div>
                    </td>

                    {/* Item count */}
                    <td className="px-4 py-3 text-gray-600">
                      {po.items.length} {po.items.length === 1 ? 'item' : 'items'}
                    </td>

                    {/* Subtotal */}
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      ${po.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Received date */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(po.receivedAt)}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel — slides in from the right on row click */}
      <DetailPanel
        po={selectedPO}
        onClose={handleClose}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
