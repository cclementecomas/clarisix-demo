// Small display formatters for the Search Funnel / Keyword Portfolio pages.
export const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
/** pp with one decimal and NO negative zero ("-0.0pp" → "0.0pp"). */
export const pp = (x: number) => { const r = +x.toFixed(1) || 0; return `${r > 0 ? '+' : ''}${r.toFixed(1)}pp`; };
export const eur = (x: number) => `€${Math.round(x).toLocaleString()}`;
export const int = (x: number) => Math.round(x).toLocaleString();
/** Counts ≥ 10,000 abbreviated (440k, 4.3M); smaller shown in full. */
export const abbrev = (x: number) => {
  const n = Math.round(x);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`;
  return n.toLocaleString();
};
export const money = (x: number | null) => (x == null ? '—' : `€${x.toFixed(2)}`);
export const weekLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
