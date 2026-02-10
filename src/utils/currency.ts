import { CURRENCY_SYMBOLS, CONVERSION_RATES, type Currency } from '../contexts/CurrencyContext';

export function convert(eurValue: number, currency: Currency): number {
  return eurValue * CONVERSION_RATES[currency];
}

export function formatNumber(value: number, decimals = 2): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (Number.isInteger(value) && Math.abs(value) < 100) {
    return value.toFixed(decimals);
  }
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function fc(eurValue: number, currency: Currency, opts?: { decimals?: number; compact?: boolean }): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const converted = convert(eurValue, currency);
  const compact = opts?.compact ?? true;
  const decimals = opts?.decimals;

  if (compact) {
    if (Math.abs(converted) >= 1000000) {
      return `${symbol}${(converted / 1000000).toFixed(decimals ?? 1)}M`;
    }
    if (Math.abs(converted) >= 1000) {
      return `${symbol}${(converted / 1000).toFixed(decimals ?? 1)}k`;
    }
  }

  return `${symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 2,
  })}`;
}

export function fcRaw(eurValue: number, currency: Currency): number {
  return convert(eurValue, currency);
}

export function tickFmt(currency: Currency): (v: number) => string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const rate = CONVERSION_RATES[currency];
  return (v: number) => {
    const c = v * rate;
    if (Math.abs(c) >= 1000000) return `${symbol}${(c / 1000000).toFixed(1)}M`;
    if (Math.abs(c) >= 1000) return `${symbol}${(c / 1000).toFixed(0)}k`;
    return `${symbol}${c.toFixed(0)}`;
  };
}
