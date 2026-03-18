'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

// current tick count
const TickerContext = createContext<number | undefined>(undefined);

export function GlobalTickerProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <TickerContext.Provider value={tick}>{children}</TickerContext.Provider>
  );
}

export function useTick(): number {
  const context = useContext(TickerContext);
  if (typeof context === 'undefined') {
    throw new Error('useTick must be used within GlobalTickerProvider');
  }
  return context;
}
