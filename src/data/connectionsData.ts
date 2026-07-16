// ─── Amazon connections & sync model (SP-API + Advertising API) ───────────────
// Models the two OAuth grants a seller authorizes (Selling Partner API and the
// Advertising API), scoped per Amazon endpoint region (NA / EU / FE), plus the
// data domains we backfill once connected. Drives the Connect step, the Sync
// Center and the Connectors manager. Wireframe: all client-side/simulated.

export type ApiRegion = 'NA' | 'EU' | 'FE';
export const API_REGION_LABEL: Record<ApiRegion, string> = {
  NA: 'North America', EU: 'Europe', FE: 'Far East',
};

/** Amazon endpoint each marketplace authorizes against (SP-API + Ads share this grouping). */
const REGION_MAP: Record<string, ApiRegion> = {
  US: 'NA', CA: 'NA', MX: 'NA', BR: 'NA',
  UK: 'EU', DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU', SE: 'EU', PL: 'EU', AE: 'EU', SA: 'EU', IN: 'EU',
  JP: 'FE', AU: 'FE', SG: 'FE',
};
export const apiRegionOf = (marketplaceCode: string): ApiRegion => REGION_MAP[marketplaceCode] ?? 'EU';

/** Group selected marketplaces into the endpoint regions that must be authorized. */
export function regionsFor(marketplaceCodes: string[]): { region: ApiRegion; marketplaces: string[] }[] {
  const byRegion = new Map<ApiRegion, string[]>();
  for (const code of marketplaceCodes) {
    const r = apiRegionOf(code);
    byRegion.set(r, [...(byRegion.get(r) ?? []), code]);
  }
  const order: ApiRegion[] = ['NA', 'EU', 'FE'];
  return order.filter((r) => byRegion.has(r)).map((r) => ({ region: r, marketplaces: byRegion.get(r)! }));
}

export type ConnectionId = 'sp_api' | 'ads';

export interface ConnectionMeta {
  id: ConnectionId;
  label: string;         // full name
  short: string;         // chip/label name
  provider: string;      // the Amazon product being authorized
  blurb: string;         // one-line why we need it
  scopes: string[];      // read-only data the grant covers (shown to the user)
}

export const CONNECTIONS: ConnectionMeta[] = [
  {
    id: 'sp_api',
    label: 'Amazon Selling Partner',
    short: 'Selling Partner',
    provider: 'Selling Partner API (SP-API)',
    blurb: 'Your orders, finances, inventory and catalog.',
    scopes: ['Orders & sales', 'Finances & settlements', 'FBA inventory', 'Product catalog', 'Business reports', 'Brand Analytics (Search Query Performance)'],
  },
  {
    id: 'ads',
    label: 'Amazon Advertising',
    short: 'Amazon Ads',
    provider: 'Advertising API',
    blurb: 'Sponsored Products, Brands, Display & DSP performance.',
    scopes: ['Campaign reporting (SP / SB / SD)', 'DSP reporting', 'Keyword & targeting reports', 'Budgets & bids (read-only)'],
  },
];
export const connectionMeta = (id: ConnectionId) => CONNECTIONS.find((c) => c.id === id)!;

/** localStorage-map key for an authorized (connection × region) pair. */
export const authKey = (id: ConnectionId, region: ApiRegion) => `${id}:${region}`;

/** Grants required to proceed: one Selling Partner + one Ads per region the marketplaces span. */
export function requiredGrants(marketplaceCodes: string[]): { id: ConnectionId; region: ApiRegion }[] {
  return regionsFor(marketplaceCodes).flatMap((r) => CONNECTIONS.map((c) => ({ id: c.id, region: r.region })));
}

// ─── Sync domains — what we backfill once connected ───────────────────────────
export type SyncStatus = 'pending' | 'syncing' | 'done' | 'error';

export interface SyncDomain {
  id: string;
  label: string;
  source: ConnectionId;   // which grant feeds it
  report: string;         // the SP-API / Ads report or API (adds realism)
  detail: string;         // what it powers in the app
  historical: boolean;    // does it backfill history (slower)
}

export const SYNC_DOMAINS: SyncDomain[] = [
  { id: 'orders',        label: 'Orders & sales',            source: 'sp_api', report: 'Orders API · All-orders report',     detail: 'Units, sales, refunds by ASIN',        historical: true },
  { id: 'finances',      label: 'Finances & settlements',    source: 'sp_api', report: 'Finances API · Settlement reports',  detail: 'Fees, disbursements, P&L reconciliation', historical: true },
  { id: 'catalog',       label: 'Product catalog',           source: 'sp_api', report: 'Catalog Items API',                  detail: 'ASINs, SKUs, titles, images',          historical: false },
  { id: 'inventory',     label: 'FBA inventory',             source: 'sp_api', report: 'FBA Inventory API',                  detail: 'Stock, ages, restock signals',         historical: false },
  { id: 'business',      label: 'Business reports',          source: 'sp_api', report: 'Sales & Traffic report',             detail: 'Sessions, page views, Buy Box',        historical: true },
  { id: 'sqp',           label: 'Search Query Performance',  source: 'sp_api', report: 'Brand Analytics · SQP report',       detail: 'Impression → click → purchase share',  historical: true },
  { id: 'advertising',   label: 'Advertising',               source: 'ads',    report: 'Ads Reporting API (SP/SB/SD/DSP)',   detail: 'Spend, ACOS, TACOS, ROAS',             historical: true },
];

/** Active products discovered from the synced catalog — drives product-based pricing post-sync. */
export const DISCOVERED_ACTIVE_PRODUCTS = 342;
