// ============================================================
// App.tsx — Root Application Layout + Page Router
// ============================================================
// App now owns the activePage state and acts as a simple router.
// When the user clicks a nav item in the Sidebar, onNavigate()
// updates activePage here, and the content area re-renders with
// the right page component.
//
// We're not using React Router (a URL-based routing library) yet —
// this is simpler "state-based" routing that's fine for a dashboard
// that lives at a single URL. We can add React Router later if we
// need deep-linking or browser back/forward support.

import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import SummaryBar from './components/SummaryBar.tsx';
import OrderFeed from './components/OrderFeed.tsx';
import RightPanel from './components/RightPanel.tsx';
import OrdersPage from './pages/OrdersPage.tsx';
import ShipmentsPage from './pages/ShipmentsPage.tsx';
import InventoryPage from './pages/InventoryPage.tsx';
import EmailPOPage from './pages/EmailPOPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';

// ---- Dashboard layout (the Phase 1 view) ----
// Extracted into its own small component so App's return stays clean.
function DashboardLayout() {
  return (
    <>
      <SummaryBar />
      <div className="flex-1 flex overflow-hidden">
        <OrderFeed />
        <RightPanel />
      </div>
    </>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const App: React.FC = () => {
  // activePage is the single source of truth for which page is showing.
  // It defaults to 'dashboard' on load.
  const [activePage, setActivePage] = useState<string>('dashboard');

  // renderPage() returns the right JSX for the current page.
  // A switch statement is cleaner than a chain of if/else here.
  // Each case returns a JSX element; the default falls back to Dashboard.
  function renderPage() {
    switch (activePage) {
      case 'dashboard':  return <DashboardLayout />;
      case 'orders':     return <OrdersPage />;
      case 'shipments':  return <ShipmentsPage />;
      case 'inventory':  return <InventoryPage />;
      case 'email-po':   return <EmailPOPage />;
      case 'reports':    return <ReportsPage />;
      case 'settings':   return <SettingsPage />;
      default:           return <DashboardLayout />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar now receives activePage and a setter as props.
          When the user clicks a nav button, onNavigate fires,
          updates activePage here, and React re-renders the content area. */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Content area: flex column, grows to fill remaining width.
          renderPage() swaps the inner content while this outer shell stays. */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </div>

    </div>
  );
};

export default App;
