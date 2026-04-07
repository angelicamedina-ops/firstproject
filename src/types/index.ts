// ============================================================
// TypeScript Types for the Antigravity Batteries ERP Dashboard
// ============================================================
//
// In TypeScript, "types" and "interfaces" define the SHAPE of data.
// Think of them like blueprints or contracts. If a function expects
// an "Order", TypeScript will error at compile time if you accidentally
// pass the wrong fields — catching bugs before they reach production.
//
// "export" means other files can import and use these types.

// --------------------
// ORDER STATUS
// --------------------
// This is a "union type" — the value can only be ONE of these exact strings.
// If you try to set status = 'cancelled', TypeScript will flag it immediately.
export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'issue' | 'cancelled';

// --------------------
// SALES CHANNEL
// --------------------
// The platforms where Antigravity Batteries sells products.
export type Channel = 'WooCommerce' | 'Walmart' | 'TikTok Shop' | 'Newegg' | 'Direct';

// --------------------
// ORDER ITEM
// --------------------
// A single line item within an order (one product + quantity).
export interface OrderItem {
  sku: string;        // Stock Keeping Unit — unique product identifier
  name: string;       // Human-readable product name
  qty: number;
  unitPrice: number;  // Price per single unit (what the customer actually paid)
  msrp?: number;      // Manufacturer's Suggested Retail Price — used for MAP check.
                      // If unitPrice < msrp, the drawer shows a MAP violation flag.
}

// --------------------
// ORDER
// --------------------
// The main data shape for an order across all channels.
export interface Order {
  id: string;
  orderNumber: string;       // e.g. "AGB-10041"
  channel: Channel;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;    // Optional — not all channels provide this
  items: OrderItem[];        // An array of line items
  total: number;             // Full order total in USD
  status: OrderStatus;
  createdAt: string;         // ISO date string, e.g. "2026-03-25T08:12:00Z"
  shippingAddress: string;
  trackingNumber?: string;
  invoiceStatus?: 'pending' | 'sent' | 'paid' | 'overdue';
  notes?: string[];          // Internal staff notes on this order
}

// --------------------
// SUMMARY TILE
// --------------------
// The 5 stat cards at the top of the dashboard.
export interface SummaryTile {
  label: string;
  value: number | string;   // Could be a count like 12, or a dollar amount like "$4,820"
  colorClass: string;       // Tailwind CSS color class, e.g. "bg-blue-100 text-blue-700"
  iconLabel: string;        // Short emoji or text icon
}

// --------------------
// ALERT
// --------------------
// Entries in the right-panel alerts feed.
export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  time: string;
}

// --------------------
// CHANNEL STAT
// --------------------
// Per-channel order counts shown in the right panel breakdown.
export interface ChannelStat {
  channel: Channel;
  orderCount: number;
  revenue: number;
  colorClass: string;        // Tailwind color for the channel badge dot
}

// --------------------
// SHIPMENT TYPES
// --------------------
// These represent the carrier-side view of a shipment, separate from
// the order-side view. An order becomes a shipment once a label is created.

export type ShipmentStatus = 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';

export type Carrier = 'USPS' | 'UPS' | 'FedEx' | 'R+L Carriers';

// A single scan event from the carrier — one entry in the tracking timeline.
export interface TrackingEvent {
  timestamp: string;    // ISO date string
  location: string;     // "City of Industry, CA 91748"
  description: string;  // "Arrived at USPS Regional Facility"
}

export interface Shipment {
  id: string;
  orderNumber: string;       // links back to the Order for cross-referencing
  customerName: string;
  shippingAddress: string;
  carrier: Carrier;
  service: string;           // "Priority Mail", "Ground", "LTL Freight", etc.
  trackingNumber: string;
  weight: string;            // "12.4 lbs"
  shipDate: string;          // ISO date string
  estimatedDelivery: string; // ISO date string
  status: ShipmentStatus;
  // Events are stored newest-first so events[0] is always the latest scan.
  events: TrackingEvent[];
}

// --------------------
// EMAIL PO TYPES
// --------------------
// Represents an incoming dealer purchase order received via email.
// In Phase 1 this is all dummy data; later we'll parse real emails via Gmail/Outlook OAuth.

export type EmailPOStatus = 'pending' | 'processed' | 'flagged' | 'archived';

// A single line item extracted (or manually entered) from the PO email
export interface EmailPOItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface EmailPO {
  id: string;
  sender: string;           // dealer name or email
  senderEmail: string;
  subject: string;
  receivedAt: string;       // ISO date string
  status: EmailPOStatus;
  dealerName: string;       // parsed or inferred dealer/company name
  poNumber: string;         // the dealer's own PO reference number
  items: EmailPOItem[];
  subtotal: number;
  notes?: string;           // any special instructions in the email body
  rawSnippet: string;       // first ~3 lines of the email body (for the detail card)
}

// --------------------
// INVENTORY TYPES
// --------------------

export type InventoryCategory =
  | '12V LiFePO4'
  | '24V LiFePO4'
  | '48V LiFePO4'
  | 'Accessories';

export interface InventoryItem {
  sku: string;
  name: string;
  category: InventoryCategory;
  physicalStock: number;     // units physically in the warehouse
  reserved: number;          // units committed to open orders, not yet shipped
  // availableToSell = physicalStock - reserved  (computed on render, not stored)
  reorderThreshold: number;  // default low-stock alert level — overridable per SKU in UI
  reorderQty: number;        // suggested replenishment quantity
  unitCost: number;          // our cost per unit (not the sale price)
  msrp: number;              // selling price
  binLocation: string;       // warehouse bin, e.g. "A-01-2"
  lastReceived: string;      // ISO date — most recent stock receipt
}
