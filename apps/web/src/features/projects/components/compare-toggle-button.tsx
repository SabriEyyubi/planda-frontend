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
    const frame = requestAnimationFrame(() =>
      setIds(readCompareIds(localStorage.getItem(COMPARE_STORAGE_KEY))),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = toggleCompareId(ids, projectId);
    if (!selected && next.length === ids.length) {
      window.location.assign(`/${locale}/compare?limit=1`);
      return;
    }
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
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
