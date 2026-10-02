'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProjectSearchParams } from '../model/project-query';
import { useTranslations } from 'next-intl';

export function ProjectFilters({
  values,
  compact = false,
  cities,
}: {
  values: ProjectSearchParams;
  compact?: boolean;
  cities?: { id: string; name: string }[];
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
        {!compact && <FilterFields values={values} cities={cities} />}
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
              <FilterFields values={values} cities={cities} />
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function FilterFields({
  values,
  cities,
}: {
  values: ProjectSearchParams;
  cities?: { id: string; name: string }[];
}) {
  const t = useTranslations('BuyerCore');
  const catalogText = useTranslations('OpenCatalog');
  const profile = useTranslations('Profile');
  const [locationChanged, setLocationChanged] = useState(false);
  const [currencyRequired, setCurrencyRequired] = useState(
    Boolean(
      values.minPrice ||
      values.maxPrice ||
      values.maxMonthlyPayment ||
      values.sort === 'PRICE_ASC' ||
      values.sort === 'PRICE_DESC',
    ),
  );
  function updateCurrencyRequirement(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const form = event.currentTarget.form;
    if (!form) return;
    const data = new FormData(form);
    setCurrencyRequired(
      ['minPrice', 'maxPrice', 'maxMonthlyPayment'].some(
        (key) => String(data.get(key) ?? '').trim() !== '',
      ) || ['PRICE_ASC', 'PRICE_DESC'].includes(String(data.get('sort'))),
    );
  }
  return (
    <>
      {cities && (
        <label>
          <span>{catalogText('city')}</span>
          <select
            name="provinceId"
            defaultValue={values.provinceId ?? ''}
            onChange={(event) =>
              setLocationChanged(
                event.currentTarget.value !== (values.provinceId ?? ''),
              )
            }
          >
            <option value="">{t('all')}</option>
            {values.provinceId &&
              !cities.some((city) => city.id === values.provinceId) && (
                <option value={values.provinceId}>{values.provinceId}</option>
              )}
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="filter-search">
        <span>{t('locationOrProject')}</span>
        <input
          name="q"
          defaultValue={values.q}
          placeholder={t('searchPlaceholder')}
        />
      </label>
      <label>
        <span>{profile('currency')}</span>
        <select
          name="currency"
          defaultValue={values.currency ?? ''}
          required={currencyRequired}
        >
          <option value="">{t('all')}</option>
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
        </select>
      </label>
      <label>
        <span>{t('minPrice')}</span>
        <input
          name="minPrice"
          onChange={updateCurrencyRequirement}
          inputMode="decimal"
          defaultValue={values.minPrice}
          placeholder="5000000"
        />
      </label>
      <label>
        <span>{t('maxPrice')}</span>
        <input
          name="maxPrice"
          onChange={updateCurrencyRequirement}
          inputMode="decimal"
          defaultValue={values.maxPrice}
          placeholder="10000000"
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
          onChange={updateCurrencyRequirement}
          inputMode="decimal"
          defaultValue={values.maxMonthlyPayment}
          placeholder="300000"
        />
      </label>
      <label className={cities ? 'catalog-filter-sort' : undefined}>
        <span>{t('sort')}</span>
        <select
          name="sort"
          defaultValue={values.sort ?? 'NEWEST'}
          onChange={updateCurrencyRequirement}
        >
          <option value="NEWEST">{t('newest')}</option>
          <option value="PRICE_ASC">{t('priceAsc')}</option>
          <option value="PRICE_DESC">{t('priceDesc')}</option>
          <option value="DELIVERY_ASC">{t('deliveryAsc')}</option>
        </select>
      </label>
      {(
        [
          'bounds',
          'provinceId',
          'districtId',
          'deliveryReady',
          'status',
          'minNetArea',
          'amenities',
        ] as const
      ).map((key) =>
        values[key] &&
        !(key === 'provinceId' && cities) &&
        !(locationChanged && (key === 'districtId' || key === 'bounds')) ? (
          <input key={key} type="hidden" name={key} value={values[key]} />
        ) : null,
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
