// ─── Profitability Deepdive Data (CFO-Level P&L per Product) ─────────────────
// Aligned with Clarisix Amazon P&L Architecture Spec (43-line waterfall)

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(55);

function randPoP(): number { return Math.round((rand() * 70 - 30) * 100) / 100; }
function randLY(): number { return Math.round((rand() * 160 - 40) * 100) / 100; }
function randPP(): number { return Math.round((rand() * 16 - 8) * 100) / 100; }

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProductProfitRow {
  asin: string;
  product: string;
  category: string;

  // ── REVENUE SECTION ────────────────────────────────────────────────────
  unitsSold: number; unitsSoldPoP: number; unitsSoldDiffLY: number;
  avgPrice: number; avgPricePoP: number; avgPriceDiffLY: number;
  grossRevenue: number; grossRevenuePoP: number; grossRevenueDiffLY: number;
  refundsAndReturns: number; refundsAndReturnsPoP: number; refundsAndReturnsDiffLY: number;
  netRevenue: number; netRevenuePoP: number; netRevenueDiffLY: number;

  // ── COGS SECTION ───────────────────────────────────────────────────────
  netCogs: number; netCogsPoP: number; netCogsDiffLY: number;

  // ── GROSS PROFIT ───────────────────────────────────────────────────────
  grossProfit: number; grossProfitPoP: number; grossProfitDiffLY: number;
  grossMargin: number; grossMarginPoP: number; grossMarginDiffLY: number;

  // ── AMAZON FEES (total of 13 sub-items) ────────────────────────────────
  totalAmazonFees: number; totalAmazonFeesPoP: number; totalAmazonFeesDiffLY: number;

  // ── ADVERTISING (SP + SB + SD + DSP + Deal/Coupon/Promo) ──────────────
  totalAdvertising: number; totalAdvertisingPoP: number; totalAdvertisingDiffLY: number;

  // ── REIMBURSEMENTS (Inventory + SAFE-T + Other) ────────────────────────
  totalReimbursements: number; totalReimbursementsPoP: number; totalReimbursementsDiffLY: number;

  // ── CONTRIBUTION PROFIT ────────────────────────────────────────────────
  contributionProfit: number; contributionProfitPoP: number; contributionProfitDiffLY: number;
  contributionMargin: number; contributionMarginPoP: number; contributionMarginDiffLY: number;

  // ── OVERHEADS & NET OPERATING PROFIT ───────────────────────────────────
  allocatedOverheads: number; allocatedOverheadsPoP: number; allocatedOverheadsDiffLY: number;
  netOperatingProfit: number; netOperatingProfitPoP: number; netOperatingProfitDiffLY: number;
  netMargin: number; netMarginPoP: number; netMarginDiffLY: number;

  // ── UNIT ECONOMICS ─────────────────────────────────────────────────────
  profitPerUnit: number; profitPerUnitPoP: number; profitPerUnitDiffLY: number;

  // ── EFFICIENCY METRICS ─────────────────────────────────────────────────
  acos: number; acosPoP: number; acosDiffLY: number;
  tacos: number; tacosPoP: number; tacosDiffLY: number;
  roas: number; roasPoP: number; roasDiffLY: number;
  returnRate: number; returnRatePoP: number; returnRateDiffLY: number;
  refundRate: number; refundRatePoP: number; refundRateDiffLY: number;
}

export interface SKUProfitRow extends ProductProfitRow {
  sku: string;
}

// ─── Reference data ─────────────────────────────────────────────────────────

const products: { asin: string; product: string; category: string; skus: string[] }[] = [
  { asin: 'B0DEMO001X', product: 'Everyday Essentials Pack M/L', category: 'Wellness', skus: ['SKU-01A', 'SKU-01B'] },
  { asin: 'B0DEMO002X', product: 'Premium Container Set Blue', category: 'Home & Kitchen', skus: ['SKU-02A', 'SKU-02B'] },
  { asin: 'B0DEMO003X', product: 'Smart Device Pro 740 Black', category: 'Electronics', skus: ['SKU-03A', 'SKU-03B'] },
  { asin: 'B0DEMO004X', product: 'Smart Device Lite X3', category: 'Electronics', skus: ['SKU-04A', 'SKU-04B'] },
  { asin: 'B0DEMO005X', product: 'Classic Carry Bag Small', category: 'Fashion', skus: ['SKU-05A', 'SKU-05B'] },
  { asin: 'B0DEMO006X', product: 'Daily Wellness Drops 50ml', category: 'Wellness', skus: ['SKU-06A', 'SKU-06B'] },
  { asin: 'B0DEMO007X', product: 'Protective Cover Ultra', category: 'Accessories', skus: ['SKU-07A', 'SKU-07B'] },
  { asin: 'B0DEMO008X', product: 'Fast Charger 30W Compact', category: 'Electronics', skus: ['SKU-08A', 'SKU-08B'] },
  { asin: 'B0DEMO009X', product: 'Clear Shield 2-Pack', category: 'Accessories', skus: ['SKU-09A', 'SKU-09B'] },
  { asin: 'B0DEMO010X', product: 'Compact Travel Pouch', category: 'Fashion', skus: ['SKU-10A', 'SKU-10B'] },
  { asin: 'B0DEMO011X', product: 'Organic Green Tea 100g', category: 'Grocery', skus: ['SKU-11A'] },
  { asin: 'B0DEMO012X', product: 'Bamboo Cutting Board Set', category: 'Home & Kitchen', skus: ['SKU-12A', 'SKU-12B'] },
  { asin: 'B0DEMO013X', product: 'LED Desk Lamp USB', category: 'Electronics', skus: ['SKU-13A'] },
  { asin: 'B0DEMO014X', product: 'Memory Foam Travel Pillow', category: 'Fashion', skus: ['SKU-14A', 'SKU-14B'] },
  { asin: 'B0DEMO015X', product: 'Silicone Utensil Set 12pc', category: 'Home & Kitchen', skus: ['SKU-15A'] },
  { asin: 'B0DEMO016X', product: 'Bluetooth Speaker Waterproof', category: 'Electronics', skus: ['SKU-16A', 'SKU-16B'] },
  { asin: 'B0DEMO017X', product: 'Vitamin D3 5000 IU 360ct', category: 'Wellness', skus: ['SKU-17A'] },
  { asin: 'B0DEMO018X', product: 'Resistance Bands Set', category: 'Fitness', skus: ['SKU-18A', 'SKU-18B'] },
  { asin: 'B0DEMO019X', product: 'Ceramic Mug with Lid 400ml', category: 'Home & Kitchen', skus: ['SKU-19A'] },
  { asin: 'B0DEMO020X', product: 'USB-C Cable 2m 3-Pack', category: 'Electronics', skus: ['SKU-20A'] },
];

// ─── Row generation (follows spec P&L waterfall logic) ──────────────────────

function generateRow(asin: string, product: string, category: string, scale: number): ProductProfitRow {
  const unitsSold = Math.round(150 + rand() * 900 * scale);
  const avgPrice = Math.round((15 + rand() * 45) * 100) / 100;

  // ═══ REVENUE (Spec lines 1-11) ════════════════════════════════════════════
  const grossOrderedRevenue = Math.round(unitsSold * avgPrice * 100) / 100;
  const cancelledOrders = Math.round(grossOrderedRevenue * (0.01 + rand() * 0.03) * 100) / 100;
  const grossShippedRevenue = Math.round((grossOrderedRevenue - cancelledOrders) * 100) / 100;

  const returnRate = Math.round((2 + rand() * 12) * 10) / 10;
  const refundAmount = Math.round(grossShippedRevenue * (returnRate / 100) * 100) / 100;
  const atozClaims = Math.round(grossShippedRevenue * (rand() * 0.005) * 100) / 100;
  const chargebacks = Math.round(grossShippedRevenue * (rand() * 0.003) * 100) / 100;
  const refundsAndReturns = Math.round((refundAmount + atozClaims + chargebacks) * 100) / 100;
  const refundRate = grossShippedRevenue > 0
    ? Math.round((refundAmount / grossShippedRevenue) * 10000) / 100
    : 0;

  const netProductRevenue = Math.round((grossShippedRevenue - refundsAndReturns) * 100) / 100;
  const shippingRevenue = Math.round(unitsSold * (2 + rand() * 3) * 100) / 100;
  const giftWrapRevenue = Math.round(unitsSold * rand() * 0.5 * 100) / 100;
  const shippingRefunds = Math.round(shippingRevenue * (returnRate / 100) * 100) / 100;
  const netRevenue = Math.round((netProductRevenue + shippingRevenue + giftWrapRevenue - shippingRefunds) * 100) / 100;

  // Use grossOrderedRevenue as the display "Gross Revenue"
  const grossRevenue = grossOrderedRevenue;

  // ═══ COGS (Spec lines 12-15) ══════════════════════════════════════════════
  const costPerUnit = Math.round(avgPrice * (0.25 + rand() * 0.15) * 100) / 100;
  const productCost = Math.round(unitsSold * costPerUnit * 100) / 100;
  const inboundShippingPerUnit = Math.round((0.5 + rand() * 2) * 100) / 100;
  const inboundShipping = Math.round(unitsSold * inboundShippingPerUnit * 100) / 100;
  const returnedUnits = Math.round(unitsSold * returnRate / 100);
  const cogsOnReturns = Math.round(returnedUnits * costPerUnit * 0.6 * 100) / 100;
  const netCogs = Math.round((productCost + inboundShipping - cogsOnReturns) * 100) / 100;

  // ═══ GROSS PROFIT (Spec line 16) ══════════════════════════════════════════
  const grossProfit = Math.round((netRevenue - netCogs) * 100) / 100;
  const grossMargin = netRevenue > 0
    ? Math.round((grossProfit / netRevenue) * 10000) / 100
    : 0;

  // ═══ AMAZON FEES (Spec lines 17-30) ═══════════════════════════════════════
  const referralFees = Math.round(netRevenue * (0.13 + rand() * 0.04) * 100) / 100;
  const fbaFulfillment = Math.round(unitsSold * (3 + rand() * 3) * 100) / 100;
  const weightHandling = Math.round(unitsSold * (0.3 + rand() * 0.5) * 100) / 100;
  const monthlyStorage = Math.round(unitsSold * (0.2 + rand() * 0.3) * 100) / 100;
  const longTermStorage = Math.round(unitsSold * rand() * 0.1 * 100) / 100;
  const inboundPlacement = Math.round(unitsSold * rand() * 0.2 * 100) / 100;
  const subscriptionFees = Math.round(rand() * 15 * 100) / 100;
  const variableClosing = Math.round(unitsSold * rand() * 0.15 * 100) / 100;
  const refundAdmin = Math.round(refundAmount * 0.2 * 100) / 100;
  const removalDisposal = Math.round(rand() * 20 * 100) / 100;
  const returnProcessing = Math.round(returnedUnits * (0.5 + rand() * 1.5) * 100) / 100;
  const otherFees = Math.round(netRevenue * (rand() * 0.005) * 100) / 100;
  const feeRefunds = Math.round((referralFees + fbaFulfillment) * (returnRate / 100) * 0.8 * 100) / 100;
  const totalAmazonFees = Math.round((
    referralFees + fbaFulfillment + weightHandling + monthlyStorage + longTermStorage
    + inboundPlacement + subscriptionFees + variableClosing + refundAdmin
    + removalDisposal + returnProcessing + otherFees - feeRefunds
  ) * 100) / 100;

  // ═══ ADVERTISING (Spec lines 31-36) ═══════════════════════════════════════
  const adRate = 0.05 + rand() * 0.15;
  const totalAdBudget = Math.round(grossRevenue * adRate * 100) / 100;
  // Split across ad types
  const spShare = 0.50 + rand() * 0.15;
  const sbShare = 0.15 + rand() * 0.10;
  const sdShare = 0.05 + rand() * 0.10;
  const dspShare = rand() * 0.08;
  const totalShare = spShare + sbShare + sdShare + dspShare;
  const _spSpend = Math.round(totalAdBudget * (spShare / totalShare) * 100) / 100;
  const _sbSpend = Math.round(totalAdBudget * (sbShare / totalShare) * 100) / 100;
  const _sdSpend = Math.round(totalAdBudget * (sdShare / totalShare) * 100) / 100;
  const _dspSpend = Math.round(totalAdBudget * (dspShare / totalShare) * 100) / 100;
  const dealCouponPromo = Math.round(grossRevenue * (rand() * 0.02) * 100) / 100;
  const totalAdvertising = Math.round((_spSpend + _sbSpend + _sdSpend + _dspSpend + dealCouponPromo) * 100) / 100;

  // Ad-attributed revenue for ACOS/ROAS
  const adAttributedRevenue = Math.round(grossRevenue * (0.3 + rand() * 0.4) * 100) / 100;

  // ═══ REIMBURSEMENTS (Spec lines 37-40) ════════════════════════════════════
  const inventoryReimb = Math.round(productCost * (rand() * 0.03) * 100) / 100;
  const safetClaims = Math.round(rand() * 50 * 100) / 100;
  const otherAdjustments = Math.round(rand() * 30 * 100) / 100;
  const totalReimbursements = Math.round((inventoryReimb + safetClaims + otherAdjustments) * 100) / 100;

  // ═══ CONTRIBUTION PROFIT (Spec line 41) ═══════════════════════════════════
  const contributionProfit = Math.round((
    grossProfit - totalAmazonFees - totalAdvertising + totalReimbursements
  ) * 100) / 100;
  const contributionMargin = netRevenue > 0
    ? Math.round((contributionProfit / netRevenue) * 10000) / 100
    : 0;

  // ═══ ALLOCATED OVERHEADS (Spec line 42) ═══════════════════════════════════
  const allocatedOverheads = Math.round(netRevenue * (0.03 + rand() * 0.04) * 100) / 100;

  // ═══ NET OPERATING PROFIT (Spec line 43) ══════════════════════════════════
  const netOperatingProfit = Math.round((contributionProfit - allocatedOverheads) * 100) / 100;
  const netMargin = netRevenue > 0
    ? Math.round((netOperatingProfit / netRevenue) * 10000) / 100
    : 0;

  // ═══ UNIT ECONOMICS & EFFICIENCY (Spec section 6) ═════════════════════════
  const profitPerUnit = unitsSold > 0
    ? Math.round((netOperatingProfit / unitsSold) * 100) / 100
    : 0;
  const acos = adAttributedRevenue > 0
    ? Math.round((totalAdvertising / adAttributedRevenue) * 10000) / 100
    : 0;
  const tacos = grossRevenue > 0
    ? Math.round((totalAdvertising / grossRevenue) * 10000) / 100
    : 0;
  const roas = totalAdvertising > 0
    ? Math.round((adAttributedRevenue / totalAdvertising) * 100) / 100
    : 0;

  return {
    asin, product, category,
    unitsSold, unitsSoldPoP: randPoP(), unitsSoldDiffLY: randLY(),
    avgPrice, avgPricePoP: randPoP(), avgPriceDiffLY: randLY(),
    grossRevenue, grossRevenuePoP: randPoP(), grossRevenueDiffLY: randLY(),
    refundsAndReturns, refundsAndReturnsPoP: randPoP(), refundsAndReturnsDiffLY: randLY(),
    netRevenue, netRevenuePoP: randPoP(), netRevenueDiffLY: randLY(),
    netCogs, netCogsPoP: randPoP(), netCogsDiffLY: randLY(),
    grossProfit, grossProfitPoP: randPoP(), grossProfitDiffLY: randLY(),
    grossMargin, grossMarginPoP: randPP(), grossMarginDiffLY: randPP(),
    totalAmazonFees, totalAmazonFeesPoP: randPoP(), totalAmazonFeesDiffLY: randLY(),
    totalAdvertising, totalAdvertisingPoP: randPoP(), totalAdvertisingDiffLY: randLY(),
    totalReimbursements, totalReimbursementsPoP: randPoP(), totalReimbursementsDiffLY: randLY(),
    contributionProfit, contributionProfitPoP: randPoP(), contributionProfitDiffLY: randLY(),
    contributionMargin, contributionMarginPoP: randPP(), contributionMarginDiffLY: randPP(),
    allocatedOverheads, allocatedOverheadsPoP: randPoP(), allocatedOverheadsDiffLY: randLY(),
    netOperatingProfit, netOperatingProfitPoP: randPoP(), netOperatingProfitDiffLY: randLY(),
    netMargin, netMarginPoP: randPP(), netMarginDiffLY: randPP(),
    profitPerUnit, profitPerUnitPoP: randPoP(), profitPerUnitDiffLY: randLY(),
    acos, acosPoP: randPP(), acosDiffLY: randPP(),
    tacos, tacosPoP: randPP(), tacosDiffLY: randPP(),
    roas, roasPoP: randPoP(), roasDiffLY: randLY(),
    returnRate, returnRatePoP: randPP(), returnRateDiffLY: randPP(),
    refundRate, refundRatePoP: randPP(), refundRateDiffLY: randPP(),
  };
}

function generateSKURow(sku: string, parentRow: ProductProfitRow): SKUProfitRow {
  const fraction = 0.3 + rand() * 0.4;
  const unitsSold = Math.round(parentRow.unitsSold * fraction);
  const grossRevenue = Math.round(parentRow.grossRevenue * fraction * 100) / 100;
  const refundsAndReturns = Math.round(parentRow.refundsAndReturns * fraction * 100) / 100;
  const netRevenue = Math.round(parentRow.netRevenue * fraction * 100) / 100;
  const netCogs = Math.round(parentRow.netCogs * fraction * 100) / 100;
  const grossProfit = Math.round((netRevenue - netCogs) * 100) / 100;
  const totalAmazonFees = Math.round(parentRow.totalAmazonFees * fraction * 100) / 100;
  const totalAdvertising = Math.round(parentRow.totalAdvertising * fraction * 100) / 100;
  const totalReimbursements = Math.round(parentRow.totalReimbursements * fraction * 100) / 100;
  const contributionProfit = Math.round((grossProfit - totalAmazonFees - totalAdvertising + totalReimbursements) * 100) / 100;
  const allocatedOverheads = Math.round(parentRow.allocatedOverheads * fraction * 100) / 100;
  const netOperatingProfit = Math.round((contributionProfit - allocatedOverheads) * 100) / 100;

  const grossMargin = netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 10000) / 100 : 0;
  const contributionMargin = netRevenue > 0 ? Math.round((contributionProfit / netRevenue) * 10000) / 100 : 0;
  const netMargin = netRevenue > 0 ? Math.round((netOperatingProfit / netRevenue) * 10000) / 100 : 0;
  const profitPerUnit = unitsSold > 0 ? Math.round((netOperatingProfit / unitsSold) * 100) / 100 : 0;
  const avgPrice = unitsSold > 0 ? Math.round((grossRevenue / unitsSold) * 100) / 100 : 0;

  return {
    ...parentRow,
    sku,
    asin: parentRow.asin,
    product: sku,
    unitsSold, unitsSoldPoP: randPoP(), unitsSoldDiffLY: randLY(),
    avgPrice, avgPricePoP: randPoP(), avgPriceDiffLY: randLY(),
    grossRevenue, grossRevenuePoP: randPoP(), grossRevenueDiffLY: randLY(),
    refundsAndReturns, refundsAndReturnsPoP: randPoP(), refundsAndReturnsDiffLY: randLY(),
    netRevenue, netRevenuePoP: randPoP(), netRevenueDiffLY: randLY(),
    netCogs, netCogsPoP: randPoP(), netCogsDiffLY: randLY(),
    grossProfit, grossProfitPoP: randPoP(), grossProfitDiffLY: randLY(),
    grossMargin, grossMarginPoP: randPP(), grossMarginDiffLY: randPP(),
    totalAmazonFees, totalAmazonFeesPoP: randPoP(), totalAmazonFeesDiffLY: randLY(),
    totalAdvertising, totalAdvertisingPoP: randPoP(), totalAdvertisingDiffLY: randLY(),
    totalReimbursements, totalReimbursementsPoP: randPoP(), totalReimbursementsDiffLY: randLY(),
    contributionProfit, contributionProfitPoP: randPoP(), contributionProfitDiffLY: randLY(),
    contributionMargin, contributionMarginPoP: randPP(), contributionMarginDiffLY: randPP(),
    allocatedOverheads, allocatedOverheadsPoP: randPoP(), allocatedOverheadsDiffLY: randLY(),
    netOperatingProfit, netOperatingProfitPoP: randPoP(), netOperatingProfitDiffLY: randLY(),
    netMargin, netMarginPoP: randPP(), netMarginDiffLY: randPP(),
    profitPerUnit, profitPerUnitPoP: randPoP(), profitPerUnitDiffLY: randLY(),
    acos: parentRow.acos + randPP() * 0.5,
    acosPoP: randPP(), acosDiffLY: randPP(),
    tacos: parentRow.tacos + randPP() * 0.3,
    tacosPoP: randPP(), tacosDiffLY: randPP(),
    roas: parentRow.roas * (0.85 + rand() * 0.3),
    roasPoP: randPoP(), roasDiffLY: randLY(),
    returnRate: parentRow.returnRate + (rand() * 4 - 2),
    returnRatePoP: randPP(), returnRateDiffLY: randPP(),
    refundRate: parentRow.refundRate + (rand() * 3 - 1.5),
    refundRatePoP: randPP(), refundRateDiffLY: randPP(),
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

export const productProfitData: ProductProfitRow[] = products.map((p, i) => {
  const scale = 1 - i * 0.03;
  return generateRow(p.asin, p.product, p.category, scale);
});

export const skuProfitMap: Record<string, SKUProfitRow[]> = {};
products.forEach((p, i) => {
  const parentRow = productProfitData[i];
  skuProfitMap[p.asin] = p.skus.map((sku) => generateSKURow(sku, parentRow));
});
