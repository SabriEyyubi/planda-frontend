'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { FavoriteButton } from './favorite-button';
import { redirectAfterUnauthorized } from '@/lib/auth/login-redirect';
import { useLocale, useTranslations } from 'next-intl';

type SavedProject = {
  id: string;
  slug: string;
  name: string;
  district: string;
  province: string;
  startingPrice: string;
  currency: string;
  heroImageUrl: string | null;
  savedAt: string;
};

export function SavedProjectsScreen() {
  const locale = useLocale();
  const t = useTranslations('Saved');
  const [items, setItems] = useState<SavedProject[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  async function load() {
    setState('loading');
    try {
      const response = await fetch('/api/me/saved-projects', {
        cache: 'no-store',
      });
      if (redirectAfterUnauthorized(response)) return;
      if (!response.ok) {
        setState('error');
        return;
      }
      setItems((await response.json()) as SavedProject[]);
      setState('ready');
    } catch {
      setState('error');
    }
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="saved-screen" aria-busy={state === 'loading'}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t('eyebrow')}</span>
          <h1>{t('title')}</h1>
        </div>
        {state === 'ready' && <p>{t('count', { count: items.length })}</p>}
      </div>
      {state === 'loading' && (
        <div className="card" role="status">
          {t('loading')}
        </div>
      )}
      {state === 'error' && (
        <div className="empty-state" role="alert">
          <h2>{t('loadFailed')}</h2>
          <p>{t('loadFailedDescription')}</p>
          <button className="button" type="button" onClick={() => void load()}>
            {t('retry')}
          </button>
        </div>
      )}
      {state === 'ready' && items.length === 0 && (
        <div className="empty-state">
          <h2>{t('empty')}</h2>
          <p>{t('emptyDescription')}</p>
          <Link className="button" href="/projects">
            {t('explore')}
          </Link>
        </div>
      )}
      {state === 'ready' && items.length > 0 && (
        <div className="saved-grid">
          {items.map((item) => (
            <article className="saved-card" key={item.id}>
              <Link
                className="saved-card__media"
                href={`/projects/${item.slug}`}
                aria-label={t('viewProject', { name: item.name })}
              />
              <div>
                <span>
                  {item.district}, {item.province}
                </span>
                <h2>
                  <Link href={`/projects/${item.slug}`}>{item.name}</Link>
                </h2>
                <strong>
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: item.currency,
                    maximumFractionDigits: 0,
                  }).format(Number(item.startingPrice))}
                </strong>
                <small>
                  {t('savedAt', {
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                    }).format(new Date(item.savedAt)),
                  })}
                </small>
                <FavoriteButton
                  projectId={item.id}
                  initialSaved
                  onRemoved={() =>
                    setItems((current) =>
                      current.filter((project) => project.id !== item.id),
                    )
                  }
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
