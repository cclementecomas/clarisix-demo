Clarisix Knowledge Base

Distilled insights from client and team conversations. Used to inform wireframe and development decisions.


Product Direction

80% of the app value = homepage summary + profitability module. Everything else (inventory, ads, traffic) = deep dives, secondary.
Profitability must be CFO-grade, accounting-ready. This is the main differentiator.
No custom reporting. All flows should be predefined. If users need to build their own reports, we failed.
Query builder exists for analysts, but the primary UX is for decision makers.

What Users Want (bbox, Mar 25 2026)

One place for everything. Going to two tools (Power BI + Sellerboard) or building Excel reports is a dealbreaker.
Category-level profitability (e.g., "lunch boxes"), not just SKU-by-SKU clicking.
Need to check performance every 2 weeks minimum. E-commerce moves too fast for quarterly reviews.
Pan-European inventory visibility: where did Amazon move stock across countries?
Exportable multi-SKU P&L report with all cost lines in one sheet.

Sellerboard Gaps (what we must solve)

No category-level profitability view.
SKU P&L is one-by-one, no bulk view or export.
Sponsor Brands cost hard to allocate per SKU.
No holistic account view (traffic, ads, sales trends together).
Slow exports, can't mix date ranges across years.


---

Wireframe Implementation Log

Profitability Overview (Profitability.tsx)

Core P&L Table
- 43-line waterfall from Gross Ordered Revenue to Net Operating Profit.
- Row types: header (gray bg), total (brand-tinted), subtotal, ratio (italic), sub-item (indented).
- 4 expandable groups: COGS, Amazon Fees (13 sub-items), Advertising (5 sub-items), Reimbursements (3 sub-items).
- Every line has an info tooltip (PL_TOOLTIPS) with account codes, formulas, and data source attribution.
- Currency values formatted via Intl.NumberFormat, negatives in red parentheses.

Granularity & Year Controls
- Granularity: Monthly / Quarterly / Yearly (+ Settlement when Cash policy is active).
- Year picker: 2024 / 2025 / 2026 (defaults to 2026, current year).
- 2026 data: Jan–Mar actuals (~8% YoY growth), Apr–Dec empty, Q1 2026 aggregated, FY2026 = YTD.
- YoY toggle: Shows ▲/▼ percentage deltas inline under each cell. Available for 2025+ years. Color logic flipped for cost lines (lower = green).

Cost Breakdown Bar ("Where each €1 goes")
- Stacked horizontal bar with 6 segments: Returns & Adj., COGS, Amazon Fees, Advertising, Overheads, Net Profit.
- Inline labels in cents format (e.g. €0.26) for segments ≥ 6% width.
- Hover: dims non-hovered segments to 50% opacity, shows tooltip with cents + % + absolute value.
- Interactive legend below bar (hovering legend highlights bar segment).
- Cascade margin chips: Product Margin → Channel Margin → Growth Margin → Net Margin with color-coded percentages (green ≥20%, yellow ≥10%, orange ≥0%, red <0%).

Column Highlighting
- Click column headers to spotlight them (brand blue header, light tint on data cells).
- Non-highlighted columns dim to 40% opacity. Multiple columns selectable.
- "Clear (N)" button appears in controls bar. Highlights auto-clear on granularity/year change.

Accounting Policy Switcher (P0)
- Three-way toggle: Accrual (default) / Management / Cash.
- Dark segmented control (bg-slate-800), positioned first in controls bar, visually most prominent.
- Switching policies conceptually changes all numbers; same 43-line structure across all three.
- When leaving Cash, settlement granularity auto-resets to quarterly.

Policy Badges (P1)
- Management: amber badge "Management View (Non-GAAP)" next to title.
- Cash: blue badge "Cash Basis (Settlement-Anchored)" next to title.
- Accrual: no badge (standard/default).

Settlement Granularity (P1, Cash only)
- Fourth granularity option "Settlement" appears when Cash policy is active.
- Shows bi-weekly settlement periods (Jan 1–14, Jan 15–28, etc.) with close dates.
- Monthly/Quarterly/Yearly still available for cash view (aggregate settlements into those periods).

Cash Reconciliation Section (P1, Cash only)
- 3-card grid below P&L table: Settlement Net Amount | P&L Net Operating Profit | Variance.
- Green checkmark (CheckCircle2) when variance < €10, red flag (AlertTriangle) otherwise.
- Source attribution on each card (Settlement Report V2, Journal entries).

Amazon Reserve Tracking (P2, Cash only)
- Expandable section below reconciliation (ChevronDown toggle).
- 4-card grid: Opening Balance → Withheld This Period → Released This Period → Closing Balance.
- Explains why settlement payout differs from earned amount.

Policy Comparison Mode (P2)
- "Compare" toggle adds side-by-side columns from a second policy.
- Dropdown selector: vs Accrual / vs Cash / vs Management (excludes active policy).
- Policy label header row distinguishes primary vs comparison columns.
- "Timing Difference" delta column on the right shows gap between policies.
- Comparison columns have purple-tinted bg; delta column has purple-900 header.
- Simulated timing differences (~2-5% offset for wireframe purposes).

Export
- Export to Excel: XLSX download via SheetJS with auto-column-width.
- Google Sheets: copies TSV to clipboard + opens new sheet URL with paste instructions modal.

Footer
- Legend for key metrics, negative values, italics, YoY indicators.
- Shows active policy basis + currency. LastRefreshed timestamp.


Profitability Deepdive (ProfitabilityDeepdive.tsx)

Product-Level P&L Table
- Uses shared DeepDiveTable component with ~25 columns.
- Each row = one ASIN with full P&L metrics. Expandable to SKU-level (child rows).
- Pinned TOTAL row at bottom with aggregated values.
- Visible by default: ASIN (pinned), P&L button, Product, Units Sold, Gross Revenue, Product Margin %, Channel Margin %, Growth Margin (€ and %), Net Margin %.
- Hidden by default (toggleable): Avg Price, Refunds, Net Revenue, COGS, all margin € values, Advertising, Reimbursements, Overheads, Net Op. Profit €, Profit/Unit, Category, ACOS, TACOS, ROAS, Return Rate, Refund Rate.
- Each metric has PoP and LY sub-columns with percentage/pp change formatting.
- Color-coded cell styles with thresholds for margins, profit, ACOS, return rates.
- Horizontal scrolling with dynamic pixel-based column widths (computed from visible columns).

P&L Waterfall Chart
- Per-product waterfall (Recharts BarChart) triggered by clicking "P&L" button on any row.
- 12-step cascade: Gross Revenue → Refunds → Net Revenue → COGS → Product Margin → Amazon Fees → Channel Margin → Advertising → Reimbursements → Growth Margin → Overheads → Net Op. Profit.
- Color scheme: navy (revenue), coral (costs), teal (reimbursements), blue (subtotals), green/red (final profit).
- Header shows margin cascade with arrows: Product Margin → Channel Margin → Growth Margin → Net Margin.
- Tooltip shows step name, value, and running total. Legend + close button.

DeepDive Table (deepdive/DeepDiveTable.tsx)
- Dynamic pixel-based column widths computed via tableMinWidth useMemo.
- table layout: fixed with pixel colgroup widths for horizontal scroll control.
- w-full class for autofit behavior. Min 900px width.
- ColumnToggle dropdown for showing/hiding columns.
- Click-to-copy on pinned ASIN cells: opt-in via `copyablePinnedCell` prop. Shows copy icon on hover, green checkmark on click with 1.5s feedback. Used on Best Selling ASINs, Profitability by Product, and Performance by ASIN tables. Non-ASIN tables (Marketplace, Category, Subcategory) do not have this feature.


Sales Overview (SalesOverview.tsx)

Stacked Bar Chart
- Stacked columns: Organic Sales (dark navy #0E5A8A) + Ad Sales (light blue #4B9DCC).
- In-bar labels: white text, 10px, hidden when segment height < 25px. Ad Sales bar uses explicit `dataKey="adSales"` to avoid Recharts stacked cumulative value bug.
- Total labels on top of columns: computed via `BarTotalLabels` Customized component using chart x/y scales. Black (#1e293b), 11px bold (10px when >12 bars for day view). Shows sum of adSales + organicSales.
- Growth trend overlay: dashed line with arrow + percentage bubble between first and last bars. Offset 36px above bar tops to clear total labels.
- Granularity: Day / Week / Month / Quarter toggle.
- Tooltip: dark bg, shows each segment with currency + percentage + total row.

Sales Deepdive (DeepDive.tsx)
- Sales Share column: computed dynamically from `sales / totalSales * 100` via `computeShares()` in deepdiveData.ts. Ensures shares always total exactly 100% with rounding correction applied to first row. Applied to marketplace, category, and ASIN tables.


Trends — Metrics over time matrix (May 5 2026 — MetricMatrix.tsx)

A second section on the Trends page beneath the existing pivot table. Shows all 12 Sales-Deepdive metrics simultaneously with periods as rows.

Layout:
- Rows: time periods, driven by the page-level Day/Week/Month/Quarter granularity toggle (shared with the pivot above).
- Columns: Sales, Units, Ad Spend, Ad Sales, ROAS, ACOS, TACOS, BBox Win, Ad Reliance, CVR, Page Views, Sessions.
- Sticky first column (period label) so horizontal scroll keeps the date visible.
- ↑ / ↓ marker per column header indicates polarity ("higher is better" vs "lower is better").

Heatmap:
- Each column independently shaded green→red based on relative position within that column's min/max.
- Polarity reversed for cost metrics (Ad Spend, ACOS, TACOS, Ad Reliance) so red always means "worse."
- Opacity capped at ~0.32 to keep text readable; neutral cells stay white.

Cell selection (matches TrendsPivotTable / DeepDiveTable pattern):
- Click → single select; click again → deselect.
- Drag → rectangle select.
- Ctrl/Cmd-click → toggle individual cells.
- Window mouseup listener ends drag.
- Initial "Click and drag cells to see statistics" hint pill auto-dismisses after 5s or on first interaction.
- Selection resets when periods change.

Stats placement (matches DeepDiveTable pattern, not TrendsPivotTable's header pattern):
- Standard SelectionStats component (Count · Sum · Avg · Median · Min · Max) shown in the bottom-right footer alongside LastRefreshed, only when there's an active selection.
- Cross-column selections produce raw stats (no unit awareness) — same behavior as DeepDiveTable. Acceptable since each column has tabular-nums and most users select within a single column.

Data:
- src/data/metricMatrixData.ts: generateMatrixData(periods) produces deterministic per-period values seeded by period label hash. Sales drives Ad Spend (6-13%); Ad Spend drives ACOS, TACOS, ROAS via formula. Other metrics noise around plausible ranges with gentle upward drift.


Loading States (ClarisixSpinner.tsx)

- SPINNER_VERBS: ~110 creative verbs (mix of tech, silly, action words) that cycle randomly every 1 second.
- `useSpinnerVerb()` hook picks a random verb, changes via setInterval every 1s.
- Personalized name-verb: 1/3 chance each tick shows the user's name as a verb (e.g. "Clauding...", "Alexandring...").
  - `nameToVerb()`: strips trailing vowels down to consonant root, adds "ing". If root would be <3 chars, keeps full name + "ing" (Leo → Leoing, Joe → Joeing).
  - Reads `cx_user_name` from localStorage (same key as greeting system), defaults to "Alex".
- Applied to TableLoader, TableOverlay, SectionLoader as default message. Custom `message` prop overrides cycling if provided.


Inventory Overview (InventoryOverview.tsx)

Settings Panel
- 4 global settings: Ideal Weeks of Coverage (default 10), Lead Time (default 30d), Lead Time Variance (default ±7d), Service Level (90/95/97.5/99%).
- Lead time is a global setting, not per-SKU. All SKU metrics recompute reactively when settings change.
- Promotional Events: configurable list with name, date, and sales multiplier. Boosts forecast demand for affected weeks.

Core Formulas (computeSkuMetrics)
- Safety Stock (King formula): SS = Z × √(LT × σ²_demand + avgDemand² × σ²_LT). Z-scores: 90%=1.282, 95%=1.645, 97.5%=1.96, 99%=2.326.
- DDLT (Demand During Lead Time) = avgDailySales × leadTimeDays. Used only for ROP, NOT in ideal inventory.
- ROP (Reorder Point) = DDLT + Safety Stock. Tells WHEN to order.
- Ideal Inventory = (adjustedWeeklySales × coverageWeeks) + Safety Stock. Tells HOW MUCH to stock.
- Reorder Qty = max(0, Ideal Inventory − Available).
- daysUntilStockout = available / avgDailySales. daysUntilReorder = daysUntilStockout − leadTimeDays.

Inventory Risk Table
- Sortable table with all SKUs. Columns: SKU, ASIN, Stock, Available, Avg Daily Sales, Days of Supply, Reorder Qty, Risk Level.
- All column headers have InfoTooltip with formula explanations.
- Expandable row detail cards showing computed metrics (Safety Stock, DDLT, ROP, Ideal Inventory, etc.) with tooltips.
- KPI filter row: Revenue at Risk, Stranded, Unfulfillable, Overstock, Low DOC.

Stock Runway Timeline (RunwayTimeline)
- Horizontal bar: green (healthy coverage), yellow (safety buffer), red (stockout gap), blue bracket (lead time window).
- Date-stamped markers below bar (actual dates, not "Xd").
- Explicit action summary with colored bullets: stock remaining, order-by deadline with date, safety buffer details, gap warnings.

Replenishment Plan Panel
- Replaces old "Today's Action Queue". Clean table view, not card-based.
- 3 urgency sections: Order Immediately (red, OOS/past ROP), Order Soon (orange, reorder within 14d), Plan Ahead (yellow, collapsed by default).
- Columns: Status badge (OOS/NOW/SOON/PLAN), SKU, Product, On Hand, Supply Left, Order By date, Stockout date, Order Qty, Est. Cost.
- Uses unitCost (per-unit COGS, $3–$23 range) for realistic cost estimates.
- Export CSV button: downloads full replenishment list with all columns, date-stamped filename.
- Footer with total SKU count, total units, total estimated cost.
- Fully reactive to settings changes (coverage, lead time, service level).
- Title-only search bar in panel header (Apr 30 2026): filters all three urgency sections by product title with clear-button. Empty-results message when no match. Totals stay unaffected — search is a "find" tool, not a totals filter. Page-level "Search SKU, ASIN, or title" was removed; SKU/ASIN are already addressed by KPI filters above.

Inventory Section Restructure (2026-04-16)

Rationale
- Replenishment page was redundant with Overview's Replenishment Action Panel. Both answered the same question (what to order, when, how much) but Replenishment used pre-baked static values with no configurable levers. The Overview's live forecast engine (coverage, lead time, service level, promo events) plus urgency bucketing and order-by dates already solved the workflow end-to-end.
- Performance page was the only distinct view — it answers a different question: "is capital working hard?" (turnover, ROI, sell-through, storage cost, days-on-hand). Kept and enhanced.

Nav Changes
- Inventory sub-items collapsed from ['Overview', 'Replenishment', 'Performance'] → ['Planner', 'Performance'].
- 'Overview' renamed to 'Planner' to signal action-oriented ownership of the replenishment workflow. Default sub = 'Planner'.
- Updated references: dashboardData.ts (KPI navSub, alert navSub), PeriodSnapshot.tsx (Out of Stock card), App.tsx routing.
- InventoryReplenishment.tsx deleted.

Planner = Former Overview (InventoryOverview.tsx)
- View switcher (segmented control) below KPI row toggles between two panels:
  - "Action Queue" (default) — ReplenishmentActionPanel with NOW/SOON/PLAN urgency buckets, order-by dates, CSV export.
  - "SKU Inventory" — full Risk Table with all SKUs.
- KPI card clicks auto-switch to "SKU Inventory" view and apply the filter (keeps discoverable filter UX while defaulting users to the action-oriented view).
- Migrated from Replenishment:
  - Demand σ / CV column added to Risk Table between Median/wk and Wks on Hand. CV > 0.5 = red (highly erratic), CV > 0.3 = yellow.
  - avgDailySales PoP/LY deltas now render inline under Median/wk cell (DeltaLine helper).
  - daysOfSupply PoP/LY deltas render under Wks on Hand cell.
  - Expanded row metric grid expanded from 8 → 9 tiles, adding Demand σ / CV tile, plus DeltaLine under Median/wk and Weeks on Hand tiles.
- DeltaLine component: green/red/gray "PoP +X.X% · LY +Y.Y%" in 10px font under the primary value.
- ComputedMetrics type extended with demandStdDevDaily + demandCV fields.

Performance (InventoryPerformance.tsx)
- Sticky filter bar at top (parity with Planner): search, category dropdown, Dead Stock toggle button with count badge.
- 4 summary cards above the table:
  - Capital Parked (red tint, clickable) — inventoryValue summed across dead-stock SKUs (daysOnHand > 180). Clicking activates the dead-stock filter.
  - Monthly Storage Drag (orange tint) — storageCostMonthly summed across dead-stock SKUs.
  - Avg Turnover (neutral) — portfolio mean, baseline 6–10x healthy.
  - Avg ROI (neutral) — portfolio mean gross profit ÷ inventory value.
- Dead Stock Action Strip — when the Dead Stock Only filter is active, a red banner appears above the table with inline CTAs: Liquidate / Discount Campaign / Create Removal Order.
- Trend column — inline SVG sparkline over 12-week weeklyVelocity. Stroke color green if end > start, red otherwise. Uses valueFormatter returning React.ReactNode.
- DEAD_STOCK_THRESHOLD_DAYS = 180.
- Warehouse child rows removed (were static clones of the parent — not useful here; Planner has them on expansion).
- Totals row now reflects the filtered subset, not the full dataset.

Files Changed
- src/data/dashboardData.ts — menu labels, KPI/alert navSub refs.
- src/App.tsx — removed import/route; Inventory now matches activeSub 'Planner'.
- src/components/PeriodSnapshot.tsx — Out of Stock card now navigates to Inventory/Planner.
- src/components/InventoryOverview.tsx — Demand σ column, DeltaLine, tab switcher, expanded row metric grid.
- src/components/InventoryPerformance.tsx — rewritten with filters, summary cards, sparkline, dead-stock CTAs.
- src/components/InventoryReplenishment.tsx — deleted.

Inventory Refinements (2026-04-16)

Risk Table Condensation (Planner)
- Flags column removed — low signal, crowded the row (Stranded / Unfulfillable / Aging 365+ are already visible via the tinted row background and status badge).
- PoP/LY DeltaLine removed from Wks on Hand and Median/wk cells (and matching expanded-row tiles). Absolute values drive action on Planner; period deltas belong on Sales/Performance.
- Table switched to `table-fixed`, `overflow-x-auto` dropped. Column headers shortened (Avail, Med/wk, σ / CV, WoH, Safety, Ideal, Reorder, In, Rev @ Risk) so 13 columns fit without horizontal scroll.
- DeltaLine component deleted (no remaining callers). colSpan updated 14 → 13.

Safety Stock Tooltip (Planner)
- Replaced the raw King formula with plain-English: "Buffer units above expected demand to absorb sales spikes and supplier delays, sized for your chosen service level (e.g. 95%). Grows when demand or lead time gets more erratic."
- Applied to both column header and expanded-row metric tile.

Replenishment Plan CSV
- Column headers aligned to deep-dive Title Case: Product→Title, Reorder Qty→Reorder Quantity, Order By→Order By Date, Est. Arrival→Arrival Date. SKU/ASIN stay uppercase.
- Filename pattern aligned to app-wide `clarisix-<thing>-YYYY-MM-DD.ext` (matches snapshot, trend, score exports): `replenishment-YYYY-MM-DD.csv` → `clarisix-replenishment-plan-YYYY-MM-DD.csv`.

GMROI Redesign (Performance)
- ROI column renamed GMROI, annualized (×12 from monthly basis) to match industry-standard framing. Bands shifted to industry benchmark: ≥300% green, 150–300% yellow, <150% red.
- Tooltip rewritten to expose the identity: "GMROI = Gross Margin % × Inventory Turns. 100% = inventory paid back once per year; 300% = three times. Gross only — excludes ads, FBA fees, storage."
- New Gross Margin column added (gross profit ÷ revenue, derived on the fly from existing roi + cogs + inventoryValue). Bands: ≥50% green, 30–50% yellow, <30% red.
- Summary cards 4 → 5: inserted Avg Gross Margin between Avg Turnover and Avg GMROI. Each card's tooltip names its role in the GMROI = Margin × Turns identity.
- Rationale: plain ROI over a spot snapshot was period-ambiguous and poorly benchmarked. Annualizing makes the number comparable to ad ROAS / T-bills, and showing the decomposition exposes the two levers (margin vs turnover) an operator can act on.
- Known limitations documented in tooltip: gross only (excludes ads/FBA/storage); annualized extrapolation distorts for launches and seasonal SKUs.

Performance Table PoP/LY Cleanup
- All PoP/LY subcolumns removed from Performance table (Units Sold, Sell-Through %, Turnover, Storage Cost/mo, GMROI). These KPIs are steady-state capital-efficiency ratios — "is this SKU pulling its weight now?" reads — not week-over-week trend indicators.
- pctSub/ppSub helpers and percentFormatter/percentCellStyle/ppFormatter imports removed.

DeepDiveTable — Auto-hide PoP/LY Toggle
- The PoP/LY toggle button group in the table toolbar now only renders when at least one column has `subFields`. Prevents dead controls on tables where period deltas aren't defined (e.g. Inventory Performance).
- Non-breaking for every other page: sales, advertising, profitability deep dives still show the toggle because their columns carry subFields.

Category Filter Removed from Performance Controls
- Local "All Categories" dropdown removed from Performance sticky controls bar — redundant with the global Marketplace / Brand / Category filters at the page-header level. `categoryFilter` state, `categories` memo, and filter branch all removed.
- Sticky controls bar now only carries search + Dead Stock toggle (the two filters that don't have a global equivalent).

Account Specifics — Settings Module (2026-04-17)

New "Account" tab added to Settings (2nd position after Preferences, Settings2 icon).

Campaign Naming Convention Toggle
- When ON: "Performance by Brand" (new) and "Performance by Category" tables in Advertising Overview render with live data. Brand data extracted from campaign name pattern (e.g. XXXXXX|ZeroWater-Filters → Brand = ZeroWater, Category = Filters).
- When OFF (default): both tables show a locked placeholder matching the Advertising Deep Dive audience placeholder pattern — blurred skeleton rows, amber "Not configured" badge, lock icon, and CTA pointing to Settings → Account.
- Configurable naming pattern field (default: XXXXXX|Brand-Category) with example and case-sensitivity warning ("Zamst ≠ ZAMST").
- "Performance by Subcategory" removed from Advertising Overview — replaced by "Performance by Brand". Table order: Marketplace → Brand → Category → ASIN.

Audience Labeling Toggle
- When ON: "Performance by Audience" table in Advertising Deep Dive renders fully unlocked with section header, chart/table toggle, and all interactive controls.
- When OFF (default): same locked placeholder as before, but CTA updated from "Contact account manager" to "Settings → Account" for self-service.

Implementation
- AccountSpecificsContext (new): two booleans + naming pattern string, persisted to localStorage (cx_campaignNaming, cx_campaignNamingPattern, cx_audienceLabeling).
- AccountSection.tsx (new): toggle switches, pattern input, example block, case-sensitivity note, confirmation badge when audience labeling is active.
- adByBrand dataset added to advertisingData.ts (7 brands, same AdPerfRow shape as marketplace/category/ASIN).
- LockedTablePlaceholder component added to AdvertisingOverview.tsx — reusable locked-state card with InfoTooltip, amber badge, blurred skeleton, and overlay CTA.

Advertising Filter Bar Scoping (2026-04-17)
- On Advertising pages (Overview + Deep Dive): Subcategory, Tag, and SKU filters removed from the global filter bar — these dimensions cannot be derived from campaign-level ad data.
- Brand and Category filters conditionally shown on Advertising pages only when the Campaign Naming Convention toggle is active (since brand/category are extracted from the naming pattern).
- All other pages (Sales, Inventory, Profitability, Traffic, etc.) keep the full filter set unchanged.
- Implementation: Navigation.tsx checks `activeSection === 'Advertising'` and `campaignNamingEnabled` from AccountSpecificsContext to conditionally render filters.

Advertising Budgets — Global Filters Removed (2026-04-17)
- Entire global filter bar (Marketplace, Brand, Category, etc.) and date filter (From/To + calendar picker) hidden on the Advertising Budgets page. Budgets is a forward-looking planning view — historical date ranges and dimension filters don't apply.
- Data is shown for YTD. A year selector for viewing past budget data is planned as a future addition.
- First page with no global filter bar; precedent is justified because forcing irrelevant filters is worse than showing none.

Category Mapping — Onboarding + Settings (2026-04-17)

Onboarding Wizard (Step 6 "Mapping")
- New step inserted between Preferences (5) and Done (7, previously 6). Wizard is now 7 steps.
- 3-part guided flow: (1) download template CSV pre-filled with SKU/ASIN columns, (2) fill Brand/Category/Subcategory/Tag per SKU in Excel or Sheets, (3) drag-and-drop upload the completed CSV.
- Step is optional — clients can skip and upload later from Settings → Account. canProceed always returns true.
- Case-sensitivity warning shown inline ("Zamst ≠ ZAMST").
- Rationale: while Amazon data is fetching post-onboarding, clients have a productive task instead of waiting on a progress screen.

Settings → Account → Data Mapping
- New section below Account Specifics in the Account tab.
- Preview table showing the current SKU mapping (Brand, Category, Subcategory, Tag).
- Download button exports the current mapping as `clarisix-category-mapping-YYYY-MM-DD.csv`.
- Upload button (drag-and-drop + browse) accepts an updated CSV; shows confirmation with filename and row count.
- Workflow: download → append/edit in spreadsheet → re-upload. Changes apply immediately to all filters and breakdown tables.
- (May 5 2026) Extracted to its own page Settings → Products with full coverage tracking — see "Settings → Products" section below.

Settings → Products (May 5 2026 — components/settings/ProductsSection.tsx)
Mirrors the COGS Coverage philosophy for the product mapping problem.

Why a separate page
- The old Data Mapping card showed only the 5 SKUs that were already mapped, with no visibility into the 45 unmapped products. Sellers couldn't see they had a problem until they noticed "NA" everywhere downstream.
- Unmapped SKUs don't disappear from filters — they bucket under "NA" in Brand, Category, Subcategory, which silently undermines reports.

Coverage model
- Source: inventoryData (50 SKUs) joined with seedMappings (5 pre-populated entries from the original Data Mapping demo).
- Required fields: Brand + Category. Without either, status = "needs-mapping" (rose). 
- Optional fields: Subcategory + Tag. With Brand+Category but Sub or Tag empty, status = "partial" (amber). All four set = "complete" (green).
- Coverage % = (mapped products / total) × 100, where "mapped" includes both complete and partial.
- productMappingData.ts exports the seed data, types, and `getMappingStatus()` helper.

UI
- Coverage header card with tier badge (STRONG ≥90, PARTIAL 60–89, NEEDS WORK <60), big % number, three sub-stats (Complete / Partial / Needs mapping).
- Top toolbar: view toggle (Needs mapping / All / Mapped, defaults to Needs mapping when count > 0), search, count, Download mapping CSV, Upload mapping CSV.
- Editable grid: SKU/ASIN/Title read-only; Brand/Category/Subcategory/Tag inline-editable with rose-bordered placeholders for required-but-empty fields. Status badge per row.
- Unmapped rows: rose-tint background, "NEEDS MAPPING" badge next to SKU. Visual language matches uncosted rows in COGS Coverage.
- Inline edits save to local state on every keystroke; status badge + coverage % update live.
- Settings page made full-width (max-w-5xl removed) so the table has operating space.

IPI Score + Storage Limits (2026-04-17)

Data Layer (inventoryData.ts)
- New `IPIData` interface and `ipiData` export: IPI score, last updated date, per-storage-type breakdown (Standard-Size, Oversize, Apparel, Footwear) with used/limit/utilization cu ft, and total utilization.
- Sourced from Amazon SP-API FBA Inventory API (`getInventoryPlanningData`, `getStorageFootprint`). IPI updated weekly by Amazon.

Planner Banner (InventoryOverview.tsx)
- Amber alert banner shown between settings panel and KPI row when IPI < 400 or total utilization > 85%.
- Displays IPI score badge (red if < 350, amber if < 400), utilization % badge, actionable guidance text, and per-storage-type utilization bars for any type above 75%.

Performance Card (InventoryPerformance.tsx)
- "Space Utilization" summary card added next to "Capital Parked" (grid 5 → 6 cols). Shows total utilization %, IPI score, cu ft used/limit. Orange tone when utilization > 85%.

Storage-Aware Replenishment Caps (InventoryOverview.tsx)
- Two-level system applied after sorting replenishment items by stockout urgency:
  - **Soft warning** (utilization 75–90% or IPI 350–400): original order qty unchanged, amber warehouse icon + tooltip on every row ("confirm FBA capacity before shipping").
  - **Hard cap** (utilization > 90% or IPI < 350): qty reduced to fit remaining cu ft (0.5 cu ft/unit estimate), most-urgent SKUs allocated first. Original qty struck through, adjusted qty in red. Zero-capacity SKUs show "—" with tooltip.
- Replenishment header shows inline storage badge when caps active: "Storage X% · ~N units left", colored amber (soft) or red (hard).
- Footer totals show struck-through original unit count when hard caps reduce quantities.
- CSV export extended with two columns: "Adjusted Quantity" and "Storage Note".
- Demo data: IPI 372, utilization 77.4% → triggers soft level. Set IPI < 350 or utilization > 90% to test hard caps.

Historical Inventory Table (2026-04-20)

Data Layer (inventoryData.ts)
- New `SKUHistory` and `DailySnapshot` interfaces. 90 days of daily snapshots per SKU generated via seeded random walk from current stock values.
- Each snapshot: unitsOnHand, inventoryValue, daysOfSupply, sellThroughRate.

Component (InventoryHistoryTable.tsx)
- Placement: Inventory Performance page, below the SKU performance DeepDiveTable.
- Structure: frozen SKU column (name + title) + horizontally scrollable date columns with arrow navigation.
- Default view: Units on Hand by Day.
- Metric switcher: Units on Hand, Inventory Value, Days of Supply, Sell-Through Rate.
- Granularity toggle: Day (default), Week, Month. Week uses ISO weeks (Monday start); Month uses end-of-period snapshot for stock metrics, average for sell-through.
- Blue heatmap: 5-step intensity scale (higher values = darker blue), neutral and non-judgmental.
- SKU search filter in header.
- CSV export: `clarisix-historical-inventory-YYYY-MM-DD.csv` — exports whichever metric + granularity is currently selected. Headers: SKU, Product Title, then date columns.


InfoTooltips — Global Rollout
- All KPI cards across all sections now have contextual tooltip content (not empty placeholders).
- Homepage KPIs (KPICards.tsx): Sales, TACOS, Profitability, Out of Stock, Content Score, Customer Experience.
- Advertising KPIs (AdvertisingKPICards.tsx): Ad Sales, Ad Spend, ACOS, TACOS, CPC, CPA, TCPA, Conversion Rate, Impressions, Clicks, CTR, Orders.
- Traffic KPIs (Traffic.tsx): Total Sessions, Page Views, Conv. Rate, Organic Share, Ad Impressions, Avg CTR.
- Section headers: SalesHeatmap, BreakdownCharts (bullet charts), Conversion Funnel, Sessions & Conversion Rate.
- DeepDiveTable: tooltip prop on ColumnDef interface renders InfoTooltip in header.


Traffic Overview (Traffic.tsx)

Sources Breakdown Redesign
- Replaced stacked bar chart with stacked area chart for traffic sources over time.
- Added absolute/percentage toggle (showPct state) to switch between raw values and 100% stacked view.
- Source keys: organic, external, sponsoredProducts, sponsoredBrands, sponsoredDisplay, dsp.

Advertising Overview & Deep Dive (AdvertisingOverview.tsx, AdvertisingDeepDive.tsx)

KPI Card Naming
- Main ad KPI cards renamed: "ACOS/ROAS" → "ACOS", "TACOS/TROAS" → "TACOS".
- Cleaner labels avoid the dual-metric ambiguity. ROAS available as a togglable column at the table level.

ROAS Column in Tables
- All ad deep-dive tables (Placement, Audience, Ad Type, Search Term, Campaign) have a ROAS column right after ACOS.
- Unticked by default in the column toggle dropdown — opt-in for users who prefer the ratio view.
- Computed dynamically as `sales ÷ spend` via `withRoas()` helper applied to all data arrays.
- Format: "x.xx×". Color coded: green ≥5×, red <3×.
- TACOS/TROAS not added at row level — these require blended (organic + paid) sales which is a business-level metric, not per-segment.
- `useSectionControls(initCols, hiddenByDefault)` extended to accept a list of fields to exclude from initial visible columns.

Cleanup
- Removed unused HourlyLineChart component and associated hourly data imports.
- Removed unused tacticData, funnelData, hourlyData imports.
- Removed unused HOURLY_METRICS constant.
- Added InfoTooltip import for search term table headers.


Content Tracker (ContentTracker.tsx)

- CopyableAsin component: click-to-copy for ASIN cells with copy/check icon feedback. Used in comparison table rows.


Data Layer (profitabilityData.ts)

- PV (Period Values) record type with string keys for all periods.
- Helper functions: scl (scale), add, sub, neg, mul, pct — operate across all period keys.
- KS array: legacy comparison keys + monthly 2024/2025/2026 + quarterly + yearly.
- Base inputs (manually set): unitsSold, unitsRefunded, grossASP, subscriptionFees, removalDisposal, safetClaims, otherAdjustments.
- Everything else derived via formulas (grossOrderedRevenue = mul(unitsSold, grossASP), etc.).
- yoyGrowth() computes year-over-year growth for 2024 vs 2023, 2025 vs 2024, 2026 vs 2025.
- Exports: profitabilityData (metric array), individual PV objects for cost breakdown bar, margin percentages, PL_TOOLTIPS.

2026 Data
- Jan–Mar actuals with ~8% YoY unit growth, ~3% ASP growth.
- Apr–Dec empty (no data yet). Q2–Q4 2026 empty. FY2026 = YTD (Jan–Mar only).


---

COGS Coverage Agent (Apr 29 2026 — full rebuild from "PO Manager" model)

Mission shift:
The page is no longer "manage purchase orders." It's an embedded coverage agent whose job is to make profit trustworthy as fast as possible. The agent optimizes for revenue-weighted coverage, not catalog completeness. Missing cost is shown as "Unknown" — never as $0.

Architecture:
- cogsData.ts: New types — CostRecord (the atomic cost unit, with marketplace scope, currency, effective dates, source, confidence), SkuCostProfile (aggregate view per SKU with status), InboundEvent + InboundCluster (FBA receipt signals), CoverageMetrics. Original PurchaseOrder/CostLayer types kept for back-compat but no longer central.
- Coverage engine: computeCoverage() returns revenue/units/active-SKU coverage %, top-revenue gap (# SKUs to fix to reach 90%), inbound-review count, dormant count.
- buildSkuCostProfiles(): joins inventory + cost records + inbound events + ignored set into SkuCostProfile[] with resolved currentCost (marketplace-specific with "all" fallback).
- Demo data: 11 SKUs intentionally uncosted (SKU-005, 009, 014, 019, 023, 027, 031, 035, 040, 044, 048) to demonstrate the workflow. ~18 SKUs receive 1-3 inbound shipments each spanning the last 60 days. Some SKUs have UK marketplace overrides (every 7th) and historical cost-change records (every 11th).

UI architecture (one workspace, one grid, one cost profile, many fillers):
- src/components/cogs/CoverageWorkspace.tsx: main shell with coverage header, worklist sidebar, editable grid, inline drawer.
- src/components/cogs/PasteUploadModal.tsx: 3-step modal (Add data → Map columns → Review). Forgiving column aliases (SKU = Seller SKU = MSKU = Merchant SKU; Landed cost = COGS = Cost = Unit landed). Min input: sku, landed_cost. Stages all rows; user can apply valid rows even if some fail.
- src/components/cogs/InboundReceiptsView.tsx: per-SKU clustered receipts with [Reuse] [Enter new] [Group as batch] [Ignore] actions.
- src/components/COGSManager.tsx: thin shell that mounts CoverageWorkspace.

Coverage header:
- Headline number = Revenue coverage % (color-tiered: green ≥90, amber 60-89, red <60).
- "Show details" expand reveals Units coverage and Active SKU coverage as secondary stats — keeps the eye on revenue.
- "Fix next N SKUs to reach 90%" CTA jumps user to filtered Needs COGS view.
- Inline "Paste / Upload Costs" button + amber "Review N inbound" pill when applicable.

Worklist sidebar (task-oriented, not accounting-oriented):
- Needs COGS — sold or stocked, no cost set.
- Top revenue — sorted by 90d revenue.
- Inbound review — recent FBA receipts pending decision.
- Dormant — no recent activity, not blocking profit.
- All SKUs — full catalog.
(Cost changes & Conflicts deferred to v2 — need defined triggers.)

Editable grid:
- Columns: Product/SKU/ASIN, Marketplaces, 90d Revenue, 90d Units, Inv/Inbound, Landed Cost (inline editable), Currency, Status.
- Inline cost edits save immediately (one cell at a time, low risk).
- Bulk paste/upload stages for review (high risk).
- Provenance icons next to each cost: Hand=manual, FileSpreadsheet=paste, Upload=csv, Inbox=inbound, Cpu=builder/api.
- Uncosted rows: rose tint, "NEEDS COST" badge, rose-bordered cost input showing "Unknown" placeholder.
- Marketplace override marker: small Globe icon next to SKU when overrides exist.

Row drawer (inline expansion):
4 tabs per SKU:
- Current cost: edit landed cost, currency, marketplace scope. Shows source + last-edited.
- Cost timeline: list of cost changes over time with effective_from/effective_to. Add cost change inline form.
- Marketplace overrides: per-marketplace records (e.g. UK override at £4.80 with reason "Higher UK duties"). Add override inline form.
- Advanced batches: collapsed by default. Enable batch tracking only if you need inventory-layer accuracy. Reveals costing method (WAC/FIFO/LIFO) picker.

Paste / Upload modal:
- Step 1 (Add data): Promoted "Download CSV template" button (top-right, with subtitle "Pre-filled headers + 3 example rows"). Three-tier "Accepted columns" reference card sits above the paste area showing Required (sku, landed_cost) / Common (currency, marketplace, effective_from) / Advanced (effective_to, quantity, received_date, batch_id, freight, duties, other) — sellers see the schema without needing to download. Big paste textarea with multi-column placeholder + drag-drop file. Defaults panel for currency/marketplace/effective-from when rows omit them.
- Step 2 (Map columns): Auto-detect with fuzzy aliases. Required-column readiness badges (SKU mapped ✓, Cost mapped ✓). Sample values shown per column.
- Step 3 (Review): 4 stat cards (rows found / ready / warnings / needs review). Estimated coverage after applying. Filter tabs (All / Warnings / Needs review). Per-row issue notes. "Apply N valid rows" CTA enabled even when bad rows exist. "Download failed rows" CSV.

Validation rules:
- Unknown SKU, missing/invalid cost, invalid currency/marketplace → needs-review.
- Missing currency → warning, defaults applied.
- Duplicate SKU at same marketplace+date with different costs → needs-review (must choose).
- Duplicate SKU same cost → warning only.

Inbound receipts review:
- Receipts clustered per SKU. If 2+ shipments within 14 days, labeled "looks like one replenishment wave."
- Actions: Reuse previous cost (if known) / Enter new cost / Ignore.
- "Enter new" defaults to Cost change from date forward, not Batch — batch is explicit opt-in.
- Reviewed receipts move to a "Reviewed" footer list.
- Important rule: inbound receipt ≠ purchase batch unless seller confirms (handles 3PL → FBA wave-shipping case).

Profitability integration:
- Banner at top of Profitability statement: "X% of revenue has unknown COGS. Profit and margin shown below are partial — N active SKUs need a cost. → Open COGS Coverage"
- Banner only shows when revenueCoverage < 100%.
- "Open COGS Coverage" navigates directly to Profitability > COGS.
- Note: P&L formulas not yet changed (deferred to v2). Numbers still compute on existing data; banner is the trust signal.

Settings update:
- "COGS Method" card relabeled "Default costing method for batch tracking."
- Note clarifies: most SKUs use a simple cost timeline; this method only applies to SKUs with batch tracking explicitly enabled.

Forgiving column aliases (cogsData.COLUMN_ALIASES):
- sku: sku, seller sku, amazon sku, msku, merchant sku, product sku, item sku
- landedCost: landed cost, cost, cogs, unit landed, product cost, unit cost, price, total cost
- marketplace: marketplace, country, market, region, mkt
- currency, effectiveFrom, effectiveTo, quantity, receivedDate, batchId, freight, duties, other (all with their common synonyms)

Decision rules implemented:
1. Never display unknown COGS as $0 — use "Unknown" placeholder + rose styling.
2. Sort grid + sidebar prioritization by revenue, not SKU count.
3. Min input is sku + landed_cost; everything else optional.
4. Inline edits commit immediately; bulk imports stage for review.
5. Apply valid rows independently of bad rows.
6. Inbound = signal, not auto-batch.
7. Marketplace overrides explicit on top of a global default; never a forced matrix.
8. Provenance preserved per record (manual/paste/csv/inbound/builder/api).
9. Batch/FIFO opt-in per SKU, not global.
10. Dormant SKUs don't nag unless they affect a selected report period (deferred to v2).

Deferred to v2:
- Landed Cost Builder wizard (invoice + freight + duties → per-SKU allocation).
- "Cost changes" & "Conflicts" persistent sidebar buckets (need triggers).
- Wiring "Unknown" through P&L formulas (currently the banner; full strikethrough cells later).
- Historical-report COGS-incomplete warning.
- True right-side overlay drawer (currently inline row expansion).
- Auto-promotion of dormant SKUs on new sales.


Settings restructure: Data Setup vs Account bands (May 6 2026)

Rationale
- The platform has two fundamentally different page kinds: analytics (read-only insight) and data foundation (editing inputs that everything depends on). They were scattered: COGS lived inside Profitability, Products in Settings, Connectors top-level, Account Specifics buried in Settings → Account. Users had to remember where each setup task lived.
- Reorganized into a coherent two-band Settings sidebar so all data-quality work has one home, and Profitability becomes purely analytical.

Settings sidebar (settings/Settings.tsx)
Two grouped cards with uppercase section headers:

DATA SETUP
- Products (mapping — already there from the earlier extraction)
- Costs (← was Profitability → COGS, now mounts COGSManager directly)
- Account specifics (renamed from "Account"; still hosts campaign naming, audience labeling, COGS method)
- Connections (← was top-level Connectors page)

ACCOUNT
- Preferences
- Team
- Security
- Subscription
- Invoices
- Danger Zone

Implementation:
- Settings component now accepts an optional `initialTab` prop and exports `SettingsTabId` type. App.tsx tracks `settingsTab` state and passes it down for deep-links.
- Default tab is now `products` (data setup is the most-frequented entry point) instead of `preferences`.
- Sub-headers above each card use `text-[10px] font-bold uppercase tracking-wider text-gray-400`.
- Top-level "Connectors" route in App.tsx kept as a thin forwarder (`<Settings initialTab="connections" />`) so the CommandPalette and any legacy callers keep working.
- Profitability → COGS sub-nav removed from `dashboardData.menuItems` (`subItems: ['Overview', 'Deepdive']`).
- Standalone Connectors button removed from Sidebar.
- Profitability "Open COGS Coverage" banner now deep-links to `Settings → Costs` via `onNavigate('Settings', 'costs')`. App.tsx routes section==='Settings' through `handleNavigateToSettings(tab)`.

Data Foundation card on Home (components/home/DataFoundationCard.tsx, May 6 2026)
- Bottom of Home page (after Greeting → KPICards → PeriodSnapshot → HomeAlerts → DataFoundationCard).
- Composite score: `revenueCoverage × 0.6 + mappingCoverage × 0.4`. Hard cap at 0 if no connectors are configured (no data → no foundation).
- Tier badge: STRONG (≥90), PARTIAL (60–89), NEEDS WORK (<60).
- Four signal rows in a 2-col grid, each clickable to deep-link the corresponding Settings tab:
  1. Profit reliability — derived from cogsData.computeCoverage() over inventoryData.
  2. Product mapping — % of SKUs with both Brand and Category set (uses seedMappings + getMappingStatus).
  3. Connections — count of `connectors[].configured === true`.
  4. Account specifics — informational shortcut (always green-passed).
- Rows show colored status dot (good/warn/bad), label, detail line, and an arrow.
- Generalizes the COGS Coverage / Mapping Coverage pattern into a single trust signal so sellers see one number for "are my reports trustworthy?"


Admin section in left sidebar (May 6 2026)

Rationale
- Settings was getting heavy: 10 sub-tabs across two bands (Data Setup + Account) inside a single in-page sidebar nav. Data foundation work was buried two clicks deep (sidebar Settings → tab) and didn't get the visibility its impact warrants.
- Promoted the Data Setup band to a top-level sidebar section called "Admin" so foundational work is reachable in one click and visible alongside Modules.

Sidebar structure
- After the existing MODULES section (Sales, Advertising, etc.), a new ADMIN section header followed by:
  - "Data" (Database icon, expandable like a module): sub-items Products · Costs · Account specifics · Connections.
- Bottom Settings entry kept as-is (single button); now opens the page filtered to the Account band only.

Implementation
- adminItems exported from src/data/dashboardData.ts. One entry "Data" with subItems and a `subToTab` mapping that translates visible labels to SettingsTabId values.
- Sidebar.tsx mirrors the menuItems render loop for adminItems. Active state driven by `currentPage === 'data' && activeSection === 'Data'`. Sub-item highlight uses a new `activeAdminSub` prop.
- App.tsx adds `'data'` page route. `handleAdminNavigate(section, sub)` maps sub-label → SettingsTabId, sets `settingsTab` state, and switches `currentPage` to `'data'`. `handleNavigateToSettings(tab)` is mode-aware: data-tabs go to the `'data'` page, account-tabs go to `'settings'`.
- Settings.tsx accepts a `mode` prop (`'data' | 'account' | 'all'`) that filters which TabGroups render. Page title/subtitle adapt to mode (Data vs Settings). When `mode === 'data'`, the in-page sidebar nav is hidden entirely (avoids duplication with the left sidebar's Admin → Data sub-items); just renders the active section content full-width.
- Profitability "Open COGS Coverage" banner and Home Data Foundation card both route through `handleNavigateToSettings`, landing automatically on the Data page (`currentPage='data'`) for data tabs.
- Legacy `currentPage === 'connectors'` route forwards to `<Settings mode="data" initialTab="connections" />`, keeping the CommandPalette working.


Sales Overview — total sales headline (May 21 2026)

Rationale
- The stacked-bar chart shows per-bucket trend but never the headline total for the selected period. Users had no at-a-glance answer to "how much did we sell?" — a critical anchor before reading the chart.

Implementation (components/SalesOverview.tsx)
- Header restructured to mirror BudgetTracker's left column ("Sales Run Rate" panel) so the two side-by-side panels on Home → Sales share identical typographic rhythm.
- Total sales value: `text-3xl font-bold text-gray-800 tabular-nums`, full-precision currency (no compact M/k). Updates with granularity (Day / Week / Month / Quarter) — computed from `data.reduce((sum, d) => sum + d.adSales + d.organicSales, 0)`.
- "Total sales" caption: `text-sm text-gray-400 mt-0.5` directly below, mirroring "Month-to-date sales" in BudgetTracker.
- PoP and LY chips sit inline to the right of the value on the same baseline. Use the same TrendingUp/TrendingDown + green-800/red-800 + `text-[11px] font-semibold` pattern as the canonical ChangeRow in KPICards.
- Comparison %s hardcoded per granularity for the wireframe (`COMPARISON_BY_GRANULARITY`). Real implementation would pull the prior comparable period + YoY-aligned period from the same source as the chart data.

Adjacent tweak (components/BudgetTracker.tsx)
- MTD value color softened from `text-gray-900` → `text-gray-800` so it reads as "a bit gray" rather than near-black. Both panels now share the same value tone.


Trends — traffic metrics added to dropdown (May 22 2026, data/trendsData.ts)

- TrendMetric union extended with `pageViews`, `sessions`, `cvr`.
- metricOptions extended (labels: 'Page Views', 'Sessions', 'Conversion Rate'). pageViews/sessions are number-typed, cvr is percent-typed.
- getBaseScale ranges added: pageViews [2000, 60000], sessions [1500, 45000], cvr [4, 14]. Selecting any of them re-generates the pivot at the right scale and format. The MetricMatrix section below already showed all of these — this just gives the single-metric pivot the same options.


Trends — full Sales Deepdive parity in metric dropdown (May 25 2026)

Rationale
- The dropdown lagged behind Deepdive: had 12 entries vs Deepdive's 30 columns. Sellers exploring a metric trend over time had no way to chart Orders, Avg Price, NTB/S&S, margins, or any of the ad mechanics.
- Brought the dropdown to parity with the Deepdive column set and grouped it using the same 5-band narrative so the two pages share a vocabulary.

Implementation (data/trendsData.ts + components/Trends.tsx)
- TrendMetric union extended with 16 keys: orders, avgPrice, ntbOrders, ntbPct, ssOrders, ssPct, organicPct, discounts, adCpc, ctr, adCvr, totalCpa, productMargin, channelMargin, growthMargin, netProfitPerUnit.
- TrendMetricOption gains an optional `group` field. metricOptions reordered to the 5-band narrative (Volume & revenue → Customer mix → Demand funnel → Marketing & promo → Margin cascade) — same buckets and order as the Deepdive table groups.
- getBaseScale extended with deterministic ranges for the new keys: orders [40, 1500], avgPrice [12, 80], ntbOrders [15, 800], ntbPct [35, 55], ssOrders [5, 300], ssPct [10, 28], organicPct [30, 75], discounts [30, 2000], adCpc [0.45, 2.25], ctr [0.3, 1.5], adCvr [5, 15], totalCpa [2, 15], productMargin [45, 68], channelMargin [30, 55], growthMargin [10, 40], netProfitPerUnit [3, 25].
- Dropdown component in Trends.tsx detects `group` on options and renders thin uppercase section labels (`text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400`) with a 1px top divider when the group changes. Behavior unchanged when no options carry a group (Dimension dropdown stays flat).
- Dropdown panel gains `max-h-[440px] overflow-y-auto` since 28 options would otherwise overflow the viewport.

Known small gap
- `bboxWinRate` and `adReliance` exist as Deepdive columns but were not added to the Trends dropdown — scope limited to the 16 "new" metrics from the May 25 expansion. They can be added later for full parity (and a value/percent flag tweak in the dropdown's formatter).


Sales Deepdive — column expansion + business-ordered visibility (May 25 2026)

Rationale
- The Deepdive tables (Marketplace / Category / ASIN) had 13 columns focused on the ad-funnel. Sellers asked for the rest of the decision-making picture: order economics, customer mix (NTB / S&S), margin cascade, ad mechanics (CPC / CTR / Ad CVR), and discounts.
- Order matters as much as inclusion: column sequence is now narrative-first ("what did I sell → who bought → how did they get there → what did I pay → what's left").

Data layer (data/deepdiveData.ts)
- MetricFields interface extended with 16 new metric groups × 3 (value + PoP + DiffLY) = 48 new properties: orders, organicPct, avgPrice, ssOrders, ssPct, ntbOrders, ntbPct, totalCpa, productMargin, channelMargin, growthMargin, netProfitPerUnit, adCpc, ctr, adCvr, discounts.
- `enrichDerivedFields(rows, labels)` mutation pass adds the new fields deterministically per row using a per-row hashed seed. Formulas anchored to existing data so totals stay internally consistent:
  - orders = round(units / unitsPerOrder), where unitsPerOrder ~1.10–1.35 (seeded)
  - avgPrice = sales / units (exact)
  - organicPct = 100 - adReliance (mechanical)
  - ssRatio ~10–28%, ntbRatio ~35–55% drive ssOrders/ntbOrders + their %s
  - totalCpa = adSpend / orders
  - productMargin seeded 52–66%, channelMargin = productMargin − (12–16) for Amazon fees, growthMargin = channelMargin − tacos, netProfitPerUnit = avgPrice × growthMargin
  - adCpc €0.45–€2.25, ctr 0.30–1.40%, adCvr 5–15%, discounts 3–12% of sales
- Row literals (marketplaceData, categoryData, asinData) kept untouched; cast at export boundary (`as unknown as MarketplaceRow[]` etc.) since the enrichment populates the new fields at module load. splitMetrics extended with ZERO_DERIVED stub so SKU child rows pass the interface check; enriched after splitting.
- All three datasets + per-ASIN SKU rows are enriched on module import.

Column visibility & order (components/DeepDive.tsx)
- 30 columns total, ordered by business narrative across 5 bands:
  1. Volume & revenue: Sales · Sales Share · Orders · Units · Avg Price
  2. Customer mix: NTB Orders · NTB % · S&S Orders · S&S %
  3. Demand funnel: Page Views · Sessions · CVR · BBox Win · Organic %
  4. Marketing & promo: Discounts · Ad Spend · Ad Sales · Ad CPC · CTR · Ad CVR · ROAS · ACOS · TACOS · Total CPA · Ad Reliance
  5. Margin cascade: Product Margin · Channel Margin · Growth Margin · Net Profit/Unit
- Default-visible (18 columns, locked May 25 2026): Sales, Sales Share, Orders, Units, Avg Price, NTB Orders, S&S Orders, Page Views, Sessions, CVR, Ad Spend, ROAS, ACOS, TACOS, Product Margin, Channel Margin, Growth Margin, Net Profit/Unit. The remaining 12 (Discounts, NTB %, S&S %, BBox Win, Organic %, Ad Sales, Ad CPC, CTR, Ad CVR, Total CPA, Ad Reliance) are `hide: true` — listed in the ColumnToggle and one click away.
- Visual grouping (May 25 2026): a thin band-header row above the columns shows the 5 buckets (`Volume & revenue`, `Customer mix`, `Demand funnel`, `Marketing & promo`, `Margin cascade`) with `colSpan` driven by contiguous visible columns. 1px left-borders between buckets in both the band and main header rows reinforce the boundaries. Pinned-left column gets a blank cell in the band row. Each table's `subtitle` prop carries the plain-English narrative ("what I sold → who bought it → how they got there → what I paid → what's left") just below the title for the operator-friendly framing alongside the taxonomic bucket labels.
- "Marketing & promo" rename (May 25 2026): bucket originally `Ads activity`; renamed because Discounts moved into it. Discounts is fundamentally an acquisition lever (substitutable with ad spend in operator decision-making) rather than a revenue line, even though P&L accounting treats it as a reduction to gross sales. Renamed band reads "spend ladder: Discounts → Ad Spend → efficiency ratios." Discounts stays `hide: true` (default-off) so it doesn't bloat the default visible set.
- METRIC_AVG_KEYS extended so percentage / rate / margin metrics aggregate as averages and unit/order counts as sums in the totals row.


Trends "Metrics over time" matrix — parity with Sales Deepdive (May 25 2026)

Rationale
- The matrix was the earliest view but lagged behind: 12 columns vs Deepdive's 30. Sellers reading the heatmap couldn't see Orders, Margins, NTB/S&S, Avg Price, or ad mechanics over time.
- Brought it to parity with Sales Deepdive (28 metric columns) and applied the same 5-band visual grouping so the two views read identically.

Implementation (data/metricMatrixData.ts + components/trends/MetricMatrix.tsx)
- MatrixMetricKey expanded from 12 → 28 keys: added orders, avgPrice, ntbOrders, ntbPct, ssOrders, ssPct, organicPct, discounts, adCpc, ctr, adCvr, totalCpa, productMargin, channelMargin, growthMargin, netProfitPerUnit.
- MatrixMetric interface gains a required `group` field for band labels.
- matrixMetrics reordered into 5 bands: Volume & revenue → Customer mix → Demand funnel → Marketing & promo → Margin cascade. Same buckets, same column order, same higher-is-better polarities as Deepdive — Ad Spend / Discounts / ACOS / TACOS / Total CPA / Ad CPC / Ad Reliance flip red↔green relative to "good" metrics.
- generateMatrixData extended with formulas mirroring the Deepdive enrichment: orders = round(units / unitsPerOrder); avgPrice = sales / units; ntb/ss as ratios of orders; growthMargin = channelMargin − tacos; netProfitPerUnit = avgPrice × growthMargin%. Per-period values are internally consistent (no contradictions between e.g. ROAS and ACOS).
- MetricMatrix.tsx renders a band-header row above the column row using the same pattern as DeepDiveTable: contiguous-run colSpans per band, 1px left dividers between bands in both the band row and the column header row, blank sticky cell over the pinned Period column. Heatmap shading, cell selection, and "Why did this move?" diagnostic all continue to work across the new columns automatically.


Sales → Traffic — insight-first funnel diagnostic (May 25 2026)

Rationale
- Old Traffic page was a polished dashboard: KPI tiles → funnel → trends → source mix → product table. Reader had to assemble the story manually across five separate components.
- Rebuilt around the shortest-path-to-insight principle: in under 10 seconds the user should know what the bottleneck is, how much it's worth, which ASINs cause it, and what to do next.

Hero insight card (funnel/HeroInsightCard.tsx)
- Replaces the 6 KPI tiles at the top. Auto-detects the leak transition from `brandFunnelDiagnostic.biggestOpportunityIdx` so the headline always matches the data.
- Layout: rose/amber gradient card with a 1px accent bar on top. Left = main-leak headline ("Click → Cart Add"), three metric tiles (Gap vs market in pp, Impact / wk in €, Units / wk recoverable at €35 ASP), and a dark "Review top leaking ASINs" CTA that scrolls to the table via `#leaking-asins-table` anchor.
- Hero card uses the conversion's `shortLabel` (not stage labels) so transition naming stays single-form across the page.

ProductTrafficTable rebuild (funnel/ProductTrafficTable.tsx)
- Default sort changed from `cvr ascending` to `lostRevenue descending`. New column `Lost revenue / wk` is the primary attention anchor with a mini-bar showing each ASIN's share of total leak.
- `estimateLostRevenue(row, diagnostic)`: gap × sessions × 0.5 (half-recovery) × 0.5 (downstream ATC→Purchase) × €35 ASP, computed against whichever stage is the brand's leak (Click → Cart Add). ASINs above the market rate score 0.
- "So what" header line surfaces top-3 concentration: "Top 3 ASINs account for ~X% of the lost revenue at Click → Cart Add."
- Footer shows total weekly portfolio leak.
- Earlier iteration tried split MECE columns (`Funnel issue` × `Likely cause`) — removed because only `Buy Box` and `Availability` are directly observable from Business Reports; the other four causes (Content / Price / Reviews / Paid mismatch) are guesswork without signals from Content Tracker / Reviews / Pricing. Future work: signal-driven scoring with hover transparency once those modules are joined in.

FunnelDiagnostic.tsx so-what lines + emphasis
- Every chart module now leads with a derived "So what:" interpretation sentence in 12px text below the title, with `"So what:"` bolded.
- FunnelStageCards: "Your click → cart add conversion is X% vs market Y% — a Zpp gap. Earlier stages are healthy, so the loss is concentrated here." (uses conv shortLabel — single framing, no mixing of share and conv-rate percentages).
- StageTrendCharts: counts weeks-below-market for the leak stage, labels as persistent (≥6/12) or recent — action implication included. Leak stage's mini-chart gets `highlight` prop → amber border + ring.
- TrafficSourceDecomposition: derived insight — "Organic grows from X% of impressions to Y% of purchases (+Npp down-funnel), while paid loses share. Paid traffic is contributing volume but converting worse." Numbers computed live from organic / total counts.

Page structure (Traffic.tsx)
1. HeroInsightCard
2. FunnelStageCards
3. ProductTrafficTable (`id="leaking-asins-table"`)
4. StageTrendCharts
5. TrafficSourceDecomposition
- TrafficKPICards component deleted (orphaned by hero card replacement). InsightStrip still exists in FunnelDiagnostic.tsx because SQP keyword detail still uses it (`KeywordDetailDrawer` uses its own composition).

Transition / metric naming convention (locked May 25 2026)
- Transitions everywhere: `Click → Cart Add` (full, singular). `Cart Add → Purchase`. `CTR` retained as a known abbreviation.
- Rate metrics in tables: `Add-to-Cart Rate` (full). `ATC` retained only inside the 4-dot funnel-health micro-component where horizontal space is tight.
- Stage tile labels stay plural ("Cart Adds") — they're noun counts, not transitions.
- All driven from `conversions[].shortLabel` in funnelDiagnosticData.ts so the source of truth is one map.

Bottleneck "focus mode" approach
- Spec asked for an explicit focus-mode toggle that retargets every module to the leak stage. Implemented implicitly instead: every module computes itself against `diagnostic.biggestOpportunityIdx`. Change the brand's leak (e.g., if data shifted to Cart Add → Purchase), and the hero card, trends highlight, product table sort, and source chart all re-narrate automatically. No separate state.


Sales → SQP — full page (May 25 2026)

Initial build
- New page on the Sales bar (between Traffic and Targets) covering Brand Analytics Search Query Performance data. Decision tool, not a dashboard: each keyword treated as an asset with a Defend / Invest / Harvest / Tail position.

Data model (data/sqpData.ts)
- KeywordRow shape mirrors Brand Analytics SQP columns: market volume, per-stage `{marketCount, brandCount, share}` for Impressions / Clicks / Cart Adds / Purchases, opportunity score (`marketVolume × max(0, portfolioAvg − yourClickShare)`), `opportunityEur` (€/wk recoverable at half-gap close), 4-week trend, 12-week trend series, top ASIN winning the query, PPC spend/ACOS, recommended action.
- 30 demo keywords seeded across all 4 quadrants. Status (`defend/invest/optimize/harvest/drop`) and action label both derived from market vol + share + trend4w.
- Helpers: `keywordQuadrant(k, volumeMedian, avgClickShare)` returns the BCG bucket from portfolio-stable boundaries (so quadrant doesn't shift when the map filter changes). `keywordMarketStageShares(k)` returns synthetic per-stage market shares for the funnel diagnostic (mirrors the formula used in the drawer). `keywordMainGap(k)` returns the stage with the largest gap vs market — used by the table's "Main gap" column.
- `sqpSummary` extended with `totalOpportunityEur`, `top5ConcentrationPct`, `volumeMedian`, `dominantOppQuadrant`, `oppByQuadrant`. Drives the hero card narrative.
- `QUADRANT_LABEL`, `QUADRANT_ACTION`, `QUADRANT_STYLE` exported as canonical maps so the map, table, drawer, and hero card all render identically. Action strings: Defend = "Protect share, avoid losing rank", Invest = "Increase bid / content / rank", Harvest = "Maintain, optimize ACOS", Tail = "Ignore or test cheaply".
- "Niche wins" quadrant renamed to "Harvest" (clearer action framing).

Hero insight card (sqp/SQPHeroCard.tsx)
- Top-of-page block answering "what is the main issue, how big, where concentrated, what next" in five seconds.
- Headline derived from `dominantOppQuadrant`: under-indexed on high-volume terms (Invest), share erosion on hero keywords (Defend), concentrated wins on low-volume terms (Harvest), or opportunity scattered across the long tail (Tail).
- Three metric tiles: Opportunity / wk (sum of `opportunityEur`), Concentration (% of opportunity € in top-5 keywords), Under-indexed (count of keywords below portfolio avg click share).
- "Next step" CTA opens the top-opportunity keyword directly in the drawer.

Portfolio map (sqp/PortfolioMap.tsx)
- BCG-style SVG scatter: X = market search volume (log scale), Y = click or purchase share (toggle in header), dot size = your purchases at that keyword, dot color = 4-week trend (green up / gray flat / red down).
- 4 quadrant overlays with action subtitles instead of position descriptions: DEFEND "Protect share, hold rank", HARVEST "Maintain, optimize ACOS", INVEST "Increase bid / content / rank", TAIL "Ignore or test cheaply". Quadrant dividers = volume × share medians of the plotted set.
- Header controls: `Rank by` (Opportunity / Purchases) + `Show` (Top 25 / 50 / 100 / 250 / All) — default Top 50 by Opportunity. Map plots only the top-N of whatever it receives; full list goes to the table.
- "Top N by Opportunity" hides Defend keywords (their opportunity score is zero by formula); switching the lens to Purchases surfaces them. That's the whole point of having both lenses — different questions, same map.
- Empty-state guard so the SVG doesn't NaN at zero keywords.
- Earlier iteration with preset tabs (Top opportunities / Hero terms / Rising stars / All) + chip filters across the map was scrapped — user said too complicated. Settled on the single Top-N + lens dropdown approach.

Prioritized keyword table (sqp/KeywordTable.tsx)
- Replaced the older filter-chip + inline-detail design. Now a clean tabular view: Keyword · Position (quadrant chip from `keywordQuadrant`) · Market Vol · Click Share · Purch Share · Main gap · Opportunity · Top ASIN · ACOS / PPC · Action.
- "Main gap" column shows the worst stage's label + pp gap from `keywordMainGap()`. Beats-market rows show a green flat indicator.
- Sorted by `opportunityEur` desc. Click any row to open the detail drawer. Selected row is highlighted in cx-50.
- "Analyst mode" toggle (full SQP column dump) explicitly deferred.

Keyword detail drawer (sqp/KeywordDetailDrawer.tsx)
- Slide-in side panel from the right edge (max-w 520px). Opens on row click or map dot click. Backdrop dims the page; Esc closes. Replaces the inline-expansion pattern.
- Sticky header: quadrant chip, intent/QSS context, keyword query, market volume + opportunity € summary line, X close button.
- Recommended action surfaced first in an amber strip — it's the why-you-opened-this. Main gap + pp shown right under it.
- Five sections below:
  1. Weekly trend (12w) — your click share + purchase share over time as a 2-line SVG mini-chart.
  2. You vs market — CTR (Impr→Click) + CVR (Click→Purchase) comparison cards. Computed from brand/market counts.
  3. Share gap by stage — 4 horizontal bars per stage (you vs synthetic market share), main-gap stage highlighted with amber border.
  4. Which ASINs get the purchases — top ASIN card with brand-purchase-share %.
  5. Paid vs organic contribution — stacked split estimated from ACOS (paid weight = ACOS/60, clamped [0.15, 0.65]). Honest caveat in italic: Brand Analytics doesn't publish per-keyword paid attribution.

Page composition (SQP.tsx)
1. SQPHeroCard
2. PortfolioMap
3. KeywordTable (sorted by opportunity, full catalog)
4. KeywordDetailDrawer (overlay, opens from any selection)
- `selected` state lifted to SQP.tsx so map clicks and row clicks both feed the same drawer.


Settings → Data → Keyword rules (May 25 2026)

Rationale
- SQP intent classification (Branded / Generic / Competitor / Long-tail / Category) was hardcoded per keyword in demo data. Real implementation needs configurable rules; users need a place to define them.

Module (settings/KeywordRulesSection.tsx + data/keywordRulesData.ts)
- New tab in Settings's Data Setup band (between Costs and Account specifics). Registered in `adminItems.subItems`, `subToTab`, App.tsx's `DATA_TABS` + admin maps. Tab id `keywordRules`.
- Header card explains evaluation order: branded → competitor → longTail → category → generic (first match wins), shown as 5 numbered colored chips with chevrons.
- "My brands" section: read-only chips derived automatically from `seedMappings` (Products mapping). Per-brand variant editor below each — add typo / international-spelling variants that should also match (e.g. ZeroWater → "zero water", "zerowater", "0water"). Add-on-Enter, X-to-remove chip UI.
- "Competitor brands": editable chip list, fully manual entry. No auto-detect (intentional for the wireframe — auto-classifying competitors is its own problem).
- "Category keywords": editable chip list (generic product-category terms).
- "Long-tail threshold": 2–8 word-count slider, default 4.
- "Classification preview" panel at the bottom: type a sample SQP query, see which rule matched and the assigned intent live. 5 pre-canned example queries as quick-pick chips ("zerowater filter replacement 6 pack", "brita pitcher replacement", etc.).
- `classifyQuery(query, state)` runs the rules in order and returns `{ intent, reason, matchedBrand?, matchedTerm? }` — re-usable when the SQP intent filter is migrated off hardcoded values.
- State local to the section for now (not wired to context). Lift to context once SQP starts consuming it.


Sales → Home BudgetTracker — projected EOM as headline (May 25 2026)

Rationale
- Card title says "Sales Run Rate" but the big number was MTD actual. Mixed framing — run rate implies the projection, not what's banked so far.
- Reframed so the headline matches the title and added a 3-stat strip below the chart to fill what was visual deadspace under the x-axis.

Header changes (components/BudgetTracker.tsx)
- Main value: `projectedEom` (€141,887) instead of `mtdTotal`. Caption: "Projected end-of-month" instead of "Month-to-date sales".
- MTD actual now a small cx-500-dotted chip directly under the projection caption — supporting context, not headline.
- Right column simplified to just the Avg Daily tile (the legend duplicating EOM proj alongside the new headline was redundant and was removed).

Stat strip below chart
- 3 mini stats in a single grid row with thin dividers: vs Last month · Days remaining · Pace.
- vs Last month uses a synthetic `lastMonthTotal = €126,240` for the demo so the delta is non-trivial (+12.4%). Color tone follows sign (emerald/rose).
- Pace bucket: ≥+5% → "Ahead" (green), ≥-2% → "On track" (gray), else → "Behind" (rose).
- Turns the previously empty bottom of the card into the natural follow-up answer to seeing a projection ("how does it compare?").


Weekly data freshness badge (WeeklyDataBadge.tsx) — applied to SQP + Traffic

- Sky-blue chip in the page header next to LastRefreshed on both pages. Reads the global date filter and labels the data scope as weekly (Brand Analytics SQP and the Business Reports inputs used on Traffic both publish on weekly snapshots).
- `useWeeklySnappedRange()` hook exposes the snapped range to consumers that need it. Helper `snapToWeeks` lives in utils/dateRanges.ts (`endOfWeek` returns Saturday; `snapToWeeks` returns `{ snapped, wasSnapped, weekCount }`).
- Pattern in place but the actual snap-back of the global date picker is not yet enforced — badge currently communicates the granularity, full snap-and-render is follow-up work.
- Period column transparency bug fixed: sticky body cell was `group-hover:bg-gray-50/60` (partial-opacity) which leaked the scrolled-under cells through on hover. Changed to `group-hover:bg-gray-50` (solid). Default `bg-white` already opaque.


Sales → Overview — decision-tool restructure (Jun 1 2026)

Rationale
- Old page was a polished dashboard: KPI tiles + run-rate chart + stacked-bar trend + 3 breakdown bullet charts + heatmap. It answered "what happened" but the user had to assemble the story across five components to know "are we on track, why, what changed, and what should I do next."
- Locked seven decision-making rules (in the salesOverviewInsights module) that turn raw numbers into an executive narrative, a Needs Attention triage, and ranking that defaults to growth contribution instead of absolute volume.

Shared insights module (data/salesOverviewInsights.ts)
- Centralizes every derived value the page needs so the executive card, the BudgetTracker stat strip, the SalesOverview trend chart, the Needs Attention panel, and the breakdown charts all stay in sync.
- Constants for the demo period (May 2026): TARGET_SALES €150k, LAST_MONTH_TOTAL €126.2k, LAST_YEAR_SAME_PERIOD €120k, MTD_ACTUAL €96.1k, PROJECTED_EOM €141.9k, AVG_DAILY_SALES €4.6k, DAYS_REMAINING 10, plus the organic/ad current+previous split.
- Rule 1 — Pace status: computePaceStatus uses target first if present (On track / Behind target) and falls back to prev-period (Ahead of last period / Behind last period). Exported as `paceStatus: { label, tone }`.
- Rule 2 — Executive headline: fixed template "{Period} is pacing {status}. Projected sales are {projected}, {gap_or_delta} {comparison}." Branches on whether a target exists.
- Rule 3 — Drivers / watchouts: enrichDrivers() computes change €, change %, and contributionPct (this row's positive change ÷ total positive change). Top positive across marketplace/category/ASIN = mainDriver. Top negative passing the watchout threshold (`< -€1,000 OR < -10%`) = mainWatchout.
- Rule 5 — Organic vs ad insight: branches on `adGrowth - organicGrowth` and ad dependency thresholds (>10pp difference, >50% ad share). Returns the one-line interpretation string.
- Rule 6 — Needs Attention: buildAlerts() in priority order: target-gap (critical) → pace-gap (required daily > current daily, warning) → top-decline (mainWatchout, warning) → ad-dependent (warning) or ad-share-high (info). Returns at most 3.
- Rule 7 — headlineCta(): routes the executive card's CTA based on the first matching condition (behind target → growth drivers; ASIN decline → declining ASINs; ad>organic → profitability; etc.).

Executive insight card (components/sales/ExecutiveInsightCard.tsx)
- Top-of-page hero, full width. Visual style mirrors Traffic/SQP heroes: gradient bg, 1px accent bar, headline column + 3 metric tiles + dark CTA.
- Tone follows paceStatus (good = emerald, bad = rose, neutral = slate).
- Metric tiles: Projected EOM (with MTD actual sub), Gap to target / vs Last period (depending on target presence), vs Last year.
- Below the metric row, a 2-column driver/watchout strip with the kind tag (marketplace/category/ASIN), name, change €, and contribution % or change %.
- CTA derived from headlineCta() and routed via onCta prop.

Needs Attention panel (components/sales/NeedsAttentionPanel.tsx)
- Compact 3-column grid (1 col on mobile). Each alert is a clickable card with severity icon, title, supporting detail, and a "CTA →" link styled like an action chip.
- Severity → color: critical = rose, warning = amber, info = sky.
- Hidden entirely if attentionAlerts is empty.

BudgetTracker — target-aware stat strip (components/BudgetTracker.tsx)
- Now imports paceStatus / gapToTarget / requiredDailyToTarget / popChangePct from salesOverviewInsights — single source of truth.
- Stat strip behavior:
  - When TARGET_SALES exists: tiles become Gap to target / Days remaining / Required per day. The Required/day tile compares against current avgDailySales and shows "+X% vs current" delta.
  - When no target: falls back to original vs Last month / Days remaining / Pace tiles.
- Card outer changed to `flex flex-col`; chart container changed from `h-[222px]` fixed to `relative flex-1 min-h-[222px]` with the ResponsiveContainer wrapped in an `absolute inset-0` div. This lets the chart absorb extra grid-row height (when SalesOverview is taller) so the stat strip stays flush at the bottom — fixes the "card floating with whitespace below" issue.

Grid wrapper height inheritance fix (App.tsx)
- Wrapping `<div id="sales-run-rate">` and `<div id="sales-trend">` are now `className="flex"` so their children's `flex-1` actually takes effect. Without this, the wrappers stretched to grid row height but BudgetTracker/SalesOverview inside them sat at their natural content height, creating uneven card bottoms.

BreakdownCharts — rank by growth contribution (components/BreakdownCharts.tsx)
- Rule 4: three cards (Marketplace / Category / ASIN) now share a single Growth | Sales toggle. Default = Growth.
- Internal helpers enrich() (adds change €, change %, contributionPct) and sortBy() (mode-aware sorting).
- Each bullet bar now shows three numeric columns after the bar: Sales · Δ € (signed, color-coded) · % Growth contribution.
- Header columns label the metrics for readability.
- Hover tooltip surfaces "X% of total growth" for positive contributors.
- ASIN child SKU rows are enriched on the fly so they show the same Δ + contribution columns.

SalesOverview — organic vs ad insight strip (components/SalesOverview.tsx)
- New 12px "So what:" strip above the chart pulls organicAdInsight + the supporting numbers (Organic %, Ad %, Ad dependency %) from the insights module.
- Slate background, amber lightbulb icon, two-line layout — same pattern as Traffic's so-what lines.

Page structure (App.tsx OverviewPage)
1. ExecutiveInsightCard
2. NeedsAttentionPanel
3. Grid: BudgetTracker (1fr) + SalesOverview (3fr)
4. BreakdownCharts (rank-toggle defaulting to Growth)
5. SalesHeatmap (unchanged, supporting)
- handleSalesOverviewCta() routes the CTAs:
  - profitability → navigates to Profitability/Overview
  - breakdown-* → scrolls to `#sales-breakdown` anchor
  - run-rate / sales-trend → scrolls to their anchors

Data-source honesty (deferred to follow-up)
- The SQP keyword detail drawer's "synthetic market" share-gap bars and "main gap vs synthetic market" line are flagged as not API-grounded — there's no Amazon-published per-query market-share benchmark. Real options: (a) drop the comparison, (b) relabel as "vs your portfolio average" (which is derivable), (c) gate behind a category-benchmarks feature once a real source is wired. Same goes for the paid/organic split estimated from ACoS. Not changed in this batch; tracked.


Sales → Deepdive — diagnostic + troubleshooting tool (Jun 1 2026)

Rationale (first pass)
- Old page was three dense, identical tables (Marketplace · Category · ASIN). Sellers had to assemble the story themselves — "what's the biggest issue, where is it, what's driving it, what to do" required reading 30 columns × 3 tables and inferring.
- Restructured into an issue-detection-and-troubleshooting tool: top-of-page issues panel, simplified troubleshooting table with derived issue type + drivers + next step, row drill-down drawer, dense tables collapsed as supporting evidence.

Diagnostic engine (data/deepdiveDiagnostics.ts)
- Per-row classifier returns `{ issueType, primary, secondary, impactEur, severity, row }`.
- Issue taxonomy (first pass): Traffic drop, Conversion drop, Ad efficiency issue, Margin risk, Price/mix issue, Acquisition weakness, Retention weakness, Low-quality traffic, Inefficient spend, Sales drop, Healthy.
- Deterministic rules ordered by precedence: sales-down branches into Traffic vs Conversion vs Price/mix vs Ad efficiency based on which signals fire; sales-up branches into Margin risk; etc.
- Drivers: per-issue candidate list of `*PoP` fields; top 2 by absolute magnitude become primary + secondary, displayed as "Sessions -20.4%".
- Severity = impact × anomaly strength multiplier; healthy rows force-sorted to the bottom.
- `topIssues` = cross-entity top-5 by severity (drives the IssuesPanel).
- View-tab filters: All / Issues only (default) / Sales drops / Traffic / Conversion / Ads / Margin.

Components (sub-pass 1)
- IssuesPanel — top 5 issue cards with rank, severity icon, kind tag, issue chip, name, drivers, impact, CTA.
- TroubleshootingTable — view tabs + simplified columns (Entity · Sales · Sales Δ · Issue · Primary · Secondary · Impact · Next step). Severity-sorted; healthy last.
- EntityDetailDrawer — slide-in side panel (max-w 520) with diagnosis sentence, metric bridge (top 6 movers), issue-specific recommended checks, bottom CTA.
- DeepDive.tsx restructured: IssuesPanel → entity pills (Marketplace / Category / ASIN) → TroubleshootingTable → drawer → collapsed "Full metric table" wrapping the existing dense DeepDiveTable.
- ColumnToggle grouped columns by `group` field with section headers (combined with the band rename from "Volume & revenue" → "What sold?", "Customer mix" → "Who bought?", "Demand funnel" → "Where is demand leaking?", "Ads activity" → "Is advertising efficient?", "Margin cascade" → "Is margin healthy?").


Sales → Deepdive — gap-to-last-period impact (Jun 1 2026)

Rationale
- First-pass impact used a linear approximation: `sales × |salesPoP|/100`. Underestimates large drops — a -46% drop with €109k current implies €203k prior, not €159k (which the linear formula would yield).

Fix (data/deepdiveDiagnostics.ts)
- `computeImpactEur` now uses `gapToPrev(current, popPct)` where `previousValue = current / (1 + popPct/100)` and `gap = |previous - current|`. Robust to popPct ≈ 0 and the asymptote near -100% (clamps to |current|).
- Sales / Traffic / Conversion / Price/mix / Low-quality drops → `gapToPrev(sales, salesPoP)`.
- Margin risk → `sales × |channelMarginPoP|/100` (direct margin € lost; sales held by definition).
- Ad efficiency / Inefficient spend → `gapToPrev(adSpend, adSpendPoP)` (extra spend ≈ profit loss).
- Acquisition / Retention weakness → `gapToPrev(orders, ordersPoP) × avgPrice`.
- France impact moves from ~€51k to ~€95k, ranking it more clearly as #1.


Sales → Deepdive — colour polarity fix on dense table + drawer (Jun 1 2026)

Bug
- `percentCellStyle` (used by the dense DeepDiveTable subFields) coloured every positive delta green and negative red. Wrong for cost / lower-is-better metrics: TACOS, ACOS, Ad Spend, Discounts, Ad CPC, Total CPA, Ad Reliance going up is bad, not good. Belgium TACOS +120% was rendering green; Germany ACOS -10.8% rendering red.
- Same bug in the drawer's metric bridge (sign-based BridgeBar coloring).
- Bonus: the unit label said "pp" but the underlying data is stored as % change (verified: Netherlands tacosPoP=73.80 implies prior 2.48% → current 4.31% = +73.8% growth, mathematically can't be pp).

Fix
- DeepDiveTable.tsx: added `costPercentCellStyle` — inverted colours (positive change = red, negative = green). Exported alongside `percentCellStyle`.
- DeepDive.tsx: added `pctSubCost` / `ppSubCost` helpers; applied to discounts, adSpend, adCpc, acos, tacos, totalCpa, adReliance. Ad Sales kept on higher-better (more attributed revenue is good in isolation; the inefficiency lives in ACOS/ROAS).
- EntityDetailDrawer: every bridge field now carries `polarity: 'higher' | 'lower'`. BridgeBar colours by `good = polarity === 'higher' ? value > 0 : value < 0`. Unit standardized to '%' everywhere.
- Driver labels in deepdiveDiagnostics: dropped the `unit` field; all driver strings now read "Sessions -20.4%" / "TACOS +73.8%".


Sales → Deepdive — profit-led decision tool (Jun 1 2026)

Rationale
- First-pass diagnostic was too sales-revenue-focused. A small revenue issue with big margin impact may be more urgent than a bigger low-margin sales drop. The page should rank by profit at risk, expose confidence in the diagnosis, and steer users via decision modes ("Profit risks" / "Growth risks" / "Protect winners"), not just "issues only".
- Also: NTB % / S&S % aren't unambiguously "higher better" (high NTB % can mean strong acquisition OR weak retention). Polarity for those was downgraded to neutral / context-dependent in the drawer.

Diagnostic engine rewrite (data/deepdiveDiagnostics.ts)
- New taxonomy (12 types + Healthy), profit-led:
  - Profit risks: Profit dilution · Margin risk · Ad efficiency issue · Ad-led growth risk · Discount-led growth risk.
  - Growth risks: Traffic-led / Conversion-led / Availability-led sales drop · Price/mix issue · Acquisition weakness · Retention weakness.
  - Other: Protect winner · Healthy.
- Replaced generic "Sales drop" with three drop-classified variants that name the lever (Traffic-led / Conversion-led / Availability-led). Sales-up paths now branch into Profit dilution (margin slipped), Ad-led growth risk (TACOS surge), or Discount-led growth risk (discounts surge) before falling through.
- Each diagnostic carries both `revenueImpact` and `profitImpact`:
  - revenue = `gapToPrev(sales, salesPoP)` (or NTB/S&S × avg price for those issues).
  - profit = margin pp × sales for margin issues; revenue × current channelMargin% for sales-drop issues; gap on ad spend for efficiency issues; max(gainedSales × marginShift, TACOS proxy) for the growth-risks.
- Confidence (`High` / `Medium` / `Low`) = count of supporting signals per issue. 3+ aligned = High, 2 = Medium, ≤1 = Low. Multipliers 1.0 / 0.7 / 0.4.
- Severity (sort key) = `|profitImpact| × confidenceMultiplier`; falls back to `|revenueImpact| × 0.2 × conf` if profit is zero.
- Severity LEVEL bucket from |profit|: Critical ≥ €20k, High ≥ €5k, Medium ≥ €1k, Watch > 0, None for Healthy. Drives the chip on cards and rows.
- Decision mode per issue (`profit-risk` / `growth-risk` / `winner` / `healthy`) — drives the mode tabs.
- Protect winner gate: salesShare ≥ 8% AND channelMargin ≥ 25% AND channelMarginPoP ≥ 0 AND not in decline.
- `topIssues` excludes both Healthy and Protect winner so the panel surfaces problems only.
- `RANK_OPTIONS` exported: Profit impact (default) · Revenue impact · Severity · Sales change.
- `sortByRank()` pushes Healthy rows to the bottom regardless of direction.
- Issue-specific CTAs replace the generic "Open detailed diagnostic" — "Review margin bridge", "Check ad dependency", "Review discount strategy", "Open inventory diagnostic", "Monitor and defend share", etc. Each maps to a `ctaRoute` for App-level navigation.

IssuesPanel rewrite (components/deepdive/IssuesPanel.tsx)
- Cards now lead with the severity-LEVEL chip (Critical / High / Medium / Watch) + entity-kind tag.
- Issue chip + Confidence chip on the second row.
- Drivers row ("Main: X · Then: Y").
- Profit impact + Revenue impact shown side-by-side (profit in rose if positive, revenue in gray).
- Specific CTA at the bottom of each card.
- Empty state retained for the no-issues case.

TroubleshootingTable rewrite (components/deepdive/TroubleshootingTable.tsx)
- Decision-mode tabs replace the old view tabs: Profit risks (default) · Growth risks · Protect winners · All issues. Each shows live count.
- Controls row beneath: Filter dropdown (All entities / Marketplaces / Categories / ASINs) + Rank by dropdown (Profit impact default).
- Columns: Entity · Type · Issue · Severity · Confidence · Profit impact · Revenue impact · Primary driver · Secondary driver · Next step.
- Each row's Entity cell carries the sales PoP chip + optional ASIN title. Type cell shows entity kind (Marketplace / Category / ASIN) so the all-entities view stays readable.
- All-entities feed = marketplace + category + ASIN diagnostics combined, severity-ranked.

EntityDetailDrawer rewrite (components/deepdive/EntityDetailDrawer.tsx)
- Sticky header: severity chip + kind + issue chip + confidence chip; sales current + PoP; profit + revenue impact inline.
- Diagnosis sentence now references confidence ("Confidence is high — multiple signals align" / "medium" / "low") and is tailored per issue type.
- Metric bridge organised by LEVER, each group a sub-card: Traffic · Conversion · Price/mix · Advertising · Margin. Polarity-aware coloured bars per row.
- Supporting metrics tile grid (Orders, Units, Avg price, Sessions, CVR, ROAS, ACOS, TACOS, Product margin, Channel margin) — current value + PoP with polarity-correct colour.
- Recommended checks: issue-specific 3-4 item lists (different for each of the 12 issue types).
- Bottom CTA: specific to issue type via `ctaRoute`.

DeepDive.tsx restructure
- Defaults: All entities · Profit risks mode · Rank by Profit impact.
- Removed the old entity-pill selector (Marketplace / Category / ASIN). Entity scoping now lives inside the TroubleshootingTable's controls row.
- Removed the old view-tabs state; replaced by decision-mode tabs.
- Full metric tables now ALL THREE stacked inside the collapsible "Full metric tables" section — no longer entity-tied, since the troubleshooting table is the entity-aware surface.

Demo data calibration check
- France: classified Conversion-led sales drop (cvrPoP=-1.40 doesn't actually pass the -3% threshold; falls through). With salesDown + sessionsDown → Traffic-led sales drop. profitImpact ≈ €94.9k × 41% channel margin ≈ €38.9k → Critical severity, High confidence.
- Germany: sessionsDown -20.4 + cvrDown -2.1 (under threshold), no avgPriceDown, no adSpendUp+roasDown — falls to Traffic-led sales drop. ~€18k profit impact → High severity.
- UK: sessionsDown -10.2 + cvrUp +1.8 → Traffic-led sales drop, High confidence. Smaller impact.
- Netherlands: sessionsDown + bboxDown -3.6 → Availability-led sales drop. Small absolute impact (Medium / Watch level).
- Belgium: tacosPoP +120% but salesDown → Price/mix or Sales drop branch (no salesUp gate). Small numbers, low severity.
- Categories ranking by Profit impact will surface Personal Care (largest absolute) and Home & Kitchen as top profit-risks if margin slipped.
- Protect winners: any category/marketplace with salesShare ≥ 8% AND channelMargin ≥ 25% AND margin stable (Personal Care is a candidate at 28.4% share if its margin held).


---

Developer Reference — Traffic & SQP Calculations (Jun 22 2026)

Explainer for implementing the Sales → Traffic and Sales → SQP pages. Every formula below is what the wireframe actually computes, with file + function references so the numbers can be reproduced against real Amazon data (Business Reports for Traffic, Brand Analytics SQP for SQP). Two recurring conventions to know up front: (1) we only ever assume HALF of any gap is recoverable — a deliberately conservative default, keep it; (2) ASP (average selling price) is a flat constant — €35 on Traffic, €18 on SQP — replace with real per-ASIN/category price when product metadata is wired.

The brand funnel everywhere is Impressions → Clicks → Cart Adds → Purchases. Each stage stores marketCount (whole market) + brandCount (you); share = brandCount / marketCount × 100.

=== 1. Sales → Traffic ===

1a. CVR (the per-ASIN "CVR" column) — trafficData.ts, ProductTrafficTable.tsx
- Definition: session→order conversion = Orders ÷ Sessions × 100. In the demo data orders is literally derived as `orders = round(sessions × cvr/100)`, so cvr IS orders/sessions. Against real data, CVR = Ordered Units (or order items) ÷ Sessions × 100 from Business Reports (Detail Page Sales & Traffic).
- Sibling rates the page uses:
    addToCartRate = Cart Adds ÷ Sessions × 100   (demo models it as cvr × 1.3–1.9, since more shoppers add-to-cart than buy)
    pvPerSession  = Page Views ÷ Sessions
- CVR cell color: green if cvr ≥ 12.5 (PORTFOLIO_CVR_BENCHMARK), else red. (This 12.5 is a fixed benchmark, separate from the funnel-dot quartiles in 1d.)

1b. "Main leak" hero — Impact/wk and Units/wk — HeroInsightCard.tsx + funnelDiagnosticData.ts
- The "leak" stage = the funnel transition with the worst conversion gap vs market. For the brand demo it is hardcoded to Cart Adds (biggestOpportunityIdx = 2), so the leaking transition is Click → Cart Add (conversions[1]). (The per-keyword version in 3 computes this dynamically.)
- Step by step (funnelDiagnosticData.ts):

        yourRate   = brandCartAdds.brand  / brandClicks.brand  × 100      // 1068 / 4580  = 23.3%
        marketRate = brandCartAdds.market / brandClicks.market × 100      // 12180/38440 = 31.7%
        gapPp      = |yourRate − marketRate|                              // 8.4 pp
        halfGap    = gapPp / 2                                            // 4.2 pp   ← only half is "recoverable"
        recoverableUnits = round(yourClicks × halfGap/100)               // round(4580 × 0.042) = 192
        impactEur        = round(recoverableUnits × €35 ASP)             // €6,720

- What the three tiles show:
    "Gap vs market" = conversions[leak].delta  (yourRate − marketRate, signed, pp; negative = you trail)
    "Impact / wk"   = impactEur                                          // €6,720
    "Units / wk"    = round(impactEur ÷ €35 ASP)                         // 192 — the recoverable units, re-derived from impact
- Plain English: "If you closed half your Click→Cart gap you'd win ~192 more units/week ≈ €6,720/week."

1c. Per-ASIN "Lost revenue / wk" column — ProductTrafficTable.tsx, estimateLostRevenue()
- Same half-gap idea, applied per ASIN, measured against the brand's leak stage (Click → Cart Add):

        marketRate = brand market click→cart rate (≈ 31.7%, = conversions[leakIdx−1].marketRate)
        productRate = row.addToCartRate
        gapPp = max(0, marketRate − productRate)                 // ASINs already ≥ market score 0 → shown as "—"
        potentialExtraATCs   = sessions × gapPp/100 × 0.5        // 0.5 = half-recovery (same assumption as the hero)
        potentialExtraOrders = potentialExtraATCs × 0.5          // 0.5 = ATC→purchase downstream ≈ Amazon avg buy rate
        lostRevenue/wk = round(potentialExtraOrders × €35 ASP)

- Two 0.5 factors stack on purpose: recover half the gap, then half of those cart-adds convert to orders.
- Gotcha: the per-ASIN calc uses row.sessions as the click base (Business Reports gives sessions, not query-level clicks per ASIN), whereas the brand calc in 1b uses real clicks. Keep the bases consistent once query→ASIN click data is joined in.
- Table footer "Total estimated weekly leak" = Σ lostRevenue over all rows. The "So what" line = top-3 ASINs' share of that total = round(top3Sum / totalLost × 100).

1d. Funnel colors — in extenso
There are FIVE colored surfaces on this page and they use DIFFERENT rules. Do not conflate them.

(i) Stage cards (the four big Impressions/Clicks/Cart Adds/Purchases cards) — FunnelDiagnostic.tsx StageCard
    delta = yourStageShare − marketStageShare (pp); marketStageShare = diagnostic.marketShares[stage] (a fixed reference lookup).
    Card BACKGROUND, by precedence:
      1. isBiggest (stage index == biggestOpportunityIdx) → AMBER + "Biggest opportunity" badge. Amber WINS even if the stage also beats market.
      2. else delta ≥ 0 → GREEN (beats market).
      3. else            → RED  (trails market).
    The small delta chip inside the card always colors green/red by (delta ≥ 0), independent of the amber background.

(ii) Conversion chips between the cards (CTR, Click→Cart, Cart→Purchase) — ConversionChip
    delta = yourRate − marketRate (pp). Green if delta ≥ 0, else red. No amber.

(iii) Stage trend mini-charts (the four small SVG lines) — StageMiniChart
    "Your" line = GREEN if the LATEST week's yourShare ≥ marketShare, else RED. Color reflects the latest point vs market, NOT trend direction (funnel share is always higher=better).
    Market line = always slate-gray dashed (#94A3B8).
    The leak stage's chart additionally gets an amber border (highlight = biggestOpportunityIdx); the line itself stays green/red by the latest point.

(iv) Per-ASIN "Funnel" health dots (4 dots: Sess · PV/S · ATC · CVR) — ProductTrafficTable FunnelDots
    Self-referential QUARTILE coloring vs YOUR OWN portfolio (not vs market):
      green (#10B981) if value ≥ portfolio P75 (top 25% of your ASINs at that metric)
      red   (#EF4444) if value <  portfolio P25 (bottom 25%)
      gray  (#CBD5E1) otherwise (middle 50%)
    P25/P75 are computed live from the visible product set (buildBenchmarks/quartile), so they move as the portfolio/filters change.
    Separate from the dots, the inline ATC and CVR cell colors use fixed rules: ATC cell green if addToCartRate ≥ market ATC rate else red; CVR cell green if ≥ 12.5 else red; BBox gray if ≥ 88 else orange.

(v) Source-mix stacked bars ("Funnel contribution by source") — colored by SOURCE category, not performance: Organic emerald #10B981, Sponsored Products #0E5A8A, Sponsored Brands indigo #6366F1, Sponsored Display amber #F59E0B. Fixed palette; bars sum to 100% per stage.

Rule of thumb: market-relative surfaces (i, ii, iii) → green beats market / red trails market / amber = the chosen leak stage. Portfolio-relative surface (iv) → green top-quartile / red bottom-quartile. Categorical surface (v) → fixed per-source colors, no judgement.

=== 2. Binning weekly SQP into a month (recommendation) ===

Problem: Brand Analytics SQP publishes WEEKLY snapshots (Sun–Sat). When the user selects a full calendar month we need one monthly set. Calendar months don't align to SQP weeks, and shares/rates cannot be averaged.

Recommendation, in priority order:

1. Prefer Amazon's native MONTHLY SQP report for whole-month selections. Amazon publishes SQP weekly, monthly AND quarterly. The monthly file is exact and already de-duplicated — use it directly and skip aggregation. Only fall back to summing weeks when the monthly file isn't available (very recent months, or a custom non-month range).

2. When you must aggregate weeks: SUM counts, RECOMPUTE rates.
   - Additive — SUM across the weeks in the month: marketVolume, and every stage's marketCount and brandCount (impressions, clicks, cart adds, purchases).
   - NOT additive — recompute from the summed counts, never average the weekly %:

         monthly share       = Σ brandCount ÷ Σ marketCount × 100
         monthly CTR/ATC/CVR = Σ countAtToStage ÷ Σ countAtFromStage × 100

   - Averaging weekly percentages is the classic bug: it over-weights low-volume weeks. Always volume-weight by recomputing from totals.

3. Recompute derived/portfolio metrics on the monthly rows — don't sum weekly. portfolioAvgClick, opportunity = max(0, portfolioAvgClick − clickShare), opportunityScore, opportunityEur, under-indexed count and concentration must all be recomputed from the monthly-aggregated shares. (Summing weekly opportunityEur double-counts and bakes in stale weekly portfolio averages.)

4. Week→month assignment: assign each weekly snapshot WHOLLY to one month — do not split a week's counts across two months. Per-keyword weekly rows are pre-aggregated; you only have the week total, not daily counts, so any day-split is fabricated. Assign by the week's END date (Saturday) — equivalently, the month that holds the majority of the week's days. A "month" is therefore the 4–5 weekly snapshots whose Saturday falls in it.
   - Surface the contributing week range in the UI ("4 weeks · May 4 – May 31") so the operator understands a month = whole weeks, not exact calendar days.

5. Flag partial months: if the month is in progress or fewer weeks landed than expected, label it "partial (N of ~M weeks)". Never show an under-counted month as if it were complete.

=== 3. Sales → SQP ===

All three hero metrics live in sqpSummary (sqpData.ts); the card is sqp/SQPHeroCard.tsx.

3a. "Opportunity / wk" (€)
- Per keyword (sqpData.ts):

        portfolioAvgClick = mean(clickShare) over all tracked keywords
        opportunity (pp)  = max(0, portfolioAvgClick − thisKeyword.clickShare)   // 0 if you're already above your own average
        opportunityEur    = round( marketVolume × (opportunity / 200) × 0.5 × €18 )

  Unpacking the constants: opportunity/200 = (opportunity/100) ÷ 2 = HALF the share-gap as a fraction; × 0.5 = market cart-add→purchase downstream factor; × €18 = category ASP. In words: recoverable purchases × €18, where recoverable purchases ≈ marketVolume × half-gap-fraction × 0.5.
- Hero "Opportunity / wk" = totalOpportunityEur = Σ opportunityEur across all keywords.
- Don't confuse with opportunityScore = round(marketVolume × opportunity), which is unitless and used only to RANK/sort keywords. The € figure is opportunityEur.

3b. "Concentration" (%)
- top5ConcentrationPct = round( Σ(opportunityEur of the 5 keywords with the highest opportunityEur) ÷ Σ(opportunityEur of all keywords) × 100 ).
- Reads as "X% of all recoverable € sits in just 5 keywords." High = a short to-do list; low = scattered work.
- Not to be confused with top14Share, a different stat = % of market VOLUME contributed by the top-14 keywords by volume.

3c. "Under-indexed" (count)
- underIndexedCount = number of keywords where clickShare < portfolio average clickShare (avgClickShare).
- Meaning: on these queries you capture a SMALLER slice of clicks than you do on average across your own tracked keywords — you punch below your own weight there. These are exactly the keywords with opportunity > 0 that feed Opportunity/wk.
- "Indexed" is the marketing sense: index 100 = your portfolio average, under-indexed = below your own baseline. It is measured vs YOUR portfolio average, NOT vs the whole market — that's deliberate: Amazon doesn't publish a per-query market-share benchmark, so the portfolio average is the honest, derivable reference.

Cross-reference: the per-keyword detail drawer reuses the SAME half-gap funnel model as Traffic (buildKeywordFunnel in funnelDiagnosticData.ts) with €18 ASP instead of €35 and synthetic per-stage market shares (keywordMarketStageShares). Those synthetic market shares are flagged elsewhere in this doc as not API-grounded — relabel as "vs your portfolio average" when productionizing.


---

Developer Reference — Advertising Performance Scorecard automation (Jun 22 2026)

How the Advertising → Overview "Performance scorecard" (Status · main readout · driver · watchout, all PoP) is generated, and how it goes live on real Amazon data. The whole surface is a DETERMINISTIC RULE ENGINE (AdvertisingScorecard.tsx) — no insight is hand-authored and no LLM is involved. Only the demo numbers are synthetic; the logic is production-shippable as-is. This note is the spec for wiring it to real data and for hardening the thresholds.

Why deterministic, not an LLM: the scorecard prints status calls ("At risk") next to money. It must be reproducible, auditable, and explainable to a CFO. Keep status / driver / watchout selection as code-level rules. If you want prose narration later, run an LLM ON TOP of the already-decided facts (status + numbers) — never let it decide the status.

1. Inputs & where the data comes from
Each metric is one object: { label, value, popChange }, where popChange = % change vs the prior comparison period (the same comparison window the page's date filter already defines, so the scorecard agrees with the rest of the page).
Metric catalog — label · polarity · source:

    Ad Sales             higher    Advertising API (attributed sales, SP+SB+SD)
    Orders               higher    Advertising API (attributed orders / conversions)
    Clicks               higher    Advertising API
    Impressions          higher    Advertising API
    CTR                  higher    Advertising API (clicks ÷ impressions)
    CPC                  lower     Advertising API (spend ÷ clicks)
    Ads Conversion Rate  higher    Advertising API (orders ÷ clicks)
    ACOS                 lower     Advertising API (spend ÷ ad sales)
    CPA                  lower     Advertising API (spend ÷ orders)
    Ad Spend             neutral   Advertising API (D+3 hot window; reconciled to settlement ad deduction, check R2)
    TACOS                lower     JOIN: ad spend (Advertising API) ÷ total net revenue (GL journal 40xx)
    TCPA                 lower     JOIN: ad spend ÷ total orders (GL / order counts)

Key point: most of the scorecard is pure Advertising API, but TACOS and TCPA are JOIN metrics — they need TOTAL revenue/orders from the P&L journal, not ad-attributed numbers. That join is what makes the scorecard "account-level" rather than "ad-only", and it's why Efficiency can be At risk (TACOS worsening) while the ad-only ACOS is improving.
Polarity is config (KPI_POLARITY): higher-is-better / lower-is-better / neutral. Ad Spend is neutral — spend rising or falling isn't inherently good or bad, so it never raises a flag by itself.

2. The pipeline — five deterministic steps (AdvertisingScorecard.tsx)
Step 1 — direction. good = (higher && Δ>0) || (lower && Δ<0). Neutral-polarity metrics return null (never judged).
Step 2 — per-KPI status (kpiStatus), from direction + magnitude |Δ|:

    |Δ| < 1%             → Stable      (noise floor — too small to mention)
    good direction       → Healthy
    bad direction, 1–5%  → Watch
    bad direction, ≥ 5%  → At risk

Step 3 — group status (groupStatusFor) = the WORST status among the group's main KPI + its watch KPIs (precedence risk > watch > good > neutral). Group config (GROUPS):

    Growth           main Ad Sales             · driver Orders · watch [Impressions, Clicks]
    Spend            main Ad Spend (neutral)   · no driver     · no watch
    Efficiency       main ACOS                 · driver CPA    · watch [TACOS, TCPA]
    Traffic quality  main Ads Conversion Rate  · driver CTR    · watch [CPC]

Step 4 — watchout (findWatchout) = the biggest ADVERSE mover among the watch KPIs (status risk/watch, ranked by |Δ|). Null if every watch KPI is healthy.
Step 5 — sentence (statusReason), a template keyed by status:

    Healthy        → "{main} {+Δ}% PoP"
    Stable         → "{main} stable"
    Watch/At risk  → "{watchout or main} {improved|declined} {Δ}% PoP"   (uses the watchout if present, else the main)

3. Worked examples (the live screenshot)
- Growth: Ad Sales +3.2% (Healthy) BUT Impressions −18.4% (bad, ≥5 → At risk) → group At risk; watchout = Impressions → "Impressions declined −18.4% PoP". This is the core behaviour: status follows the WORST signal in the group, and the sentence names the metric driving the concern — which can be a watch metric even when the headline number is up.
- Efficiency: ACOS −9.0% (lower=better → Healthy) BUT TACOS +11.5% (lower=better, + is bad, ≥5 → At risk) → group At risk; watchout = TACOS → "TACOS declined +11.5% PoP". "declined" means "got worse" for an inverse-polarity metric.
- Traffic quality: Ads Conversion Rate −9.6% (higher=better → bad, ≥5 → At risk) is the MAIN; the CPC watch is healthy this period → no watchout, sentence falls back to the main → "Ads Conversion Rate declined −9.6% PoP".
- Spend: Ad Spend is neutral polarity → never At risk on its own → "Ad Spend stable".

4. The comparison window
popChange is PoP against whatever the date filter sets as the comparison range (Navigation already exposes primary vs compare ranges). Productionise: compute each metric for [primary] and [compare] from the SAME aggregated table, then Δ = (primary − compare) / |compare| × 100. Bind the scorecard to that single source so it never disagrees with the KPI tiles on the same page.

5. Productionising — the data pipeline
  a. Ingest Advertising API SP/SB/SD campaign reports daily; re-pull the last 3 days (D+3 hot window) — spend/attribution settle late.
  b. Aggregate to ACCOUNT level per day, then roll up to the selected primary/compare windows.
  c. Join total net revenue + total orders from the GL journal (40xx / order counts) for TACOS and TCPA.
  d. Reconcile ad spend to the settlement ad-deduction line (check R2, 2% tolerance) so the spend figure is financial-grade.
  e. Compute popChange per metric and feed the { label, value, popChange } objects into the existing rule engine. Nothing in steps 1–5 changes — only the inputs become real.
The config a human maintains is tiny and static: the polarity map, the thresholds, and the group definitions. Everything on screen is derived — that IS the automation, and it scales to any account with zero per-insight authoring.

6. Hardening before this is trustworthy at scale
  1. Per-metric thresholds. Flat 1% / 5% is wrong across metrics — a 5% Impressions swing is normal noise; a 5% ACOS swing is large. Move the Watch / At-risk cutoffs into the per-metric config next to polarity.
  2. Significance / volume gate. A 30% move on a €40-spend campaign is noise. Require a minimum absolute base (spend or clicks) before a % move can raise a flag, so thin-data metrics can't trip "At risk".
  3. Seasonality-aware baseline. Pure PoP misfires around Prime Day / Q4 / launches. Compare against EXPECTED (same period last year, or a moving / z-score baseline) and flag deviation-from-expected, not raw PoP.
  4. Impact-ranked watchout. Rank the watchout by € impact, not by % move, so the flagged metric is the one actually costing money (a small % on huge spend beats a big % on tiny spend).
  5. Wording. "TACOS declined +11.5%" reads oddly because the sign and the verb disagree. Use "worsened / improved" for inverse-polarity metrics.
  6. Confidence surfacing. Carry the volume / base through to a confidence tag (High / Med / Low), like the decision drawer does, so a flag built on thin data is visibly low-confidence.

Net: the engine architecture is correct and already automated. Going live is (a) feeding real Advertising-API + GL aggregates into the same { label, value, popChange } objects, and (b) replacing the flat thresholds with per-metric, volume-gated, seasonality-aware ones.