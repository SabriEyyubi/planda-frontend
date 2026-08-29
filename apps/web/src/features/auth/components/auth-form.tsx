'use client';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Link } from '@/lib/i18n/navigation';
import { safeReturnTo } from '@/lib/auth/return-to';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

type Kind = 'login' | 'register' | 'forgot' | 'reset';

export function AuthForm({ kind, title }: { kind: Kind; title: string }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'invalid' | 'rateLimited' | 'unavailable'
  >('idle');
  const [showPassword, setShowPassword] = useState(false);

  if (kind === 'forgot' || kind === 'reset') {
    return (
      <section className="auth-unavailable" aria-labelledby="auth-title">
        <span className="eyebrow">{t('accountAccess')}</span>
        <h1 id="auth-title">{title}</h1>
        <p>{t('recoveryUnavailable')}</p>
        <Link className="button" href="/login">
          {t('backToLogin')}
        </Link>
      </section>
    );
  }

  const errorMessage =
    status === 'rateLimited'
      ? t('rateLimited')
      : status === 'unavailable'
        ? t('serviceUnavailable')
        : status === 'invalid'
          ? t('invalidCredentials')
          : null;

  return (
    <form
      className="auth-form"
      aria-busy={status === 'submitting'}
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('submitting');
        const form = new FormData(event.currentTarget);
        if (
          kind === 'register' &&
          form.get('password') !== form.get('passwordConfirmation')
        ) {
          setStatus('invalid');
          return;
        }
        let response: Response;
        try {
          response = await fetch(`/api/auth/${kind}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              email: form.get('email'),
              password: form.get('password'),
            }),
          });
        } catch {
          setStatus('unavailable');
          return;
        }
        if (!response.ok) {
          setStatus(
            response.status === 429
              ? 'rateLimited'
              : response.status >= 500
                ? 'unavailable'
                : 'invalid',
          );
          return;
        }
        const returnTo = new URLSearchParams(window.location.search).get(
          'returnTo',
        );
        window.location.assign(safeReturnTo(returnTo, `/${locale}`));
      }}
    >
      <div>
        <span className="eyebrow">{t('accountAccess')}</span>
        <h1>{kind === 'login' ? t('welcomeBack') : title}</h1>
        <p className="muted">
          {kind === 'login'
            ? t('welcomeDescription')
            : t('registerDescription')}
        </p>
      </div>
      <nav className="auth-tabs" aria-label={t('authMethod')}>
        <Link
          aria-current={kind === 'login' ? 'page' : undefined}
          href="/login"
        >
          {t('login')}
        </Link>
        <Link
          aria-current={kind === 'register' ? 'page' : undefined}
          href="/register"
        >
          {t('register')}
        </Link>
      </nav>
      <Field
        name="email"
        type="email"
        label={t('email')}
        autoComplete="email"
        required
      />
      <div className="password-field field">
        <div className="password-field__label">
          <label htmlFor="password">{t('password')}</label>
          {kind === 'login' && (
            <Link href="/forgot-password">{t('forgotPassword')}</Link>
          )}
        </div>
        <div className="password-field__control">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={
              kind === 'login' ? 'current-password' : 'new-password'
            }
            required
          />
          <button
            type="button"
            aria-pressed={showPassword}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? '◉' : '◎'}
          </button>
        </div>
      </div>
      {kind === 'register' && (
        <Field
          name="passwordConfirmation"
          type={showPassword ? 'text' : 'password'}
          label={t('passwordConfirmation')}
          autoComplete="new-password"
          required
        />
      )}
      {kind === 'register' && (
        <label className="auth-consent">
          <input type="checkbox" required /> <span>{t('consent')}</span>
        </label>
      )}
      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? t('submitting') : title}
      </Button>
      <div className="auth-divider" aria-hidden="true">
        <span /> {t('or')} <span />
      </div>
      <button
        className="auth-provider"
        type="button"
        disabled
        title={t('providerUnavailable')}
      >
        G&nbsp;&nbsp;{t('continueWithGoogle')} · {t('comingSoon')}
      </button>
      <p className="auth-corporate">
        {t('corporateQuestion')}{' '}
        <span aria-disabled="true">
          {t('corporateLogin')} · {t('comingSoon')}
        </span>
      </p>
    </form>
  );
}
