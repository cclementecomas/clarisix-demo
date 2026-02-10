interface SelectionStatsProps {
  values: number[];
}

export default function SelectionStats({ values }: SelectionStatsProps) {
  if (values.length === 0) return null;

  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1000) {
      return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  const stats = [
    { label: 'Count', value: count.toString() },
    { label: 'Sum', value: fmt(sum) },
    { label: 'Average', value: fmt(avg) },
    { label: 'Min', value: fmt(min) },
    { label: 'Max', value: fmt(max) },
  ];

  return (
    <div className="flex items-center gap-1 text-xs animate-in fade-in">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 mx-0.5">|</span>}
          <span className="text-gray-500 font-medium">{s.label}:</span>
          <span className="text-gray-800 font-semibold tabular-nums">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
