'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthorization } from '@/lib/permissions/authorization-context';
import {
  operationsRequest,
  type OperationError,
} from '@/features/operations/api/operations-client';
import type { DeveloperSettings } from '@/features/operations/api/growth-types';
import { useOrganizationScope } from '@/features/operations/hooks/use-organization-scope';

export function DeveloperSettingsScreen() {
  const t = useTranslations('DeveloperSettings');
  const { canManageOrganization } = useAuthorization();
  const scope = useOrganizationScope('developer');
  const [settings, setSettings] = useState<DeveloperSettings>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedback, setFeedback] = useState('');
  const [dirty, setDirty] = useState(false);
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const organizationId = scope.organizationId;
    if (!organizationId) return;
    const sequence = ++loadSequence.current;
    setState('loading');
    try {
      const nextSettings = await operationsRequest<DeveloperSettings>(
        `/developer/settings?organizationId=${organizationId}`,
      );
      if (sequence !== loadSequence.current) return;
      setSettings(nextSettings);
      setDirty(false);
      setState('ready');
    } catch {
      if (sequence !== loadSequence.current) return;
      setState('error');
    }
  }, [scope.organizationId]);

  useEffect(() => {
    if (!scope.organizationId) return;
    const frame = requestAnimationFrame(() => void load());
    return () => {
      cancelAnimationFrame(frame);
      loadSequence.current += 1;
    };
  }, [load, scope.organizationId]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const noOrganizations =
    scope.state === 'ready' && scope.organizations.length === 0;
  const isLoading =
    scope.state === 'loading' ||
    (scope.state === 'ready' && !noOrganizations && state === 'loading');
  const hasError =
    scope.state === 'error' || (scope.state === 'ready' && state === 'error');
  const canManage = settings
    ? settings.id === scope.organizationId && canManageOrganization(settings.id)
    : false;
  return (
    <section
      className="growth-screen"
      aria-labelledby="developer-settings-title"
      aria-busy={isLoading}
    >
      <header className="growth-heading">
        <div>
          <span className="eyebrow">{t('eyebrow')}</span>
          <h1 id="developer-settings-title">{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
        {scope.organizations.length > 1 && (
          <label>
            <span>{t('organization')}</span>
            <select
              value={scope.organizationId}
              onChange={(event) => scope.setOrganizationId(event.target.value)}
            >
              {scope.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>
      {isLoading && <SettingsState text={t('loading')} />}
      {noOrganizations && <SettingsState text={t('noOrganizations')} />}
      {hasError && (
        <SettingsState
          text={t('loadFailed')}
          action={scope.state === 'error' ? scope.reload : load}
          actionLabel={t('retry')}
        />
      )}
      {scope.state === 'ready' &&
        !noOrganizations &&
        state === 'ready' &&
        settings && (
          <>
            {!canManage && (
              <p className="privacy-callout" role="status">
                {t('readonly')}
              </p>
            )}
            <form
              key={`${settings.id}:${settings.version}`}
              className="ops-card growth-form"
              onChange={() => setDirty(true)}
              onSubmit={async (event) => {
                event.preventDefault();
                if (!canManage) return;
                const organizationId = settings.id;
                const form = new FormData(event.currentTarget);
                setFeedback(t('saving'));
                try {
                  const updated = await operationsRequest<DeveloperSettings>(
                    `/developer/settings?organizationId=${organizationId}`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({
                        version: settings.version,
                        name: value(form, 'name'),
                        about: value(form, 'about'),
                        salesEmail: value(form, 'salesEmail'),
                        salesPhone: value(form, 'salesPhone'),
                        websiteUrl: value(form, 'websiteUrl'),
                      }),
                    },
                  );
                  setSettings(updated);
                  setDirty(false);
                  setFeedback(t('saved'));
                } catch (error) {
                  const operationError = error as OperationError;
                  if (operationError.status === 409) {
                    setFeedback(t('conflict'));
                    await load();
                  } else if (operationError.status === 403) {
                    setFeedback(t('forbidden'));
                  } else {
                    setFeedback(
                      t('saveFailed', {
                        requestId: operationError.requestId ?? 'none',
                      }),
                    );
                  }
                }
              }}
            >
              <div className="growth-form__grid">
                <label>
                  <span>{t('name')}</span>
                  <input
                    name="name"
                    required
                    maxLength={200}
                    defaultValue={settings.name}
                    disabled={!canManage}
                  />
                </label>
                <label>
                  <span>{t('salesEmail')}</span>
                  <input
                    name="salesEmail"
                    type="email"
                    defaultValue={settings.salesEmail ?? ''}
                    disabled={!canManage}
                  />
                </label>
                <label>
                  <span>{t('salesPhone')}</span>
                  <input
                    name="salesPhone"
                    type="tel"
                    defaultValue={settings.salesPhone ?? ''}
                    disabled={!canManage}
                  />
                </label>
                <label>
                  <span>{t('website')}</span>
                  <input
                    name="websiteUrl"
                    type="url"
                    defaultValue={settings.websiteUrl ?? ''}
                    disabled={!canManage}
                  />
                </label>
                <label className="growth-form__wide">
                  <span>{t('about')}</span>
                  <textarea
                    name="about"
                    maxLength={2000}
                    defaultValue={settings.about ?? ''}
                    disabled={!canManage}
                  />
                </label>
              </div>
              <p className="muted">{t('immutableNotice')}</p>
              {feedback && (
                <p role="status" aria-live="polite">
                  {feedback}
                </p>
              )}
              <button className="button" type="submit" disabled={!canManage}>
                {t('save')}
              </button>
            </form>
          </>
        )}
    </section>
  );
}

function SettingsState({
  text,
  action,
  actionLabel,
}: {
  text: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="empty-state" role={action ? 'alert' : 'status'}>
      <p>{text}</p>
      {action && (
        <button className="button" type="button" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function value(form: FormData, key: string) {
  const result = String(form.get(key) ?? '').trim();
  return result || null;
}
