'use client';

import { Link } from '@/lib/i18n/navigation';
import { redirectAfterUnauthorized } from '@/lib/auth/login-redirect';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import type { Profile, UpdateProfile } from '../api/profile-adapter';

export function ProfileScreen() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const [profile, setProfile] = useState<Profile>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const response = await fetch('/api/me/profile', { cache: 'no-store' });
      if (redirectAfterUnauthorized(response)) return;
      if (!response.ok) {
        setState('error');
        return;
      }
      setProfile((await response.json()) as Profile);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);

  if (state === 'loading') return <ProfileState message={t('loading')} />;
  if (state === 'error' || !profile)
    return (
      <ProfileState
        message={t('loadFailed')}
        retry={() => void load()}
        retryLabel={t('retry')}
      />
    );

  return (
    <section className="profile-screen">
      <header className="profile-summary">
        <span className="profile-avatar" aria-hidden="true">
          {initialsFor(profile.fullName, profile.email)}
        </span>
        <div>
          <span className="eyebrow">{t('account')}</span>
          <h1>{profile.fullName || profile.email}</h1>
          <p>
            {profile.email} ·{' '}
            {t('memberSince', {
              date: new Intl.DateTimeFormat(locale, {
                month: 'long',
                year: 'numeric',
              }).format(new Date(profile.createdAt)),
            })}
          </p>
          <div className="profile-roles">
            {profile.roles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </div>
      </header>
      <div className="profile-grid">
        <form
          className="card profile-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setFeedback(t('saving'));
            const form = new FormData(event.currentTarget);
            const payload: UpdateProfile = {
              fullName: nullable(form.get('fullName')),
              phone: nullable(form.get('phone')),
              preferredLanguage: nullable(
                form.get('preferredLanguage'),
              ) as UpdateProfile['preferredLanguage'],
              preferredCurrency: nullable(form.get('preferredCurrency')),
            };
            try {
              const response = await fetch('/api/me/profile', {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (redirectAfterUnauthorized(response)) return;
              if (!response.ok) {
                setFeedback(t('saveFailed'));
                return;
              }
              setProfile((await response.json()) as Profile);
              setFeedback(t('saved'));
            } catch {
              setFeedback(t('saveFailed'));
            }
          }}
        >
          <h2>{t('personalInformation')}</h2>
          <div className="profile-fields">
            <label>
              <span>{t('fullName')}</span>
              <input name="fullName" defaultValue={profile.fullName ?? ''} />
            </label>
            <label>
              <span>{t('phone')}</span>
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ''}
              />
            </label>
            <label>
              <span>{t('email')}</span>
              <input value={profile.email} readOnly aria-readonly="true" />
            </label>
            <label>
              <span>{t('language')}</span>
              <select
                name="preferredLanguage"
                defaultValue={profile.preferredLanguage ?? ''}
              >
                <option value="">—</option>
                <option value="TR">Türkçe</option>
                <option value="EN">English</option>
                <option value="AR">العربية</option>
                <option value="RU">Русский</option>
              </select>
            </label>
            <label>
              <span>{t('currency')}</span>
              <select
                name="preferredCurrency"
                defaultValue={profile.preferredCurrency ?? ''}
              >
                <option value="">—</option>
                <option value="TRY">TRY</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
          {feedback && (
            <p role="status" aria-live="polite">
              {feedback}
            </p>
          )}
          <button className="button" type="submit">
            {t('save')}
          </button>
        </form>
        <aside className="profile-side">
          <section className="card">
            <h2>{t('savedProjects')}</h2>
            <p>{t('savedProjectsDescription')}</p>
            <Link href="/saved">{t('viewSaved')} →</Link>
          </section>
          <section className="card">
            <h2>{t('requests')}</h2>
            <p>{t('requestsDescription')}</p>
            <Link href="/alerts">{t('viewRequests')} →</Link>
          </section>
          <section className="card policy-card">
            <h2>{t('savedSearches')}</h2>
            <p>{t('savedSearchesUnavailable')}</p>
          </section>
          <section className="card policy-card">
            <h2>{t('notifications')}</h2>
            <p>{t('notificationsUnavailable')}</p>
          </section>
          <section className="card policy-card">
            <h2>{t('accountDeletion')}</h2>
            <p>{t('accountDeletionUnavailable')}</p>
          </section>
        </aside>
      </div>
    </section>
  );
}

function ProfileState({
  message,
  retry,
  retryLabel,
}: {
  message: string;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <section className="card" role="status">
      <h1>{message}</h1>
      {retry && (
        <button className="button" type="button" onClick={retry}>
          {retryLabel}
        </button>
      )}
    </section>
  );
}

function initialsFor(name: string | null, email: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (
    parts.length
      ? parts
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
      : email.slice(0, 2)
  ).toUpperCase();
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || null;
}
