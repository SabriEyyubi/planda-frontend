'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  listItems,
  operationsRequest,
  type OperationError,
} from '@/features/operations/api/operations-client';
import type {
  BrokerClient,
  BrokerContact,
} from '@/features/operations/api/growth-types';
import { useOrganizationScope } from '@/features/operations/hooks/use-organization-scope';

export function BrokerClientsScreen() {
  const t = useTranslations('BrokerGrowth');
  const locale = useLocale();
  const scope = useOrganizationScope('broker');
  const [items, setItems] = useState<BrokerClient[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [editing, setEditing] = useState<BrokerClient>();
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [nextCursor, setNextCursor] = useState<string>();
  const loadSequence = useRef(0);

  const load = useCallback(
    async (cursor?: string, append = false) => {
      const organizationId = scope.organizationId;
      if (!organizationId) return;
      const sequence = ++loadSequence.current;
      setState('loading');
      try {
        const search = new URLSearchParams({
          status,
          limit: '100',
          organizationId,
        });
        if (appliedQuery) search.set('q', appliedQuery);
        if (cursor) search.set('cursor', cursor);
        const response = await operationsRequest<
          | BrokerClient[]
          | {
              items: BrokerClient[];
              pageInfo?: { nextCursor?: string | null };
            }
        >(`/broker/clients?${search}`);
        if (sequence !== loadSequence.current) return;
        const loaded = listItems(response);
        setItems((current) => (append ? [...current, ...loaded] : loaded));
        setNextCursor(
          Array.isArray(response)
            ? undefined
            : (response.pageInfo?.nextCursor ?? undefined),
        );
        setState('ready');
      } catch (error) {
        if (sequence !== loadSequence.current) return;
        setFeedback(errorText(error as OperationError, t));
        setState('error');
      }
    },
    [appliedQuery, scope.organizationId, status, t],
  );

  useEffect(() => {
    if (!scope.organizationId) return;
    const frame = requestAnimationFrame(() => void load());
    return () => {
      cancelAnimationFrame(frame);
      loadSequence.current += 1;
    };
  }, [load, scope.organizationId]);

  const noOrganizations =
    scope.state === 'ready' && scope.organizations.length === 0;
  const isLoading =
    scope.state === 'loading' ||
    (scope.state === 'ready' && !noOrganizations && state === 'loading');
  const hasError =
    scope.state === 'error' || (scope.state === 'ready' && state === 'error');

  async function save(payload: ClientPayload, client?: BrokerClient) {
    setFeedback(t('saving'));
    try {
      await operationsRequest(
        client
          ? `/broker/clients/${client.id}`
          : `/broker/clients?organizationId=${scope.organizationId}`,
        {
          method: client ? 'PATCH' : 'POST',
          body: JSON.stringify(
            client
              ? { version: client.version, ...payload }
              : {
                  fullName: payload.fullName,
                  ...(payload.phone ? { phone: payload.phone } : {}),
                  ...(payload.email ? { email: payload.email } : {}),
                  ...(payload.notes ? { notes: payload.notes } : {}),
                },
          ),
        },
      );
      setCreating(false);
      setEditing(undefined);
      setFeedback(t('saved'));
      await load();
    } catch (error) {
      setFeedback(errorText(error as OperationError, t));
    }
  }

  async function archive(client: BrokerClient) {
    if (!window.confirm(t('archiveConfirm', { name: client.fullName }))) return;
    setFeedback(t('archiving'));
    try {
      await operationsRequest(
        `/broker/clients/${client.id}?version=${client.version}`,
        {
          method: 'DELETE',
        },
      );
      setFeedback(t('archived'));
      await load();
    } catch (error) {
      setFeedback(errorText(error as OperationError, t));
    }
  }

  return (
    <section
      className="broker-screen growth-screen"
      aria-labelledby="broker-clients-title"
      aria-busy={isLoading}
    >
      <header className="broker-heading">
        <div>
          <span>{t('mode')}</span>
          <h1 id="broker-clients-title">{t('clientsTitle')}</h1>
          <p>{t('clientsDescription')}</p>
        </div>
        <div className="growth-heading__actions">
          {scope.organizations.length > 1 && (
            <label>
              <span>{t('organization')}</span>
              <select
                value={scope.organizationId}
                onChange={(event) =>
                  scope.setOrganizationId(event.target.value)
                }
              >
                {scope.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="button"
            disabled={!scope.organizationId}
            onClick={() => setCreating(true)}
          >
            {t('addClient')}
          </button>
        </div>
      </header>
      <form
        className="growth-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedQuery(query.trim());
        }}
      >
        <label>
          <span>{t('search')}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>{t('status')}</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="ACTIVE">{t('active')}</option>
            <option value="ARCHIVED">{t('archivedStatus')}</option>
          </select>
        </label>
        <button type="submit">{t('apply')}</button>
      </form>
      {feedback && (
        <p className="broker-policy" role="status" aria-live="polite">
          {feedback}
        </p>
      )}
      {isLoading && <BrokerGrowthState text={t('loadingClients')} />}
      {noOrganizations && <BrokerGrowthState text={t('noOrganizations')} />}
      {hasError && (
        <BrokerGrowthState
          text={feedback || t('loadFailed')}
          action={() =>
            void (scope.state === 'error' ? scope.reload() : load())
          }
          actionLabel={t('retry')}
        />
      )}
      {scope.state === 'ready' &&
        !noOrganizations &&
        state === 'ready' &&
        items.length === 0 && <BrokerGrowthState text={t('emptyClients')} />}
      {scope.state === 'ready' &&
        !noOrganizations &&
        state === 'ready' &&
        items.length > 0 && (
          <>
            <div className="broker-client-grid">
              {items.map((client) => (
                <article key={client.id}>
                  <div>
                    <span>
                      {client.status === 'ACTIVE'
                        ? t('active')
                        : t('archivedStatus')}
                    </span>
                    <h2>{client.fullName}</h2>
                  </div>
                  <dl>
                    <div>
                      <dt>{t('phone')}</dt>
                      <dd>{client.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('email')}</dt>
                      <dd>{client.email || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('notes')}</dt>
                      <dd>{client.notes || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('updated')}</dt>
                      <dd>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                        }).format(new Date(client.updatedAt))}
                      </dd>
                    </div>
                  </dl>
                  <div className="inline-actions">
                    <button type="button" onClick={() => setEditing(client)}>
                      {t('edit')}
                    </button>
                    {client.status === 'ACTIVE' && (
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() => void archive(client)}
                      >
                        {t('archive')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {nextCursor && (
              <button type="button" onClick={() => void load(nextCursor, true)}>
                {t('loadMore')}
              </button>
            )}
          </>
        )}
      {(creating || editing) && (
        <ClientEditor
          client={editing}
          onCancel={() => {
            setCreating(false);
            setEditing(undefined);
          }}
          onSave={save}
        />
      )}
      <p className="broker-policy">{t('privacyNotice')}</p>
    </section>
  );
}

type ClientPayload = {
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

function ClientEditor({
  client,
  onCancel,
  onSave,
}: {
  client?: BrokerClient;
  onCancel: () => void;
  onSave: (payload: ClientPayload, client?: BrokerClient) => Promise<void>;
}) {
  const t = useTranslations('BrokerGrowth');
  const [validation, setValidation] = useState('');
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);
  return (
    <div className="growth-dialog-backdrop">
      <section
        className="growth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-editor-title"
      >
        <h2 id="client-editor-title">
          {client ? t('editClient') : t('addClient')}
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const phone = String(form.get('phone') ?? '').trim();
            const email = String(form.get('email') ?? '').trim();
            if (!phone && !email) {
              setValidation(t('contactRequired'));
              return;
            }
            setValidation('');
            void onSave(
              {
                fullName: String(form.get('fullName') ?? '').trim(),
                phone: phone || null,
                email: email || null,
                notes: String(form.get('notes') ?? '').trim() || null,
              },
              client,
            );
          }}
        >
          <label>
            <span>{t('fullName')}</span>
            <input
              name="fullName"
              required
              defaultValue={client?.fullName}
              autoFocus
            />
          </label>
          <label>
            <span>{t('phone')}</span>
            <input name="phone" type="tel" defaultValue={client?.phone ?? ''} />
          </label>
          <label>
            <span>{t('email')}</span>
            <input
              name="email"
              type="email"
              defaultValue={client?.email ?? ''}
            />
          </label>
          <label>
            <span>{t('notes')}</span>
            <textarea name="notes" defaultValue={client?.notes ?? ''} />
          </label>
          {validation && (
            <p role="alert" className="form-error">
              {validation}
            </p>
          )}
          <div className="inline-actions">
            <button type="button" onClick={onCancel}>
              {t('cancel')}
            </button>
            <button className="button" type="submit">
              {t('save')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function BrokerContactsScreen() {
  const t = useTranslations('BrokerGrowth');
  const [contacts, setContacts] = useState<BrokerContact[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const load = useCallback(async () => {
    setState('loading');
    try {
      setContacts(await operationsRequest<BrokerContact[]>('/broker/contacts'));
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);
  const normalized = query.trim().toLocaleLowerCase();
  const visible = contacts.filter(
    (contact) =>
      !normalized ||
      [
        contact.projectName,
        contact.developerName,
        contact.fullName,
        contact.phone,
        contact.email,
      ].some((value) => value?.toLocaleLowerCase().includes(normalized)),
  );
  return (
    <section
      className="broker-screen growth-screen"
      aria-labelledby="broker-contacts-title"
      aria-busy={state === 'loading'}
    >
      <header className="broker-heading">
        <div>
          <span>{t('mode')}</span>
          <h1 id="broker-contacts-title">{t('contactsTitle')}</h1>
          <p>{t('contactsDescription')}</p>
        </div>
      </header>
      <label className="broker-search">
        <span>{t('search')}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {state === 'loading' && <BrokerGrowthState text={t('loadingContacts')} />}
      {state === 'error' && (
        <BrokerGrowthState
          text={t('loadFailed')}
          action={load}
          actionLabel={t('retry')}
        />
      )}
      {state === 'ready' && visible.length === 0 && (
        <BrokerGrowthState text={t('emptyContacts')} />
      )}
      {state === 'ready' && visible.length > 0 && (
        <div className="broker-contact-grid">
          {visible.map((contact) => (
            <article
              key={`${contact.projectId}-${contact.fullName}-${contact.email}-${contact.phone}`}
            >
              <span>{contact.developerName}</span>
              <h2>{contact.fullName}</h2>
              <p>{contact.projectName}</p>
              <div>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                ) : (
                  <span>—</span>
                )}
                {contact.email ? (
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                ) : (
                  <span>—</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="broker-policy">{t('contactsPrivacy')}</p>
    </section>
  );
}

function BrokerGrowthState({
  text,
  action,
  actionLabel,
}: {
  text: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="broker-state" role={action ? 'alert' : 'status'}>
      <p>{text}</p>
      {action && (
        <button type="button" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function errorText(
  error: OperationError,
  t: ReturnType<typeof useTranslations<'BrokerGrowth'>>,
) {
  if (error.status === 409) return t('conflict');
  if (error.status === 403) return t('forbidden');
  return t('operationFailed', { requestId: error.requestId ?? 'none' });
}
