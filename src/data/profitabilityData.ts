// ─── CFO-Level P&L Statement Data (43-line waterfall) ────────────────────────
// Aligned with Clarisix Amazon P&L Architecture Spec

export interface ProfitabilityMetric {
  label: string;
  type: 'number' | 'currency' | 'percentage' | 'growth';
  styleType?: 'header' | 'subtotal' | 'total' | 'ratio' | 'sub-item' | 'default';
  hasInfo?: boolean;
  isExpandable?: boolean;
  parentGroup?: string;
  indent?: number;
  [key: string]: number | string | boolean | undefined;
}

type PV = Record<string, number>;

// All period keys — legacy comparison + monthly 2024/2025 + quarterly + yearly
const KS: string[] = [
  // Legacy comparison columns
  'ytd25', 'ytd24', 'ltm25', 'ptm24', 'l3m25', 'p3m24', 'total',
  // Monthly 2024
  'jan2024','feb2024','mar2024','apr2024','may2024','jun2024',
  'jul2024','aug2024','sep2024','oct2024','nov2024','dec2024',
  // Monthly 2025
  'jan2025','feb2025','mar2025','apr2025','may2025','jun2025',
  'jul2025','aug2025','sep2025','oct2025','nov2025','dec2025',
  // Quarterly
  'q12024','q22024','q32024','q42024',
  'q12025','q22025','q32025','q42025',
  // Yearly
  'fy2023','fy2024','fy2025',
];

const rd = (v: number) => Math.round(v * 10) / 10;

const scl = (a: PV, f: number): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd((a[k] ?? 0) * f); return o;
};
const add = (...args: PV[]): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd(args.reduce((s, a) => s + (a[k] ?? 0), 0)); return o;
};
const sub = (a: PV, ...rest: PV[]): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd((a[k] ?? 0) - rest.reduce((s, b) => s + (b[k] ?? 0), 0)); return o;
};
const neg = (a: PV): PV => scl(a, -1);
const mul = (a: PV, b: PV): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd((a[k] ?? 0) * (b[k] ?? 0)); return o;
};
const pct = (a: PV, b: PV): PV => {
  const o: PV = {}; for (const k of KS) o[k] = (b[k] ?? 0) !== 0 ? rd(((a[k] ?? 0) / (b[k] ?? 0)) * 100) : 0; return o;
};

function m(
  label: string,
  type: ProfitabilityMetric['type'],
  pv: PV,
  opts: Partial<ProfitabilityMetric> = {},
): ProfitabilityMetric {
  return { label, type, ...pv, ...opts } as ProfitabilityMetric;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE INPUTS — all period keys populated
// ═══════════════════════════════════════════════════════════════════════════════

const unitsSold: PV = {
  // Legacy
  ytd25: 1049, ytd24: 1012, ltm25: 2662, ptm24: 2658,
  l3m25: 685, p3m24: 666, total: 1496,
  // Monthly 2024
  jan2024: 148, feb2024: 160, mar2024: 186, apr2024: 180, may2024: 191, jun2024: 183,
  jul2024: 194, aug2024: 211, sep2024: 206, oct2024: 217, nov2024: 90, dec2024: 509,
  // Monthly 2025
  jan2025: 212, feb2025: 219, mar2025: 237, apr2025: 230, may2025: 243, jun2025: 234,
  jul2025: 247, aug2025: 265, sep2025: 259, oct2025: 270, nov2025: 275, dec2025: 542,
  // Quarterly
  q12024: 494, q22024: 554, q32024: 611, q42024: 816,
  q12025: 668, q22025: 707, q32025: 771, q42025: 1087,
  // Yearly
  fy2023: 2128, fy2024: 2475, fy2025: 3233,
};

const unitsRefunded: PV = {
  // Legacy
  ytd25: 72, ytd24: 69, ltm25: 138, ptm24: 150,
  l3m25: 32, p3m24: 41, total: 81,
  // Monthly 2024
  jan2024: 10, feb2024: 11, mar2024: 13, apr2024: 12, may2024: 13, jun2024: 12,
  jul2024: 13, aug2024: 14, sep2024: 14, oct2024: 15, nov2024: 5, dec2024: 20,
  // Monthly 2025
  jan2025: 24, feb2025: 9, mar2025: 16, apr2025: 16, may2025: 17, jun2025: 16,
  jul2025: 17, aug2025: 18, sep2025: 18, oct2025: 18, nov2025: 19, dec2025: 37,
  // Quarterly
  q12024: 34, q22024: 37, q32024: 41, q42024: 40,
  q12025: 49, q22025: 49, q32025: 53, q42025: 74,
  // Yearly
  fy2023: 135, fy2024: 152, fy2025: 225,
};

const netUnits = sub(unitsSold, unitsRefunded);

const grossASP: PV = {
  // Legacy
  ytd25: 36.5, ytd24: 35.8, ltm25: 35.2, ptm24: 34.8,
  l3m25: 35.8, p3m24: 35.1, total: 35.2,
  // Monthly 2024
  jan2024: 36.2, feb2024: 36.5, mar2024: 36.0, apr2024: 35.8, may2024: 35.6, jun2024: 35.4,
  jul2024: 35.2, aug2024: 35.0, sep2024: 35.2, oct2024: 35.6, nov2024: 37.2, dec2024: 33.8,
  // Monthly 2025
  jan2025: 35.4, feb2025: 37.5, mar2025: 37.2, apr2025: 37.0, may2025: 36.8, jun2025: 36.6,
  jul2025: 36.4, aug2025: 36.2, sep2025: 36.4, oct2025: 36.8, nov2025: 38.0, dec2025: 34.8,
  // Quarterly
  q12024: 36.2, q22024: 35.6, q32024: 35.1, q42024: 35.0,
  q12025: 36.7, q22025: 36.8, q32025: 36.3, q42025: 36.6,
  // Yearly
  fy2023: 35.0, fy2024: 35.3, fy2025: 36.8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE
// ═══════════════════════════════════════════════════════════════════════════════

const grossOrderedRevenue = mul(unitsSold, grossASP);
const cancelledOrders = scl(grossOrderedRevenue, 0.022);
const grossShippedRevenue = sub(grossOrderedRevenue, cancelledOrders);

const refundAmount = scl(grossShippedRevenue, 0.065);
const atozClaims = scl(grossShippedRevenue, 0.007);
const chargebacks = scl(grossShippedRevenue, 0.004);
const netProductRevenue = sub(grossShippedRevenue, refundAmount, atozClaims, chargebacks);

const shippingRevenue = scl(unitsSold, 3.2);
const giftWrapRevenue = scl(unitsSold, 0.4);
const shippingRefunds = scl(shippingRevenue, 0.065);
const netRevenue = sub(add(netProductRevenue, shippingRevenue, giftWrapRevenue), shippingRefunds);

const netASP: PV = {};
for (const k of KS) netASP[k] = (netUnits[k] ?? 0) !== 0 ? rd((netRevenue[k] ?? 0) / (netUnits[k] ?? 0)) : 0;

// ═══════════════════════════════════════════════════════════════════════════════
// COGS
// ═══════════════════════════════════════════════════════════════════════════════

const costPerUnit = scl(grossASP, 0.30);
const productCost = mul(unitsSold, costPerUnit);
const inboundShipping = scl(unitsSold, 1.60);
const cogsOnReturns = scl(mul(unitsRefunded, costPerUnit), 0.6);
const netCogs = sub(add(productCost, inboundShipping), cogsOnReturns);

// ═══════════════════════════════════════════════════════════════════════════════
// GROSS PROFIT
// ═══════════════════════════════════════════════════════════════════════════════

const grossProfit = sub(netRevenue, netCogs);
const grossMarginPct = pct(grossProfit, netRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// AMAZON FEES
// ═══════════════════════════════════════════════════════════════════════════════

const referralFees = scl(netRevenue, 0.15);
const fbaFulfillment = scl(unitsSold, 4.50);
const weightHandling = scl(unitsSold, 0.40);
const monthlyStorage = scl(unitsSold, 0.25);
const longTermStorage = scl(unitsSold, 0.05);
const inboundPlacement = scl(unitsSold, 0.12);

const subscriptionFees: PV = {
  // Legacy
  ytd25: 80, ytd24: 80, ltm25: 480, ptm24: 480,
  l3m25: 120, p3m24: 120, total: 160,
  // Monthly 2024 & 2025 — flat $40/month
  jan2024: 40, feb2024: 40, mar2024: 40, apr2024: 40, may2024: 40, jun2024: 40,
  jul2024: 40, aug2024: 40, sep2024: 40, oct2024: 40, nov2024: 40, dec2024: 40,
  jan2025: 40, feb2025: 40, mar2025: 40, apr2025: 40, may2025: 40, jun2025: 40,
  jul2025: 40, aug2025: 40, sep2025: 40, oct2025: 40, nov2025: 40, dec2025: 40,
  // Quarterly
  q12024: 120, q22024: 120, q32024: 120, q42024: 120,
  q12025: 120, q22025: 120, q32025: 120, q42025: 120,
  // Yearly
  fy2023: 480, fy2024: 480, fy2025: 480,
};

const variableClosing = scl(unitsSold, 0.12);
const refundAdmin = scl(refundAmount, 0.20);

const removalDisposal: PV = {
  ytd25: 29, ytd24: 25, ltm25: 175, ptm24: 160,
  l3m25: 43, p3m24: 38, total: 58,
  jan2024: 12, feb2024: 12, mar2024: 13, apr2024: 13, may2024: 14, jun2024: 14,
  jul2024: 14, aug2024: 15, sep2024: 15, oct2024: 15, nov2024: 14, dec2024: 15,
  jan2025: 14, feb2025: 15, mar2025: 15, apr2025: 15, may2025: 16, jun2025: 16,
  jul2025: 16, aug2025: 17, sep2025: 17, oct2025: 17, nov2025: 17, dec2025: 18,
  q12024: 37, q22024: 41, q32024: 44, q42024: 44,
  q12025: 44, q22025: 47, q32025: 50, q42025: 52,
  fy2023: 170, fy2024: 176, fy2025: 193,
};

const returnProcessing = scl(unitsRefunded, 1.20);
const otherFees = scl(netRevenue, 0.003);
const feeRefunds = scl(add(referralFees, fbaFulfillment), 0.052);
const totalAmazonFees = sub(
  add(referralFees, fbaFulfillment, weightHandling, monthlyStorage, longTermStorage,
    inboundPlacement, subscriptionFees, variableClosing, refundAdmin,
    removalDisposal, returnProcessing, otherFees),
  feeRefunds,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADVERTISING
// ═══════════════════════════════════════════════════════════════════════════════

const adBudget = scl(grossOrderedRevenue, 0.08);
const spSpend = scl(adBudget, 0.52);
const sbSpend = scl(adBudget, 0.20);
const sdSpend = scl(adBudget, 0.12);
const dspSpend = scl(adBudget, 0.08);
const dealCouponPromo = scl(adBudget, 0.08);
const totalAdvertising = add(spSpend, sbSpend, sdSpend, dspSpend, dealCouponPromo);
const tacosPct = pct(totalAdvertising, grossOrderedRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// REIMBURSEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const inventoryReimb = scl(productCost, 0.015);

const safetClaims: PV = {
  ytd25: 45, ytd24: 38, ltm25: 210, ptm24: 185,
  l3m25: 35, p3m24: 28, total: 68,
  jan2024: 10, feb2024: 10, mar2024: 12, apr2024: 12, may2024: 14, jun2024: 14,
  jul2024: 15, aug2024: 16, sep2024: 16, oct2024: 14, nov2024: 8, dec2024: 15,
  jan2025: 18, feb2025: 27, mar2025: 22, apr2025: 20, may2025: 20, jun2025: 19,
  jul2025: 19, aug2025: 18, sep2025: 18, oct2025: 18, nov2025: 19, dec2025: 22,
  q12024: 32, q22024: 40, q32024: 47, q42024: 37,
  q12025: 67, q22025: 59, q32025: 55, q42025: 59,
  fy2023: 130, fy2024: 156, fy2025: 240,
};

const otherAdjustments: PV = {
  ytd25: 32, ytd24: 25, ltm25: 145, ptm24: 130,
  l3m25: 24, p3m24: 19, total: 48,
  jan2024: 8, feb2024: 8, mar2024: 9, apr2024: 9, may2024: 10, jun2024: 10,
  jul2024: 11, aug2024: 11, sep2024: 12, oct2024: 12, nov2024: 6, dec2024: 12,
  jan2025: 14, feb2025: 18, mar2025: 16, apr2025: 15, may2025: 15, jun2025: 14,
  jul2025: 14, aug2025: 14, sep2025: 13, oct2025: 13, nov2025: 14, dec2025: 16,
  q12024: 25, q22024: 29, q32024: 34, q42024: 30,
  q12025: 48, q22025: 44, q32025: 41, q42025: 43,
  fy2023: 100, fy2024: 118, fy2025: 176,
};

const totalReimbursements = add(inventoryReimb, safetClaims, otherAdjustments);

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION & NET PROFIT
// ═══════════════════════════════════════════════════════════════════════════════

const contributionProfit = add(grossProfit, neg(totalAmazonFees), neg(totalAdvertising), totalReimbursements);
const contributionMarginPct = pct(contributionProfit, netRevenue);

const allocatedOverheads = scl(netRevenue, 0.05);
const netOperatingProfit = sub(contributionProfit, allocatedOverheads);
const netOperatingMarginPct = pct(netOperatingProfit, netRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH ROWS
// ═══════════════════════════════════════════════════════════════════════════════

function yoyGrowth(current: PV, prior: PV): PV {
  const result: PV = {
    // Legacy comparison keys
    ytd25: (prior.ytd24 ?? 0) !== 0 ? rd(((current.ytd25 ?? 0) - (prior.ytd24 ?? 0)) / Math.abs(prior.ytd24 ?? 0) * 100) : 0,
    ytd24: 1.5, ltm25: (prior.ptm24 ?? 0) !== 0 ? rd(((current.ltm25 ?? 0) - (prior.ptm24 ?? 0)) / Math.abs(prior.ptm24 ?? 0) * 100) : 0,
    ptm24: 3.2, l3m25: (prior.p3m24 ?? 0) !== 0 ? rd(((current.l3m25 ?? 0) - (prior.p3m24 ?? 0)) / Math.abs(prior.p3m24 ?? 0) * 100) : 0,
    p3m24: -2.1, total: 5.0,
  };

  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

  for (const m of MONTHS) {
    const k24 = `${m}2024`, k25 = `${m}2025`;
    const p24 = prior[k24] ?? 0;
    const p25 = prior[k25] ?? 0;
    result[k25] = p24 !== 0 ? rd(((current[k25] ?? 0) - p24) / Math.abs(p24) * 100) : 0;
    // 2024 vs 2023 (approx +10%)
    result[k24] = p25 !== 0 ? rd(((current[k24] ?? 0) - (current[k24] ?? 0) / 1.1) / ((current[k24] ?? 0) / 1.1) * 100) : 9.5;
  }

  for (const q of ['q1','q2','q3','q4']) {
    const k24 = `${q}2024`, k25 = `${q}2025`;
    const p24 = prior[k24] ?? 0;
    result[k25] = p24 !== 0 ? rd(((current[k25] ?? 0) - p24) / Math.abs(p24) * 100) : 0;
    result[k24] = 9.5;
  }

  const fy24 = prior.fy2024 ?? 0, fy23 = prior.fy2023 ?? 0;
  result.fy2025 = fy24 !== 0 ? rd(((current.fy2025 ?? 0) - fy24) / Math.abs(fy24) * 100) : 0;
  result.fy2024 = fy23 !== 0 ? rd(((current.fy2024 ?? 0) - fy23) / Math.abs(fy23) * 100) : 0;
  result.fy2023 = 8.0;

  return result;
}

const unitsSoldGrowth = yoyGrowth(unitsSold, unitsSold);
const netRevenueGrowth = yoyGrowth(netRevenue, netRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD METRIC ARRAY
// ═══════════════════════════════════════════════════════════════════════════════

export const profitabilityData: ProfitabilityMetric[] = [
  // ── UNIT METRICS ─────────────────────────────────────────────────────────
  m('Units sold', 'number', unitsSold),
  m('Units sold growth', 'growth', unitsSoldGrowth, { styleType: 'ratio' }),
  m('Units refunded', 'number', unitsRefunded),
  m('Net units', 'number', netUnits, { styleType: 'subtotal' }),
  m('Gross avg selling price', 'currency', grossASP, { hasInfo: true }),
  m('Net avg selling price', 'currency', netASP, { styleType: 'subtotal', hasInfo: true }),

  // ── REVENUE ──────────────────────────────────────────────────────────────
  m('Gross Ordered Revenue', 'currency', grossOrderedRevenue, { styleType: 'header' }),
  m('(-) Cancelled Orders', 'currency', neg(cancelledOrders), { indent: 1 }),
  m('= Gross Shipped Revenue', 'currency', grossShippedRevenue, { styleType: 'subtotal' }),
  m('(-) Refunds', 'currency', neg(refundAmount), { indent: 1 }),
  m('(-) A-to-Z Claims', 'currency', neg(atozClaims), { indent: 1 }),
  m('(-) Chargebacks', 'currency', neg(chargebacks), { indent: 1 }),
  m('= Net Product Revenue', 'currency', netProductRevenue, { styleType: 'subtotal' }),
  m('(+) Shipping Revenue', 'currency', shippingRevenue, { indent: 1 }),
  m('(+) Gift Wrap Revenue', 'currency', giftWrapRevenue, { indent: 1 }),
  m('(-) Shipping Refunds', 'currency', neg(shippingRefunds), { indent: 1 }),
  m('Net Revenue', 'currency', netRevenue, { styleType: 'total' }),
  m('Net Revenue growth', 'growth', netRevenueGrowth, { styleType: 'ratio', indent: 1 }),

  // ── COGS ─────────────────────────────────────────────────────────────────
  m('COGS', 'currency', neg(netCogs), { styleType: 'header', hasInfo: true, isExpandable: true }),
  m('Product Cost (FIFO)', 'currency', neg(productCost), { styleType: 'sub-item', indent: 1, parentGroup: 'COGS' }),
  m('Inbound Shipping', 'currency', neg(inboundShipping), { styleType: 'sub-item', indent: 1, parentGroup: 'COGS' }),
  m('(-) COGS on Returns', 'currency', cogsOnReturns, { styleType: 'sub-item', indent: 1, parentGroup: 'COGS' }),

  // ── GROSS PROFIT ─────────────────────────────────────────────────────────
  m('Gross Profit', 'currency', grossProfit, { styleType: 'total', hasInfo: true }),
  m('Gross Margin %', 'percentage', grossMarginPct, { styleType: 'ratio', indent: 1 }),

  // ── AMAZON FEES ───────────────────────────────────────────────────────────
  m('Amazon Fees', 'currency', neg(totalAmazonFees), { styleType: 'header', hasInfo: true, isExpandable: true }),
  m('Referral Fees', 'currency', neg(referralFees), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('FBA Fulfillment', 'currency', neg(fbaFulfillment), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Weight Handling', 'currency', neg(weightHandling), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Monthly Storage', 'currency', neg(monthlyStorage), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Long-Term Storage', 'currency', neg(longTermStorage), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Inbound Placement', 'currency', neg(inboundPlacement), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Subscription Fees', 'currency', neg(subscriptionFees), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Variable Closing Fees', 'currency', neg(variableClosing), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Refund Administration', 'currency', neg(refundAdmin), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Removal / Disposal', 'currency', neg(removalDisposal), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Return Processing', 'currency', neg(returnProcessing), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Other Fees', 'currency', neg(otherFees), { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),
  m('Fee Refunds', 'currency', feeRefunds, { styleType: 'sub-item', indent: 1, parentGroup: 'Amazon Fees' }),

  // ── ADVERTISING ───────────────────────────────────────────────────────────
  m('Advertising', 'currency', neg(totalAdvertising), { styleType: 'header', isExpandable: true }),
  m('Sponsored Products', 'currency', neg(spSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('Sponsored Brands', 'currency', neg(sbSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('Sponsored Display', 'currency', neg(sdSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('DSP', 'currency', neg(dspSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('Deals / Coupons / Promos', 'currency', neg(dealCouponPromo), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('TACOS %', 'percentage', tacosPct, { styleType: 'ratio', indent: 1 }),

  // ── REIMBURSEMENTS ────────────────────────────────────────────────────────
  m('Reimbursements', 'currency', totalReimbursements, { styleType: 'header', isExpandable: true }),
  m('Inventory Reimbursements', 'currency', inventoryReimb, { styleType: 'sub-item', indent: 1, parentGroup: 'Reimbursements' }),
  m('SAFE-T Claims', 'currency', safetClaims, { styleType: 'sub-item', indent: 1, parentGroup: 'Reimbursements' }),
  m('Other Adjustments', 'currency', otherAdjustments, { styleType: 'sub-item', indent: 1, parentGroup: 'Reimbursements' }),

  // ── CONTRIBUTION PROFIT ───────────────────────────────────────────────────
  m('Contribution Profit', 'currency', contributionProfit, { styleType: 'total', hasInfo: true }),
  m('Contribution Margin %', 'percentage', contributionMarginPct, { styleType: 'ratio', indent: 1 }),

  // ── OVERHEADS & NET OPERATING PROFIT ──────────────────────────────────────
  m('(-) Allocated Overheads', 'currency', neg(allocatedOverheads)),
  m('Net Operating Profit', 'currency', netOperatingProfit, { styleType: 'total' }),
  m('Net Operating Margin %', 'percentage', netOperatingMarginPct, { styleType: 'ratio', indent: 1 }),
];

// Export for use in granularity-based column building
export { netRevenue, grossProfit, contributionProfit, netOperatingProfit };
