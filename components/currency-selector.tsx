'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { currencies, type CurrencyCode } from '@/lib/currency';

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode;
  userId: string;
}

export function CurrencySelector({ currentCurrency, userId }: CurrencySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleCurrencyChange(newCurrency: CurrencyCode) {
    setIsLoading(true);
    try {
      await fetch('/api/user/currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currency: newCurrency }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <select 
      value={currentCurrency} 
      onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
      disabled={isLoading}
      className="px-3 py-2 border rounded-md bg-background"
    >
      {Object.values(currencies).map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.name} ({c.code})
        </option>
      ))}
    </select>
  );
}
