'use client';

import { useEffect, useRef, useState } from 'react';
import { paymentEstimate } from '../model/payment-estimate';
import type { PaymentPlan } from '../model/project';
import { useLocale, useTranslations } from 'next-intl';

export function PaymentPlanSheet({
  plan,
  startingPrice,
  currency,
}: {
  plan: PaymentPlan;
  startingPrice: string;
  currency: string;
}) {
  const locale = useLocale();
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  const [open, setOpen] = useState(false);
  const t = useTranslations('ProjectDetail');
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const price = Number(startingPrice);
  const estimate = paymentEstimate(
    {
      roomType: '',
      startingPrice,
      currency,
      availableCount: 1,
      minNetArea: '0',
      maxNetArea: '0',
    },
    plan,
    currency,
  );
  const downPayment = estimate?.downPayment ?? 0;
  const deliveryPayment = estimate?.deliveryPayment ?? 0;
  const monthly = estimate?.monthly ?? 0;

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
        'button:not([disabled]), a[href]',
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
      <button
        ref={openerRef}
        className="plan-detail-button"
        type="button"
        onClick={() => setOpen(true)}
      >
        {t('viewPlan')}
      </button>
      {open && (
        <div
          className="filter-sheet-backdrop"
          onMouseDown={() => setOpen(false)}
        >
          <section
            ref={sheetRef}
            className="payment-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`plan-${plan.id}`}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={handleSheetKeyDown}
          >
            <button
              ref={closeRef}
              className="dialog-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('closePlan')}
            >
              ×
            </button>
            <span className="eyebrow">{t('exampleCalculation')}</span>
            <h2 id={`plan-${plan.id}`}>
              {plan.name} — %{plan.downPaymentPercent} + {plan.termMonths} ay
            </h2>
            <p>
              {money.format(price)} başlangıç fiyatı üzerinden bilgilendirme
              amaçlıdır.
            </p>
            {estimate ? (
              <dl>
                <div>
                  <dt>{t('today')}</dt>
                  <dd>{money.format(downPayment)}</dd>
                </div>
                <div>
                  <dt>{t('monthly')}</dt>
                  <dd>
                    {plan.termMonths
                      ? `${money.format(monthly)} / ay`
                      : t('noInstallments')}
                  </dd>
                </div>
                <div>
                  <dt>{t('onDelivery')}</dt>
                  <dd>{money.format(deliveryPayment)}</dd>
                </div>
                <div>
                  <dt>{t('total')}</dt>
                  <dd>{money.format(price)}</dd>
                </div>
              </dl>
            ) : (
              <p role="status">
                Ödeme takvimi eksik veya tutarsız. Satış ofisinden güncel planı
                isteyin.
              </p>
            )}
            <p className="privacy-callout">{t('calculationDisclaimer')}</p>
          </section>
        </div>
      )}
    </>
  );
}
