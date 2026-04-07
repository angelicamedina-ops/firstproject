// ============================================================
// SettingsPage.tsx — Integration Status & Company Settings
// ============================================================
// Two sections:
//  1. API Integrations — one card per external system, showing
//     connection status (green/red indicator) and a placeholder
//     Connect/Disconnect button. In a real app these buttons
//     would trigger an OAuth flow or API key save.
//
//  2. Company Info — editable fields for company name, address,
//     phone, email, and website. Saved in local state for now
//     (would POST to a backend endpoint in a later phase).

import React, { useState } from 'react';

// ============================================================
// TYPES
// ============================================================
type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: ConnectionStatus;
  statusDetail: string;   // e.g. "Last synced 4 min ago" or "Auth token expired"
  icon: string;           // emoji used as a stand-in for a real logo
}

// ============================================================
// DUMMY INTEGRATION DATA
// These represent the real integrations Antigravity Batteries uses.
// Status is hardcoded for the UI prototype.
// ============================================================
const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Desktop',
    description: 'Order invoicing and accounting via QuickBooks Web Connector (QBWC)',
    status: 'connected',
    statusDetail: 'Last synced 4 min ago',
    icon: '🧾',
  },
  {
    id: 'shipstation',
    name: 'ShipStation',
    description: 'Label creation, carrier rates, and shipment tracking',
    status: 'connected',
    statusDetail: 'Last synced 12 min ago',
    icon: '📦',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Direct-to-consumer orders from antigravitybatteries.com',
    status: 'connected',
    statusDetail: 'Last synced 1 min ago',
    icon: '🛒',
  },
  {
    id: 'walmart',
    name: 'Walmart Seller',
    description: 'Marketplace orders from Walmart.com',
    status: 'connected',
    statusDetail: 'Last synced 8 min ago',
    icon: '🟡',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    description: 'Marketplace orders from TikTok Shop',
    status: 'error',
    statusDetail: 'Auth token expired — reconnect required',
    icon: '🎵',
  },
  {
    id: 'newegg',
    name: 'Newegg',
    description: 'Marketplace orders from Newegg.com',
    status: 'connected',
    statusDetail: 'Last synced 6 min ago',
    icon: '🥚',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Email PO intake — parses incoming dealer purchase orders',
    status: 'disconnected',
    statusDetail: 'Not connected',
    icon: '✉️',
  },
];

// ============================================================
// SUB-COMPONENT: STATUS INDICATOR
// A colored dot + label showing the connection state.
// ============================================================
function StatusIndicator({ status, detail }: { status: ConnectionStatus; detail: string }) {
  const dot: Record<ConnectionStatus, string> = {
    connected:    'bg-green-500',
    disconnected: 'bg-gray-300',
    error:        'bg-red-500',
  };
  const label: Record<ConnectionStatus, string> = {
    connected:    'Connected',
    disconnected: 'Not connected',
    error:        'Error',
  };
  const labelColor: Record<ConnectionStatus, string> = {
    connected:    'text-green-700',
    disconnected: 'text-gray-500',
    error:        'text-red-700',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Pulsing dot for connected state — a nice subtle live indicator */}
      <span className="relative flex h-2.5 w-2.5">
        {status === 'connected' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot[status]} opacity-50`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dot[status]}`} />
      </span>
      <span className={`text-sm font-medium ${labelColor[status]}`}>{label[status]}</span>
      <span className="text-xs text-gray-400 ml-1">— {detail}</span>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: INTEGRATION CARD
// ============================================================
interface IntegrationCardProps {
  integration: Integration;
  onToggle: (id: string) => void;
}

function IntegrationCard({ integration, onToggle }: IntegrationCardProps) {
  const isConnected = integration.status === 'connected';
  const isError     = integration.status === 'error';

  return (
    <div className={`bg-white rounded-xl border p-5 flex items-start gap-4
      ${isError ? 'border-red-200 bg-red-50/30' : ''}`}>

      {/* Icon */}
      <div className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0">
        {integration.icon}
      </div>

      {/* Name + description + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-800">{integration.name}</h3>
        </div>
        <p className="text-xs text-gray-500 mb-2">{integration.description}</p>
        <StatusIndicator status={integration.status} detail={integration.statusDetail} />
      </div>

      {/* Action button */}
      <button
        onClick={() => onToggle(integration.id)}
        className={`flex-shrink-0 px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors
          ${isConnected
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : isError
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {isConnected ? 'Disconnect' : isError ? 'Reconnect' : 'Connect'}
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function SettingsPage() {
  // Integrations stored in state so the Connect/Disconnect buttons
  // actually change what's displayed (toggling between states).
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);

  // Company info stored in state so the form fields are editable.
  const [company, setCompany] = useState({
    name:    'Antigravity Batteries',
    address: '1234 Battery Blvd, Los Angeles, CA 90001',
    phone:   '(310) 555-0182',
    email:   'operations@antigravitybatteries.com',
    website: 'antigravitybatteries.com',
  });

  // Track whether we're in "edit" mode for the company info section.
  const [editingCompany, setEditingCompany] = useState(false);

  // Temporary draft while editing — we only commit to `company` on Save.
  // If the user hits Cancel, the draft is discarded and original is preserved.
  const [draft, setDraft] = useState(company);

  // Toggle an integration between connected ↔ disconnected (or error → connected)
  function handleToggle(id: string) {
    setIntegrations(prev => prev.map(intg => {
      if (intg.id !== id) return intg;
      if (intg.status === 'connected') {
        return { ...intg, status: 'disconnected', statusDetail: 'Not connected' };
      } else {
        // In the real app, this would launch an OAuth flow.
        // For now, we just flip to "connected" as a placeholder.
        return { ...intg, status: 'connected', statusDetail: 'Just connected' };
      }
    }));
  }

  function handleSaveCompany() {
    setCompany(draft);
    setEditingCompany(false);
  }

  function handleCancelCompany() {
    setDraft(company);         // discard changes
    setEditingCompany(false);
  }

  // Counts for the summary at the top
  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount     = integrations.filter(i => i.status === 'error').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* ---- PAGE HEADER ---- */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Integration connections and company configuration
        </p>
      </div>

      {/* ---- SCROLLABLE CONTENT ---- */}
      <div className="flex-1 overflow-auto p-6 space-y-8">

        {/* ---- INTEGRATIONS SECTION ---- */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">API Integrations</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {connectedCount} of {integrations.length} connected
                {errorCount > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    · {errorCount} {errorCount === 1 ? 'error' : 'errors'} require attention
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Grid: 2 columns on wider screens, 1 on narrow */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {integrations.map(intg => (
              <IntegrationCard
                key={intg.id}
                integration={intg}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>

        {/* ---- COMPANY INFO SECTION ---- */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Company Information</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Used on packing slips, invoices, and email templates
              </p>
            </div>
            {!editingCompany && (
              <button
                onClick={() => { setDraft(company); setEditingCompany(true); }}
                className="px-4 py-1.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200
                  text-gray-700 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5">
            {editingCompany ? (
              /* ---- EDIT FORM ---- */
              <div className="space-y-4">
                {(Object.keys(draft) as (keyof typeof draft)[]).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type="text"
                      value={draft[field]}
                      onChange={e => setDraft(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800
                        focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveCompany}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white
                      text-sm font-semibold rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelCompany}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700
                      text-sm font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ---- READ-ONLY VIEW ---- */
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {(Object.entries(company) as [keyof typeof company, string][]).map(([field, value]) => (
                  <div key={field}>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </dt>
                    <dd className="text-gray-800 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* ---- FOOTER NOTE ---- */}
        <p className="text-xs text-gray-400 text-center pb-2">
          Connect/Disconnect buttons are placeholders — OAuth flows and API key management
          will be implemented in a future backend phase.
        </p>

      </div>
    </div>
  );
}
