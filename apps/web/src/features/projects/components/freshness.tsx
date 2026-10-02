'use client';

import { useEffect, useState } from 'react';
import { isStockCurrent } from '../model/project-presentation';
export function Freshness({
  value,
  label,
  locale,
}: {
  value: string | null;
  label: string;
  locale: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const timestamp = value ? Date.parse(value) : NaN;
  const valid =
    Number.isFinite(timestamp) && (now === null || timestamp <= now);
  return (
    <span className="data-freshness">
      {label}:{' '}
      {valid ? (
        <>
          <time dateTime={value!}>
            {new Intl.DateTimeFormat(locale, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(timestamp)}
          </time>
          {now !== null && !isStockCurrent(value, now) && ' · 48 saati aştı'}
        </>
      ) : (
        'Tarih paylaşılmadı'
      )}
    </span>
  );
}
