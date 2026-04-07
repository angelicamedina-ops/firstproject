// ============================================================
// Dummy Data for Phase 1 UI Development
// ============================================================
// These are realistic-looking but fake orders for Antigravity Batteries.
// We use this data now so the UI looks real while we build it,
// and we'll swap it out for live API data in later phases.

import { Order, Alert, ChannelStat, Shipment, InventoryItem, EmailPO } from '../types/index.ts';

// --------------------
// DUMMY ORDERS
// --------------------
export const dummyOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'AGB-10041',
    channel: 'WooCommerce',
    customerName: 'Carlos Reyes',
    customerEmail: 'creyes@email.com',
    customerPhone: '(323) 555-0182',
    items: [
      { sku: 'LFP-100AH-12V', name: '12V 100Ah LiFePO4 Battery', qty: 2, unitPrice: 289.99, msrp: 289.99 },
    ],
    total: 579.98,
    status: 'new',
    createdAt: '2026-03-25T08:12:00Z',
    shippingAddress: '4521 Maple Ave, Los Angeles, CA 90001',
    invoiceStatus: 'pending',
  },
  {
    id: '2',
    orderNumber: 'AGB-10042',
    channel: 'Walmart',
    customerName: 'Jennifer Torres',
    customerEmail: 'jtorres@gmail.com',
    customerPhone: '(562) 555-0247',
    items: [
      { sku: 'LFP-200AH-12V', name: '12V 200Ah LiFePO4 Battery', qty: 1, unitPrice: 499.99, msrp: 499.99 },
      { sku: 'CHARGER-20A',   name: '20A Smart Charger',          qty: 1, unitPrice: 89.99  },
    ],
    total: 589.98,
    status: 'processing',
    createdAt: '2026-03-25T07:45:00Z',
    shippingAddress: '882 Ocean Blvd, Long Beach, CA 90802',
    invoiceStatus: 'sent',
  },
  {
    id: '3',
    orderNumber: 'AGB-10040',
    channel: 'TikTok Shop',
    customerName: 'Marcus Webb',
    customerEmail: 'marcus.webb@outlook.com',
    customerPhone: '(818) 555-0391',
    items: [
      { sku: 'LFP-50AH-12V', name: '12V 50Ah LiFePO4 Battery', qty: 4, unitPrice: 179.99, msrp: 179.99 },
    ],
    total: 719.96,
    status: 'shipped',
    createdAt: '2026-03-24T15:30:00Z',
    shippingAddress: '310 Sunset Drive, Burbank, CA 91501',
    trackingNumber: '9400111899223456781234',
    invoiceStatus: 'sent',
    notes: ['Customer requested signature confirmation — added to ShipStation label.'],
  },
  {
    id: '4',
    orderNumber: 'AGB-10039',
    channel: 'Newegg',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.s@techmail.com',
    // No phone — Newegg doesn't pass customer phone in their API
    items: [
      // unitPrice 499.99 < msrp 549.99 → MAP violation flag will trigger
      { sku: 'LFP-100AH-24V', name: '24V 100Ah LiFePO4 Battery', qty: 1, unitPrice: 499.99, msrp: 549.99 },
    ],
    total: 499.99,
    status: 'issue',
    createdAt: '2026-03-24T11:20:00Z',
    shippingAddress: '7720 Ventura Blvd, Sherman Oaks, CA 91423',
    invoiceStatus: 'pending',
    notes: [
      'ShipStation label failed — ZIP code 91423 flagged as invalid. Verify with customer.',
      'Newegg order import pulled wrong unit price. Needs manual correction before fulfillment.',
    ],
  },
  {
    id: '5',
    orderNumber: 'AGB-10038',
    channel: 'WooCommerce',
    customerName: 'Derek and Linda Holt',
    customerEmail: 'dholt@riverview.net',
    customerPhone: '(626) 555-0554',
    items: [
      { sku: 'LFP-100AH-48V', name: '48V 100Ah LiFePO4 Battery Pack', qty: 1, unitPrice: 1299.99, msrp: 1299.99 },
      { sku: 'BMS-100A',       name: '100A Battery Management System', qty: 1, unitPrice: 149.99  },
    ],
    total: 1449.98,
    status: 'shipped',
    createdAt: '2026-03-24T09:05:00Z',
    shippingAddress: '15 Ponderosa Ln, Pasadena, CA 91103',
    trackingNumber: '9400111899223456789012',
    invoiceStatus: 'paid',
  },
  {
    id: '6',
    orderNumber: 'AGB-10037',
    channel: 'Direct',
    customerName: 'SunVolt Solar LLC',
    customerEmail: 'orders@sunvoltsolar.com',
    customerPhone: '(310) 555-0768',
    items: [
      { sku: 'LFP-200AH-48V', name: '48V 200Ah LiFePO4 Battery Pack', qty: 6, unitPrice: 2199.99, msrp: 2199.99 },
    ],
    total: 13199.94,
    status: 'processing',
    createdAt: '2026-03-24T08:00:00Z',
    shippingAddress: '4400 Industrial Way, Compton, CA 90220',
    invoiceStatus: 'sent',
    notes: [
      'Net-30 terms agreed upon. Invoice due 2026-04-23.',
      'Freight quote requested from R+L Carriers — awaiting callback.',
    ],
  },
  {
    id: '7',
    orderNumber: 'AGB-10036',
    channel: 'Walmart',
    customerName: 'Anthony Nguyen',
    customerEmail: 'anguyen88@yahoo.com',
    customerPhone: '(310) 555-0193',
    items: [
      { sku: 'LFP-50AH-12V', name: '12V 50Ah LiFePO4 Battery', qty: 1, unitPrice: 179.99, msrp: 179.99 },
    ],
    total: 179.99,
    status: 'delivered',
    createdAt: '2026-03-23T16:40:00Z',
    shippingAddress: '209 Harbor View Rd, San Pedro, CA 90731',
    trackingNumber: '9400111899223456770099',
    invoiceStatus: 'paid',
  },
  {
    id: '8',
    orderNumber: 'AGB-10035',
    channel: 'Newegg',
    customerName: 'Rachel Kim',
    customerEmail: 'rachelkim@design.io',
    // No phone — Newegg doesn't pass customer phone
    items: [
      { sku: 'LFP-100AH-12V', name: '12V 100Ah LiFePO4 Battery', qty: 1, unitPrice: 289.99, msrp: 289.99 },
      { sku: 'CHARGER-10A',   name: '10A Smart Charger',          qty: 1, unitPrice: 59.99  },
    ],
    total: 349.98,
    status: 'new',
    createdAt: '2026-03-25T09:55:00Z',
    shippingAddress: '88 Hillside Terrace, Glendale, CA 91206',
    invoiceStatus: 'pending',
  },
  {
    id: '9',
    orderNumber: 'AGB-10034',
    channel: 'TikTok Shop',
    customerName: 'Brandon Castillo',
    customerEmail: 'bcastillo@hotmail.com',
    customerPhone: '(213) 555-0445',
    items: [
      { sku: 'LFP-200AH-12V', name: '12V 200Ah LiFePO4 Battery', qty: 2, unitPrice: 499.99, msrp: 499.99 },
    ],
    total: 999.98,
    status: 'processing',
    createdAt: '2026-03-25T06:30:00Z',
    shippingAddress: '5501 Wilshire Blvd #302, Los Angeles, CA 90036',
    invoiceStatus: 'pending',
  },
  {
    id: '10',
    orderNumber: 'AGB-10033',
    channel: 'WooCommerce',
    customerName: 'Green Grid Energy',
    customerEmail: 'procurement@greengrid.energy',
    customerPhone: '(424) 555-0812',
    items: [
      // unitPrice 1199.99 < msrp 1299.99 → MAP violation flag will trigger
      { sku: 'LFP-100AH-48V', name: '48V 100Ah LiFePO4 Battery Pack', qty: 4, unitPrice: 1199.99, msrp: 1299.99 },
    ],
    total: 4799.96,
    status: 'issue',
    createdAt: '2026-03-23T14:10:00Z',
    shippingAddress: '1200 Commerce Park Dr, Torrance, CA 90502',
    invoiceStatus: 'overdue',
    notes: [
      'QuickBooks flagged payment hold — ACH transfer from Green Grid bounced.',
      'Called A/P contact Maria Chen at (424) 555-0812 ext 204 — voicemail left.',
    ],
  },
];

// --------------------
// DUMMY ALERTS
// --------------------
export const dummyAlerts: Alert[] = [
  {
    id: 'a1',
    type: 'error',
    message: 'Order AGB-10039: ShipStation label creation failed — invalid ZIP code.',
    time: '9:41 AM',
  },
  {
    id: 'a2',
    type: 'error',
    message: 'Order AGB-10033: Payment hold flagged by QuickBooks — review required.',
    time: '8:15 AM',
  },
  {
    id: 'a3',
    type: 'warning',
    message: 'SKU LFP-50AH-12V stock below reorder point (8 units remaining).',
    time: '7:50 AM',
  },
  {
    id: 'a4',
    type: 'info',
    message: 'New email PO received from SunVolt Solar LLC — review in Email Intake.',
    time: '8:00 AM',
  },
];

// --------------------
// DUMMY SHIPMENTS
// --------------------
// One shipment per status so every state is visible in the UI.
// Events are stored newest-first — events[0] is always the latest scan,
// which the table row displays without needing to search the array.
export const dummyShipments: Shipment[] = [
  {
    // ---- IN TRANSIT ----
    id: 'shp-1',
    orderNumber: 'AGB-10040',
    customerName: 'Marcus Webb',
    shippingAddress: '310 Sunset Drive, Burbank, CA 91501',
    carrier: 'USPS',
    service: 'Priority Mail',
    trackingNumber: '9400111899223456781234',
    weight: '14.2 lbs',
    shipDate: '2026-03-24T17:45:00Z',
    estimatedDelivery: '2026-03-27T00:00:00Z',
    status: 'in_transit',
    events: [
      {
        timestamp: '2026-03-25T08:15:00Z',
        location: 'City of Industry, CA 91748',
        description: 'Arrived at USPS Regional Distribution Center',
      },
      {
        timestamp: '2026-03-25T04:30:00Z',
        location: 'City of Industry, CA 91748',
        description: 'In Transit to Next Facility',
      },
      {
        timestamp: '2026-03-24T23:10:00Z',
        location: 'Los Angeles, CA 90009',
        description: 'Departed Post Office',
      },
      {
        timestamp: '2026-03-24T17:45:00Z',
        location: 'Los Angeles, CA 90009',
        description: 'Accepted at USPS Origin Facility',
      },
      {
        timestamp: '2026-03-24T15:30:00Z',
        location: 'Gardena, CA 90248',
        description: 'Shipping Label Created, USPS Awaiting Item',
      },
    ],
  },
  {
    // ---- OUT FOR DELIVERY ----
    id: 'shp-2',
    orderNumber: 'AGB-10038',
    customerName: 'Derek and Linda Holt',
    shippingAddress: '15 Ponderosa Ln, Pasadena, CA 91103',
    carrier: 'USPS',
    service: 'Priority Mail',
    trackingNumber: '9400111899223456789012',
    weight: '28.8 lbs',
    shipDate: '2026-03-24T11:30:00Z',
    estimatedDelivery: '2026-03-25T00:00:00Z',
    status: 'out_for_delivery',
    events: [
      {
        timestamp: '2026-03-25T08:02:00Z',
        location: 'Pasadena, CA 91103',
        description: 'Out for Delivery',
      },
      {
        timestamp: '2026-03-25T05:45:00Z',
        location: 'Pasadena, CA 91103',
        description: 'Arrived at Post Office',
      },
      {
        timestamp: '2026-03-25T01:20:00Z',
        location: 'City of Industry, CA 91748',
        description: 'Departed USPS Regional Distribution Center',
      },
      {
        timestamp: '2026-03-24T20:55:00Z',
        location: 'City of Industry, CA 91748',
        description: 'Arrived at USPS Regional Distribution Center',
      },
      {
        timestamp: '2026-03-24T11:30:00Z',
        location: 'Los Angeles, CA 90009',
        description: 'Accepted at USPS Origin Facility',
      },
      {
        timestamp: '2026-03-24T09:05:00Z',
        location: 'Gardena, CA 90248',
        description: 'Shipping Label Created, USPS Awaiting Item',
      },
    ],
  },
  {
    // ---- DELIVERED ----
    id: 'shp-3',
    orderNumber: 'AGB-10036',
    customerName: 'Anthony Nguyen',
    shippingAddress: '209 Harbor View Rd, San Pedro, CA 90731',
    carrier: 'USPS',
    service: 'First-Class Package',
    trackingNumber: '9400111899223456770099',
    weight: '3.6 lbs',
    shipDate: '2026-03-23T18:00:00Z',
    estimatedDelivery: '2026-03-24T00:00:00Z',
    status: 'delivered',
    events: [
      {
        timestamp: '2026-03-24T13:42:00Z',
        location: 'San Pedro, CA 90731',
        description: 'Delivered, Front Door / Porch',
      },
      {
        timestamp: '2026-03-24T09:18:00Z',
        location: 'San Pedro, CA 90731',
        description: 'Out for Delivery',
      },
      {
        timestamp: '2026-03-24T07:05:00Z',
        location: 'San Pedro, CA 90731',
        description: 'Arrived at Post Office',
      },
      {
        timestamp: '2026-03-24T01:40:00Z',
        location: 'Los Angeles, CA 90009',
        description: 'In Transit to Next Facility',
      },
      {
        timestamp: '2026-03-23T18:00:00Z',
        location: 'Los Angeles, CA 90009',
        description: 'Accepted at USPS Origin Facility',
      },
      {
        timestamp: '2026-03-23T16:40:00Z',
        location: 'Gardena, CA 90248',
        description: 'Shipping Label Created, USPS Awaiting Item',
      },
    ],
  },
  {
    // ---- IN TRANSIT — LTL Freight (SunVolt Solar bulk order) ----
    id: 'shp-4',
    orderNumber: 'AGB-10037',
    customerName: 'SunVolt Solar LLC',
    shippingAddress: '4400 Industrial Way, Compton, CA 90220',
    carrier: 'R+L Carriers',
    service: 'LTL Freight — Standard',
    trackingNumber: 'RLC-0038821-CA',
    weight: '342 lbs',
    shipDate: '2026-03-24T14:00:00Z',
    estimatedDelivery: '2026-03-26T00:00:00Z',
    status: 'in_transit',
    events: [
      {
        timestamp: '2026-03-25T02:00:00Z',
        location: 'Los Angeles, CA 90058',
        description: 'Arrived at R+L Carriers Terminal — Scheduled for Line-Haul',
      },
      {
        timestamp: '2026-03-24T14:00:00Z',
        location: 'Gardena, CA 90248',
        description: 'Shipment Picked Up by Driver',
      },
      {
        timestamp: '2026-03-24T08:00:00Z',
        location: 'Gardena, CA 90248',
        description: 'Bill of Lading Created — Shipment Tendered to R+L Carriers',
      },
    ],
  },
  {
    // ---- EXCEPTION ----
    id: 'shp-5',
    orderNumber: 'AGB-10035',
    customerName: 'Rachel Kim',
    shippingAddress: '88 Hillside Terrace, Glendale, CA 91206',
    carrier: 'UPS',
    service: 'UPS Ground',
    trackingNumber: '1Z999AA10123456784',
    weight: '9.1 lbs',
    shipDate: '2026-03-25T11:30:00Z',
    estimatedDelivery: '2026-03-26T00:00:00Z',
    status: 'exception',
    events: [
      {
        timestamp: '2026-03-25T18:12:00Z',
        location: 'Glendale, CA 91206',
        description: 'Delivery Attempt Failed — Animal Blocking Access. Will Reattempt Next Business Day.',
      },
      {
        timestamp: '2026-03-25T14:30:00Z',
        location: 'Glendale, CA 91206',
        description: 'Out for Delivery',
      },
      {
        timestamp: '2026-03-25T11:30:00Z',
        location: 'Commerce, CA 90040',
        description: 'Departed UPS Facility',
      },
      {
        timestamp: '2026-03-25T09:55:00Z',
        location: 'Commerce, CA 90040',
        description: 'Origin Scan — Package Received by UPS',
      },
    ],
  },
];

// --------------------
// DUMMY INVENTORY
// --------------------
// SKUs match exactly what's referenced in dummyOrders above.
// reserved counts are derived from open (new/processing/issue) orders.
// Four SKUs are intentionally below their reorder threshold so low-stock
// highlighting is visible immediately — LFP-50AH-12V matches the alert
// already shown in the right panel on the Dashboard.
export const dummyInventory: InventoryItem[] = [
  // ---- 12V LiFePO4 ----
  {
    sku: 'LFP-50AH-12V',
    name: '12V 50Ah LiFePO4 Battery',
    category: '12V LiFePO4',
    physicalStock: 8,
    reserved: 0,           // shipped orders don't hold reservation
    reorderThreshold: 15,  // LOW STOCK — matches the dashboard alert panel
    reorderQty: 30,
    unitCost: 89.00,
    msrp: 179.99,
    binLocation: 'A-01-2',
    lastReceived: '2026-02-14T00:00:00Z',
  },
  {
    sku: 'LFP-100AH-12V',
    name: '12V 100Ah LiFePO4 Battery',
    category: '12V LiFePO4',
    physicalStock: 24,
    reserved: 3,           // orders AGB-10041 (2 units) + AGB-10035 (1 unit), both new
    reorderThreshold: 10,
    reorderQty: 25,
    unitCost: 144.00,
    msrp: 289.99,
    binLocation: 'A-01-3',
    lastReceived: '2026-03-10T00:00:00Z',
  },
  {
    sku: 'LFP-200AH-12V',
    name: '12V 200Ah LiFePO4 Battery',
    category: '12V LiFePO4',
    physicalStock: 12,
    reserved: 3,           // AGB-10042 (1 unit, processing) + AGB-10034 (2 units, processing)
    reorderThreshold: 8,
    reorderQty: 20,
    unitCost: 249.00,
    msrp: 499.99,
    binLocation: 'A-01-4',
    lastReceived: '2026-03-10T00:00:00Z',
  },
  // ---- 24V LiFePO4 ----
  {
    sku: 'LFP-50AH-24V',
    name: '24V 50Ah LiFePO4 Battery',
    category: '24V LiFePO4',
    physicalStock: 6,
    reserved: 0,
    reorderThreshold: 8,   // LOW STOCK — 6 available, threshold 8
    reorderQty: 20,
    unitCost: 159.00,
    msrp: 319.99,
    binLocation: 'A-02-1',
    lastReceived: '2026-01-28T00:00:00Z',
  },
  {
    sku: 'LFP-100AH-24V',
    name: '24V 100Ah LiFePO4 Battery',
    category: '24V LiFePO4',
    physicalStock: 18,
    reserved: 1,           // AGB-10039 (1 unit, issue — still holds reservation)
    reorderThreshold: 6,
    reorderQty: 15,
    unitCost: 274.00,
    msrp: 549.99,
    binLocation: 'A-02-2',
    lastReceived: '2026-03-10T00:00:00Z',
  },
  {
    sku: 'LFP-200AH-24V',
    name: '24V 200Ah LiFePO4 Battery',
    category: '24V LiFePO4',
    physicalStock: 4,
    reserved: 0,
    reorderThreshold: 5,   // LOW STOCK — 4 available, threshold 5
    reorderQty: 12,
    unitCost: 499.00,
    msrp: 999.99,
    binLocation: 'A-02-3',
    lastReceived: '2026-01-28T00:00:00Z',
  },
  // ---- 48V LiFePO4 ----
  {
    sku: 'LFP-100AH-48V',
    name: '48V 100Ah LiFePO4 Battery Pack',
    category: '48V LiFePO4',
    physicalStock: 11,
    reserved: 5,           // AGB-10038 (1 shipped, no reserve) + AGB-10033 (4 units, issue)
    reorderThreshold: 4,
    reorderQty: 10,
    unitCost: 649.00,
    msrp: 1299.99,
    binLocation: 'A-03-1',
    lastReceived: '2026-02-20T00:00:00Z',
  },
  {
    sku: 'LFP-200AH-48V',
    name: '48V 200Ah LiFePO4 Battery Pack',
    category: '48V LiFePO4',
    physicalStock: 7,
    reserved: 6,           // AGB-10037 (6 units, processing — large SunVolt order)
    reorderThreshold: 3,
    reorderQty: 8,
    unitCost: 1099.00,
    msrp: 2199.99,
    binLocation: 'A-03-2',
    lastReceived: '2026-02-20T00:00:00Z',
  },
  // ---- Accessories ----
  {
    sku: 'BMS-100A',
    name: '100A Battery Management System',
    category: 'Accessories',
    physicalStock: 32,
    reserved: 0,
    reorderThreshold: 10,
    reorderQty: 20,
    unitCost: 74.00,
    msrp: 149.99,
    binLocation: 'B-01-1',
    lastReceived: '2026-03-05T00:00:00Z',
  },
  {
    sku: 'CHARGER-10A',
    name: '10A Smart Charger',
    category: 'Accessories',
    physicalStock: 45,
    reserved: 1,           // AGB-10035 (1 unit, new)
    reorderThreshold: 15,
    reorderQty: 30,
    unitCost: 29.00,
    msrp: 59.99,
    binLocation: 'B-01-2',
    lastReceived: '2026-03-05T00:00:00Z',
  },
  {
    sku: 'CHARGER-20A',
    name: '20A Smart Charger',
    category: 'Accessories',
    physicalStock: 28,
    reserved: 1,           // AGB-10042 (1 unit, processing)
    reorderThreshold: 12,
    reorderQty: 24,
    unitCost: 44.00,
    msrp: 89.99,
    binLocation: 'B-01-3',
    lastReceived: '2026-03-05T00:00:00Z',
  },
  {
    sku: 'CHARGER-30A',
    name: '30A Smart Charger',
    category: 'Accessories',
    physicalStock: 3,
    reserved: 0,
    reorderThreshold: 10,  // LOW STOCK — 3 available, threshold 10
    reorderQty: 20,
    unitCost: 59.00,
    msrp: 119.99,
    binLocation: 'B-01-4',
    lastReceived: '2025-12-18T00:00:00Z',
  },
  {
    sku: 'CABLE-40A',
    name: '40A Battery Interconnect Cable (2ft)',
    category: 'Accessories',
    physicalStock: 67,
    reserved: 0,
    reorderThreshold: 20,
    reorderQty: 50,
    unitCost: 12.00,
    msrp: 24.99,
    binLocation: 'B-02-1',
    lastReceived: '2026-03-01T00:00:00Z',
  },
  {
    sku: 'FUSE-100A',
    name: '100A ANL Fuse with Holder',
    category: 'Accessories',
    physicalStock: 89,
    reserved: 0,
    reorderThreshold: 25,
    reorderQty: 50,
    unitCost: 8.50,
    msrp: 17.99,
    binLocation: 'B-02-2',
    lastReceived: '2026-03-01T00:00:00Z',
  },
];

// --------------------
// CHANNEL BREAKDOWN
// --------------------
// EMAIL PO INTAKE — Incoming dealer purchase orders received via email
// --------------------
export const dummyEmailPOs: EmailPO[] = [
  {
    id: 'epo-001',
    sender: 'Jim Hargrove',
    senderEmail: 'jim.hargrove@desertpowerco.com',
    subject: 'PO #DP-2026-0312 — Battery Order',
    receivedAt: '2026-04-06T08:14:00Z',
    status: 'pending',
    dealerName: 'Desert Power Co.',
    poNumber: 'DP-2026-0312',
    items: [
      { sku: 'LFP-100AH-12V', name: '12V 100Ah LiFePO4 Battery',  qty: 10, unitPrice: 399.00 },
      { sku: 'LFP-200AH-12V', name: '12V 200Ah LiFePO4 Battery',  qty:  4, unitPrice: 699.00 },
    ],
    subtotal: 6790.00,
    notes: 'Please ship ASAP — customer event on 4/18. Prefer UPS Ground.',
    rawSnippet: 'Hi Antigravity Team,\nPlease process the attached PO for our upcoming event inventory replenishment.\nKindly confirm receipt and estimated ship date.',
  },
  {
    id: 'epo-002',
    sender: 'Maria Chen',
    senderEmail: 'procurement@solarhorizon.net',
    subject: 'Purchase Order #SH-0089',
    receivedAt: '2026-04-05T14:32:00Z',
    status: 'processed',
    dealerName: 'Solar Horizon LLC',
    poNumber: 'SH-0089',
    items: [
      { sku: 'LFP-50AH-24V',  name: '24V 50Ah LiFePO4 Battery',   qty:  6, unitPrice: 549.00 },
      { sku: 'CHARGER-30A',   name: '30A LiFePO4 Smart Charger',   qty:  6, unitPrice: 129.00 },
    ],
    subtotal: 4068.00,
    rawSnippet: 'Good afternoon,\nAttached please find our monthly replenishment order for our solar storage division.\nNet 30 terms as per our dealer agreement.',
  },
  {
    id: 'epo-003',
    sender: 'Russ Delgado',
    senderEmail: 'russ@offgridoutfitters.com',
    subject: 'Re: Battery Quote — Ready to Order',
    receivedAt: '2026-04-05T09:07:00Z',
    status: 'flagged',
    dealerName: 'Off-Grid Outfitters',
    poNumber: 'OGO-112',
    items: [
      { sku: 'LFP-100AH-48V', name: '48V 100Ah LiFePO4 Battery',  qty: 2, unitPrice: 1299.00 },
    ],
    subtotal: 2598.00,
    notes: 'Flagged: requested pricing below MAP. Follow up required before processing.',
    rawSnippet: 'Hey team,\nI wanted to move forward on the quote from last week. Can you honor the $1,099 price per unit?\nLet me know and I\'ll send a formal PO.',
  },
  {
    id: 'epo-004',
    sender: 'accounts@greentechsupply.biz',
    senderEmail: 'accounts@greentechsupply.biz',
    subject: 'Automated PO — GTS-20260404-7712',
    receivedAt: '2026-04-04T22:45:00Z',
    status: 'processed',
    dealerName: 'GreenTech Supply',
    poNumber: 'GTS-20260404-7712',
    items: [
      { sku: 'LFP-100AH-12V', name: '12V 100Ah LiFePO4 Battery',  qty: 5, unitPrice: 399.00 },
      { sku: 'BMS-100A',       name: '100A Battery Management System', qty: 5, unitPrice: 89.00 },
    ],
    subtotal: 2440.00,
    rawSnippet: 'This is an automated purchase order generated by GreenTech Supply\'s procurement system.\nPO Number: GTS-20260404-7712. Please acknowledge within 24 hours.',
  },
  {
    id: 'epo-005',
    sender: 'Tyler Brooks',
    senderEmail: 'tbrooks@mountainmobilesolutions.com',
    subject: 'Order Request — 48V Systems',
    receivedAt: '2026-04-03T11:20:00Z',
    status: 'pending',
    dealerName: 'Mountain Mobile Solutions',
    poNumber: 'MMS-2026-031',
    items: [
      { sku: 'LFP-200AH-48V', name: '48V 200Ah LiFePO4 Battery',  qty: 3, unitPrice: 2299.00 },
      { sku: 'CHARGER-30A',   name: '30A LiFePO4 Smart Charger',   qty: 3, unitPrice: 129.00 },
    ],
    subtotal: 7284.00,
    notes: 'New dealer — needs account setup before processing.',
    rawSnippet: 'Hi,\nWe\'re a new dealer based in Denver, CO. We\'d like to place our first order for 48V systems.\nCould you also send over your dealer application? Thanks!',
  },
  {
    id: 'epo-006',
    sender: 'Lisa Wu',
    senderEmail: 'lisa.wu@pacificsolarworks.com',
    subject: 'PO #PSW-4401 — Quarterly Restock',
    receivedAt: '2026-04-02T16:55:00Z',
    status: 'archived',
    dealerName: 'Pacific Solar Works',
    poNumber: 'PSW-4401',
    items: [
      { sku: 'LFP-100AH-12V', name: '12V 100Ah LiFePO4 Battery',  qty: 20, unitPrice: 379.00 },
      { sku: 'LFP-100AH-24V', name: '24V 100Ah LiFePO4 Battery',  qty:  8, unitPrice: 799.00 },
    ],
    subtotal: 13972.00,
    rawSnippet: 'Hello,\nPlease find attached our Q2 quarterly restock order.\nWe\'d appreciate the dealer volume discount discussed in our last call.',
  },
];

// --------------------
export const channelStats: ChannelStat[] = [
  { channel: 'WooCommerce',  orderCount: 3, revenue: 7229.92,  colorClass: 'bg-purple-500' },
  { channel: 'Walmart',      orderCount: 2, revenue: 769.97,   colorClass: 'bg-blue-500'   },
  { channel: 'TikTok Shop',  orderCount: 2, revenue: 1719.94,  colorClass: 'bg-pink-500'   },
  { channel: 'Newegg',       orderCount: 2, revenue: 899.97,   colorClass: 'bg-orange-500' },
  { channel: 'Direct',       orderCount: 1, revenue: 13199.94, colorClass: 'bg-gray-500'   },
];
