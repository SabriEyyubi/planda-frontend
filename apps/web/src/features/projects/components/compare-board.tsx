'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ProjectSummary, ProjectDetail } from '../model/project';
import { useLocale } from 'next-intl';
import {
  formatProjectDate,
  formatProjectPrice,
} from '../model/project-presentation';
import {
  COMPARE_STORAGE_KEY,
  MAX_COMPARE_PROJECTS,
  normalizeCompareIds,
  readCompareIds,
} from '../model/compare-storage';

import { LeadDialog } from '@/features/leads/components/lead-dialog';
import { paymentEstimate } from '../model/payment-estimate';
import { Freshness } from './freshness';

type CompareColumn = { id: string; project?: ProjectSummary };

export function CompareBoard({ projects }: { projects: ProjectSummary[] }) {
  const locale = useLocale();
  const [details, setDetails] = useState<Record<string, ProjectDetail | null>>(
    {},
  );
  const [failed, setFailed] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState<
    Record<string, { unit?: string; plan?: string }>
  >({});
  const [ids, setIds] = useState<string[]>([]);
  const columns = useMemo(
    () =>
      ids.map((id) => ({
        id,
        project:
          details[id] === null
            ? undefined
            : (details[id] ?? projects.find((item) => item.id === id)),
      })),
    [ids, projects, details],
  );
  const candidates = projects.filter((project) => !ids.includes(project.id));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const queryIds =
        new URLSearchParams(window.location.search).get('ids')?.split(',') ??
        [];
      let stored: string[] = [];
      try {
        stored = readCompareIds(localStorage.getItem(COMPARE_STORAGE_KEY));
      } catch {
        /* Storage is optional. */
      }
      setIds(normalizeCompareIds(queryIds.length ? queryIds : stored));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    for (const id of ids) {
      fetch(`/api/projects/${encodeURIComponent(id)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (response.status === 404) return null;
          if (!response.ok) throw new Error('Unavailable');
          return response.json() as Promise<ProjectDetail>;
        })
        .then((detail) => {
          if (!controller.signal.aborted) {
            setDetails((current) => ({ ...current, [id]: detail }));
            setFailed((current) => current.filter((item) => item !== id));
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setFailed((current) => [...new Set([...current, id])]);
        });
    }
    return () => controller.abort();
  }, [ids, attempt]);

  function chosen(id: string) {
    const detail = details[id];
    const unit =
      detail?.unitTypes.find(
        (item) => `${item.roomType}:${item.currency}` === selection[id]?.unit,
      ) ?? detail?.unitTypes[0];
    const plan =
      detail?.paymentPlans.find((item) => item.id === selection[id]?.plan) ??
      detail?.paymentPlans[0];
    return {
      detail,
      unit,
      plan,
      estimate: paymentEstimate(unit, plan, detail?.currency ?? ''),
    };
  }
  function financial(
    id: string,
    field: 'downPayment' | 'monthly' | 'deliveryPayment' | 'total',
  ) {
    const { estimate } = chosen(id);
    return estimate
      ? formatProjectPrice(estimate[field], estimate.currency, locale)
      : 'Hesaplanamıyor';
  }

  function persist(nextIds: string[]) {
    const next = normalizeCompareIds(nextIds);
    setIds(next);
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* URL remains shareable. */
    }
    const url = new URL(window.location.href);
    if (next.length) url.searchParams.set('ids', next.join(','));
    else url.searchParams.delete('ids');
    url.searchParams.delete('limit');
    window.history.replaceState(null, '', url);
  }

  return (
    <section className="compare-board">
      <div className="section-heading compare-heading">
        <div>
          <span className="eyebrow">KARAR DESTEĞİ</span>
          <h1>
            {ids.length
              ? `${ids.length} proje karşılaştırılıyor`
              : 'Karşılaştırma listeniz boş'}
          </h1>
          <p>
            Daire tipi ve ödeme planını seçin; bugün, aylık ve teslimdeki örnek
            ödemeleri yan yana görün.
          </p>
        </div>
        <label className="compare-add">
          <span className="sr-only">Karşılaştırmaya proje ekle</span>
          <select
            value=""
            disabled={ids.length >= MAX_COMPARE_PROJECTS || !candidates.length}
            onChange={(event) =>
              event.target.value && persist([...ids, event.target.value])
            }
          >
            <option value="">
              + Proje ekle (maks. {MAX_COMPARE_PROJECTS})
            </option>
            {candidates.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {columns.length > 0 && (
        <p className="privacy-callout">
          Örnek tutarlar, seçilen daire tipinin başlangıç fiyatına yayımlanan
          plan yüzdeleri uygulanarak hesaplanır. Teklif değildir; planın daireye
          uygunluğu, indirimler ve ek masraflar satış ofisinden teyit
          edilmelidir. Farklı para birimleri dönüştürülmez.
        </p>
      )}
      {!columns.length ? (
        <div className="empty-state">
          <h2>Karar vermek istediğiniz projeleri ekleyin</h2>
          <p>
            Proje detayındaki karşılaştır butonunu kullanabilir veya yukarıdaki
            listeden seçim yapabilirsiniz.
          </p>
          <a className="button" href="./projects">
            Projeleri keşfet
          </a>
        </div>
      ) : (
        <div
          className="compare-table"
          role="table"
          aria-label="Proje karşılaştırması"
        >
          <CompareRow columns={columns} label="Proje" header>
            {({ id, project }) =>
              project ? (
                <article>
                  <span className="compare-visual" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => persist(ids.filter((item) => item !== id))}
                    aria-label={`${project.name} projesini karşılaştırmadan çıkar`}
                  >
                    ×
                  </button>
                  <strong>{project.name}</strong>
                  <small>{project.developerName}</small>
                </article>
              ) : (
                <article className="compare-unavailable">
                  <strong>
                    {details[id] === null
                      ? 'Proje artık yayında değil'
                      : 'Proje bilgileri yükleniyor'}
                  </strong>
                  <small>
                    {failed.includes(id)
                      ? 'Bağlantı kurulamadı.'
                      : 'Güncel bilgiler kontrol ediliyor.'}
                  </small>
                  <button
                    type="button"
                    onClick={() => persist(ids.filter((item) => item !== id))}
                  >
                    Kaldır
                  </button>
                </article>
              )
            }
          </CompareRow>
          <CompareRow columns={columns} label="Proje başlangıcı">
            {({ project }) =>
              project
                ? formatProjectPrice(
                    project.startingPrice,
                    project.currency,
                    locale,
                  )
                : '—'
            }
          </CompareRow>
          <CompareRow columns={columns} label="Daire tipi">
            {({ id }) => {
              const { detail, unit } = chosen(id);
              return detail ? (
                <select
                  aria-label={`${detail.name} daire tipi`}
                  value={unit ? `${unit.roomType}:${unit.currency}` : ''}
                  onChange={(event) =>
                    setSelection({
                      ...selection,
                      [id]: { ...selection[id], unit: event.target.value },
                    })
                  }
                >
                  {!detail.unitTypes.length && (
                    <option>Stok paylaşılmadı</option>
                  )}
                  {detail.unitTypes.map((item) => (
                    <option
                      key={`${item.roomType}:${item.currency}`}
                      value={`${item.roomType}:${item.currency}`}
                    >
                      {item.roomType} · {item.currency} · {item.availableCount}{' '}
                      müsait
                    </option>
                  ))}
                </select>
              ) : (
                '—'
              );
            }}
          </CompareRow>
          <CompareRow columns={columns} label="Seçilen tip başlangıcı">
            {({ id }) => {
              const { unit } = chosen(id);
              return unit
                ? formatProjectPrice(unit.startingPrice, unit.currency, locale)
                : '—';
            }}
          </CompareRow>
          <CompareRow columns={columns} label="Ödeme planı">
            {({ id }) => {
              const { detail, plan } = chosen(id);
              return detail ? (
                <select
                  aria-label={`${detail.name} ödeme planı`}
                  value={plan?.id ?? ''}
                  onChange={(event) =>
                    setSelection({
                      ...selection,
                      [id]: { ...selection[id], plan: event.target.value },
                    })
                  }
                >
                  {!detail.paymentPlans.length && (
                    <option>Plan paylaşılmadı</option>
                  )}
                  {detail.paymentPlans.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                '—'
              );
            }}
          </CompareRow>
          <CompareRow columns={columns} label="Bugün · örnek">
            {({ id }) => financial(id, 'downPayment')}
          </CompareRow>
          <CompareRow columns={columns} label="Aylık · örnek">
            {({ id }) => financial(id, 'monthly')}
          </CompareRow>
          <CompareRow columns={columns} label="Teslimde · örnek">
            {({ id }) => financial(id, 'deliveryPayment')}
          </CompareRow>
          <CompareRow columns={columns} label="Toplam · örnek">
            {({ id }) => financial(id, 'total')}
          </CompareRow>
          <CompareRow columns={columns} label="Vade">
            {({ id }) => {
              const { plan } = chosen(id);
              return plan ? `${plan.termMonths} ay` : '—';
            }}
          </CompareRow>
          <CompareRow columns={columns} label="Yayımlanan plan tutarı">
            {({ id }) => {
              const { detail, plan } = chosen(id);
              return detail && plan ? (
                <>
                  <span>
                    Toplam:{' '}
                    {plan.totalPrice
                      ? formatProjectPrice(
                          plan.totalPrice,
                          detail.currency,
                          locale,
                        )
                      : 'Paylaşılmadı'}
                  </span>
                  <br />
                  <span>
                    Aylık:{' '}
                    {plan.monthlyPayment
                      ? formatProjectPrice(
                          plan.monthlyPayment,
                          detail.currency,
                          locale,
                        )
                      : 'Paylaşılmadı'}
                  </span>
                  <small style={{ display: 'block' }}>
                    Seçilen daire tipine uygulanabilirliği satış ofisinden teyit
                    edin.
                  </small>
                </>
              ) : (
                '—'
              );
            }}
          </CompareRow>
          <CompareRow columns={columns} label="Veri güncelliği">
            {({ id, project }) =>
              project ? (
                <>
                  <Freshness
                    label="Stok"
                    value={project.stockUpdatedAt}
                    locale={locale}
                  />
                  <br />
                  <Freshness
                    label="Fiyat"
                    value={project.priceUpdatedAt}
                    locale={locale}
                  />
                  {failed.includes(id) && (
                    <button
                      type="button"
                      onClick={() => setAttempt(attempt + 1)}
                    >
                      Yeniden dene
                    </button>
                  )}
                </>
              ) : failed.includes(id) ? (
                <button type="button" onClick={() => setAttempt(attempt + 1)}>
                  Yeniden dene
                </button>
              ) : (
                '—'
              )
            }
          </CompareRow>
          <CompareRow columns={columns} label="Lokasyon">
            {({ project }) => project?.district.name ?? '—'}
          </CompareRow>
          <CompareRow columns={columns} label="Teslim">
            {({ project }) =>
              formatProjectDate(project?.deliveryDate ?? null, locale)
            }
          </CompareRow>
          <CompareRow columns={columns} label="Geliştirici">
            {({ project }) => project?.developerName ?? '—'}
          </CompareRow>
          <CompareRow columns={columns} label="Aksiyon">
            {({ id, project }) =>
              project ? (
                <div>
                  <a
                    className="button button--secondary"
                    href={`./projects/${project.slug}`}
                  >
                    Projeyi gör
                  </a>
                  {details[id] && (
                    <LeadDialog
                      projectId={id}
                      projectName={project.name}
                      context={{
                        unitPreference: chosen(id).unit?.roomType,
                        currency: chosen(id).unit?.currency ?? project.currency,
                        paymentPlanId: chosen(id).plan?.id,
                        paymentPlanName: chosen(id).plan?.name,
                      }}
                    />
                  )}
                </div>
              ) : (
                '—'
              )
            }
          </CompareRow>
        </div>
      )}
    </section>
  );
}

function CompareRow({
  columns,
  label,
  header = false,
  children,
}: {
  columns: CompareColumn[];
  label: string;
  header?: boolean;
  children: (column: CompareColumn) => ReactNode;
}) {
  return (
    <div
      className={`compare-row ${header ? 'compare-row--projects' : ''}`}
      role="row"
      style={{
        gridTemplateColumns: `11rem repeat(${columns.length}, minmax(12rem, 1fr))`,
      }}
    >
      <strong role={header ? 'columnheader' : 'rowheader'}>{label}</strong>
      {columns.map((column) => (
        <div role={header ? 'columnheader' : 'cell'} key={column.id}>
          {children(column)}
        </div>
      ))}
    </div>
  );
}
