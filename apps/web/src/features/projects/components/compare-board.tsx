'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ProjectSummary } from '../model/project';
import {
  COMPARE_STORAGE_KEY,
  MAX_COMPARE_PROJECTS,
  normalizeCompareIds,
  readCompareIds,
} from '../model/compare-storage';

const money = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

type CompareColumn = { id: string; project?: ProjectSummary };

export function CompareBoard({ projects }: { projects: ProjectSummary[] }) {
  const [ids, setIds] = useState<string[]>([]);
  const columns = useMemo(
    () =>
      ids.map((id) => ({
        id,
        project: projects.find((item) => item.id === id),
      })),
    [ids, projects],
  );
  const candidates = projects.filter((project) => !ids.includes(project.id));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const queryIds =
        new URLSearchParams(window.location.search).get('ids')?.split(',') ??
        [];
      const stored = readCompareIds(localStorage.getItem(COMPARE_STORAGE_KEY));
      setIds(normalizeCompareIds(queryIds.length ? queryIds : stored));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function persist(nextIds: string[]) {
    const next = normalizeCompareIds(nextIds);
    setIds(next);
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
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
            Fiyat, konum, teslim ve geliştirici bilgilerini yan yana
            değerlendirin.
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
                  <strong>Proje artık yayında değil</strong>
                  <small>Mevcut bilgiler gösterilemiyor.</small>
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
          <CompareRow columns={columns} label="Başlangıç">
            {({ project }) =>
              project ? money.format(Number(project.startingPrice)) : '—'
            }
          </CompareRow>
          <CompareRow columns={columns} label="Lokasyon">
            {({ project }) => project?.district.name ?? '—'}
          </CompareRow>
          <CompareRow columns={columns} label="Teslim">
            {({ project }) =>
              project?.deliveryDate
                ? new Intl.DateTimeFormat('tr-TR', {
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(project.deliveryDate))
                : project
                  ? 'Teslime hazır'
                  : '—'
            }
          </CompareRow>
          <CompareRow columns={columns} label="Geliştirici">
            {({ project }) => project?.developerName ?? '—'}
          </CompareRow>
          <CompareRow columns={columns} label="Aksiyon">
            {({ project }) =>
              project ? (
                <a className="button" href={`./projects/${project.slug}`}>
                  Projeyi gör
                </a>
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
