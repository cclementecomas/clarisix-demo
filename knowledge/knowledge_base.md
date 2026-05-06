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