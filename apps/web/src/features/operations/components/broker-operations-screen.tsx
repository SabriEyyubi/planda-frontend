'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  BrokerMaterial as Material,
  BrokerProject,
} from '@planda/api-contract';
import {
  listItems,
  operationsRequest,
  type OperationError,
} from '../api/operations-client';
import { useLocale, useTranslations } from 'next-intl';

export function BrokerProjectScreen() {
  const t = useTranslations('Broker');
  const locale = useLocale();
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  });
  const [projects, setProjects] = useState<BrokerProject[]>([]);
  const [selected, setSelected] = useState('');
  const [project, setProject] = useState<BrokerProject>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const list = listItems(
        await operationsRequest<BrokerProject[] | { items: BrokerProject[] }>(
          '/broker/projects',
        ),
      );
      setProjects(list);
      const id = selected || list[0]?.id;
      if (!id) {
        setProject(undefined);
        setState('ready');
        return;
      }
      if (!selected) setSelected(id);
      setProject(
        await operationsRequest<BrokerProject>(`/broker/projects/${id}`),
      );
      setState('ready');
    } catch (error) {
      setMessage(
        t('loadFailed', {
          requestId: (error as OperationError).requestId ?? '',
        }),
      );
      setState('error');
    }
  }, [selected, t]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);

  return (
    <section
      className="broker-screen"
      aria-busy={state === 'loading'}
      aria-labelledby="broker-project-title"
    >
      <div className="broker-heading">
        <div>
          <span>{t('mode')}</span>
          <h1 id="broker-project-title">{t('projectTitle')}</h1>
          <p>{t('privateNotice')}</p>
        </div>
        {projects.length > 0 && (
          <select
            aria-label={t('selectProject')}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {projects.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {state === 'loading' && (
        <BrokerState text={t('loadingProject')} retryLabel={t('retry')} />
      )}
      {state === 'error' && (
        <BrokerState
          text={message}
          action={() => void load()}
          retryLabel={t('retry')}
        />
      )}
      {state === 'ready' && !project && (
        <BrokerState text={t('emptyProject')} retryLabel={t('retry')} />
      )}
      {state === 'ready' && project && (
        <>
          <div className="broker-title">
            <div>
              <span>
                {project.developerName} · {t('verifiedSource')}
              </span>
              <h2>{project.name}</h2>
              <p>
                {t('updatedAt', {
                  date: new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(project.updatedAt)),
                })}
              </p>
            </div>
            <div>
              <span>{t('commission')}</span>
              <strong>
                {project.commissionPercent
                  ? `${project.commissionPercent}%`
                  : t('notProvided')}
              </strong>
            </div>
          </div>
          <div className="broker-metrics">
            <article>
              <span>{t('publicPrice')}</span>
              <strong>
                {money.format(Number(project.publicStartingPrice))}
              </strong>
            </article>
            <article>
              <span>{t('brokerPrice')}</span>
              <strong>
                {project.brokerPrice
                  ? money.format(Number(project.brokerPrice))
                  : t('notProvided')}
              </strong>
            </article>
            <article>
              <span>{t('availableStock')}</span>
              <strong>
                {
                  project.units.filter((unit) => unit.status === 'AVAILABLE')
                    .length
                }
              </strong>
            </article>
            <article>
              <span>{t('reservationWindow')}</span>
              <strong>
                {project.reservationHours
                  ? t('hours', { count: project.reservationHours })
                  : t('notProvided')}
              </strong>
            </article>
          </div>
          <p className="broker-policy">
            {t('salesPolicy', {
              contact: project.salesContact ?? t('notProvided'),
            })}
          </p>
          <div className="broker-actions">
            <button disabled title={t('downloadPending')}>
              {t('downloadPriceList')}
            </button>
            <button disabled title={t('sharePending')}>
              {t('createShareLink')}
            </button>
          </div>
          {project.units.length ? (
            <div className="broker-table">
              <h3>{t('inventoryTitle')}</h3>
              <div
                className="data-table"
                role="table"
                aria-label={t('inventoryLabel')}
              >
                <div
                  className="data-row data-row--head"
                  style={{
                    gridTemplateColumns: 'repeat(7, minmax(8rem, 1fr))',
                  }}
                  role="row"
                >
                  {[
                    t('unit'),
                    t('type'),
                    t('floor'),
                    t('netArea'),
                    t('price'),
                    t('status'),
                    t('updated'),
                  ].map((label) => (
                    <b role="columnheader" key={label}>
                      {label}
                    </b>
                  ))}
                </div>
                {project.units.map((unit) => (
                  <div
                    className="data-row"
                    style={{
                      gridTemplateColumns: 'repeat(7, minmax(8rem, 1fr))',
                    }}
                    role="row"
                    key={unit.id}
                  >
                    {[
                      unit.unitNumber,
                      unit.roomType,
                      unit.floor ?? '—',
                      unit.netArea,
                      money.format(Number(unit.price)),
                      unit.status,
                      new Intl.DateTimeFormat(locale, {
                        dateStyle: 'short',
                      }).format(new Date(unit.updatedAt)),
                    ].map((cell, index) => (
                      <span role="cell" key={index}>
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <BrokerState text={t('emptyInventory')} retryLabel={t('retry')} />
          )}
        </>
      )}
    </section>
  );
}

export function BrokerMaterialsScreen() {
  const t = useTranslations('Broker');
  const locale = useLocale();
  const [projects, setProjects] = useState<BrokerProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [language, setLanguage] = useState('ALL');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const list = listItems(
        await operationsRequest<BrokerProject[] | { items: BrokerProject[] }>(
          '/broker/projects',
        ),
      );
      setProjects(list);
      const id = projectId || list[0]?.id;
      if (!id) {
        setMaterials([]);
        setState('ready');
        return;
      }
      if (!projectId) setProjectId(id);
      const response = await operationsRequest<
        Material[] | { items: Material[] }
      >(`/broker/projects/${id}/materials`);
      setMaterials(listItems(response));
      setState('ready');
    } catch {
      setState('error');
    }
  }, [projectId]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);
  const visible = materials.filter(
    (material) =>
      language === 'ALL' || (material.language ?? 'UNSPECIFIED') === language,
  );

  return (
    <section
      className="broker-screen"
      aria-busy={state === 'loading'}
      aria-labelledby="broker-materials-title"
    >
      <div className="broker-heading">
        <div>
          <span>{t('materialCenter')}</span>
          <h1 id="broker-materials-title">{t('materialsTitle')}</h1>
          <p>{t('materialsDescription')}</p>
        </div>
        {projects.length > 0 && (
          <select
            aria-label={t('selectMaterialProject')}
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div
        className="broker-language"
        role="group"
        aria-label={t('materialLanguage')}
      >
        {['ALL', 'EN', 'AR', 'RU', 'TR'].map((value) => (
          <button
            type="button"
            aria-pressed={language === value}
            key={value}
            onClick={() => setLanguage(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {state === 'loading' && (
        <BrokerState text={t('loadingMaterials')} retryLabel={t('retry')} />
      )}
      {state === 'error' && (
        <BrokerState
          text={t('materialsLoadFailed')}
          action={() => void load()}
          retryLabel={t('retry')}
        />
      )}
      {state === 'ready' && !visible.length && (
        <BrokerState text={t('emptyMaterials')} retryLabel={t('retry')} />
      )}
      {state === 'ready' && visible.length > 0 && (
        <div className="material-grid">
          {visible.map((material) => (
            <article key={material.id}>
              <span>{material.kind}</span>
              <h2>{material.title}</h2>
              <p>
                {material.language ?? t('languageUnspecified')}
                {material.updatedAt
                  ? ` · ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(material.updatedAt))}`
                  : ''}
              </p>
              <div>
                <button disabled title={t('downloadPending')}>
                  {t('downloadDisabled')}
                </button>
                <button disabled title={t('sharePending')}>
                  {t('shareDisabled')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function BrokerPolicyPendingScreen({
  surface,
}: {
  surface: 'clients' | 'contacts';
}) {
  const t = useTranslations('Broker');
  return (
    <section className="broker-screen">
      <span>{t('mode')}</span>
      <h1>{t(surface)}</h1>
      <div className="broker-policy">
        <strong>{t('readonlyPolicy')}</strong>
        <p>{t('policyDescription')}</p>
      </div>
    </section>
  );
}

function BrokerState({
  text,
  action,
  retryLabel,
}: {
  text: string;
  action?: () => void;
  retryLabel: string;
}) {
  return (
    <div className="broker-state" role={action ? 'alert' : 'status'}>
      <p>{text}</p>
      {action && (
        <button type="button" onClick={action}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
