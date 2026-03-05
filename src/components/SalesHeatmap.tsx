// ─── Monthly Performance Heatmap ─────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const HEATMAP_ROWS: { year: number; values: (number | null)[] }[] = [
  { year: 2025, values: [  5,  9, -2,   9,  13,  20,  28,  11,  15,  21,  25,  30] },
  { year: 2026, values: [ 11,  7, 14, null, null, null, null, null, null, null, null, null] },
];

function getColor(pct: number | null): { bg: string; text: string } {
  if (pct === null) return { bg: '#F3F4F6', text: '#9CA3AF' };
  if (pct < -20) return { bg: '#EF4444', text: '#fff' };
  if (pct < -12) return { bg: '#F87171', text: '#fff' };
  if (pct <  -6) return { bg: '#FCA5A5', text: '#7f1d1d' };
  if (pct <  -1) return { bg: '#FECACA', text: '#7f1d1d' };
  if (pct <=  1) return { bg: '#E5E7EB', text: '#6B7280' };
  if (pct <   8) return { bg: '#86EFAC', text: '#14532d' };
  if (pct <  16) return { bg: '#4ADE80', text: '#14532d' };
  if (pct <  26) return { bg: '#22C55E', text: '#fff' };
  return               { bg: '#16A34A', text: '#fff' };
}

const LEGEND_STEPS = [-25, -16, -9, -3, 0, 4, 12, 20, 30];

export default function SalesHeatmap() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-6 w-full">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
        Monthly Performance Heatmap
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr>
              <th className="text-left text-gray-400 text-xs font-semibold pb-3 w-16">Year</th>
              {MONTHS.map((m) => (
                <th key={m} className="text-center text-gray-400 text-xs font-semibold pb-3">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEATMAP_ROWS.map((row) => (
              <tr key={row.year}>
                <td className="text-gray-500 text-xs font-semibold py-1.5 pr-4">{row.year}</td>
                {row.values.map((pct, mi) => {
                  const { bg, text } = getColor(pct);
                  return (
                    <td key={mi} className="py-1.5 px-1">
                      <div
                        className="rounded-lg h-9 flex items-center justify-center text-[11px] font-semibold hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: bg, color: text }}
                        title={pct !== null ? `${pct > 0 ? '+' : ''}${pct}%` : 'No data'}
                      >
                        {pct !== null ? `${pct > 0 ? '+' : ''}${pct}%` : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        <span className="text-gray-400 text-xs mr-1">Negative</span>
        {LEGEND_STEPS.map((pct) => {
          const { bg } = getColor(pct);
          return <div key={pct} className="w-7 h-5 rounded-full" style={{ backgroundColor: bg }} />;
        })}
        <span className="text-gray-400 text-xs ml-1">Positive</span>
      </div>
    </div>
  );
}
