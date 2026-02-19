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
  ytd25: number | string;
  ytd24: number | string;
  ltm25: number | string;
  ptm24: number | string;
  l3m25: number | string;
  p3m24: number | string;
  total: number | string;
  nov2024: number | string;
  dec2024: number | string;
  jan2025: number | string;
  feb2025: number | string;
}

// ─── Period-value helpers (ensure waterfall math is correct per column) ──────

type PV = Record<string, number>;
const KS = ['ytd25', 'ytd24', 'ltm25', 'ptm24', 'l3m25', 'p3m24', 'total', 'nov2024', 'dec2024', 'jan2025', 'feb2025'] as const;
const rd = (v: number) => Math.round(v * 10) / 10;

const scl = (a: PV, f: number): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd(a[k] * f); return o;
};
const add = (...args: PV[]): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd(args.reduce((s, a) => s + a[k], 0)); return o;
};
const sub = (a: PV, ...rest: PV[]): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd(a[k] - rest.reduce((s, b) => s + b[k], 0)); return o;
};
const neg = (a: PV): PV => scl(a, -1);
const mul = (a: PV, b: PV): PV => {
  const o: PV = {}; for (const k of KS) o[k] = rd(a[k] * b[k]); return o;
};
const pct = (a: PV, b: PV): PV => {
  const o: PV = {}; for (const k of KS) o[k] = b[k] !== 0 ? rd((a[k] / b[k]) * 100) : 0; return o;
};

// Helper: build metric row
function m(
  label: string,
  type: ProfitabilityMetric['type'],
  pv: PV,
  opts: Partial<ProfitabilityMetric> = {},
): ProfitabilityMetric {
  return { label, type, ...pv, ...opts } as ProfitabilityMetric;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE INPUTS
// ═══════════════════════════════════════════════════════════════════════════════

const unitsSold: PV = {
  ytd25: 1049, ytd24: 1012, ltm25: 2662, ptm24: 2658,
  l3m25: 685, p3m24: 666, total: 1496,
  nov2024: 90, dec2024: 509, jan2025: 212, feb2025: 219,
};

const unitsRefunded: PV = {
  ytd25: 72, ytd24: 69, ltm25: 138, ptm24: 150,
  l3m25: 32, p3m24: 41, total: 81,
  nov2024: 5, dec2024: 20, jan2025: 24, feb2025: 9,
};

const netUnits = sub(unitsSold, unitsRefunded);

const grossASP: PV = {
  ytd25: 36.5, ytd24: 35.8, ltm25: 35.2, ptm24: 34.8,
  l3m25: 35.8, p3m24: 35.1, total: 35.2,
  nov2024: 37.2, dec2024: 33.8, jan2025: 35.4, feb2025: 37.5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE (Spec lines 1-11)
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

// Net ASP = net revenue / net units
const netASP: PV = {};
for (const k of KS) netASP[k] = netUnits[k] !== 0 ? rd(netRevenue[k] / netUnits[k]) : 0;

// ═══════════════════════════════════════════════════════════════════════════════
// COGS (Spec lines 12-15)
// ═══════════════════════════════════════════════════════════════════════════════

const costPerUnit = scl(grossASP, 0.30);
const productCost = mul(unitsSold, costPerUnit);
const inboundShipping = scl(unitsSold, 1.60);
const cogsOnReturns = scl(mul(unitsRefunded, costPerUnit), 0.6);
const netCogs = sub(add(productCost, inboundShipping), cogsOnReturns);

// ═══════════════════════════════════════════════════════════════════════════════
// GROSS PROFIT (Spec line 16)
// ═══════════════════════════════════════════════════════════════════════════════

const grossProfit = sub(netRevenue, netCogs);
const grossMarginPct = pct(grossProfit, netRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// AMAZON FEES (Spec lines 17-30)
// ═══════════════════════════════════════════════════════════════════════════════

const referralFees = scl(netRevenue, 0.15);
const fbaFulfillment = scl(unitsSold, 4.50);
const weightHandling = scl(unitsSold, 0.40);
const monthlyStorage = scl(unitsSold, 0.25);
const longTermStorage = scl(unitsSold, 0.05);
const inboundPlacement = scl(unitsSold, 0.12);
// Subscription: flat ~$40/month, scale by period
const subscriptionFees: PV = {
  ytd25: 80, ytd24: 80, ltm25: 480, ptm24: 480,
  l3m25: 120, p3m24: 120, total: 160,
  nov2024: 40, dec2024: 40, jan2025: 40, feb2025: 40,
};
const variableClosing = scl(unitsSold, 0.12);
const refundAdmin = scl(refundAmount, 0.20);
const removalDisposal: PV = {
  ytd25: 29, ytd24: 25, ltm25: 175, ptm24: 160,
  l3m25: 43, p3m24: 38, total: 58,
  nov2024: 14, dec2024: 15, jan2025: 14, feb2025: 15,
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
// ADVERTISING (Spec lines 31-36)
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
// REIMBURSEMENTS (Spec lines 37-40)
// ═══════════════════════════════════════════════════════════════════════════════

const inventoryReimb = scl(productCost, 0.015);
const safetClaims: PV = {
  ytd25: 45, ytd24: 38, ltm25: 210, ptm24: 185,
  l3m25: 35, p3m24: 28, total: 68,
  nov2024: 8, dec2024: 15, jan2025: 18, feb2025: 27,
};
const otherAdjustments: PV = {
  ytd25: 32, ytd24: 25, ltm25: 145, ptm24: 130,
  l3m25: 24, p3m24: 19, total: 48,
  nov2024: 6, dec2024: 12, jan2025: 14, feb2025: 18,
};
const totalReimbursements = add(inventoryReimb, safetClaims, otherAdjustments);

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION PROFIT (Spec line 41)
// ═══════════════════════════════════════════════════════════════════════════════

const contributionProfit = add(grossProfit, neg(totalAmazonFees), neg(totalAdvertising), totalReimbursements);
const contributionMarginPct = pct(contributionProfit, netRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// OVERHEADS & NET OPERATING PROFIT (Spec lines 42-43)
// ═══════════════════════════════════════════════════════════════════════════════

const allocatedOverheads = scl(netRevenue, 0.05);
const netOperatingProfit = sub(contributionProfit, allocatedOverheads);
const netOperatingMarginPct = pct(netOperatingProfit, netRevenue);

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function yoyGrowth(current: PV, prior: PV): PV {
  return {
    ytd25: prior.ytd24 !== 0 ? rd(((current.ytd25 - prior.ytd24) / Math.abs(prior.ytd24)) * 100) : 0,
    ytd24: 1.5,
    ltm25: prior.ptm24 !== 0 ? rd(((current.ltm25 - prior.ptm24) / Math.abs(prior.ptm24)) * 100) : 0,
    ptm24: 3.2,
    l3m25: prior.p3m24 !== 0 ? rd(((current.l3m25 - prior.p3m24) / Math.abs(prior.p3m24)) * 100) : 0,
    p3m24: -2.1,
    total: 5.0,
    nov2024: 15.2, dec2024: 36.0, jan2025: 8.5, feb2025: 12.1,
  };
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

  // ── REVENUE (Spec lines 1-11) ────────────────────────────────────────────
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

  // ── COGS (Spec lines 12-15) ──────────────────────────────────────────────
  m('COGS', 'currency', neg(netCogs), { styleType: 'header', hasInfo: true, isExpandable: true }),
  m('Product Cost (FIFO)', 'currency', neg(productCost), { styleType: 'sub-item', indent: 1, parentGroup: 'COGS' }),
  m('Inbound Shipping', 'currency', neg(inboundShipping), { styleType: 'sub-item', indent: 1, parentGroup: 'COGS' }),
  m('(-) COGS on Returns', 'currency', cogsOnReturns, { styleType: 'sub-item', indent: 1, parentGroup: 'COGS' }),

  // ── GROSS PROFIT (Spec line 16) ──────────────────────────────────────────
  m('Gross Profit', 'currency', grossProfit, { styleType: 'total', hasInfo: true }),
  m('Gross Margin %', 'percentage', grossMarginPct, { styleType: 'ratio', indent: 1 }),

  // ── AMAZON FEES (Spec lines 17-30) ───────────────────────────────────────
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

  // ── ADVERTISING (Spec lines 31-36) ───────────────────────────────────────
  m('Advertising', 'currency', neg(totalAdvertising), { styleType: 'header', isExpandable: true }),
  m('Sponsored Products', 'currency', neg(spSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('Sponsored Brands', 'currency', neg(sbSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('Sponsored Display', 'currency', neg(sdSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('DSP', 'currency', neg(dspSpend), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('Deals / Coupons / Promos', 'currency', neg(dealCouponPromo), { styleType: 'sub-item', indent: 1, parentGroup: 'Advertising' }),
  m('TACOS %', 'percentage', tacosPct, { styleType: 'ratio', indent: 1 }),

  // ── REIMBURSEMENTS (Spec lines 37-40) ────────────────────────────────────
  m('Reimbursements', 'currency', totalReimbursements, { styleType: 'header', isExpandable: true }),
  m('Inventory Reimbursements', 'currency', inventoryReimb, { styleType: 'sub-item', indent: 1, parentGroup: 'Reimbursements' }),
  m('SAFE-T Claims', 'currency', safetClaims, { styleType: 'sub-item', indent: 1, parentGroup: 'Reimbursements' }),
  m('Other Adjustments', 'currency', otherAdjustments, { styleType: 'sub-item', indent: 1, parentGroup: 'Reimbursements' }),

  // ── CONTRIBUTION PROFIT (Spec line 41) ───────────────────────────────────
  m('Contribution Profit', 'currency', contributionProfit, { styleType: 'total', hasInfo: true }),
  m('Contribution Margin %', 'percentage', contributionMarginPct, { styleType: 'ratio', indent: 1 }),

  // ── OVERHEADS & NET OPERATING PROFIT (Spec lines 42-43) ─────────────────
  m('(-) Allocated Overheads', 'currency', neg(allocatedOverheads)),
  m('Net Operating Profit', 'currency', netOperatingProfit, { styleType: 'total' }),
  m('Net Operating Margin %', 'percentage', netOperatingMarginPct, { styleType: 'ratio', indent: 1 }),
];
