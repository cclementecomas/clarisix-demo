// ─── Advertising Deepdive Data ───────────────────────────────────────────────

export interface CampaignPlacement {
  placement: string;
  impressions: number;
  impressionsPoP: number;
  impressionsDiffLY: number;
  clicks: number;
  clicksPoP: number;
  clicksDiffLY: number;
  ctr: number;
  ctrPoP: number;
  ctrDiffLY: number;
  spend: number;
  spendPoP: number;
  spendDiffLY: number;
  sales: number;
  salesPoP: number;
  salesDiffLY: number;
  orders: number;
  ordersPoP: number;
  ordersDiffLY: number;
  acos: number;
  acosPoP: number;
  acosDiffLY: number;
  cvr: number;
  cvrPoP: number;
  cvrDiffLY: number;
}

export interface CampaignRow {
  campaign: string;
  type: 'SP' | 'SD' | 'SB';
  status: 'Enabled' | 'Paused';
  impressions: number;
  impressionsPoP: number;
  impressionsDiffLY: number;
  clicks: number;
  clicksPoP: number;
  clicksDiffLY: number;
  ctr: number;
  ctrPoP: number;
  ctrDiffLY: number;
  spend: number;
  spendPoP: number;
  spendDiffLY: number;
  pctTotal: number;
  sales: number;
  salesPoP: number;
  salesDiffLY: number;
  orders: number;
  ordersPoP: number;
  ordersDiffLY: number;
  acos: number;
  acosPoP: number;
  acosDiffLY: number;
  cvr: number;
  cvrPoP: number;
  cvrDiffLY: number;
  placements: CampaignPlacement[];
}

export interface PlacementSummary {
  placement: string;
  spend: number;
  pctOfSpend: number;
  sales: number;
  acos: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cvr: number;
}

export interface AudienceSegment {
  segment: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  sales: number;
  acos: number;
  cvr: number;
  roas: number;
}

// ─── Seeded random for deterministic data ────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Campaign name parts ─────────────────────────────────────────────────────

const campaignPrefixes = [
  'Brand Awareness', 'Product Launch', 'Seasonal Push', 'Evergreen',
  'Competitor Targeting', 'Category Rank', 'Clearance', 'Best Seller',
  'New Arrival', 'Cross Sell', 'Upsell', 'Retargeting',
  'High Intent', 'Low Funnel', 'Top Funnel', 'Mid Funnel',
  'Auto Campaign', 'Manual Campaign', 'Discovery', 'Defensive',
];

const campaignSuffixes = [
  'Personal Care', 'Home & Kitchen', 'Electronics Pro', 'Electronics Lite',
  'Fashion Bags', 'Wellness', 'Premium', 'Standard',
  'DE', 'FR', 'UK', 'US', 'IT', 'ES', 'NL', 'BE',
  'AquaPure', 'FreshTech', 'NovaBright', 'EcoBlend', 'ZenCore',
];

const PLACEMENTS = ['Top of Search', 'Rest of Search', 'Product Pages'];

// ─── Generate campaigns ──────────────────────────────────────────────────────

// Generate a PoP change (percentage) in the range -30..+40
function randPoPChange(rand: () => number): number {
  return Math.round((-30 + rand() * 70) * 100) / 100;
}

// Generate a LY change (percentage) in the range -40..+120
function randLYChange(rand: () => number): number {
  return Math.round((-40 + rand() * 160) * 100) / 100;
}

// Generate a pp change for ratio metrics (CTR, ACOS, CVR) in the range -8..+8
function randPPChange(rand: () => number): number {
  return Math.round((-8 + rand() * 16) * 100) / 100;
}

function generateCampaigns(): CampaignRow[] {
  const rand = seededRandom(42);
  const campaigns: CampaignRow[] = [];
  let totalSpend = 0;

  for (let i = 0; i < 220; i++) {
    const prefix = campaignPrefixes[i % campaignPrefixes.length];
    const suffix = campaignSuffixes[i % campaignSuffixes.length];
    const typeRoll = rand();
    const type: 'SP' | 'SD' | 'SB' = typeRoll < 0.6 ? 'SP' : typeRoll < 0.85 ? 'SB' : 'SD';
    const status: 'Enabled' | 'Paused' = rand() < 0.82 ? 'Enabled' : 'Paused';

    // Base metrics scaled by campaign "importance"
    const scale = 200 + rand() * 4800;
    const impressions = Math.round(scale * (800 + rand() * 12000));
    const ctrBase = 0.2 + rand() * 0.8;
    const clicks = Math.round(impressions * ctrBase / 100);
    const ctr = clicks / impressions * 100;
    const cpc = 0.3 + rand() * 1.2;
    const spend = Math.round(clicks * cpc * 100) / 100;
    const cvr = 4 + rand() * 18;
    const orders = Math.round(clicks * cvr / 100);
    const avgOrderValue = 8 + rand() * 40;
    const sales = Math.round(orders * avgOrderValue * 100) / 100;
    const acos = sales > 0 ? Math.round(spend / sales * 10000) / 100 : 0;

    totalSpend += spend;

    // Generate placement breakdowns
    const placementSplits = [0.35 + rand() * 0.25, 0, 0];
    placementSplits[1] = 0.15 + rand() * 0.25;
    placementSplits[2] = 1 - placementSplits[0] - placementSplits[1];

    const placements: CampaignPlacement[] = PLACEMENTS.map((name, pi) => {
      const pSpend = Math.round(spend * placementSplits[pi] * 100) / 100;
      const pImpressions = Math.round(impressions * placementSplits[pi] * (0.8 + rand() * 0.4));
      const pClicks = Math.round(clicks * placementSplits[pi] * (0.8 + rand() * 0.4));
      const pCtr = pImpressions > 0 ? Math.round(pClicks / pImpressions * 10000) / 100 : 0;
      const pCvr = cvr * (0.7 + rand() * 0.6);
      const pOrders = Math.round(pClicks * pCvr / 100);
      const pSales = Math.round(pOrders * avgOrderValue * (0.9 + rand() * 0.2) * 100) / 100;
      const pAcos = pSales > 0 ? Math.round(pSpend / pSales * 10000) / 100 : 0;

      return {
        placement: name,
        impressions: pImpressions,
        impressionsPoP: randPoPChange(rand),
        impressionsDiffLY: randLYChange(rand),
        clicks: pClicks,
        clicksPoP: randPoPChange(rand),
        clicksDiffLY: randLYChange(rand),
        ctr: pCtr,
        ctrPoP: randPPChange(rand),
        ctrDiffLY: randPPChange(rand),
        spend: pSpend,
        spendPoP: randPoPChange(rand),
        spendDiffLY: randLYChange(rand),
        sales: pSales,
        salesPoP: randPoPChange(rand),
        salesDiffLY: randLYChange(rand),
        orders: pOrders,
        ordersPoP: randPoPChange(rand),
        ordersDiffLY: randLYChange(rand),
        acos: pAcos,
        acosPoP: randPPChange(rand),
        acosDiffLY: randPPChange(rand),
        cvr: Math.round(pCvr * 100) / 100,
        cvrPoP: randPPChange(rand),
        cvrDiffLY: randPPChange(rand),
      };
    });

    campaigns.push({
      campaign: `${type} | ${prefix} — ${suffix} ${String(Math.floor(i / 20) + 1).padStart(2, '0')}`,
      type,
      status,
      impressions,
      impressionsPoP: randPoPChange(rand),
      impressionsDiffLY: randLYChange(rand),
      clicks,
      clicksPoP: randPoPChange(rand),
      clicksDiffLY: randLYChange(rand),
      ctr: Math.round(ctr * 100) / 100,
      ctrPoP: randPPChange(rand),
      ctrDiffLY: randPPChange(rand),
      spend: Math.round(spend * 100) / 100,
      spendPoP: randPoPChange(rand),
      spendDiffLY: randLYChange(rand),
      pctTotal: 0, // computed after
      sales: Math.round(sales * 100) / 100,
      salesPoP: randPoPChange(rand),
      salesDiffLY: randLYChange(rand),
      orders,
      ordersPoP: randPoPChange(rand),
      ordersDiffLY: randLYChange(rand),
      acos,
      acosPoP: randPPChange(rand),
      acosDiffLY: randPPChange(rand),
      cvr: Math.round(cvr * 100) / 100,
      cvrPoP: randPPChange(rand),
      cvrDiffLY: randPPChange(rand),
      placements,
    });
  }

  // Compute pctTotal
  for (const c of campaigns) {
    c.pctTotal = Math.round(c.spend / totalSpend * 10000) / 100;
  }

  // Sort by spend descending
  campaigns.sort((a, b) => b.spend - a.spend);

  return campaigns;
}

export const campaignData: CampaignRow[] = generateCampaigns();

// ─── Aggregated KPIs ─────────────────────────────────────────────────────────

export interface DeepDiveKPI {
  label: string;
  value: string;
  rawValue: number;
  format: 'currency' | 'percent' | 'number' | 'decimal';
}

function computeKpis(campaigns: CampaignRow[]): DeepDiveKPI[] {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalSales = campaigns.reduce((s, c) => s + c.sales, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
  const acos = totalSales > 0 ? totalSpend / totalSales * 100 : 0;
  const cvr = totalClicks > 0 ? totalOrders / totalClicks * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions * 100 : 0;

  return [
    { label: 'Total Spend', value: '', rawValue: totalSpend, format: 'currency' },
    { label: 'Total Sales', value: '', rawValue: totalSales, format: 'currency' },
    { label: 'ACOS', value: `${acos.toFixed(2)}%`, rawValue: acos, format: 'percent' },
    { label: 'CVR', value: `${cvr.toFixed(2)}%`, rawValue: cvr, format: 'percent' },
    { label: 'CPC', value: '', rawValue: cpc, format: 'currency' },
    { label: 'Impressions', value: '', rawValue: totalImpressions, format: 'number' },
    { label: 'CTR', value: `${ctr.toFixed(2)}%`, rawValue: ctr, format: 'percent' },
  ];
}

export const deepDiveKpis: DeepDiveKPI[] = computeKpis(campaignData);

// ─── Placement Summaries ─────────────────────────────────────────────────────

function computePlacementSummaries(campaigns: CampaignRow[]): PlacementSummary[] {
  const map = new Map<string, { spend: number; sales: number; impressions: number; clicks: number; orders: number }>();

  for (const c of campaigns) {
    for (const p of c.placements) {
      const existing = map.get(p.placement) || { spend: 0, sales: 0, impressions: 0, clicks: 0, orders: 0 };
      existing.spend += p.spend;
      existing.sales += p.sales;
      existing.impressions += p.impressions;
      existing.clicks += p.clicks;
      existing.orders += p.orders;
      map.set(p.placement, existing);
    }
  }

  const totalSpend = Array.from(map.values()).reduce((s, v) => s + v.spend, 0);

  return Array.from(map.entries()).map(([placement, v]) => ({
    placement,
    spend: Math.round(v.spend * 100) / 100,
    pctOfSpend: Math.round(v.spend / totalSpend * 10000) / 100,
    sales: Math.round(v.sales * 100) / 100,
    acos: v.sales > 0 ? Math.round(v.spend / v.sales * 10000) / 100 : 0,
    impressions: v.impressions,
    clicks: v.clicks,
    ctr: v.impressions > 0 ? Math.round(v.clicks / v.impressions * 10000) / 100 : 0,
    cvr: v.clicks > 0 ? Math.round(v.orders / v.clicks * 10000) / 100 : 0,
  }));
}

export const placementSummaries: PlacementSummary[] = computePlacementSummaries(campaignData);

// ─── Audience Segments ───────────────────────────────────────────────────────

export const audienceSegments: AudienceSegment[] = [
  {
    segment: 'High Intent Shoppers',
    impressions: 48200000,
    clicks: 385600,
    ctr: 0.80,
    spend: 269920,
    sales: 1039392,
    acos: 25.97,
    cvr: 12.4,
    roas: 3.85,
  },
  {
    segment: 'Cart Abandoners',
    impressions: 12600000,
    clicks: 151200,
    ctr: 1.20,
    spend: 105840,
    sales: 528192,
    acos: 20.04,
    cvr: 18.6,
    roas: 4.99,
  },
  {
    segment: 'Brand Loyalists',
    impressions: 31400000,
    clicks: 219800,
    ctr: 0.70,
    spend: 153860,
    sales: 455414,
    acos: 33.78,
    cvr: 8.2,
    roas: 2.96,
  },
  {
    segment: 'Category Browsers',
    impressions: 67800000,
    clicks: 271200,
    ctr: 0.40,
    spend: 189840,
    sales: 380724,
    acos: 49.87,
    cvr: 5.1,
    roas: 2.01,
  },
  {
    segment: 'New-to-Brand',
    impressions: 89500000,
    clicks: 268500,
    ctr: 0.30,
    spend: 188000,
    sales: 323200,
    acos: 58.16,
    cvr: 3.8,
    roas: 1.72,
  },
];
