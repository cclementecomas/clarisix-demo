import { useMemo } from 'react';

function formatRefreshTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `Today at ${h}:${m} ${ampm}`;

  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()} at ${h}:${m} ${ampm}`;
}

interface LastRefreshedProps {
  className?: string;
  offsetMinutes?: number;
}

export default function LastRefreshed({ className = '', offsetMinutes = 14 }: LastRefreshedProps) {
  const lastRefreshed = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - offsetMinutes);
    return d;
  }, [offsetMinutes]);

  return (
    <span className={`text-[11px] text-gray-400 tracking-wide ${className}`}>
      Last refreshed: {formatRefreshTime(lastRefreshed)}
    </span>
  );
}
