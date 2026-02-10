import { useState, useEffect } from 'react';

export function useSimulatedLoading(delay = 800): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return loading;
}
