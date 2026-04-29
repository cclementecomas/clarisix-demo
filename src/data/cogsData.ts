// ─── COGS Data Model ────────────────────────────────────────────────────────

export type CostingMethod = 'fifo' | 'lifo' | 'wac';

export interface PurchaseOrder {
  id: string;
  date: string;          // YYYY-MM-DD
  supplier: string;
  sku: string;
  asin: string;
  title: string;
  qty: number;
  unitCost: number;      // raw supplier price
  freightPerUnit: number;
  dutiesPerUnit: number;
  otherPerUnit: number;
  landedCost: number;    // unitCost + freight + duties + other
}

export interface CostLayer {
  poId: string;
  date: string;
  sku: string;
  qtyPurchased: number;
  qtyRemaining: number;
  unitCost: number;
  landedCost: number;
}

// ─── COGS Calculation Engine ────────────────────────────────────────────────

export function buildCostLayers(orders: PurchaseOrder[]): Map<string, CostLayer[]> {
  const layers = new Map<string, CostLayer[]>();
  // Sort by date ascending for consistent layer stacking
  const sorted = [...orders].sort((a, b) => a.date.localeCompare(b.date));
  for (const po of sorted) {
    if (!layers.has(po.sku)) layers.set(po.sku, []);
    layers.get(po.sku)!.push({
      poId: po.id,
      date: po.date,
      sku: po.sku,
      qtyPurchased: po.qty,
      qtyRemaining: po.qty,
      unitCost: po.unitCost,
      landedCost: po.landedCost,
    });
  }
  return layers;
}

export interface COGSResult {
  totalCOGS: number;
  unitsConsumed: number;
  remainingLayers: CostLayer[];
}

/** Consume `unitsSold` from layers using FIFO (oldest first). */
export function consumeFIFO(layers: CostLayer[], unitsSold: number): COGSResult {
  const remaining = layers.map((l) => ({ ...l }));
  let cogs = 0;
  let consumed = 0;
  let left = unitsSold;

  for (const layer of remaining) {
    if (left <= 0) break;
    const take = Math.min(layer.qtyRemaining, left);
    cogs += take * layer.landedCost;
    layer.qtyRemaining -= take;
    consumed += take;
    left -= take;
  }

  return { totalCOGS: Math.round(cogs * 100) / 100, unitsConsumed: consumed, remainingLayers: remaining };
}

/** Consume `unitsSold` from layers using LIFO (newest first). */
export function consumeLIFO(layers: CostLayer[], unitsSold: number): COGSResult {
  const remaining = layers.map((l) => ({ ...l }));
  let cogs = 0;
  let consumed = 0;
  let left = unitsSold;

  for (let i = remaining.length - 1; i >= 0; i--) {
    if (left <= 0) break;
    const layer = remaining[i];
    const take = Math.min(layer.qtyRemaining, left);
    cogs += take * layer.landedCost;
    layer.qtyRemaining -= take;
    consumed += take;
    left -= take;
  }

  return { totalCOGS: Math.round(cogs * 100) / 100, unitsConsumed: consumed, remainingLayers: remaining };
}

/** Consume `unitsSold` using Weighted Average Cost. */
export function consumeWAC(layers: CostLayer[], unitsSold: number): COGSResult {
  const remaining = layers.map((l) => ({ ...l }));
  const totalQty = remaining.reduce((s, l) => s + l.qtyRemaining, 0);
  const totalValue = remaining.reduce((s, l) => s + l.qtyRemaining * l.landedCost, 0);
  const avgCost = totalQty > 0 ? totalValue / totalQty : 0;

  const consumed = Math.min(unitsSold, totalQty);
  const cogs = consumed * avgCost;

  // Deplete proportionally
  if (totalQty > 0) {
    const ratio = consumed / totalQty;
    for (const layer of remaining) {
      const take = Math.round(layer.qtyRemaining * ratio);
      layer.qtyRemaining -= take;
    }
  }

  return { totalCOGS: Math.round(cogs * 100) / 100, unitsConsumed: consumed, remainingLayers: remaining };
}

/** Dispatch to the right method. */
export function consumeCOGS(method: CostingMethod, layers: CostLayer[], unitsSold: number): COGSResult {
  switch (method) {
    case 'fifo': return consumeFIFO(layers, unitsSold);
    case 'lifo': return consumeLIFO(layers, unitsSold);
    case 'wac':  return consumeWAC(layers, unitsSold);
  }
}

/** Get current unit cost for inventory valuation based on method. */
export function getCurrentUnitCost(method: CostingMethod, layers: CostLayer[]): number {
  const active = layers.filter((l) => l.qtyRemaining > 0);
  if (active.length === 0) return 0;

  switch (method) {
    case 'fifo':
      return active[0].landedCost; // oldest remaining
    case 'lifo':
      return active[active.length - 1].landedCost; // newest remaining
    case 'wac': {
      const totalQty = active.reduce((s, l) => s + l.qtyRemaining, 0);
      const totalVal = active.reduce((s, l) => s + l.qtyRemaining * l.landedCost, 0);
      return totalQty > 0 ? Math.round((totalVal / totalQty) * 100) / 100 : 0;
    }
  }
}

/** Get total inventory value from remaining layers (exact, method-independent). */
export function getInventoryValue(layers: CostLayer[]): number {
  return Math.round(layers.reduce((s, l) => s + l.qtyRemaining * l.landedCost, 0) * 100) / 100;
}

// ─── Demo Purchase Order Data ───────────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Self-contained SKU seed data (avoids circular dependency with inventoryData)
const SKU_TITLES = [
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
const SKU_SUPPLIERS = [
  'ShenZhen Mfg Co.', 'GreenLeaf Supplies', 'Pacific Trade Ltd.',
  'EuroSource GmbH', 'Nordic Direct', 'Atlas Imports',
  'Silk Road Trading', 'PrimeMaker Inc.',
];

interface SkuSeed { sku: string; asin: string; title: string; supplier: string; unitCost: number; avgDailySales: number }

const skuSeeds: SkuSeed[] = (() => {
  // Mirror the same seeded random as inventoryData so SKU fields align
  function seededRandom(seed: number): () => number {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }
  const rand = seededRandom(99);
  const seeds: SkuSeed[] = [];
  for (let i = 0; i < 50; i++) {
    const avgDailySales = Math.round((2 + rand() * 80) * 10) / 10;
    // Burn the same random calls that inventoryData uses so the sequence stays in sync
    rand(); // leadTimeDays
    rand(); // scenarioRoll
    // Burn stock/status randoms (variable count depending on scenario — use fixed burns for seed alignment)
    rand(); rand(); rand(); rand(); rand(); rand(); rand(); rand();
    // unitCost: approximate from the same range inventoryData uses
    const unitCost = Math.round((3 + rand() * 20) * 100) / 100;
    seeds.push({
      sku: `SKU-${String(i + 1).padStart(3, '0')}`,
      asin: `B0DEMO${String(i + 1).padStart(4, '0')}`,
      title: SKU_TITLES[i % SKU_TITLES.length],
      supplier: SKU_SUPPLIERS[i % SKU_SUPPLIERS.length],
      unitCost,
      avgDailySales,
    });
  }
  return seeds;
})();

function makePO(
  id: string, date: string, supplier: string, sku: string, asin: string, title: string,
  qty: number, unitCost: number, freight: number, duties: number, other: number,
): PurchaseOrder {
  return {
    id, date, supplier, sku, asin, title, qty, unitCost,
    freightPerUnit: freight, dutiesPerUnit: duties, otherPerUnit: other,
    landedCost: Math.round((unitCost + freight + duties + other) * 100) / 100,
  };
}

export const purchaseOrders: PurchaseOrder[] = (() => {
  const rng = seededRng(2026);
  const pos: PurchaseOrder[] = [];
  let poNum = 1;

  const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];

  for (const d of skuSeeds) {
    const numPOs = 3 + Math.floor(rng() * 3);
    const selectedMonths = months
      .filter(() => rng() < numPOs / months.length)
      .slice(0, numPOs);

    while (selectedMonths.length < 3) {
      const m = months[Math.floor(rng() * months.length)];
      if (!selectedMonths.includes(m)) selectedMonths.push(m);
    }
    selectedMonths.sort();

    const baseCost = d.unitCost * (0.35 + rng() * 0.15);
    const freight = Math.round(baseCost * (0.03 + rng() * 0.04) * 100) / 100;
    const duties = Math.round(baseCost * (0.02 + rng() * 0.05) * 100) / 100;
    const other = Math.round(baseCost * rng() * 0.02 * 100) / 100;

    for (const month of selectedMonths) {
      const day = String(1 + Math.floor(rng() * 28)).padStart(2, '0');
      const date = `${month}-${day}`;
      const costVariation = 1 + (rng() - 0.5) * 0.10;
      const cost = Math.round(baseCost * costVariation * 100) / 100;
      const qty = Math.round((d.avgDailySales * (14 + rng() * 42)) * (0.8 + rng() * 0.4));

      pos.push(makePO(
        `PO-${String(poNum++).padStart(4, '0')}`,
        date,
        d.supplier,
        d.sku,
        d.asin,
        d.title,
        Math.max(10, qty),
        cost,
        freight,
        duties,
        other,
      ));
    }
  }

  return pos.sort((a, b) => a.date.localeCompare(b.date));
})();

// Pre-built cost layers from demo data
export const demoCostLayers = buildCostLayers(purchaseOrders);

// ─── COGS Coverage Agent Model ──────────────────────────────────────────────

export type CostSource = 'manual' | 'paste' | 'csv' | 'inbound' | 'builder' | 'api';
export type CostConfidence = 'high' | 'medium' | 'low';
export type CostMarketplace = 'all' | 'US' | 'UK' | 'DE' | 'FR' | 'IT' | 'ES' | 'CA';
export type CostCurrency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'CAD' | 'AUD';

export interface CostRecord {
  id: string;
  sku: string;
  marketplace: CostMarketplace;     // 'all' = global default
  landedCost: number;
  currency: CostCurrency;
  effectiveFrom: string | null;     // null = "all time"
  effectiveTo: string | null;       // null = open-ended
  source: CostSource;
  confidence: CostConfidence;
  createdAt: string;
  reason?: string;
  breakdown?: { unitCost?: number; freight?: number; duties?: number; other?: number };
}

export type SkuCoverageStatus =
  | 'costed'              // has a current cost record
  | 'needs-cost-active'   // sold recently, no cost
  | 'needs-cost-inventory'// has FBA inventory, no cost
  | 'needs-cost-inbound'  // inbound shipment received, no cost
  | 'dormant'             // no activity, no cost
  | 'ignored';            // user dismissed

export interface InboundEvent {
  id: string;
  sku: string;
  date: string;
  quantity: number;
  shipmentId: string;
}

export interface InboundCluster {
  sku: string;
  events: InboundEvent[];
  totalQty: number;
  firstDate: string;
  lastDate: string;
  previousCost: number | null;
  previousCurrency: CostCurrency | null;
  reviewed: boolean;
}

export interface SkuCostProfile {
  sku: string;
  asin: string;
  title: string;
  marketplaces: CostMarketplace[];   // marketplaces this SKU is sold in
  costRecords: CostRecord[];
  inboundEvents: InboundEvent[];
  // 90-day signals
  revenue90d: number;
  units90d: number;
  // Inventory signals
  fbaInventory: number;
  inboundUnits: number;
  // Status
  status: SkuCoverageStatus;
  // Resolved current cost (uses 'all' fallback when marketplace-specific not found)
  currentCost: number | null;
  currentCurrency: CostCurrency | null;
  hasMarketplaceOverrides: boolean;
}

// ─── Coverage Calculations ──────────────────────────────────────────────────

export interface CoverageMetrics {
  revenueCoverage: number;       // % of 90d revenue with cost set
  unitsCoverage: number;          // % of 90d units with cost set
  activeSkuCoverage: number;      // % of active SKUs with cost set
  totalRevenue90d: number;
  coveredRevenue90d: number;
  uncoveredRevenue90d: number;
  totalUnits90d: number;
  coveredUnits90d: number;
  activeSkus: number;
  costedActiveSkus: number;
  needsCostCount: number;
  topRevenueGap: number;          // # of SKUs to fix to reach 90% coverage
  inboundReviewCount: number;
  dormantCount: number;
}

export function computeCoverage(profiles: SkuCostProfile[]): CoverageMetrics {
  const active = profiles.filter((p) => p.revenue90d > 0 || p.fbaInventory > 0 || p.inboundUnits > 0);
  const totalRevenue = active.reduce((s, p) => s + p.revenue90d, 0);
  const coveredRevenue = active.filter((p) => p.currentCost !== null).reduce((s, p) => s + p.revenue90d, 0);
  const totalUnits = active.reduce((s, p) => s + p.units90d, 0);
  const coveredUnits = active.filter((p) => p.currentCost !== null).reduce((s, p) => s + p.units90d, 0);
  const costedActive = active.filter((p) => p.currentCost !== null).length;

  const needsCostCount = profiles.filter(
    (p) => p.status === 'needs-cost-active' || p.status === 'needs-cost-inventory' || p.status === 'needs-cost-inbound'
  ).length;
  const dormantCount = profiles.filter((p) => p.status === 'dormant').length;

  // Top revenue gap: number of SKUs needed to reach 90% revenue coverage
  const sortedUncovered = active
    .filter((p) => p.currentCost === null)
    .sort((a, b) => b.revenue90d - a.revenue90d);
  const target = totalRevenue * 0.9;
  let running = coveredRevenue;
  let gap = 0;
  for (const p of sortedUncovered) {
    if (running >= target) break;
    running += p.revenue90d;
    gap += 1;
  }

  return {
    revenueCoverage: totalRevenue > 0 ? Math.round((coveredRevenue / totalRevenue) * 100) : 100,
    unitsCoverage: totalUnits > 0 ? Math.round((coveredUnits / totalUnits) * 100) : 100,
    activeSkuCoverage: active.length > 0 ? Math.round((costedActive / active.length) * 100) : 100,
    totalRevenue90d: Math.round(totalRevenue),
    coveredRevenue90d: Math.round(coveredRevenue),
    uncoveredRevenue90d: Math.round(totalRevenue - coveredRevenue),
    totalUnits90d: totalUnits,
    coveredUnits90d: coveredUnits,
    activeSkus: active.length,
    costedActiveSkus: costedActive,
    needsCostCount,
    topRevenueGap: gap,
    inboundReviewCount: profiles.filter((p) => p.inboundEvents.length > 0 && p.currentCost === null).length,
    dormantCount,
  };
}

export function resolveCurrentCost(
  records: CostRecord[],
  marketplace: CostMarketplace = 'all',
  asOfDate?: string
): CostRecord | null {
  if (records.length === 0) return null;
  const today = asOfDate || new Date().toISOString().slice(0, 10);

  const applies = (r: CostRecord) =>
    (!r.effectiveFrom || r.effectiveFrom <= today) &&
    (!r.effectiveTo || r.effectiveTo >= today);

  // Prefer marketplace-specific
  if (marketplace !== 'all') {
    const mkSpecific = records
      .filter((r) => r.marketplace === marketplace && applies(r))
      .sort((a, b) => (b.effectiveFrom || '').localeCompare(a.effectiveFrom || ''));
    if (mkSpecific.length > 0) return mkSpecific[0];
  }

  // Fall back to global ('all')
  const global = records
    .filter((r) => r.marketplace === 'all' && applies(r))
    .sort((a, b) => (b.effectiveFrom || '').localeCompare(a.effectiveFrom || ''));
  return global[0] || null;
}

export function buildSkuCostProfiles(
  inventoryItems: Array<{
    sku: string;
    asin: string;
    title: string;
    marketplace: CostMarketplace;
    avgDailySales: number;
    unitsSold: number;
    currentStock: number;
    inbound: number;
  }>,
  costRecords: CostRecord[],
  inboundEvents: InboundEvent[],
  ignoredSkus: Set<string> = new Set(),
): SkuCostProfile[] {
  const recordsBySku = new Map<string, CostRecord[]>();
  for (const r of costRecords) {
    if (!recordsBySku.has(r.sku)) recordsBySku.set(r.sku, []);
    recordsBySku.get(r.sku)!.push(r);
  }
  const inboundBySku = new Map<string, InboundEvent[]>();
  for (const e of inboundEvents) {
    if (!inboundBySku.has(e.sku)) inboundBySku.set(e.sku, []);
    inboundBySku.get(e.sku)!.push(e);
  }

  return inventoryItems.map((item) => {
    const records = recordsBySku.get(item.sku) || [];
    const inbound = inboundBySku.get(item.sku) || [];
    const current = resolveCurrentCost(records, item.marketplace);

    // 90-day estimates from avgDailySales
    const units90d = Math.round(item.avgDailySales * 90);
    const aspEstimate = current ? current.landedCost * 2.6 : 14 + (item.avgDailySales % 17);
    const revenue90d = Math.round(units90d * aspEstimate);

    const hasOverrides = records.some((r) => r.marketplace !== 'all');

    let status: SkuCoverageStatus;
    if (ignoredSkus.has(item.sku)) {
      status = 'ignored';
    } else if (current !== null) {
      status = 'costed';
    } else if (item.unitsSold > 0 || item.avgDailySales > 0) {
      status = 'needs-cost-active';
    } else if (inbound.length > 0) {
      status = 'needs-cost-inbound';
    } else if (item.currentStock > 0) {
      status = 'needs-cost-inventory';
    } else {
      status = 'dormant';
    }

    return {
      sku: item.sku,
      asin: item.asin,
      title: item.title,
      marketplaces: ['all'],
      costRecords: records,
      inboundEvents: inbound,
      revenue90d,
      units90d,
      fbaInventory: item.currentStock,
      inboundUnits: item.inbound,
      status,
      currentCost: current?.landedCost ?? null,
      currentCurrency: current?.currency ?? null,
      hasMarketplaceOverrides: hasOverrides,
    };
  });
}

// ─── Demo Cost Records & Inbound Events ────────────────────────────────────

// Generate initial cost records: most active SKUs costed from PO data,
// but intentionally leave ~12-15 SKUs uncosted to demonstrate the workflow.
export function buildDemoCostRecords(): CostRecord[] {
  const records: CostRecord[] = [];
  // Skus that should NOT have a cost — chosen to be a mix of active & inventory
  const uncostedSkus = new Set([
    'SKU-005', 'SKU-009', 'SKU-014', 'SKU-019', 'SKU-023',
    'SKU-027', 'SKU-031', 'SKU-035', 'SKU-040', 'SKU-044',
    'SKU-048',
  ]);

  let recordIdSeq = 1;

  for (const [sku, layers] of demoCostLayers.entries()) {
    if (uncostedSkus.has(sku)) continue;
    if (layers.length === 0) continue;

    // Most recent layer = current global cost
    const latest = layers[layers.length - 1];
    records.push({
      id: `CR-${String(recordIdSeq++).padStart(4, '0')}`,
      sku,
      marketplace: 'all',
      landedCost: latest.landedCost,
      currency: 'USD',
      effectiveFrom: null,
      effectiveTo: null,
      source: 'manual',
      confidence: 'high',
      createdAt: latest.date,
    });

    // For ~20% of SKUs, add a marketplace override and a cost change
    const skuIndex = parseInt(sku.replace('SKU-', ''), 10);
    if (skuIndex % 7 === 0) {
      records.push({
        id: `CR-${String(recordIdSeq++).padStart(4, '0')}`,
        sku,
        marketplace: 'UK',
        landedCost: Math.round(latest.landedCost * 1.18 * 100) / 100,
        currency: 'GBP',
        effectiveFrom: '2026-01-01',
        effectiveTo: null,
        source: 'manual',
        confidence: 'high',
        createdAt: '2026-01-01',
        reason: 'Higher UK duties and freight',
      });
    }
    if (skuIndex % 11 === 0 && layers.length > 1) {
      const earlier = layers[0];
      records.push({
        id: `CR-${String(recordIdSeq++).padStart(4, '0')}`,
        sku,
        marketplace: 'all',
        landedCost: earlier.landedCost,
        currency: 'USD',
        effectiveFrom: null,
        effectiveTo: '2025-12-31',
        source: 'csv',
        confidence: 'high',
        createdAt: earlier.date,
      });
    }
  }

  // Backdate createdAt slightly so "Last edited" looks varied
  return records;
}

// Generate inbound events spanning the last ~60 days. Some SKUs get
// multi-shipment "replenishment waves," others a single shipment.
export function buildDemoInboundEvents(): InboundEvent[] {
  const events: InboundEvent[] = [];
  const rand = seededRng(7777);

  // Pick ~18 SKUs with recent inbound activity
  const allSkus = Array.from(demoCostLayers.keys());
  const inboundSkus = allSkus.filter((_, i) => i % 3 === 0).slice(0, 18);

  let eventSeq = 1;
  const today = new Date('2026-04-29');

  for (const sku of inboundSkus) {
    const numShipments = 1 + Math.floor(rand() * 3); // 1-3 shipments
    const baseDaysAgo = 5 + Math.floor(rand() * 30);

    for (let i = 0; i < numShipments; i++) {
      const daysAgo = baseDaysAgo + i * (1 + Math.floor(rand() * 4));
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const date = d.toISOString().slice(0, 10);
      const qty = 200 + Math.floor(rand() * 1500);
      events.push({
        id: `INB-${String(eventSeq++).padStart(4, '0')}`,
        sku,
        date,
        quantity: qty,
        shipmentId: `FBA${Math.floor(rand() * 9_000_000 + 1_000_000)}`,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function clusterInboundEvents(events: InboundEvent[]): InboundCluster[] {
  const bySku = new Map<string, InboundEvent[]>();
  for (const e of events) {
    if (!bySku.has(e.sku)) bySku.set(e.sku, []);
    bySku.get(e.sku)!.push(e);
  }
  const clusters: InboundCluster[] = [];
  for (const [sku, list] of bySku) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const totalQty = list.reduce((s, e) => s + e.quantity, 0);
    const layers = demoCostLayers.get(sku);
    const previousCost = layers && layers.length > 0
      ? layers[layers.length - 1].landedCost
      : null;
    clusters.push({
      sku,
      events: list,
      totalQty,
      firstDate: list[0].date,
      lastDate: list[list.length - 1].date,
      previousCost,
      previousCurrency: previousCost !== null ? 'USD' : null,
      reviewed: false,
    });
  }
  return clusters.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export const demoCostRecords = buildDemoCostRecords();
export const demoInboundEvents = buildDemoInboundEvents();
export const demoInboundClusters = clusterInboundEvents(demoInboundEvents);

// ─── Column Mapping Aliases (forgiving import) ─────────────────────────────

export const COLUMN_ALIASES: Record<string, string[]> = {
  sku: ['sku', 'seller sku', 'amazon sku', 'msku', 'merchant sku', 'product sku', 'item sku'],
  asin: ['asin', 'amazon asin', 'product id'],
  landedCost: ['landed cost', 'landed_cost', 'cost', 'cogs', 'unit landed', 'product cost', 'unit cost', 'price', 'total cost'],
  currency: ['currency', 'cur', 'ccy'],
  marketplace: ['marketplace', 'country', 'market', 'region', 'mkt'],
  effectiveFrom: ['effective from', 'effective_from', 'start date', 'start_date', 'from date', 'date', 'effective'],
  effectiveTo: ['effective to', 'effective_to', 'end date', 'end_date', 'to date'],
  quantity: ['quantity', 'qty', 'units', 'amount'],
  receivedDate: ['received date', 'received_date', 'received', 'arrival date'],
  batchId: ['batch id', 'batch_id', 'po', 'po number', 'po_number', 'lot'],
  freight: ['freight', 'freight per unit', 'shipping', 'shipping per unit'],
  duties: ['duties', 'duties per unit', 'tariff', 'tariffs'],
  other: ['other', 'other per unit', 'fees', 'misc'],
};

export function detectColumn(header: string): keyof typeof COLUMN_ALIASES | null {
  const norm = header.trim().toLowerCase();
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(norm)) return key as keyof typeof COLUMN_ALIASES;
  }
  return null;
}

export const MARKETPLACE_LABELS: Record<CostMarketplace, string> = {
  all: 'All marketplaces',
  US: 'United States',
  UK: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  CA: 'Canada',
};
