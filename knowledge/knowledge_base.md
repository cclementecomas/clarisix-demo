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
- All base PVs updated: unitsSold, unitsRefunded, grossASP, subscriptionFees, removalDisposal, safetClaims, otherAdjustments.