'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  COMPARE_STORAGE_KEY,
  MAX_COMPARE_PROJECTS,
  readCompareIds,
  toggleCompareId,
} from '../model/compare-storage';

export function CompareToggleButton({ projectId }: { projectId: string }) {
  const t = useTranslations('ProjectDetail');
  const locale = useLocale();
  const [ids, setIds] = useState<string[]>([]);
  const selected = ids.includes(projectId);

  useEffect(() => {
    const sync = () => {
      try {
        setIds(readCompareIds(localStorage.getItem(COMPARE_STORAGE_KEY)));
      } catch {
        /* Storage may be unavailable. */
      }
    };
    const changed = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail;
      if (Array.isArray(detail)) setIds(readCompareIds(JSON.stringify(detail)));
    };
    const frame = requestAnimationFrame(sync);
    window.addEventListener('storage', sync);
    window.addEventListener('planda:compare-change', changed);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('storage', sync);
      window.removeEventListener('planda:compare-change', changed);
    };
  }, []);

  function toggle() {
    let current = ids;
    try {
      current = readCompareIds(localStorage.getItem(COMPARE_STORAGE_KEY));
    } catch {
      /* Use current in-memory selection. */
    }
    const next = toggleCompareId(current, projectId);
    if (!current.includes(projectId) && next.length === current.length) {
      window.location.assign(`/${locale}/compare?limit=1`);
      return;
    }
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Keep same-page selection functional. */
    }
    setIds(next);
    window.dispatchEvent(
      new CustomEvent('planda:compare-change', { detail: next }),
    );
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={selected}>
      {selected ? `✓ ${t('comparing')}` : `⇄ ${t('compare')}`}
      <span className="sr-only"> (en fazla {MAX_COMPARE_PROJECTS})</span>
    </button>
  );
}
