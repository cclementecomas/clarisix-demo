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

COGS System (Apr 20 2026)

Architecture:
- cogsData.ts: Data model (PurchaseOrder, CostLayer), COGS calculation engine (FIFO/LIFO/WAC), demo PO data generator, pre-built cost layers.
- AccountSpecificsContext: cogsMethod state persisted to localStorage (cx_cogsMethod), default FIFO.
- Settings > Account: COGS Method card with 3 selectable cards (FIFO, LIFO, WAC) showing active state and descriptions.
- COGSManager.tsx: Full COGS Manager page under Profitability > COGS in sidebar.

COGS Manager (4 tabs):
- Purchase Orders: Searchable/exportable table of all POs with cost components (unit cost, freight, duties, other, landed cost). Read-only — manual edits not needed for wireframe.
- CSV Upload: 3-step flow (download template → fill → upload). Drag-and-drop with header validation and preview table. Template columns: PO Number, Date, Supplier, SKU, ASIN, Product Title, Quantity, Unit Cost, Freight Per Unit, Duties Per Unit, Other Per Unit.
- Manual Entry: Form with all PO fields, live landed cost preview, success feedback.
- Cost Layers: Per-SKU expandable drill-down showing all layers with qtyPurchased, qtyRemaining, unitCost, landedCost, layer value. Depleted layers shown at 40% opacity.

Costing Methods:
- FIFO (default): Oldest inventory costs consumed first. Amazon default, most common.
- LIFO: Newest inventory costs consumed first. Reduces taxable income when costs rise.
- WAC: Blends all purchase costs into weighted average. Smooths cost fluctuations.

Integration:
- inventoryData.ts: unitCost, cogs, inventoryValue now derived from COGS cost layers (FIFO at data-gen time) instead of random values. recalcCOGS() helper exported for dynamic method switching.
- Landed cost = unitCost + freightPerUnit + dutiesPerUnit + otherPerUnit (auto-calculated).
- Demo data: 3-5 POs per SKU spanning Oct 2025 – Apr 2026, seeded random with ±5% cost variation per PO.
- Changing COGS method in Settings recalculates all profitability metrics and inventory valuations.

Design decisions:
- PO table is read-only. Editing POs cascades into cost layer rebuild → inventory/profitability recalc. Not needed for wireframe.
- Summary cards: Total POs, Unique SKUs, Total Inventory Value, Avg Unit Cost (method-aware).
- CSV export follows app convention: clarisix-purchase-orders-YYYY-MM-DD.csv, clarisix-cogs-template.csv for template.
- All base PVs updated: unitsSold, unitsRefunded, grossASP, subscriptionFees, removalDisposal, safetClaims, otherAdjustments.