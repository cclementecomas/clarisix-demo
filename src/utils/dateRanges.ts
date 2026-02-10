export interface DateRange {
  start: Date;
  end: Date;
}

export type CompareMode = 'pop' | 'ly' | 'custom';

export interface DateFilterResult {
  primary: DateRange;
  compare: DateRange;
  compareMode: CompareMode;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return startOfDay(r);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function previousPeriod(range: DateRange): DateRange {
  const days = diffDays(range.start, range.end) + 1;
  return {
    start: subDays(range.start, days),
    end: subDays(range.start, 1),
  };
}

function lastYearPeriod(range: DateRange): DateRange {
  return {
    start: new Date(range.start.getFullYear() - 1, range.start.getMonth(), range.start.getDate()),
    end: new Date(range.end.getFullYear() - 1, range.end.getMonth(), range.end.getDate()),
  };
}

export function resolveCompare(primary: DateRange, mode: CompareMode, custom?: DateRange): DateRange {
  if (mode === 'ly') return lastYearPeriod(primary);
  if (mode === 'custom' && custom) return custom;
  return previousPeriod(primary);
}

export function resolveQuickPreset(preset: string, compareMode: CompareMode = 'pop', customCompare?: DateRange): DateFilterResult {
  const today = startOfDay(new Date());
  let primary: DateRange;

  switch (preset) {
    case 'Today':
      primary = { start: today, end: today };
      break;
    case 'Yesterday':
      primary = { start: subDays(today, 1), end: subDays(today, 1) };
      break;
    case 'Week to date':
      primary = { start: startOfWeek(today), end: today };
      break;
    case 'Last week': {
      const lastWeekEnd = subDays(startOfWeek(today), 1);
      primary = { start: startOfWeek(lastWeekEnd), end: lastWeekEnd };
      break;
    }
    case 'Month to date':
      primary = { start: startOfMonth(today), end: today };
      break;
    case 'Last month': {
      const prevMonthEnd = subDays(startOfMonth(today), 1);
      primary = { start: startOfMonth(prevMonthEnd), end: prevMonthEnd };
      break;
    }
    case 'Year to date':
      primary = { start: startOfYear(today), end: today };
      break;
    case 'Last year': {
      const ly = today.getFullYear() - 1;
      primary = { start: new Date(ly, 0, 1), end: new Date(ly, 11, 31) };
      break;
    }
    case 'BFCM2025':
      primary = { start: new Date(2025, 10, 28), end: new Date(2025, 11, 1) };
      break;
    case 'BFCM2024':
      primary = { start: new Date(2024, 10, 29), end: new Date(2024, 11, 2) };
      break;
    case 'BFCM2023':
      primary = { start: new Date(2023, 10, 24), end: new Date(2023, 10, 27) };
      break;
    case 'BFCM2022':
      primary = { start: new Date(2022, 10, 25), end: new Date(2022, 10, 28) };
      break;
    case 'All time':
      primary = { start: new Date(2022, 0, 1), end: today };
      break;
    default:
      primary = { start: subDays(today, 29), end: today };
  }

  return { primary, compare: resolveCompare(primary, compareMode, customCompare), compareMode };
}

export function resolveRelativeFilter(value: number, unit: string, compareMode: CompareMode = 'pop', customCompare?: DateRange): DateFilterResult {
  const today = startOfDay(new Date());
  let start: Date;

  switch (unit) {
    case 'weeks':
      start = subDays(today, value * 7 - 1);
      break;
    case 'months': {
      start = new Date(today);
      start.setMonth(start.getMonth() - value);
      start.setDate(start.getDate() + 1);
      break;
    }
    case 'years': {
      start = new Date(today);
      start.setFullYear(start.getFullYear() - value);
      start.setDate(start.getDate() + 1);
      break;
    }
    default:
      start = subDays(today, value - 1);
  }

  const primary: DateRange = { start, end: today };
  return { primary, compare: resolveCompare(primary, compareMode, customCompare), compareMode };
}

export function resolveCustomRange(rangeStart: Date, rangeEnd: Date, compareMode: CompareMode = 'pop', customCompare?: DateRange): DateFilterResult {
  const primary: DateRange = { start: startOfDay(rangeStart), end: startOfDay(rangeEnd) };
  return { primary, compare: resolveCompare(primary, compareMode, customCompare), compareMode };
}

export function formatDateShort(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yr = String(d.getFullYear()).slice(2);
  return `${months[d.getMonth()]} ${d.getDate()}, ${yr}`;
}
