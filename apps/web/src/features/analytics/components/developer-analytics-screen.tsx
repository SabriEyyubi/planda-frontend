'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  operationsRequest,
  type OperationError,
} from '@/features/operations/api/operations-client';
import type {
  AnalyticsRange,
  DeveloperAnalytics,
} from '@/features/operations/api/growth-types';
import { useOrganizationScope } from '@/features/operations/hooks/use-organization-scope';

export function DeveloperAnalyticsScreen() {
  const t = useTranslations('DeveloperAnalytics');
  const locale = useLocale();
  const scope = useOrganizationScope('developer');
  const [range, setRange] = useState<AnalyticsRange>(30);
  const [data, setData] = useState<DeveloperAnalytics>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [requestId, setRequestId] = useState('');
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const organizationId = scope.organizationId;
    if (!organizationId) return;
    const sequence = ++loadSequence.current;
    setState('loading');
    setRequestId('');
    try {
      const nextData = await operationsRequest<DeveloperAnalytics>(
        `/developer/analytics?range=${range}&organizationId=${organizationId}`,
      );
      if (sequence !== loadSequence.current) return;
      setData(nextData);
      setState('ready');
    } catch (error) {
      if (sequence !== loadSequence.current) return;
      setRequestId((error as OperationError).requestId ?? '');
      setState('error');
    }
  }, [range, scope.organizationId]);

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
  const empty =
    data && data.totals.views + data.totals.favorites + data.totals.leads === 0;
  return (
    <section
      className="growth-screen"
      aria-labelledby="analytics-title"
      aria-busy={isLoading}
    >
      <header className="growth-heading">
        <div>
          <span className="eyebrow">{t('eyebrow')}</span>
          <h1 id="analytics-title">{t('title')}</h1>
          <p>{t('description')}</p>
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
          <div
            className="segmented-control"
            role="group"
            aria-label={t('rangeLabel')}
          >
            {([7, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={range === days}
                onClick={() => setRange(days)}
              >
                {t('days', { count: days })}
              </button>
            ))}
          </div>
        </div>
      </header>
      {isLoading && <GrowthState text={t('loading')} />}
      {noOrganizations && <GrowthState text={t('noOrganizations')} />}
      {hasError && (
        <GrowthState
          text={t('loadFailed', { requestId: requestId || 'none' })}
          action={scope.state === 'error' ? scope.reload : load}
          actionLabel={t('retry')}
        />
      )}
      {scope.state === 'ready' &&
        !noOrganizations &&
        state === 'ready' &&
        data && (
          <>
            <p className="privacy-callout">
              {t('utcNotice', { date: formatDateTime(data.range.to, locale) })}
            </p>
            <div className="metric-grid metric-grid--growth">
              <Metric
                label={t('views')}
                value={data.totals.views}
                change={data.totals.viewsChangePercent}
                t={t}
              />
              <Metric
                label={t('favorites')}
                value={data.totals.favorites}
                change={data.totals.favoritesChangePercent}
                t={t}
              />
              <Metric
                label={t('leads')}
                value={data.totals.leads}
                change={data.totals.leadsChangePercent}
                t={t}
              />
              <Metric
                label={t('conversion')}
                value={
                  data.totals.conversionRate === null
                    ? '—'
                    : `${data.totals.conversionRate}%`
                }
                change={null}
                t={t}
              />
            </div>
            {empty && <GrowthState text={t('empty')} />}
            {!empty && (
              <div className="growth-columns">
                <section
                  className="ops-card growth-card"
                  aria-labelledby="trend-title"
                >
                  <h2 id="trend-title">{t('trend')}</h2>
                  <DailyTrendChart daily={data.daily} locale={locale} t={t} />
                </section>
                <section
                  className="ops-card growth-card"
                  aria-labelledby="top-projects-title"
                >
                  <h2 id="top-projects-title">{t('topProjects')}</h2>
                  {data.topProjects.length === 0 ? (
                    <p>{t('noTopProjects')}</p>
                  ) : (
                    <div
                      className="responsive-data-list"
                      role="table"
                      aria-label={t('topProjects')}
                    >
                      <div role="row" className="responsive-data-list__head">
                        {[
                          t('project'),
                          t('views'),
                          t('favorites'),
                          t('leads'),
                          t('conversion'),
                        ].map((label) => (
                          <b role="columnheader" key={label}>
                            {label}
                          </b>
                        ))}
                      </div>
                      {data.topProjects.map((project) => (
                        <div role="row" key={project.projectId}>
                          <strong role="cell">{project.name}</strong>
                          <span role="cell" data-label={t('views')}>
                            {project.views}
                          </span>
                          <span role="cell" data-label={t('favorites')}>
                            {project.favorites}
                          </span>
                          <span role="cell" data-label={t('leads')}>
                            {project.leads}
                          </span>
                          <span role="cell" data-label={t('conversion')}>
                            {project.conversionRate === null
                              ? '—'
                              : `${project.conversionRate}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
    </section>
  );
}

function DailyTrendChart({
  daily,
  locale,
  t,
}: {
  daily: DeveloperAnalytics['daily'];
  locale: string;
  t: ReturnType<typeof useTranslations<'DeveloperAnalytics'>>;
}) {
  const width = 640;
  const height = 220;
  const inset = 18;
  const max = Math.max(
    1,
    ...daily.flatMap(({ views, favorites, leads }) => [
      views,
      favorites,
      leads,
    ]),
  );
  const series = [
    { key: 'views', label: t('views'), className: 'is-views' },
    { key: 'favorites', label: t('favorites'), className: 'is-favorites' },
    { key: 'leads', label: t('leads'), className: 'is-leads' },
  ] as const;
  const points = (key: (typeof series)[number]['key']) =>
    daily
      .map((day, index) => {
        const x =
          inset + (index * (width - inset * 2)) / Math.max(1, daily.length - 1);
        const y = height - inset - (day[key] / max) * (height - inset * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="analytics-chart">
      <div className="analytics-legend" aria-hidden="true">
        {series.map((item) => (
          <span key={item.key} className={item.className}>
            <i /> {item.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('chartLabel')}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={inset}
            x2={width - inset}
            y1={height * ratio}
            y2={height * ratio}
            className="analytics-gridline"
          />
        ))}
        {series.map((item) => (
          <polyline
            key={item.key}
            points={points(item.key)}
            className={item.className}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="sr-only" role="table" aria-label={t('chartData')}>
        <div role="row">
          {[t('date'), t('views'), t('favorites'), t('leads')].map((label) => (
            <span role="columnheader" key={label}>
              {label}
            </span>
          ))}
        </div>
        {daily.map((day) => (
          <div role="row" key={day.date}>
            <time role="cell" dateTime={day.date}>
              {formatDate(day.date, locale)}
            </time>
            <span role="cell">{day.views}</span>
            <span role="cell">{day.favorites}</span>
            <span role="cell">{day.leads}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  t,
}: {
  label: string;
  value: number | string;
  change: number | null;
  t: ReturnType<typeof useTranslations<'DeveloperAnalytics'>>;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>
        {change === null
          ? t('changeUnavailable')
          : t('change', { value: change })}
      </small>
    </article>
  );
}

function GrowthState({
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

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value));
}
