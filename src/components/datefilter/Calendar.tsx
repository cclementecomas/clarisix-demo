import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarProps {
  month: number;
  year: number;
  selectedDate: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export default function Calendar({
  month, year, selectedDate, rangeStart, rangeEnd,
  onSelectDate, onPrevMonth, onNextMonth,
}: CalendarProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  while (weeks[weeks.length - 1].length < 7) {
    weeks[weeks.length - 1].push(null);
  }

  return (
    <div className="px-2">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-dashed border-cx-300/50 text-cx-500 hover:border-cx-400 hover:text-cx-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="font-semibold text-gray-800 text-base">{MONTH_NAMES[month]}</div>
          <div className="text-sm font-medium text-orange-400">{year}</div>
        </div>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-dashed border-cx-300/50 text-cx-500 hover:border-cx-400 hover:text-cx-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="space-y-0.5">
        {weeks.map((week, wi) => {
          const hasRange = week.some(d => {
            if (!d) return false;
            const date = new Date(year, month, d);
            return isInRange(date, rangeStart, rangeEnd);
          });

          return (
            <div
              key={wi}
              className={`grid grid-cols-7 rounded-lg transition-colors ${hasRange ? 'bg-cx-100/60' : ''}`}
            >
              {week.map((day, di) => {
                if (!day) return <div key={di} />;

                const date = new Date(year, month, day);
                const isSelected = isSameDay(date, selectedDate);
                const inRange = isInRange(date, rangeStart, rangeEnd);

                return (
                  <button
                    key={di}
                    onClick={() => onSelectDate(date)}
                    className={`
                      h-9 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all
                      ${isSelected
                        ? 'bg-cx-300 text-white shadow-sm'
                        : inRange
                          ? 'text-cx-500 hover:bg-cx-200/60'
                          : 'text-gray-500 hover:bg-gray-100'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
