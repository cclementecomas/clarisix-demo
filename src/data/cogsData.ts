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
