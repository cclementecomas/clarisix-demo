# Clarisix Classifiers & Recommendation Engine

The single, in-depth reference for **every automatic label, classification, status,
and recommendation** Clarisix produces. Think of this as the decision-tree engine
spec: given a set of inputs, exactly how does Clarisix decide what to *say* and what
to *recommend*.

Scope: this consolidates all the rule logic scattered across `knowledge_base.md`
into one place, cross-checked against the actual code. Where this file and the
narrative log disagree, **the code is the source of truth** (file refs are given
per engine). Demo numbers are synthetic; the **logic is production-shippable**.

---

## 0. How to read this file

Every engine below is documented as:

- **Purpose** — what it decides.
- **Inputs** — the fields it consumes (and where they come from in production).
- **Thresholds / constants** — the tunable numbers (today mostly flat placeholders).
- **Decision tree** — ordered rules. Unless stated otherwise, **first match wins —
  order matters.**
- **Outputs** — the label/classification AND the recommendation/CTA it yields.
- **Code ref** — the file(s) that implement it.
- **Production caveats** — what must change before it is trustworthy on real data.

---

## 1. Design principles (true for ALL engines)

1. **Deterministic rule engines, never an LLM for the decision.** Every status,
   label and recommendation is code-level and reproducible. These calls sit next
   to money and must be auditable/explainable to a CFO. If prose narration is ever
   added, run the LLM *on top of* the already-decided facts — never let it decide
   the status.
2. **Polarity-aware.** Each metric is `higher`-is-better, `lower`-is-better, or
   `neutral`. Neutral metrics (e.g. Ad Spend) never raise a flag on their own.
3. **Period-over-period (PoP) by default.** Change is measured vs the comparison
   window the page's date filter already defines, so engines never disagree with
   the KPI tiles on the same page.
4. **Conservative "half-gap" recovery.** Any opportunity € assumes only **half** of
   a measured gap is recoverable. This is a deliberate default — keep it.
5. **Confidence = how many signals agree** (not model probability). More aligned
   signals → higher confidence → higher severity weight.
6. **Severity = magnitude × confidence**, then bucketed into a named level.

---

## 2. Shared primitives (the vocabulary every engine reuses)

### 2.1 Direction & polarity
```
good(metric) = (polarity == 'higher' && Δ > 0) || (polarity == 'lower' && Δ < 0)
polarity == 'neutral' → never judged (returns null / no flag)
```
"Δ" is PoP % change unless a rule says otherwise. For inverse-polarity metrics
(ACOS, TACOS, CPC…) a POSITIVE Δ is BAD — say "worsened", not "increased".

### 2.2 Confidence (signal-count → tier → multiplier)
```
n = count of supporting signals that fire for the chosen decision
n >= 3 → High     (× 1.0)
n == 2 → Medium   (× 0.7)
else   → Low      (× 0.4)
```
Used identically by the Advertising engine, the Sales-Deepdive engine, and the
Advertising executive-insight headline.

### 2.3 Severity (score + named level)
```
severityScore = |impact| × confidenceMultiplier        // the sort key
```
Named level from |impact| (flat € buckets, shared across engines):
```
>= €20,000 → Critical
>= €5,000  → High
>= €1,000  → Medium
>  €0      → Watch
== 0       → None
```
Opportunity-side decisions relabel the level as "…opportunity" (High/Medium/Low);
risk-side decisions relabel as "…risk" (Critical/High/Medium risk, then Watch).

### 2.4 The brand funnel (Traffic & SQP)
```
Stages: Impressions → Clicks → Cart Adds → Purchases
Per stage: marketCount (whole market) · brandCount (you) · share = brand/market×100
share gap[S]      = marketShare[S] − yourShare[S]        // + = you under-index
conv rate[A→B]    = count[B] / count[A] × 100            // yours vs market
half-gap recovery = gap / 2                              // only half is recoverable
ASP constants     = €35 (Traffic, blended basket) · €18 (SQP, single-ASIN)
```
Both ASP values are wireframe constants — replace with real per-scope ASP.

### 2.5 Metric coloring rules (do not conflate — there are four families)
- **Market-relative:** green = beats market, red = trails market, amber = the chosen
  leak/opportunity stage. (Stage cards, conversion chips, stage trend lines.)
- **Portfolio-relative (quartile):** green ≥ your P75, red < your P25, gray middle.
  (Per-ASIN funnel health dots — vs your own portfolio, not the market.)
- **Fixed benchmark:** green/red vs a flat number (e.g. CVR ≥ 12.5% green; BuyBox ≥ 88% gray).
- **Categorical:** fixed palette by source/type, no judgement (source-mix bars).

---

## 3. Engine catalog

### A. Sales → Overview — pacing & growth decision tool
File: `data/salesOverviewInsights.ts` · cards in `components/sales/`.

**Purpose:** headline pace status, growth driver/watchout, organic-vs-ad read, a
capped "Needs Attention" alert list, and the headline CTA.

**A1. Pace status** (`computePaceStatus`)
```
if TARGET_SALES set:
    PROJECTED_EOM >= TARGET_SALES  → 'On track'           (good)
    else                           → 'Behind target'      (bad)
else (no target):
    PROJECTED_EOM >= LAST_MONTH_TOTAL → 'Ahead of last period' (good)
    else                              → 'Behind last period'   (bad)

gapToTarget           = PROJECTED_EOM − TARGET_SALES
requiredDailyToTarget = max(0, ceil((TARGET_SALES − MTD_ACTUAL) / DAYS_REMAINING))
popChangePct          = (PROJECTED_EOM − LAST_MONTH_TOTAL) / LAST_MONTH_TOTAL × 100
yoyChangePct          = (PROJECTED_EOM − LAST_YEAR_SAME_PERIOD) / LAST_YEAR_SAME_PERIOD × 100
```

**A2. Growth driver / watchout** (per marketplace, category, ASIN feed)
```
change = value − previous ; changePct = change/previous×100
topPositive = max change > 0
topNegative = max(|change|) where change < −€1,000 OR changePct < −10%   // OR is intentional
mainDriver   = top topPositive across feeds, ranked by |change €|
mainWatchout = top topNegative across feeds, ranked by |change €|
```

**A3. Organic vs ad** (first match wins)
```
diff = adGrowthPct − organicGrowthPct
adDependencyPct = AD_SALES / (ORGANIC_SALES + AD_SALES) × 100
diff > +10pp           → "Growth is increasingly ad-driven. Check profitability / TACOS."
diff < −10pp           → "Growth is supported by stronger organic sales."
adDependencyPct > 50%  → "High ad dependency. Check margin quality."
else                   → "Organic and paid are growing in step — no immediate concern."
```

**A4. Needs-Attention alerts** (`buildAlerts`, priority-ordered, **cap 3**)
```
P1 Target gap        if TARGET set & PROJECTED_EOM < TARGET → severity critical → CTA breakdown-marketplace
P2 Daily-pace gap    if requiredDailyToTarget > AVG_DAILY_SALES → warning → CTA run-rate
P3 Largest decline   if mainWatchout → warning → CTA breakdown-{marketplace|category|asin}
P4 Ad dependency     if diff > +10pp → warning → CTA profitability
   else if adDependencyPct > 50% → info → CTA profitability
```

**A5. Headline CTA routing** (`headlineCta`, first match wins)
```
TARGET set & under target        → 'View growth drivers'     → breakdown-marketplace
else mainWatchout.kind == asin   → 'Review declining ASINs'  → breakdown-asin
else mainWatchout.kind==marketpl → 'Open marketplace breakdown'
else mainWatchout.kind==category → 'Open category breakdown'
else diff > +10pp                → 'Check profitability'     → profitability
else                             → 'Open sales trend'        → sales-trend
```

**Production caveats:** all input constants are May-2026 demo values; the ±10pp /
50% / €1,000 / −10% thresholds are flat placeholders.

---

### B. Advertising → Overview — entity decision engine
File: `data/advertisingDiagnostics.ts`. Classifies EVERY entity (campaign, ad group,
placement, campaign type, product/ASIN, search term, keyword) into
`{ decision, issue, confidence, severity, revenueImpact, drivers, because, watch,
severityLabel }`. Overview shows the top-3 + an executive insight; Diagnostics and
"Where-is-it-happening" reuse the same engine.

**B0. Targets (single source of truth)**
```
acos 30% · breakEvenAcos 45% · tacos 15% · significantPpDelta 5%
highSpend €5,000 · noSalesSpend €1,000 · highShare 8% (of total spend)
```

**B1. Derived signals** (`deriveSignals`)
```
highSpend = spend ≥ 5000 ; noOrders = orders == 0
acosAboveTarget = acos > 30 ; acosAboveBreakEven = acos > 45 ; acosUnderTarget = 0 < acos ≤ 30
tacosHigh = tacos > 15
cpcUp = cpcPoP ≥ +5 ; ctrDown = ctrPoP ≤ −5 ; cvrDown = cvrPoP ≤ −5 ; cvrUp = cvrPoP ≥ +5 ; cvrStable = |cvrPoP| < 5
highShare = spend/totalSales×100 ≥ 8
productReadiness = kind=='product' && (buyBoxPct<85 || rating<4.0 || inventoryDays<14)
```

**B2. Decision classifier** (`classify`, FIRST MATCH WINS)
```
1. highSpend & noOrders                        → Pause  · "Spend without sales"
2. product & productReadiness                  → Fix    · "Product readiness issue"
3. highSpend & acosAboveBreakEven              → Waste  · "High ACOS"
4. highSpend & acosAboveTarget & !noOrders     → Fix, sub-issue by first signal:
     cpcUp→"CPC inflation" · cvrDown→"CVR decline" · ctrDown→"CTR decline"
     · tacosHigh→"High TACOS" · else→"High ACOS"
5. acosUnderTarget & (cvrStable||cvrUp):
     highShare → Protect · "Healthy"
     else      → Scale   · "Profitable scaling opportunity"
6. highShare & 0 < acos ≤ 30                    → Protect · "Healthy"
7. spend < €1,000                              → Monitor · "Low impressions"
8. cvrDown                                     → Monitor · "CVR decline"
9. ctrDown                                     → Monitor · "CTR decline"
default                                        → Monitor · "Healthy"
```

**B3. Confidence** — count supporting signals per decision, then §2.2.
```
Scale:   acosUnderTarget · (cvrStable||cvrUp) · roas≥3 · salesPoP>0
Fix:     highSpend · acosAboveTarget · cpcUp · cvrDown · ctrDown
Pause:   noOrders · highSpend · spendPoP>0
Waste:   acosAboveBreakEven · highSpend · cpcUp · cvrDown
Protect: highShare · acosUnderTarget · !cvrDown · salesPoP>0
Monitor/Healthy: baseline 1
```

**B4. Revenue impact** (`computeRevenueImpact`)
```
Pause / Waste   → round(spend)                          // full spend at risk
Fix             → acos ≤ 30 ? 0 : round(spend × (acos−30)/acos)   // spend above target ACOS
Scale / Protect → round(sales × 0.2)                    // 20% upside proxy
Monitor         → 0
```

**B5. Severity + level + label**
```
severity = round(|revenueImpact| × confidenceMultiplier)
level: Monitor→Watch ; Protect→Watch ; else €20k/€5k/€1k/>0 → Critical/High/Medium/Watch ; 0→None
label: Scale/Protect → "{High|Medium|Low} opportunity" (Critical clamps to "High opportunity")
       Fix/Pause/Waste → "{Critical|High|Medium} risk", else "Watch"
```

**B6. Top-3 panel** (`topThreeDecisions`): `bestScale` = max severity over {Scale,Protect};
`biggestWaste` = max over {Pause,Waste}; `biggestFix` = max over {Fix}. Expansion shows
top-3 Scale+Protect and top-3 Fix+Pause+Waste.

**B7. Executive insight headline** (`buildExecutiveInsight`, brand summary)
```
headline: salesPoP>0 & acosPoP>0 → "Ad sales growing, but efficiency weakening."
          salesPoP>0 & acosPoP≤0 → "Ad sales growing efficiently."
          salesPoP≤0 & spendPoP>0→ "Spend increased while ad sales declined."
          salesPoP≤0 & spendPoP≤0→ "Both spend and ad sales softening."
          else                    → "Advertising performance is stable."
issue:    tacos>15 → "TACOS above target" · (cpcPoP>0 & cvrPoP<0) → "CPC up while ad CVR down"
          · acos>30 → "ACOS above target" · else "No material issue"
confidence: n = (acos>30)+(tacos>15)+(cpcPoP>0&cvrPoP<0)+(salesPoP<0&spendPoP>0) → §2.2
CTA:      count Fix/Waste campaigns with spend≥€5k > 0 ? "Review N high-spend inefficient campaigns" : "Open Diagnostics"
```

**B8. "Because" / "Watch" sentences** (`becauseFor` / `watchFor`): `watchFor` only fires a
counter-signal, e.g. Scale/Protect: cvrPoP≤−2 / ctrPoP≤−2 / acosPoP≥+5; Fix: salesPoP≥+5;
Pause/Waste: spendPoP<0; Monitor: none.

**Production caveats:** TARGETS are placeholders (make per-account in Settings → Data);
gate confidence on a minimum spend/order base; make severity € buckets percentile-based.

---

### C. Advertising → Overview — Performance Scorecard
File: `components/AdvertisingScorecard.tsx`. Status · readout · driver · watchout per
group, all PoP. Pure rule engine.

```
Step 1 direction:  good = (higher & Δ>0)||(lower & Δ<0) ; neutral → null
Step 2 kpiStatus:  |Δ| < 1% → Stable
                   good → Healthy
                   bad & 1–5% → Watch
                   bad & ≥5%  → At risk
Step 3 group:      worst status among {main KPI + watch KPIs} (risk>watch>good>neutral)
Step 4 watchout:   biggest ADVERSE watch KPI by |Δ| (null if all healthy)
Step 5 sentence:   Healthy→"{main} +Δ% PoP" · Stable→"{main} stable"
                   Watch/At risk→"{watchout or main} {improved|declined} Δ% PoP"
```
Groups: Growth (main Ad Sales · watch Impressions,Clicks) · Spend (main Ad Spend, neutral) ·
Efficiency (main ACOS · watch TACOS,TCPA) · Traffic quality (main Ads CVR · watch CPC).
Key behavior: **status follows the WORST signal in the group** — Growth can read "At risk"
on an Impressions drop even while Ad Sales is up. TACOS/TCPA are JOIN metrics (ad spend ÷
total revenue/orders from the GL), which is what makes the scorecard account-level.

**Production caveats:** flat 1%/5% cutoffs are wrong per-metric (5% Impressions = noise,
5% ACOS = large) — move into per-metric config; add a volume/significance gate; use a
seasonality-aware baseline; rank the watchout by € impact; use "worsened/improved" wording.

---

### D. Sales → Deepdive — profit-led diagnostic engine
File: `data/deepdiveDiagnostics.ts`. Classifies every entity (marketplace, category,
ASIN) into one of **12 issue types + Healthy**, ranked by **profit at risk**.

**Taxonomy**
```
Profit risks : Profit dilution · Margin risk · Ad efficiency issue · Ad-led growth risk · Discount-led growth risk
Growth risks : Traffic-led / Conversion-led / Availability-led sales drop · Price/mix issue · Acquisition weakness · Retention weakness
Other        : Protect winner · Healthy
```

**Branch logic (shape)**
```
sales DOWN → name the lever:
    sessions down (dominant)        → Traffic-led sales drop
    CVR down past −3% threshold     → Conversion-led sales drop
    buy-box/availability down       → Availability-led sales drop
    (then Price/mix, Acquisition, Retention as applicable)
sales UP → check quality BEFORE celebrating:
    margin slipped                  → Profit dilution
    TACOS surge                     → Ad-led growth risk
    discount surge                  → Discount-led growth risk
Protect winner gate: salesShare ≥ 8% AND channelMargin ≥ 25% AND channelMarginPoP ≥ 0 AND not in decline
otherwise                          → Healthy
```

**Impacts, confidence, severity**
```
revenueImpact = gapToPrev(sales, salesPoP)   (or NTB/S&S × avg price for those issues)
profitImpact  = margin issues: marginΔpp × sales
                sales-drop:     revenueImpact × current channelMargin%
                ad-efficiency:  gap on ad spend
                growth-risk:    max(gainedSales × marginShift, TACOS proxy)
confidence    = aligned-signal count → High(≥3)/Medium(2)/Low(≤1) → ×1.0/0.7/0.4
severity      = |profitImpact| × confidenceMultiplier
                fallback |revenueImpact| × 0.2 × conf   (when profit is 0)
severity LEVEL from |profit|: €20k/€5k/€1k/>0 → Critical/High/Medium/Watch ; Healthy → None
```

**Outputs:** decision mode (`profit-risk` / `growth-risk` / `winner` / `healthy`) drives
the mode tabs; `topIssues` excludes Healthy AND Protect-winner (problems only); each issue
carries a SPECIFIC CTA + route ("Review margin bridge", "Check ad dependency", "Review
discount strategy", "Open inventory diagnostic", "Monitor and defend share"…).
`RANK_OPTIONS` = Profit impact (default) · Sales impact · Severity · Sales change;
`sortByRank` always pushes Healthy to the bottom.

**Note on polarity:** NTB% / Subscribe-&-Save% are NOT unambiguously higher-better (high NTB
can mean strong acquisition OR weak retention) → polarity downgraded to neutral/contextual.

---

### E. Sales → Traffic — main leak / biggest opportunity / impact
Files: `data/funnelDiagnosticData.ts` · `components/funnel/*`.

```
Step 1 leak stage = arg max over stages of gap[S] = marketShare[S] − yourShare[S]
                    (demo hardcodes Cart Adds; production = arg-max, no hardcoding)
Step 2 conv-rate gap on the leak transition A→B:
       delta = yourRate − marketRate  (yourRate = brand[B]/brand[A]×100, etc.)
Step 3 € impact (half-gap):
       recoverableUnits = round(yourClicks × (|delta|/2)/100)
       impactEur        = round(recoverableUnits × €35 ASP)
```
Per-ASIN "Lost sales / wk" (`estimateLostRevenue`):
```
lost = round( sessions × max(0, marketATCRate − productATCRate)/100
              × 0.5     // half-recovery of the ATC gap
              × 0.5     // ATC → Purchase downstream (~50% market avg)
              × €35 )   // ASP
```
Footer "Total weekly leak" = Σ; "So what" = top-3 ASINs' share of that total.
**Caveat:** `marketShare[S]` is a synthetic benchmark (Amazon doesn't publish per-query
brand-rollup market share). Production needs a real category benchmark, a portfolio-average
fallback, or drop the comparison and show drop-off only. ASP €35 is flat.

---

### F. Sales → SQP — keyword opportunity, quadrant, main gap, and the detail pop-up
File: `data/sqpData.ts` · drawer `components/sqp/KeywordDetailDrawer.tsx`.

**F1. Opportunity (per keyword)**
```
portfolioAvgClick = mean(clickShare) over tracked keywords
opportunity (pp)  = max(0, portfolioAvgClick − clickShare)      // 0 if at/above your avg
opportunityScore  = round(marketVolume × opportunity)           // unitless SORT key
opportunityEur    = round(marketVolume × (opportunity/200) × 0.5 × €18)
                    // ½-gap fraction × cart→buy 50% × €18 ASP
```

**F2. Quadrant (the badge in the pop-up)** — `keywordQuadrant`, portfolio-RELATIVE
```
highVol   = marketVolume ≥ volumeMedian
highShare = clickShare   ≥ avgClickShare
highVol & highShare  → DEFEND  (emerald)  "Protect share, avoid losing rank"
highVol & !highShare → INVEST  (amber)    "Increase bid / content / rank"
!highVol & highShare → HARVEST (indigo)   "Maintain, optimize ACOS"
else                 → TAIL    (slate)    "Ignore or test cheaply"
```

**F3. Recommended action (the amber call-out)** — uses an ABSOLUTE-threshold status,
NOT the relative quadrant above. `classify()` → `actionFor()`:
```
status: volHi = marketVolume ≥ 8000 ; shareHi = clickShare ≥ 15
        volHi & shareHi  → trend4w < −3 ? 'optimize' : 'defend'
        volHi & !shareHi → 'invest'
        !volHi & shareHi → 'harvest'
        else             → 'drop'
gap = portfolioAvgClick − clickShare
action: defend→"Hold rank; protect bids"
        invest→ gap>15 ? "Aggressive bid + creative refresh" : "Increase bid 20% on top campaigns"
        optimize→"Audit listing & creative for funnel leak"
        harvest→"Lower bid; preserve margin"
        drop→"Pause bids; deprioritize"
```

**F4. Main gap** — synthetic per-stage market benchmark, then arg-max:
```
marketStageShares = { impressions: max(15, clickShare+8), clicks: max(15, clickShare+8),
                      cartAdds: max(12, clickShare+5), purchases: max(10, purchaseShare+6) }
mainGap = arg max over S of (marketStageShares[S] − yourShare[S])
        > 0 → "{stage} · {gap}pp behind synthetic market" ; ≤ 0 → "beats market at every stage"
```

**F5. Portfolio hero narrative** — `dominantOppQuadrant` = arg max of Σ opportunityEur by
quadrant → 'invest'/'defend'/'harvest'/'tail' each map to a headline sentence.
Hero stats: `totalOpportunityEur` (Σ), `top5ConcentrationPct`, `underIndexedCount`
(keywords with clickShare < avgClickShare).

> **⚠ Two-classifier divergence to fix:** the **badge** is portfolio-relative
> (`keywordQuadrant`) while the **action** is absolute-threshold (`classify`). They
> usually agree but CAN contradict. In production pick ONE source of truth so the chip
> and the recommendation can never disagree. Also replace the synthetic per-stage market
> shares with real Brand Analytics shares (or relabel "vs your portfolio average"), and
> wire real QSS (currently randomised).

> **Monthly SQP rule:** prefer Amazon's native monthly SQP file; if you must aggregate
> weeks, **SUM counts and RECOMPUTE rates** (never average weekly %); recompute all
> portfolio/derived metrics on the monthly rows; assign each week wholly to the month of
> its Saturday; flag partial months.

---

### G. Inventory — status, replenishment, risk, capital efficiency, storage
File: `data/inventoryData.ts` · `components/InventoryOverview.tsx` · `InventoryPerformance.tsx`.

**G1. Stock status** (production rule = days-of-supply bands; demo seeds it via a scenario roll)
```
available == 0                     → Out of Stock
days-of-supply < 7                 → Critical
7 ≤ DOS < 21                       → Low Stock
21 ≤ DOS < 120                     → In Stock (healthy)
DOS ≥ 120                          → Overstock
```

**G2. Replenishment urgency buckets** (Planner Action Queue)
```
include if: status ∈ {Out of Stock, Critical} OR (Low Stock AND revenueAtRisk > 0)
Order Immediately (red)  = OOS or past ROP
Order Soon (orange)      = reorder within 14 days
Plan Ahead (yellow)      = the rest (collapsed by default)
```

**G3. Core formulas**
```
Safety Stock (King) = Z × √(LT×σ²_demand + avgDemand²×σ²_LT)   // Z: 90%1.282/95%1.645/97.5%1.96/99%2.326
DDLT = avgDailySales × leadTimeDays
ROP  = DDLT + SafetyStock                                       // WHEN to order
Ideal Inventory = adjustedWeeklySales × coverageWeeks + SafetyStock   // HOW MUCH
Reorder Qty = max(0, Ideal − Available)
daysUntilStockout = available / avgDailySales ; daysUntilReorder = − leadTimeDays
revenueAtRisk: OOS → avgDaily×30×ASP ; Critical → avgDaily×(30−DOS)×ASP ; else 0
```

**G4. Capital-efficiency bands** (Performance)
```
GMROI (annualized ×12): ≥300% green · 150–300% yellow · <150% red   // = GrossMargin% × Turns
Gross Margin:           ≥50% green · 30–50% yellow · <30% red
Demand CV:              >0.5 red (erratic) · >0.3 yellow
Dead stock:             daysOnHand > 180
```

**G5. IPI / storage-aware caps**
```
Banner if IPI < 400 OR utilization > 85% (IPI badge red < 350, amber < 400)
Soft warning: utilization 75–90% OR IPI 350–400 → qty unchanged, capacity tooltip
Hard cap:     utilization > 90% OR IPI < 350    → qty reduced to fit remaining cu ft
              (0.5 cu ft/unit; most-urgent SKUs allocated first; zero-capacity → "—")
```

---

### H. COGS coverage / Profit reliability & Product mapping
Files: `components/cogs/CoverageWorkspace.tsx` · `components/settings/ProductsSection.tsx`
· `components/home/DataFoundationCard.tsx`.

**H1. Profit reliability (COGS coverage score = % of sales with known COGS)**
```
score ≥ 90 → STRONG     "Profit reliability is strong."
60 ≤ score < 90 → PARTIAL  "{100−score}% of sales has unknown COGS — profit is partial."
score < 60 → NOT READY  "Your profit is not ready yet."
```
(Home "Profit reliability" tile tone: good ≥90 · warn ≥60 · bad otherwise.)

**H2. Product mapping status (per SKU) + coverage tier**
```
status: Brand AND Category set?  no  → needs-mapping (rose, required)
        Sub OR Tag missing?      yes → partial (amber)
        all four set             → complete (green)
coverage % = mapped (complete+partial) / total × 100
tier badge: STRONG ≥90 · PARTIAL 60–89 · NEEDS WORK <60
```

---

### I. Content Tracker — match status
File: `data/contentTrackerData.ts`. Compares live Amazon content vs source-of-truth.
```
similarity ≥ 90 → perfect
similarity ≥ 70 → partial
else            → mismatch
```
Applied both per field and to the overall product match (overallMatch %).

---

### J. Prime Day Recap — metric coloring & celebration gating
Files: `data/primeDayData.ts` (`metricChange`) · `components/PrimeDayWelcome.tsx`.

**J1. YoY metric color** (`metricChange`, polarity-driven)
```
raw = thisYear − lastYear
polarity 'higher'  → positive(green) if raw > 0, else negative(red)
polarity 'lower'   → positive(green) if raw < 0, else negative(red)
polarity 'neutral' → null → gray (never judged)
delta text: pct→"±X.Xpp" · x→"±X.XX×" · else→"±X.X%"
```

**J2. "Wrapped" welcome gating:** the celebration only fires when headline **revenue
YoY > 0** — never celebrate a flat or down event.

---

## 4. Global thresholds & constants (single source of truth to tune)

| Domain | Constant | Value | Where |
|---|---|---|---|
| Advertising | target ACOS / break-even / TACOS | 30% / 45% / 15% | B0 |
| Advertising | highSpend / noSalesSpend / highShare | €5,000 / €1,000 / 8% | B0 |
| Advertising | significant PoP delta (CPC/CVR/CTR) | 5pp | B1 |
| Scorecard | noise floor / at-risk cutoff | 1% / 5% | C |
| Severity (€) | Critical / High / Medium / Watch | ≥20k / ≥5k / ≥1k / >0 | 2.3 |
| Confidence | High / Medium / Low multiplier | 1.0 / 0.7 / 0.4 | 2.2 |
| Recovery | recoverable fraction of any gap | ½ (0.5) | 2.4 |
| ASP | Traffic / SQP | €35 / €18 | 2.4 |
| Traffic CVR | portfolio benchmark (green) | ≥12.5% | E |
| SQP action | volume hi / share hi / trend / gap | ≥8000 / ≥15% / <−3 / >15 | F3 |
| Inventory | DOS bands (Crit/Low/Healthy/Over) | 7 / 21 / 120 | G1 |
| Inventory | reorder-soon window / dead stock | 14d / 180d | G2,G4 |
| Inventory | GMROI / Gross Margin bands | 300/150 · 50/30 | G4 |
| Inventory | demand CV (red/yellow) | 0.5 / 0.3 | G4 |
| Inventory | IPI banner / soft / hard | <400 or >85% · 75–90%/350–400 · >90%/<350 | G5 |
| COGS coverage | STRONG / PARTIAL / NOT READY | 90 / 60 | H1 |
| Mapping | coverage STRONG/PARTIAL/NEEDS WORK | 90 / 60 | H2 |
| Content | perfect / partial | 90 / 70 | I |
| Sales Overview | ad-vs-organic / dependency / decline | ±10pp / 50% / €1k or −10% | A |

---

## 5. Cross-cutting production hardening (applies to most engines)

1. **Per-metric thresholds** — flat % cutoffs misfire across metrics; move Watch/At-risk
   cutoffs next to each metric's polarity.
2. **Volume / significance gate** — require a minimum absolute base (spend, clicks, orders,
   units) before a % move can raise a flag, so thin-data entities can't trip a status.
3. **Seasonality-aware baseline** — compare vs EXPECTED (same period last year, or a moving
   / z-score baseline), not raw PoP, especially around Prime Day / Q4 / launches.
4. **Impact-ranked, not %-ranked** — rank watchouts/issues by € impact so the flagged item
   is the one actually costing money.
5. **Confidence everywhere** — carry the data base through to a visible High/Med/Low tag so a
   flag built on thin data reads as low-confidence.
6. **Real benchmarks** — replace synthetic "market" stage shares (Traffic & SQP) with a real
   category benchmark or relabel "vs your portfolio average". Replace flat ASPs with real
   per-scope ASP. Make TARGETS/coverage cutoffs per-account configurable in Settings → Data.
7. **One source of truth per surface** — notably SQP, where the badge and the action must be
   driven by the same classifier (see F).
