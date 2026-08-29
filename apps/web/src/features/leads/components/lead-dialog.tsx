'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { leadConsentConfig, type LeadConsentConfig } from '@/lib/config/public';

export function LeadDialog({
  projectId,
  projectName,
  consentConfig = leadConsentConfig,
}: {
  projectId: string;
  projectName: string;
  consentConfig?: LeadConsentConfig | null;
}) {
  const dialogId = useId();
  const locale = useLocale();
  const t = useTranslations('BuyerCore');
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const idempotencyKeyRef = useRef<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const openFromExternalCta = () => setOpen(true);
    window.addEventListener(
      `planda:open-lead:${projectId}`,
      openFromExternalCta,
    );
    return () =>
      window.removeEventListener(
        `planda:open-lead:${projectId}`,
        openFromExternalCta,
      );
  }, [projectId]);

  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
      opener?.focus();
    };
  }, [open]);

  function trapFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return;
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>(
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consentConfig) {
      setStatus('error');
      setMessage(t('policyMissing'));
      return;
    }
    setStatus('submitting');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: form.get('fullName'),
      phone: form.get('phone'),
      email: form.get('email') || undefined,
      preferredLanguage: form.get('preferredLanguage'),
      unitPreference: form.get('unitPreference') || undefined,
      budgetMax: form.get('budgetMax') || undefined,
      currency: 'TRY',
      consentToDeveloper: form.get('consent') === 'on',
      consentVersion: consentConfig.version,
    };
    try {
      idempotencyKeyRef.current ??= crypto.randomUUID();
      const response = await fetch(`/api/projects/${projectId}/leads`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': idempotencyKeyRef.current,
        },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        setStatus('error');
        setMessage(t('authRequired'));
        return;
      }
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as {
          code?: string;
          requestId?: string;
        } | null;
        setStatus('error');
        setMessage(
          response.status === 429
            ? t('rateLimited')
            : response.status === 409
              ? t('duplicateLead')
              : `${t('leadFailed')}${error?.requestId ? ` (${error.requestId})` : ''}`,
        );
        return;
      }
      idempotencyKeyRef.current = undefined;
      setStatus('success');
    } catch {
      setStatus('error');
      setMessage(t('leadUnavailable'));
    }
  }

  return (
    <>
      <button
        ref={openerRef}
        className="button button--wide"
        type="button"
        onClick={() => setOpen(true)}
      >
        {t('contactSales')}
      </button>
      {open && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setOpen(false)}
        >
          <section
            ref={dialogRef}
            aria-labelledby={dialogId}
            aria-modal="true"
            className="lead-dialog"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={trapFocus}
          >
            <button
              ref={closeButtonRef}
              className="dialog-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('closeContact')}
            >
              ×
            </button>
            {status === 'success' ? (
              <div
                className="success-state"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="success-state__icon" aria-hidden="true">
                  ✓
                </span>
                <h2 id={dialogId}>{t('leadReceived')}</h2>
                <p>{t('leadReceivedDescription', { projectName })}</p>
                <button
                  className="button"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {t('done')}
                </button>
              </div>
            ) : (
              <>
                <span className="eyebrow">{projectName}</span>
                <h2 id={dialogId}>{t('leadTitle')}</h2>
                <p className="muted">{t('leadDescription')}</p>
                <form
                  className="lead-form"
                  onSubmit={submit}
                  aria-busy={status === 'submitting'}
                >
                  <label>
                    <span>{t('fullName')}</span>
                    <input
                      name="fullName"
                      autoComplete="name"
                      minLength={2}
                      required
                    />
                  </label>
                  <label>
                    <span>{t('phone')}</span>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+90 5__ ___ __ __"
                      required
                    />
                  </label>
                  <label>
                    <span>{t('emailOptional')}</span>
                    <input name="email" type="email" autoComplete="email" />
                  </label>
                  <label>
                    <span>{t('preferredLanguage')}</span>
                    <select name="preferredLanguage" defaultValue="TR">
                      <option value="TR">Türkçe</option>
                      <option value="EN">English</option>
                      <option value="AR">العربية</option>
                      <option value="RU">Русский</option>
                    </select>
                  </label>
                  <label>
                    <span>{t('unitPreference')}</span>
                    <select name="unitPreference" defaultValue="">
                      <option value="">{t('anyUnit')}</option>
                      <option>1+1</option>
                      <option>2+1</option>
                      <option>3+1</option>
                    </select>
                  </label>
                  <label>
                    <span>{t('budgetOptional')}</span>
                    <input
                      name="budgetMax"
                      inputMode="decimal"
                      placeholder="12000000"
                    />
                  </label>
                  <label className="consent-field">
                    <input
                      name="consent"
                      type="checkbox"
                      required={Boolean(consentConfig)}
                      disabled={!consentConfig}
                    />
                    <span>
                      {consentConfig ? (
                        <>
                          {t('consentText', { projectName })}{' '}
                          <a
                            href={consentConfig.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('legalText')}
                          </a>
                        </>
                      ) : (
                        t('consentPending')
                      )}
                    </span>
                  </label>
                  {!consentConfig && (
                    <p
                      className="privacy-callout lead-policy-state"
                      role="status"
                    >
                      {t('consentDisabled')}
                    </p>
                  )}
                  {status === 'error' && (
                    <div
                      className="form-error"
                      role="alert"
                      id={`${dialogId}-error`}
                    >
                      <p>{message}</p>
                      {message.includes('giriş yapmanız') && (
                        <a
                          href={`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`}
                        >
                          {t('signIn')}
                        </a>
                      )}
                    </div>
                  )}
                  <button
                    className="button button--wide"
                    type="submit"
                    disabled={status === 'submitting' || !consentConfig}
                    aria-describedby={
                      status === 'error' ? `${dialogId}-error` : undefined
                    }
                  >
                    {status === 'submitting' ? t('sendingLead') : t('sendLead')}
                  </button>
                  <span className="sr-only" role="status" aria-live="polite">
                    {status === 'submitting' ? t('sendingLead') : ''}
                  </span>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
