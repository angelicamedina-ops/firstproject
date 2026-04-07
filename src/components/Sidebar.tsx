// ============================================================
// Sidebar.tsx — Left Navigation Panel
// ============================================================
// ARCHITECTURE NOTE: "Controlled Component" pattern
//
// Previously, Sidebar owned its own activeId state internally.
// The problem: App.tsx had no way to know which page was selected,
// so it couldn't swap the content area.
//
// The fix is called "lifting state up" — we move the state to the
// nearest common ancestor that needs it (App.tsx), and pass it back
// down as props. Sidebar is now a "controlled component": it receives
// the current value and a change handler from its parent, and just
// reports what the user clicked. It doesn't make decisions.
//
// This is one of the most important patterns in React. A component
// that controls its own state is like a form input with no value prop —
// you can't read or control it from outside. A controlled component
// is like an input with value={x} onChange={setX} — the parent owns
// the truth and can react to changes.

import React from 'react';

interface NavItem {
  label: string;
  icon: string;
  id: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard',  icon: '⊞',  label: 'Dashboard'      },
  { id: 'orders',     icon: '📋', label: 'Orders'          },
  { id: 'shipments',  icon: '📦', label: 'Shipments'       },
  { id: 'inventory',  icon: '🗃️', label: 'Inventory'       },
  { id: 'email-po',   icon: '✉️', label: 'Email PO Intake' },
  { id: 'reports',    icon: '📊', label: 'Reports'         },
  { id: 'settings',   icon: '⚙️', label: 'Settings'        },
];

// Props this component accepts from its parent (App.tsx).
// activePage: which page is currently shown — we use it to highlight the right button.
// onNavigate: the function to call when a nav button is clicked — App handles what happens next.
interface SidebarProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  return (
    <aside className="w-56 bg-slate-900 text-white flex flex-col h-screen flex-shrink-0">

      {/* ---- LOGO / BRAND AREA ---- */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="text-sm font-bold text-yellow-400 uppercase tracking-widest">
          Antigravity
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          Batteries — ERP Dashboard
        </div>
      </div>

      {/* ---- NAV LINKS ---- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // We now compare against the "activePage" PROP instead of internal state.
          // The visual result is identical — the right button gets highlighted —
          // but now App.tsx is in control of which one that is.
          const isActive = item.id === activePage;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}  // tell App: "user clicked this"
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                text-left transition-colors duration-150
                ${isActive
                  ? 'bg-yellow-400 text-slate-900 font-semibold'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              `}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- FOOTER / USER AREA ---- */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-bold text-sm flex-shrink-0">
            A
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">Admin</div>
            <div className="text-xs text-slate-400 truncate">antigravitybatteries.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
