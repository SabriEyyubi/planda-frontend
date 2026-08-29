'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProjectSearchParams } from '../model/project-query';
import { useTranslations } from 'next-intl';

export function ProjectFilters({
  values,
  compact = false,
}: {
  values: ProjectSearchParams;
  compact?: boolean;
}) {
  const t = useTranslations('BuyerCore');
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      opener?.focus();
    };
  }, [open]);

  function handleSheetKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [
      ...(sheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])',
      ) ?? []),
    ];
    if (!focusable.length) return;
    const first = focusable[0]!;
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <form
        className={`project-filter-form project-filter-form--desktop ${compact ? 'project-filter-form--compact' : ''}`}
        method="get"
      >
        {!compact && <FilterFields values={values} />}
      </form>
      <div
        className={`mobile-filter-controls ${compact ? 'mobile-filter-controls--map' : ''}`}
      >
        <button
          ref={openerRef}
          className="button button--secondary"
          type="button"
          onClick={() => setOpen(true)}
        >
          {t('filters')}
        </button>
        <span>{t('activeFilters', { count: countFilters(values) })}</span>
      </div>
      {open && (
        <div
          className={`filter-sheet-backdrop ${compact ? 'filter-sheet-backdrop--map' : ''}`}
          onMouseDown={() => setOpen(false)}
        >
          <section
            ref={sheetRef}
            className="filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-sheet-title"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={handleSheetKeyDown}
          >
            <header>
              <h2 id="filter-sheet-title">{t('filters')}</h2>
              <button
                ref={closeRef}
                type="button"
                aria-label={t('closeFilters')}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>
            <form
              className="project-filter-form project-filter-form--sheet"
              method="get"
            >
              <FilterFields values={values} />
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function FilterFields({ values }: { values: ProjectSearchParams }) {
  const t = useTranslations('BuyerCore');
  return (
    <>
      <label className="filter-search">
        <span>{t('locationOrProject')}</span>
        <input
          name="q"
          defaultValue={values.q}
          placeholder="İstanbul, ilçe veya proje"
        />
      </label>
      <label>
        <span>{t('minPrice')}</span>
        <input
          name="minPrice"
          inputMode="decimal"
          defaultValue={values.minPrice}
          placeholder="₺5.000.000"
        />
      </label>
      <label>
        <span>{t('maxPrice')}</span>
        <input
          name="maxPrice"
          inputMode="decimal"
          defaultValue={values.maxPrice}
          placeholder="₺10.000.000"
        />
      </label>
      <label>
        <span>{t('rooms')}</span>
        <select name="roomType" defaultValue={values.roomType ?? ''}>
          <option value="">{t('all')}</option>
          <option value="1+1">1+1</option>
          <option value="2+1">2+1</option>
          <option value="3+1">3+1</option>
          <option value="4+1">4+1</option>
        </select>
      </label>
      <label>
        <span>{t('deliveryBefore')}</span>
        <input
          name="deliveryBefore"
          type="date"
          defaultValue={values.deliveryBefore}
        />
      </label>
      <label>
        <span>{t('maxDownPayment')}</span>
        <input
          name="maxDownPaymentPercent"
          inputMode="decimal"
          defaultValue={values.maxDownPaymentPercent}
          placeholder="30"
        />
      </label>
      <label>
        <span>{t('maxMonthly')}</span>
        <input
          name="maxMonthlyPayment"
          inputMode="decimal"
          defaultValue={values.maxMonthlyPayment}
          placeholder="₺300.000"
        />
      </label>
      <label>
        <span>{t('sort')}</span>
        <select name="sort" defaultValue={values.sort ?? 'NEWEST'}>
          <option value="NEWEST">{t('newest')}</option>
          <option value="PRICE_ASC">{t('priceAsc')}</option>
          <option value="PRICE_DESC">{t('priceDesc')}</option>
          <option value="DELIVERY_ASC">{t('deliveryAsc')}</option>
        </select>
      </label>
      {values.bounds && (
        <input type="hidden" name="bounds" value={values.bounds} />
      )}
      <div className="filter-actions">
        <a href="?">{t('clearAll')}</a>
        <button className="button" type="submit">
          {t('showProjects')}
        </button>
      </div>
    </>
  );
}

function countFilters(values: ProjectSearchParams) {
  return Object.entries(values).filter(
    ([key, value]) =>
      value && key !== 'sort' && key !== 'limit' && key !== 'cursor',
  ).length;
}
