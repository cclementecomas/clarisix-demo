interface QuickFiltersProps {
  selected: string;
  onSelect: (value: string) => void;
}

const ROWS = [
  ['Today', 'Week to date', 'Month to date', 'Year to date'],
  ['Yesterday', 'Last week', 'Last month', 'Last year'],
  ['BFCM2025', 'BFCM2024', 'BFCM2023', 'BFCM2022'],
];

export default function QuickFilters({ selected, onSelect }: QuickFiltersProps) {
  const renderBtn = (label: string, fullWidth = false) => {
    const isActive = selected === label;
    return (
      <button
        key={label}
        onClick={() => onSelect(label)}
        className={`
          px-3 py-2.5 text-sm font-medium rounded-lg transition-all text-center flex items-center justify-center
          ${fullWidth ? 'w-full' : ''}
          ${isActive
            ? 'bg-cx-500 text-white shadow-sm'
            : 'border-2 border-dashed border-gray-200 text-gray-500 hover:border-cx-300 hover:text-cx-600'
          }
        `}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      {ROWS.map((row, i) => (
        <div key={i} className="grid grid-cols-4 gap-2">
          {row.map(label => renderBtn(label))}
        </div>
      ))}
      <div>
        {renderBtn('All time', true)}
      </div>
    </div>
  );
}
