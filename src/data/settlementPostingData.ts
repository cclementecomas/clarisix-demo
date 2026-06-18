// ─── Settlement Posting & Payout Bridge ──────────────────────────────────────
// Cash-basis (Payout policy) view. Each Settlement Report V2 is mapped to a
// double-entry journal anchored on Amazon Receivable (1010). Because every line
// is posted as a balanced Dr/Cr pair, the journal ALWAYS balances and the net
// movement on Amazon Receivable ALWAYS equals the bank disbursement — by
// construction, not by luck. Unmatched amount-types post to Suspense (9999) and
// are surfaced as a posting-completeness exception.

export type TBSection =
  | 'Receivable' | 'Revenue' | 'Tax' | 'Refunds' | 'Promotions'
  | 'Fees' | 'Advertising' | 'Reimbursements' | 'Reserve' | 'Suspense';

interface AcctMeta { name: string; section: TBSection; }

// Chart of accounts touched by a settlement (spec §7 numbering).
const ACCT: Record<string, AcctMeta> = {
  '1010': { name: 'Amazon Receivable', section: 'Receivable' },
  '1015': { name: 'Amazon Reserve Receivable', section: 'Reserve' },
  '4010': { name: 'Product Revenue', section: 'Revenue' },
  '4020': { name: 'Shipping Revenue', section: 'Revenue' },
  '4030': { name: 'Gift Wrap Revenue', section: 'Revenue' },
  '4090': { name: 'Other Revenue (Amazon-funded promo)', section: 'Revenue' },
  '2010': { name: 'Tax Collected (VAT — pass-through)', section: 'Tax' },
  '4110': { name: 'Returns & Refunds — Product', section: 'Refunds' },
  '4120': { name: 'Returns & Refunds — Shipping', section: 'Refunds' },
  '4130': { name: 'A-to-Z Claims & Chargebacks', section: 'Refunds' },
  '4140': { name: 'Promotions (seller-funded)', section: 'Promotions' },
  '6010': { name: 'Referral Fees', section: 'Fees' },
  '6020': { name: 'FBA Fulfilment Fees', section: 'Fees' },
  '6030': { name: 'Storage & Inventory Fees', section: 'Fees' },
  '6040': { name: 'Inbound Placement / AWD Fees', section: 'Fees' },
  '6060': { name: 'Refund Administration Fees', section: 'Fees' },
  '6090': { name: 'Subscription Fee', section: 'Fees' },
  '6110': { name: 'Advertising (SP / SB / SD / DSP)', section: 'Advertising' },
  '7010': { name: 'Reimbursements', section: 'Reimbursements' },
  '9999': { name: 'Suspense — Unclassified', section: 'Suspense' },
};

export interface TBLine { id: string; name: string; section: TBSection; debit: number; credit: number; }
export interface BridgeItem { label: string; amount: number; }

export interface SettlementRecon {
  key: string;
  label: string;
  closeDate: string;
  payoutDate: string;
  trialBalance: TBLine[];
  totalDebit: number;
  totalCredit: number;
  bridge: {
    inItems: BridgeItem[];
    outItems: BridgeItem[];
    moneyIn: number;
    moneyOut: number;
    netActivity: number;
    reserveWithheld: number;
    reserveReleased: number;
    netDisbursement: number;
    settlementPayout: number;
    variance: number;
  };
  completeness: {
    totalRows: number;
    classifiedRows: number;
    suspenseRows: number;
    suspenseAmount: number;
    balanced: boolean;
    tiesToPayout: boolean;
  };
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function build(
  key: string, label: string, closeDate: string, payoutDate: string,
  product: number, reserveWithheld: number, reserveReleased: number,
  suspense: number, suspenseRows: number,
): SettlementRecon {
  const dr: Record<string, number> = {};
  const cr: Record<string, number> = {};
  const post = (d: string, c: string, amt: number) => {
    const a = r2(amt);
    if (a === 0) return;
    dr[d] = r2((dr[d] ?? 0) + a);
    cr[c] = r2((cr[c] ?? 0) + a);
  };

  // ── Derive component amounts from gross product sales (ratios mirror the P&L)
  const shipping = r2(product * 0.09);
  const giftWrap = r2(product * 0.01);
  const taxBase = product + shipping + giftWrap;
  const taxCollected = r2(taxBase * 0.20);      // collected at checkout
  const taxRemitted = taxCollected;             // Amazon withholds & remits → nets 0

  const referral = r2(product * 0.15);
  const fba = r2(product * 0.16);
  const storage = r2(product * 0.012);
  const placement = r2(product * 0.004);
  const subscription = 19.99;
  const advertising = r2(product * 0.08);

  const refundProduct = r2(product * 0.065);
  const refundShipping = r2(shipping * 0.065);
  const refundAdmin = r2(referral * 0.065 * 0.20);
  const feeRefund = r2(referral * 0.065);        // referral returned on refunds
  const sellerPromo = r2(product * 0.010);
  const amazonPromo = r2(product * 0.004);       // Amazon-funded → income
  const atoz = r2(product * 0.007);
  const reimbursements = r2(product * 0.015);

  // ── Post the journal (Dr / Cr) ───────────────────────────────────────────
  // Income & sales → money IN (Dr Amazon Receivable)
  post('1010', '4010', product);
  post('1010', '4020', shipping);
  post('1010', '4030', giftWrap);
  post('1010', '2010', taxCollected);
  post('1010', '4090', amazonPromo);
  post('1010', '7010', reimbursements);
  post('1010', '6010', feeRefund);               // referral fee refunded to you

  // Fees & deductions → money OUT (Cr Amazon Receivable)
  post('6010', '1010', referral);
  post('6020', '1010', fba);
  post('6030', '1010', storage);
  post('6040', '1010', placement);
  post('6090', '1010', subscription);
  post('6110', '1010', advertising);
  post('4140', '1010', sellerPromo);
  post('6060', '1010', refundAdmin);
  post('2010', '1010', taxRemitted);             // facilitator tax withheld → nets 2010 to 0

  // Refunds to buyers (contra-revenue) → money OUT
  post('4110', '1010', refundProduct);
  post('4120', '1010', refundShipping);
  post('4130', '1010', atoz);

  // Unclassified amount-types → Suspense (still posts to receivable, but flagged)
  post('9999', '1010', suspense);

  // Reserve movements
  post('1015', '1010', reserveWithheld);         // withheld this settlement
  post('1010', '1015', reserveReleased);         // released from prior settlement

  // ── Trial balance ─────────────────────────────────────────────────────────
  const ids = Array.from(new Set([...Object.keys(dr), ...Object.keys(cr)])).sort();
  const trialBalance: TBLine[] = ids.map((id) => ({
    id, name: ACCT[id].name, section: ACCT[id].section,
    debit: r2(dr[id] ?? 0), credit: r2(cr[id] ?? 0),
  }));
  const totalDebit = r2(trialBalance.reduce((s, l) => s + l.debit, 0));
  const totalCredit = r2(trialBalance.reduce((s, l) => s + l.credit, 0));

  // ── Receivable → payout bridge ────────────────────────────────────────────
  const inItems: BridgeItem[] = [
    { label: 'Product sales', amount: product },
    { label: 'Shipping', amount: shipping },
    { label: 'Gift wrap', amount: giftWrap },
    { label: 'Tax collected (VAT)', amount: taxCollected },
    { label: 'Reimbursements', amount: reimbursements },
    { label: 'Fee refunds', amount: feeRefund },
    { label: 'Amazon-funded promos', amount: amazonPromo },
  ].filter((i) => i.amount !== 0);

  const outItems: BridgeItem[] = [
    { label: 'Referral fees', amount: referral },
    { label: 'FBA fulfilment fees', amount: fba },
    { label: 'Storage & inventory', amount: storage },
    { label: 'Inbound placement', amount: placement },
    { label: 'Subscription', amount: subscription },
    { label: 'Advertising', amount: advertising },
    { label: 'Refunds to buyers', amount: r2(refundProduct + refundShipping) },
    { label: 'A-to-Z & chargebacks', amount: atoz },
    { label: 'Seller-funded promos', amount: sellerPromo },
    { label: 'Refund administration', amount: refundAdmin },
    { label: 'Tax remitted (VAT)', amount: taxRemitted },
    { label: 'Unclassified (suspense)', amount: suspense },
  ].filter((i) => i.amount !== 0);

  const moneyIn = r2(inItems.reduce((s, i) => s + i.amount, 0));
  const moneyOut = r2(outItems.reduce((s, i) => s + i.amount, 0));
  const netActivity = r2(moneyIn - moneyOut);
  const netDisbursement = r2(netActivity - reserveWithheld + reserveReleased);

  const totalRows = Math.round(product / 7) + suspenseRows;

  return {
    key, label, closeDate, payoutDate,
    trialBalance, totalDebit, totalCredit,
    bridge: {
      inItems, outItems, moneyIn, moneyOut, netActivity,
      reserveWithheld, reserveReleased, netDisbursement,
      settlementPayout: netDisbursement,        // ties exactly — zero differences
      variance: 0,
    },
    completeness: {
      totalRows,
      classifiedRows: totalRows - suspenseRows,
      suspenseRows,
      suspenseAmount: r2(suspense),
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      tiesToPayout: true,
    },
  };
}

export const settlementRecons: SettlementRecon[] = [
  build('stl_2026_01a', 'Jan 1–14', '2026-01-14', '2026-01-16', 8200, 1840.5, 1500.0, 0, 0),
  build('stl_2026_01b', 'Jan 15–28', '2026-01-28', '2026-01-30', 8600, 1920.0, 1840.5, 0, 0),
  build('stl_2026_02a', 'Feb 1–14', '2026-02-14', '2026-02-16', 8900, 1700.0, 1920.0, 0, 0),
  build('stl_2026_02b', 'Feb 15–28', '2026-02-28', '2026-03-02', 9100, 1780.0, 1700.0, 0, 0),
  // Mar 1–14 carries two unclassified rows → demonstrates the Suspense flag
  build('stl_2026_03a', 'Mar 1–14', '2026-03-14', '2026-03-16', 9400, 1850.0, 1780.0, 42.18, 2),
  build('stl_2026_03b', 'Mar 15–31', '2026-03-31', '2026-04-02', 10200, 1990.0, 1850.0, 0, 0),
];

export const TB_SECTION_ORDER: TBSection[] = [
  'Receivable', 'Revenue', 'Tax', 'Refunds', 'Promotions',
  'Fees', 'Advertising', 'Reimbursements', 'Reserve', 'Suspense',
];
