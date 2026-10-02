'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type {
  AdminOverview as Overview,
  AdminQualityItem as QualityItem,
  AdminReviewProject as ReviewProject,
  AdminStatusResult as StatusResult,
} from '@planda/api-contract';
import { useTranslations } from 'next-intl';
import {
  operationsRequest,
  type OperationPage,
  type OperationError,
} from '../api/operations-client';

type Tab = 'overview' | 'queue' | 'quality';
const adminTabValues = ['overview', 'queue', 'quality'] as const;

export function AdminOperationsScreen() {
  const t = useTranslations('OperationsCore');
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<
    Overview | ReviewProject[] | QualityItem[]
  >();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedback, setFeedback] = useState('');
  const requestVersion = useRef(0);
  const [cursor, setCursor] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  function changeTab(next: Tab) {
    if (next === tab && !cursor) return;
    requestVersion.current += 1;
    setState('loading');
    setData(undefined);
    setFeedback('');
    setCursor('');
    setHistory([]);
    setNextCursor(null);
    setTab(next);
  }

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setState('loading');
    try {
      const path =
        tab === 'overview'
          ? '/admin/overview'
          : tab === 'queue'
            ? '/admin/projects/review-queue'
            : '/admin/data-quality';
      const response = await operationsRequest<
        | Overview
        | ReviewProject[]
        | QualityItem[]
        | OperationPage<ReviewProject | QualityItem>
      >(`${path}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
      if (version !== requestVersion.current) return;
      const page = response as OperationPage<ReviewProject | QualityItem>;
      setNextCursor(
        page.pageInfo?.hasNextPage ? page.pageInfo.nextCursor : null,
      );
      setData(
        'items' in Object(response)
          ? (response as { items: ReviewProject[] | QualityItem[] }).items
          : (response as Overview | ReviewProject[] | QualityItem[]),
      );
      setState('ready');
    } catch (error) {
      if (version !== requestVersion.current) return;
      setFeedback(adminError(error as OperationError));
      setState('error');
    }
  }, [cursor, tab]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => {
      cancelAnimationFrame(frame);
      requestVersion.current += 1;
    };
  }, [load]);

  async function update(
    project: ReviewProject,
    status: 'PUBLISHED' | 'ARCHIVED',
  ) {
    const version = requestVersion.current;
    setFeedback('İşlem kaydediliyor…');
    try {
      const result = await operationsRequest<StatusResult>(
        `/admin/projects/${project.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      );
      if (version !== requestVersion.current) return;
      setFeedback(
        `Durum güncellendi${result.auditId ? ` · Audit ID: ${result.auditId}` : ''}.`,
      );
      await load();
    } catch (error) {
      if (version !== requestVersion.current) return;
      setFeedback(adminError(error as OperationError));
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = adminTabValues.findIndex((value) => value === tab);
    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % adminTabValues.length
        : event.key === 'ArrowLeft'
          ? (currentIndex - 1 + adminTabValues.length) % adminTabValues.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? adminTabValues.length - 1
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const nextTab = adminTabValues[nextIndex]!;
    changeTab(nextTab);
    requestAnimationFrame(() =>
      document.getElementById(`admin-tab-${nextTab}`)?.focus(),
    );
  }

  return (
    <section
      className="ops-screen"
      aria-busy={state === 'loading'}
      aria-labelledby="admin-operations-title"
    >
      <div className="ops-heading">
        <div>
          <span className="eyebrow">{t('adminEyebrow')}</span>
          <h1 id="admin-operations-title">{t('adminTitle')}</h1>
          <p>{t('adminDescription')}</p>
        </div>
        <button
          className="button button--secondary"
          disabled
          title="Bildirim sağlayıcısı yapılandırılmadı"
        >
          {t('notificationDisabled')}
        </button>
      </div>
      <div className="admin-tabs" role="tablist">
        {adminTabValues.map((value) => (
          <button
            id={`admin-tab-${value}`}
            role="tab"
            aria-selected={tab === value}
            aria-controls="admin-panel"
            tabIndex={tab === value ? 0 : -1}
            type="button"
            key={value}
            onClick={() => changeTab(value)}
            onKeyDown={handleTabKeyDown}
          >
            {value === 'overview'
              ? t('dashboard')
              : value === 'queue'
                ? t('reviewQueue')
                : t('dataQuality')}
          </button>
        ))}
      </div>
      {feedback && (
        <p
          className={
            feedback.includes('Audit') ? 'success-callout' : 'warning-callout'
          }
          aria-live="polite"
          aria-atomic="true"
          role="status"
        >
          {feedback}
        </p>
      )}
      <div
        id="admin-panel"
        role="tabpanel"
        aria-labelledby={`admin-tab-${tab}`}
        tabIndex={0}
      >
        {state === 'loading' && <AdminState text={t('adminLoading')} />}
        {state === 'error' && (
          <AdminState
            text={feedback || 'Veriler alınamadı.'}
            action={() => void load()}
          />
        )}
        {state === 'ready' && tab === 'overview' && (
          <OverviewPanel data={data as Overview} />
        )}
        {state === 'ready' && tab === 'queue' && (
          <QueuePanel items={(data as ReviewProject[]) ?? []} update={update} />
        )}
        {state === 'ready' && tab === 'quality' && (
          <QualityPanel items={(data as QualityItem[]) ?? []} update={update} />
        )}
      </div>
      {state === 'ready' && (history.length > 0 || nextCursor) && (
        <nav aria-label="Liste sayfaları" className="inline-actions">
          <button
            disabled={!history.length}
            onClick={() => {
              requestVersion.current += 1;
              setState('loading');
              setCursor(history.at(-1) ?? '');
              setHistory(history.slice(0, -1));
            }}
          >
            Önceki sayfa
          </button>
          <button
            disabled={!nextCursor}
            onClick={() => {
              requestVersion.current += 1;
              setState('loading');
              setHistory([...history, cursor]);
              setCursor(nextCursor ?? '');
            }}
          >
            Sonraki sayfa
          </button>
        </nav>
      )}
      <div className="privacy-callout">{t('policyPending')}</div>
    </section>
  );
}

function OverviewPanel({ data }: { data: Overview }) {
  const metrics = data
    ? [
        ['Yayında', data.publishedProjectCount],
        ['İncelemede', data.inReviewProjectCount],
        ['Taslak', data.draftProjectCount],
        ['Arşiv', data.archivedProjectCount],
        ['Bayat stok', data.staleStockProjectCount],
        ['Bayat fiyat', data.stalePriceProjectCount],
      ]
    : [];
  return metrics.length ? (
    <div className="metric-grid">
      {metrics.map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  ) : (
    <AdminState text="Özet metrikleri henüz oluşmadı." />
  );
}
function QueuePanel({
  items,
  update,
}: {
  items: ReviewProject[];
  update: (
    project: ReviewProject,
    status: 'PUBLISHED' | 'ARCHIVED',
  ) => Promise<void>;
}) {
  return items.length ? (
    <div className="ops-card">
      <div className="data-table" role="table" aria-label="Proje onay kuyruğu">
        <div
          className="data-row data-row--head"
          role="row"
          style={{ gridTemplateColumns: 'repeat(6, minmax(8rem, 1fr))' }}
        >
          {[
            'Proje',
            'Şirket',
            'Durum',
            'Tamamlanma',
            'Gönderim',
            'Aksiyon',
          ].map((label) => (
            <b role="columnheader" key={label}>
              {label}
            </b>
          ))}
        </div>
        {items.map((item) => (
          <div
            className="data-row"
            role="row"
            style={{ gridTemplateColumns: 'repeat(6, minmax(8rem, 1fr))' }}
            key={item.id}
          >
            <span>{item.name}</span>
            <span>{item.developerName}</span>
            <span>{item.status}</span>
            <span>
              {item.completenessPercent != null
                ? `%${item.completenessPercent}`
                : '—'}
            </span>
            <span>
              {item.updatedAt
                ? new Intl.DateTimeFormat('tr-TR', {
                    dateStyle: 'short',
                  }).format(new Date(item.updatedAt))
                : '—'}
            </span>
            <span>
              {item.status === 'IN_REVIEW' ? (
                <button
                  type="button"
                  onClick={() => void update(item, 'PUBLISHED')}
                >
                  Yayınla
                </button>
              ) : item.status === 'PUBLISHED' ? (
                <button
                  type="button"
                  onClick={() => void update(item, 'ARCHIVED')}
                >
                  Arşivle
                </button>
              ) : (
                'Salt okunur'
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <AdminState text="Onay kuyruğu tamamlandı." />
  );
}
function QualityPanel({
  items,
  update,
}: {
  items: QualityItem[];
  update: (
    project: ReviewProject,
    status: 'PUBLISHED' | 'ARCHIVED',
  ) => Promise<void>;
}) {
  return items.length ? (
    <div className="ops-card">
      <div className="data-table" role="table" aria-label="Proje veri kalitesi">
        <div
          className="data-row data-row--head"
          role="row"
          style={{ gridTemplateColumns: 'repeat(6, minmax(8rem, 1fr))' }}
        >
          {[
            'Proje',
            'Müteahhit',
            'Sorunlar',
            'Güncelleme',
            'Durum',
            'Aksiyon',
          ].map((label) => (
            <b role="columnheader" key={label}>
              {label}
            </b>
          ))}
        </div>
        {items.map((item) => (
          <div
            className="data-row"
            role="row"
            style={{ gridTemplateColumns: 'repeat(6, minmax(8rem, 1fr))' }}
            key={item.id}
          >
            <span>{item.name}</span>
            <span>{item.developerName}</span>
            <span>{item.issues.join(' · ')}</span>
            <span>
              {new Intl.DateTimeFormat('tr-TR', {
                dateStyle: 'short',
              }).format(new Date(item.updatedAt))}
            </span>
            <span>{item.status}</span>
            <span>
              <button
                type="button"
                onClick={() => void update(item, 'ARCHIVED')}
              >
                Arşivle
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <AdminState text="Aktif veri kalitesi sorunu yok." />
  );
}
function AdminState({ text, action }: { text: string; action?: () => void }) {
  return (
    <div className="empty-state" role={action ? 'alert' : 'status'}>
      <h2>{text}</h2>
      {action && (
        <button className="button" type="button" onClick={action}>
          Tekrar dene
        </button>
      )}
    </div>
  );
}
function adminError(error: OperationError) {
  if (error.status === 409)
    return 'Kayıt başka bir yönetici tarafından değiştirildi. Liste yenilenerek tekrar kontrol edilmeli.';
  return `İşlem tamamlanamadı${error.requestId ? ` (İstek: ${error.requestId})` : ''}.`;
}
