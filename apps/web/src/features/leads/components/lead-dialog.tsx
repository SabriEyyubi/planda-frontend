'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { leadConsentConfig, type LeadConsentConfig } from '@/lib/config/public';

export type LeadContext = {
  unitPreference?: string;
  paymentPlanId?: string;
  paymentPlanName?: string;
  message?: string;
  currency?: string;
};

export function LeadDialog({
  projectId,
  projectName,
  consentConfig = leadConsentConfig,
  context = {},
}: {
  projectId: string;
  projectName: string;
  consentConfig?: LeadConsentConfig | null;
  context?: LeadContext;
}) {
  const dialogId = useId();
  const locale = useLocale();
  const t = useTranslations('BuyerCore');
  const profile = useTranslations('Profile');
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const idempotencyKeyRef = useRef<string | undefined>(undefined);
  const pendingPayloadRef = useRef<string | undefined>(undefined);
  const [authRequired, setAuthRequired] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [draft, setDraft] = useState<LeadContext>(context);
  const draftKey = `planda:lead-context:${projectId}`;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null');
        sessionStorage.removeItem(draftKey);
        if (
          saved &&
          Date.now() - saved.at < 30 * 60 * 1000 &&
          typeof saved.context === 'object'
        ) {
          setDraft(saved.context);
          setOpen(true);
        }
      } catch {
        /* Storage is optional. */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [draftKey]);

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
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
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
      currency: form.get('currency'),
      consentToDeveloper: form.get('consent') === 'on',
      consentVersion: consentConfig.version,
      paymentPlanId: draft.paymentPlanId || undefined,
      message: form.get('message') || undefined,
    };
    try {
      setAuthRequired(false);
      pendingPayloadRef.current ??= JSON.stringify(payload);
      idempotencyKeyRef.current ??= crypto.randomUUID();
      const response = await fetch(`/api/projects/${projectId}/leads`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': idempotencyKeyRef.current,
        },
        body: pendingPayloadRef.current,
      });
      if (response.status === 401) {
        setStatus('error');
        setAuthRequired(true);
        setUncertain(false);
        pendingPayloadRef.current = undefined;
        idempotencyKeyRef.current = undefined;
        setMessage(t('authRequired'));
        return;
      }
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as {
          code?: string;
          requestId?: string;
        } | null;
        setStatus('error');
        if (response.status >= 500) {
          setUncertain(true);
          setMessage(t('submissionUncertain'));
        } else {
          pendingPayloadRef.current = undefined;
          idempotencyKeyRef.current = undefined;
          setUncertain(false);
          setMessage(
            response.status === 429
              ? t('rateLimited')
              : error?.code === 'LEAD_CONSENT_VERSION_MISMATCH'
                ? t('consentChanged')
                : error?.code === 'IDEMPOTENCY_KEY_REUSED'
                  ? t('requestChanged')
                  : `${t('leadFailed')}${error?.requestId ? ` (${error.requestId})` : ''}`,
          );
        }
        return;
      }
      idempotencyKeyRef.current = undefined;
      pendingPayloadRef.current = undefined;
      setUncertain(false);
      setStatus('success');
    } catch {
      setStatus('error');
      setUncertain(true);
      setMessage(t('submissionUncertain'));
    }
  }

  return (
    <>
      <button
        ref={openerRef}
        className="button button--wide"
        type="button"
        onClick={() => {
          if (!uncertain) setDraft(context);
          setOpen(true);
        }}
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
                  <fieldset
                    disabled={uncertain || status === 'submitting'}
                    style={{
                      border: 0,
                      padding: 0,
                      margin: 0,
                      display: 'contents',
                    }}
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
                      <select
                        name="unitPreference"
                        defaultValue={draft.unitPreference ?? ''}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            unitPreference: event.target.value,
                          })
                        }
                      >
                        <option value="">{t('anyUnit')}</option>
                        <option>1+1</option>
                        <option>2+1</option>
                        <option>3+1</option>
                        {draft.unitPreference &&
                          !['1+1', '2+1', '3+1'].includes(
                            draft.unitPreference,
                          ) && <option>{draft.unitPreference}</option>}
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
                    <label>
                      <span>{profile('currency')}</span>
                      <select
                        name="currency"
                        defaultValue={draft.currency ?? 'TRY'}
                        onChange={(event) =>
                          setDraft({ ...draft, currency: event.target.value })
                        }
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                      </select>
                    </label>
                    {draft.paymentPlanName && (
                      <p className="privacy-callout">
                        {t('selectedPlan')}: {draft.paymentPlanName}
                      </p>
                    )}
                    <label>
                      <span>{t('buyerQuestion')}</span>
                      <textarea
                        name="message"
                        maxLength={1000}
                        rows={3}
                        defaultValue={draft.message ?? ''}
                        onChange={(event) =>
                          setDraft({ ...draft, message: event.target.value })
                        }
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
                  </fieldset>
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
                      {authRequired && (
                        <a
                          onClick={() => {
                            try {
                              sessionStorage.setItem(
                                draftKey,
                                JSON.stringify({
                                  at: Date.now(),
                                  context: draft,
                                }),
                              );
                            } catch {
                              /* Context recovery is optional. */
                            }
                          }}
                          href={`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`}
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
                    {status === 'submitting'
                      ? t('sendingLead')
                      : uncertain
                        ? t('retrySubmission')
                        : t('sendLead')}
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
