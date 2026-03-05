// ─── Inventory Data ──────────────────────────────────────────────────────────

export type StockStatus = 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock' | 'Overstock';
export type Marketplace = 'US' | 'UK' | 'DE' | 'FR' | 'IT' | 'ES';
export type FulfillmentType = 'FBA' | 'FBM';

export interface InventoryKPI {
  label: string;
  value: string;
  rawValue: number;
  format: 'number' | 'currency' | 'days' | 'percent';
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'neutral';
}

export interface WarehouseBreakdown {
  warehouse: string;
  currentStock: number;
  reserved: number;
  available: number;
  inbound: number;
}

export interface InventorySKU {
  sku: string;
  asin: string;
  title: string;
  category: string;
  supplier: string;
  // Stock
  currentStock: number;
  reserved: number;
  available: number;
  inbound: number;
  // Velocity
  avgDailySales: number;
  avgDailySalesPoP: number;
  avgDailySalesDiffLY: number;
  // Supply
  daysOfSupply: number;
  daysOfSupplyPoP: number;
  daysOfSupplyDiffLY: number;
  // Reorder
  reorderPoint: number;
  safetyStock: number;
  suggestedQty: number;
  leadTimeDays: number;
  estStockoutDate: string;
  revenueAtRisk: number;
  // Status
  status: StockStatus;
  // Performance
  sellThroughRate: number;
  sellThroughRatePoP: number;
  sellThroughRateDiffLY: number;
  inventoryTurnover: number;
  inventoryTurnoverPoP: number;
  inventoryTurnoverDiffLY: number;
  daysOnHand: number;
  unitsSold: number;
  unitsSoldPoP: number;
  unitsSoldDiffLY: number;
  unitsReceived: number;
  storageCostMonthly: number;
  storageCostMonthlyPoP: number;
  storageCostMonthlyDiffLY: number;
  cogs: number;
  inventoryValue: number;
  roi: number;
  roiPoP: number;
  roiDiffLY: number;
  // Aging
  ageBucket: '0-90' | '91-180' | '181-270' | '271-365' | '365+';
  // Warehouse breakdown
  warehouses: WarehouseBreakdown[];
  // Control Tower fields
  marketplace: Marketplace;
  fulfillmentType: FulfillmentType;
  weeklyVelocity: number[];
  targetMinDays: number;
  targetMaxDays: number;
  inboundETA: string | null;
  isStranded: boolean;
  isUnfulfillable: boolean;
}

export interface AgingBucket {
  bucket: string;
  units: number;
  value: number;
  pctOfTotal: number;
  skuCount: number;
  feeRisk: number;
}

// ─── Seeded random ───────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Reference data ──────────────────────────────────────────────────────────

const titles = [
  'Everyday Essentials Pack', 'Premium Container Set', 'Smart Device Pro',
  'Classic Carry Bag', 'Smart Device Lite', 'Daily Wellness Capsules',
  'Kids Container', 'Protective Cover Slim', 'Compact Travel Pouch',
  'Fast Charger 30W', 'Clear Shield 2-Pack', 'Wellness Drops 60ml',
  'Organic Blend Powder', 'Ultra Slim Case', 'Bamboo Kitchen Set',
  'LED Desk Lamp', 'Wireless Earbuds Pro', 'Yoga Mat Premium',
  'Stainless Water Bottle', 'Pet Grooming Kit', 'Silicone Baking Set',
  'Adjustable Phone Stand', 'Essential Oil Diffuser', 'Memory Foam Pillow',
  'Portable Blender', 'Laptop Sleeve 15"', 'Resistance Bands Set',
  'Ceramic Coffee Mug', 'Solar Power Bank', 'Aroma Candle Set',
  'Digital Kitchen Scale', 'Bluetooth Speaker Mini', 'Eye Cream 30ml',
  'Hiking Daypack 20L', 'Insulated Lunch Box', 'Wireless Mouse Ergonomic',
  'Vitamin C Serum', 'Shower Caddy Organizer', 'Plant-Based Protein',
  'Smart Watch Band', 'Cotton Towel Set', 'Air Purifier Filter',
  'Neck Massage Pillow', 'Journal Notebook A5', 'Stainless Cutlery Set',
  'Bike Phone Mount', 'Hand Cream Trio', 'Gaming Mouse Pad XL',
  'Reusable Produce Bags', 'UV Sanitizer Box',
];

const categories = [
  'Personal Care', 'Home & Kitchen', 'Electronics Pro', 'Fashion Bags',
  'Electronics Lite', 'Wellness', 'Kids', 'Phone Accessories',
  'Travel', 'Fitness', 'Beauty', 'Outdoor',
];

const suppliers = [
  'ShenZhen Mfg Co.', 'GreenLeaf Supplies', 'Pacific Trade Ltd.',
  'EuroSource GmbH', 'Nordic Direct', 'Atlas Imports',
  'Silk Road Trading', 'PrimeMaker Inc.',
];

const warehouseNames = ['FBA DE', 'FBA FR', 'FBA UK', 'FBA US', 'FBA IT', 'FBA ES'];

// ─── Generate SKU data ───────────────────────────────────────────────────────

function randPoP(rand: () => number): number {
  return Math.round((-25 + rand() * 50) * 100) / 100;
}
function randLY(rand: () => number): number {
  return Math.round((-30 + rand() * 100) * 100) / 100;
}
function randPP(rand: () => number): number {
  return Math.round((-6 + rand() * 12) * 100) / 100;
}

function generateInventory(): InventorySKU[] {
  const rand = seededRandom(99);
  const skus: InventorySKU[] = [];

  for (let i = 0; i < 50; i++) {
    const avgDailySales = Math.round((2 + rand() * 80) * 10) / 10;
    const leadTimeDays = Math.round(14 + rand() * 60);

    // Determine stock scenario
    const scenarioRoll = rand();
    let currentStock: number;
    let statusHint: StockStatus;

    if (scenarioRoll < 0.08) {
      // Out of stock
      currentStock = 0;
      statusHint = 'Out of Stock';
    } else if (scenarioRoll < 0.20) {
      // Critical — less than 7 days
      currentStock = Math.round(avgDailySales * (1 + rand() * 6));
      statusHint = 'Critical';
    } else if (scenarioRoll < 0.35) {
      // Low stock — 7-21 days
      currentStock = Math.round(avgDailySales * (7 + rand() * 14));
      statusHint = 'Low Stock';
    } else if (scenarioRoll < 0.88) {
      // Healthy
      currentStock = Math.round(avgDailySales * (21 + rand() * 90));
      statusHint = 'In Stock';
    } else {
      // Overstock — 120+ days
      currentStock = Math.round(avgDailySales * (120 + rand() * 180));
      statusHint = 'Overstock';
    }

    const reserved = Math.round(currentStock * (0.05 + rand() * 0.15));
    const available = currentStock - reserved;
    const inbound = rand() < 0.4 ? Math.round(avgDailySales * (14 + rand() * 30)) : 0;

    const daysOfSupply = avgDailySales > 0
      ? Math.round(available / avgDailySales)
      : currentStock > 0 ? 999 : 0;

    const safetyStock = Math.round(avgDailySales * (7 + rand() * 7));
    const reorderPoint = Math.round(avgDailySales * leadTimeDays + safetyStock);

    // Suggested reorder qty: covers 60 days of sales + safety stock - current available - inbound
    const targetCover = Math.round(avgDailySales * 60 + safetyStock);
    const suggestedQty = Math.max(0, targetCover - available - inbound);

    // Stockout date
    let estStockoutDate = '—';
    if (statusHint === 'Out of Stock') {
      estStockoutDate = 'Now';
    } else if (daysOfSupply < 90 && avgDailySales > 0) {
      const d = new Date();
      d.setDate(d.getDate() + daysOfSupply);
      estStockoutDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const revenueAtRisk = statusHint === 'Out of Stock'
      ? Math.round(avgDailySales * 30 * (8 + rand() * 25) * 100) / 100
      : statusHint === 'Critical'
        ? Math.round(avgDailySales * (30 - daysOfSupply) * (8 + rand() * 25) * 100) / 100
        : 0;

    // Performance
    const unitsSold = Math.round(avgDailySales * 30);
    const unitsReceived = Math.round(avgDailySales * 30 * (0.6 + rand() * 0.8));
    const sellThroughRate = (unitsSold + currentStock) > 0
      ? Math.round(unitsSold / (unitsSold + currentStock) * 10000) / 100
      : 0;
    const inventoryTurnover = Math.round((2 + rand() * 10) * 100) / 100;
    const daysOnHand = inventoryTurnover > 0 ? Math.round(365 / inventoryTurnover) : 999;
    const avgUnitCost = 3 + rand() * 20;
    const cogs = Math.round(unitsSold * avgUnitCost * 100) / 100;
    const inventoryValue = Math.round(currentStock * avgUnitCost * 100) / 100;
    const storageCostMonthly = Math.round(currentStock * (0.02 + rand() * 0.08) * 100) / 100;
    const grossProfit = unitsSold * (8 + rand() * 25) - cogs;
    const roi = inventoryValue > 0 ? Math.round(grossProfit / inventoryValue * 10000) / 100 : 0;

    // Aging
    let ageBucket: InventorySKU['ageBucket'];
    if (daysOnHand <= 90) ageBucket = '0-90';
    else if (daysOnHand <= 180) ageBucket = '91-180';
    else if (daysOnHand <= 270) ageBucket = '181-270';
    else if (daysOnHand <= 365) ageBucket = '271-365';
    else ageBucket = '365+';

    // Warehouse breakdown
    const numWarehouses = 2 + Math.floor(rand() * 4);
    const whSelection = warehouseNames
      .map((w) => ({ w, r: rand() }))
      .sort((a, b) => a.r - b.r)
      .slice(0, numWarehouses)
      .map((x) => x.w);

    let remaining = currentStock;
    const warehouses: WarehouseBreakdown[] = whSelection.map((wh, wi) => {
      const isLast = wi === whSelection.length - 1;
      const whStock = isLast ? remaining : Math.round(remaining * (0.15 + rand() * 0.5));
      remaining -= whStock;
      if (remaining < 0) remaining = 0;
      const whReserved = Math.round(whStock * (0.05 + rand() * 0.12));
      return {
        warehouse: wh,
        currentStock: whStock,
        reserved: whReserved,
        available: whStock - whReserved,
        inbound: wi === 0 && inbound > 0 ? inbound : 0,
      };
    });

    skus.push({
      sku: `SKU-${String(i + 1).padStart(3, '0')}`,
      asin: `B0DEMO${String(i + 1).padStart(4, '0')}`,
      title: titles[i % titles.length],
      category: categories[i % categories.length],
      supplier: suppliers[i % suppliers.length],
      currentStock,
      reserved,
      available,
      inbound,
      avgDailySales,
      avgDailySalesPoP: randPoP(rand),
      avgDailySalesDiffLY: randLY(rand),
      daysOfSupply,
      daysOfSupplyPoP: randPoP(rand),
      daysOfSupplyDiffLY: randLY(rand),
      reorderPoint,
      safetyStock,
      suggestedQty,
      leadTimeDays,
      estStockoutDate,
      revenueAtRisk,
      status: statusHint,
      sellThroughRate,
      sellThroughRatePoP: randPP(rand),
      sellThroughRateDiffLY: randPP(rand),
      inventoryTurnover,
      inventoryTurnoverPoP: randPoP(rand),
      inventoryTurnoverDiffLY: randLY(rand),
      daysOnHand,
      unitsSold,
      unitsSoldPoP: randPoP(rand),
      unitsSoldDiffLY: randLY(rand),
      unitsReceived,
      storageCostMonthly,
      storageCostMonthlyPoP: randPoP(rand),
      storageCostMonthlyDiffLY: randLY(rand),
      cogs,
      inventoryValue,
      roi,
      roiPoP: randPoP(rand),
      roiDiffLY: randLY(rand),
      ageBucket,
      warehouses,
      // Placeholders — enrichWithControlTowerFields overwrites these
      marketplace: 'US',
      fulfillmentType: 'FBA',
      weeklyVelocity: [],
      targetMinDays: 30,
      targetMaxDays: 90,
      inboundETA: null,
      isStranded: false,
      isUnfulfillable: false,
    });
  }

  return skus;
}

// Add Control Tower fields using separate seed to preserve existing data
function enrichWithControlTowerFields(skus: InventorySKU[]): InventorySKU[] {
  const rand = seededRandom(42);
  const marketplaceMap: Record<string, Marketplace> = {
    'FBA US': 'US', 'FBA UK': 'UK', 'FBA DE': 'DE',
    'FBA FR': 'FR', 'FBA IT': 'IT', 'FBA ES': 'ES',
  };

  return skus.map((sku) => {
    const marketplace = marketplaceMap[sku.warehouses[0]?.warehouse] || 'US';
    const fulfillmentType: FulfillmentType = rand() < 0.9 ? 'FBA' : 'FBM';

    // Generate 12-week velocity sparkline around avgDailySales * 7
    const weeklyBase = sku.avgDailySales * 7;
    const weeklyVelocity: number[] = [];
    for (let w = 0; w < 12; w++) {
      weeklyVelocity.push(Math.max(0, Math.round(weeklyBase * (0.6 + rand() * 0.8))));
    }

    const targetMinDays = 30;
    const targetMaxDays = 90;

    let inboundETA: string | null = null;
    if (sku.inbound > 0) {
      const etaDays = Math.round(5 + rand() * 25);
      const d = new Date();
      d.setDate(d.getDate() + etaDays);
      inboundETA = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const isStranded = rand() < 0.05;
    const isUnfulfillable = rand() < 0.03;

    return { ...sku, marketplace, fulfillmentType, weeklyVelocity, targetMinDays, targetMaxDays, inboundETA, isStranded, isUnfulfillable };
  });
}

export const inventoryData: InventorySKU[] = enrichWithControlTowerFields(generateInventory());

// ─── Aggregated KPIs ─────────────────────────────────────────────────────────

function computeKPIs(data: InventorySKU[]): InventoryKPI[] {
  const totalSKUs = data.length;
  const inStock = data.filter((d) => d.status === 'In Stock').length;
  const lowStock = data.filter((d) => d.status === 'Low Stock').length;
  const critical = data.filter((d) => d.status === 'Critical').length;
  const outOfStock = data.filter((d) => d.status === 'Out of Stock').length;
  const overstock = data.filter((d) => d.status === 'Overstock').length;
  const totalValue = data.reduce((s, d) => s + d.inventoryValue, 0);
  const totalRevAtRisk = data.reduce((s, d) => s + d.revenueAtRisk, 0);
  const avgDOS = data.filter((d) => d.daysOfSupply < 900).length > 0
    ? Math.round(
        data.filter((d) => d.daysOfSupply < 900).reduce((s, d) => s + d.daysOfSupply, 0) /
        data.filter((d) => d.daysOfSupply < 900).length
      )
    : 0;

  return [
    { label: 'Total SKUs', value: String(totalSKUs), rawValue: totalSKUs, format: 'number', color: 'neutral' },
    { label: 'In Stock', value: String(inStock), rawValue: inStock, format: 'number', color: 'green' },
    { label: 'Low Stock', value: String(lowStock), rawValue: lowStock, format: 'number', color: 'yellow' },
    { label: 'Critical', value: String(critical), rawValue: critical, format: 'number', color: 'orange' },
    { label: 'Out of Stock', value: String(outOfStock), rawValue: outOfStock, format: 'number', color: 'red' },
    { label: 'Overstock', value: String(overstock), rawValue: overstock, format: 'number', color: 'blue' },
    { label: 'Inventory Value', value: '', rawValue: totalValue, format: 'currency', color: 'neutral' },
    { label: 'Avg Days of Supply', value: String(avgDOS), rawValue: avgDOS, format: 'days', color: avgDOS < 21 ? 'orange' : 'green' },
    { label: 'Revenue at Risk', value: '', rawValue: totalRevAtRisk, format: 'currency', color: totalRevAtRisk > 0 ? 'red' : 'green' },
  ];
}

export const inventoryKPIs: InventoryKPI[] = computeKPIs(inventoryData);

// ─── Stock Health Distribution ───────────────────────────────────────────────

export interface StockHealthSegment {
  status: StockStatus;
  count: number;
  pct: number;
  color: string;
  units: number;
  inventoryValue: number;
  avgDaysOfSupply: number;
  revenueAtRisk: number;
  avgDailySales: number;
}

export const stockHealthDistribution: StockHealthSegment[] = (() => {
  const total = inventoryData.length;
  const statusOrder: StockStatus[] = ['In Stock', 'Low Stock', 'Critical', 'Out of Stock', 'Overstock'];
  const colorMap: Record<StockStatus, string> = {
    'In Stock': '#16A34A',
    'Low Stock': '#EAB308',
    'Critical': '#EA580C',
    'Out of Stock': '#DC2626',
    'Overstock': '#3B82F6',
  };

  return statusOrder.map((status) => {
    const items = inventoryData.filter((d) => d.status === status);
    const count = items.length;
    const units = items.reduce((s, d) => s + d.currentStock, 0);
    const inventoryValue = items.reduce((s, d) => s + d.inventoryValue, 0);
    const revenueAtRisk = items.reduce((s, d) => s + d.revenueAtRisk, 0);
    const avgDailySales = count > 0
      ? Math.round(items.reduce((s, d) => s + d.avgDailySales, 0) / count * 10) / 10
      : 0;
    const validDOS = items.filter((d) => d.daysOfSupply < 900);
    const avgDaysOfSupply = validDOS.length > 0
      ? Math.round(validDOS.reduce((s, d) => s + d.daysOfSupply, 0) / validDOS.length)
      : 0;
    return {
      status,
      count,
      pct: Math.round(count / total * 10000) / 100,
      color: colorMap[status],
      units,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      avgDaysOfSupply,
      revenueAtRisk: Math.round(revenueAtRisk * 100) / 100,
      avgDailySales,
    };
  }).filter((s) => s.count > 0);
})();

// ─── Days of Supply by Category ──────────────────────────────────────────────

export interface CategoryDOS {
  category: string;
  avgDaysOfSupply: number;
  skuCount: number;
}

export const categoryDaysOfSupply: CategoryDOS[] = (() => {
  const map = new Map<string, { totalDOS: number; count: number }>();
  for (const d of inventoryData) {
    const dos = d.daysOfSupply < 900 ? d.daysOfSupply : 0;
    const existing = map.get(d.category) || { totalDOS: 0, count: 0 };
    existing.totalDOS += dos;
    existing.count += 1;
    map.set(d.category, existing);
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      avgDaysOfSupply: v.count > 0 ? Math.round(v.totalDOS / v.count) : 0,
      skuCount: v.count,
    }))
    .sort((a, b) => a.avgDaysOfSupply - b.avgDaysOfSupply);
})();

// ─── Aging Buckets ───────────────────────────────────────────────────────────

export const agingBuckets: AgingBucket[] = (() => {
  const buckets = ['0-90', '91-180', '181-270', '271-365', '365+'] as const;
  const totalUnits = inventoryData.reduce((s, d) => s + d.currentStock, 0);
  const feeRates: Record<string, number> = {
    '0-90': 0,
    '91-180': 0,
    '181-270': 0.5,
    '271-365': 1.5,
    '365+': 6.90,
  };

  return buckets.map((bucket) => {
    const items = inventoryData.filter((d) => d.ageBucket === bucket);
    const units = items.reduce((s, d) => s + d.currentStock, 0);
    const value = items.reduce((s, d) => s + d.inventoryValue, 0);
    return {
      bucket,
      units,
      value: Math.round(value * 100) / 100,
      pctOfTotal: totalUnits > 0 ? Math.round(units / totalUnits * 10000) / 100 : 0,
      skuCount: items.length,
      feeRisk: Math.round(units * feeRates[bucket] * 100) / 100,
    };
  });
})();

// ─── Top Priority Alerts ─────────────────────────────────────────────────────

export interface InventoryAlert {
  sku: string;
  title: string;
  status: StockStatus;
  daysOfSupply: number;
  revenueAtRisk: number;
  suggestedAction: string;
}

export const inventoryAlerts: InventoryAlert[] = (() => {
  return inventoryData
    .filter((d) => d.status === 'Out of Stock' || d.status === 'Critical' || (d.status === 'Low Stock' && d.revenueAtRisk > 0))
    .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
    .slice(0, 10)
    .map((d) => ({
      sku: d.sku,
      title: d.title,
      status: d.status,
      daysOfSupply: d.daysOfSupply,
      revenueAtRisk: d.revenueAtRisk,
      suggestedAction:
        d.status === 'Out of Stock'
          ? `Urgent reorder: ${d.suggestedQty} units from ${d.supplier}`
          : d.status === 'Critical'
            ? `Reorder ${d.suggestedQty} units — stockout in ${d.daysOfSupply} days`
            : `Plan reorder of ${d.suggestedQty} units within ${Math.max(0, d.daysOfSupply - d.leadTimeDays)} days`,
    }));
})();

// ─── Control Tower KPIs ─────────────────────────────────────────────────────

export interface ControlTowerKPI {
  key: string;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'days';
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'neutral';
  subtitle?: string;
}

export const controlTowerKPIs: ControlTowerKPI[] = (() => {
  const totalUnits = inventoryData.reduce((s, d) => s + d.currentStock, 0);
  const revAtRisk = inventoryData.reduce((s, d) => s + d.revenueAtRisk, 0);
  const validDOS = inventoryData.filter((d) => d.daysOfSupply < 900);
  const avgDOC = validDOS.length > 0
    ? Math.round(validDOS.reduce((s, d) => s + d.daysOfSupply, 0) / validDOS.length)
    : 0;
  const stranded = inventoryData.filter((d) => d.isStranded).length;
  const unfulfillable = inventoryData.filter((d) => d.isUnfulfillable).length;
  const overstockValue = inventoryData
    .filter((d) => d.status === 'Overstock')
    .reduce((s, d) => s + d.inventoryValue, 0);

  return [
    { key: 'totalUnits', label: 'Total Units', value: totalUnits, format: 'number', color: 'neutral', subtitle: `${inventoryData.length} SKUs` },
    { key: 'revAtRisk', label: 'Revenue at Risk', value: revAtRisk, format: 'currency', color: revAtRisk > 0 ? 'red' : 'green' },
    { key: 'avgDOC', label: 'Avg Days of Cover', value: avgDOC, format: 'days', color: avgDOC < 21 ? 'orange' : 'green' },
    { key: 'stranded', label: 'Stranded SKUs', value: stranded, format: 'number', color: stranded > 0 ? 'orange' : 'green' },
    { key: 'unfulfillable', label: 'Unfulfillable', value: unfulfillable, format: 'number', color: unfulfillable > 0 ? 'red' : 'green' },
    { key: 'overstockValue', label: 'Overstock Value', value: overstockValue, format: 'currency', color: overstockValue > 0 ? 'blue' : 'neutral' },
  ] as ControlTowerKPI[];
})();

// ─── Action Queue ───────────────────────────────────────────────────────────

export interface ActionQueueItem {
  type: 'stockout' | 'stranded' | 'aging-fee' | 'overstock' | 'low-stock';
  priority: 'critical' | 'warning' | 'info';
  sku: string;
  title: string;
  message: string;
  deadline?: string;
}

export const actionQueueItems: ActionQueueItem[] = (() => {
  const items: ActionQueueItem[] = [];

  for (const d of inventoryData) {
    if (d.status === 'Out of Stock') {
      items.push({
        type: 'stockout',
        priority: 'critical',
        sku: d.sku,
        title: d.title,
        message: `Urgent reorder: ${d.suggestedQty} units from ${d.supplier}`,
        deadline: 'ASAP',
      });
    } else if (d.status === 'Critical') {
      items.push({
        type: 'stockout',
        priority: 'critical',
        sku: d.sku,
        title: d.title,
        message: `Reorder ${d.suggestedQty} units — stockout in ${d.daysOfSupply} days`,
        deadline: d.estStockoutDate,
      });
    } else if (d.status === 'Low Stock') {
      items.push({
        type: 'low-stock',
        priority: 'warning',
        sku: d.sku,
        title: d.title,
        message: `Plan reorder of ${d.suggestedQty} units (${d.daysOfSupply} days left)`,
      });
    }
    if (d.isStranded) {
      items.push({
        type: 'stranded',
        priority: 'warning',
        sku: d.sku,
        title: d.title,
        message: 'Listing stranded — fix listing or create removal order',
      });
    }
    if (d.ageBucket === '365+') {
      items.push({
        type: 'aging-fee',
        priority: 'warning',
        sku: d.sku,
        title: d.title,
        message: `Aging 365+ days — $6.90/unit/mo fee risk (${d.currentStock} units)`,
      });
    }
    if (d.status === 'Overstock' && d.daysOfSupply > 180) {
      items.push({
        type: 'overstock',
        priority: 'info',
        sku: d.sku,
        title: d.title,
        message: `${d.daysOfSupply} days of cover — consider removal or promotion`,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
})();

// ─── Inventory Velocity Trend (last 12 weeks) ───────────────────────────────

export interface VelocityWeek {
  week: string;
  unitsSold: number;
  unitsReceived: number;
  stockLevel: number;
}

export const velocityTrend: VelocityWeek[] = (() => {
  const rand = seededRandom(77);
  const weeks: VelocityWeek[] = [];
  let stock = inventoryData.reduce((s, d) => s + d.currentStock, 0);

  for (let w = 12; w >= 1; w--) {
    const sold = Math.round((stock * 0.06 + rand() * stock * 0.04));
    const received = Math.round((stock * 0.04 + rand() * stock * 0.06));
    stock = stock - sold + received;
    weeks.push({
      week: `W${53 - w}`,
      unitsSold: sold,
      unitsReceived: received,
      stockLevel: Math.round(stock),
    });
  }

  return weeks;
})();
